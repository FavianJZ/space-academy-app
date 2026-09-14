import {
  BGM_TRACKS,
  SFX_CUES,
  VICTORY_STING_SRC,
  type AudioChannel,
  type BgmKey,
  type SfxKey,
} from "./audioCatalog";

type ActiveVoice = {
  audio: HTMLAudioElement;
  key: SfxKey;
  channel: AudioChannel;
  tailTimer: number | null;
};

export type PlaySfxOptions = {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
};

export type AudioPlayback = {
  durationMs: number;
  motionMs: number;
  stop: () => void;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

class GameAudioDirector {
  private musicVolume = 0.5;
  private sfxVolume = 0.5;
  private currentBgm: { key: BgmKey; audio: HTMLAudioElement } | null = null;
  private pendingBgm: { key: BgmKey; audio: HTMLAudioElement; requestId: number } | null = null;
  private requestedBgm: BgmKey | null = null;
  private bgmRequestId = 0;
  private unlocked = false;
  private activeChannels = new Map<AudioChannel, ActiveVoice>();
  private activePolyphonic = new Set<ActiveVoice>();
  private lastPlayedAt = new Map<SfxKey, number>();
  private fadeFrame: number | null = null;
  private bgmDuckFactor = 1;
  private duckTimer: number | null = null;

  setVolumes(musicVolume: number, sfxVolume: number) {
    this.musicVolume = clamp01(musicVolume);
    this.sfxVolume = clamp01(sfxVolume);
    this.applyBgmVolume();

    this.activeChannels.forEach(({ audio, key }) => {
      audio.volume = clamp01(SFX_CUES[key].volume * this.sfxVolume);
    });
    this.activePolyphonic.forEach(({ audio, key }) => {
      audio.volume = clamp01(SFX_CUES[key].volume * this.sfxVolume);
    });
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.requestedBgm) this.playBgm(this.requestedBgm);
  }

  playBgm(key: BgmKey, crossfadeMs = 900) {
    this.requestedBgm = key;
    if (!this.unlocked) return;

    this.cancelPendingBgm();

    if (this.currentBgm?.key === key) {
      if (this.currentBgm.audio.paused) {
        void this.currentBgm.audio.play().catch(() => {
          this.unlocked = false;
        });
      }
      this.applyBgmVolume();
      return;
    }

    const previous = this.currentBgm;
    const audio = new Audio(BGM_TRACKS[key]);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    const requestId = ++this.bgmRequestId;
    this.pendingBgm = { key, audio, requestId };

    void audio.play().then(() => {
      if (this.requestedBgm !== key || this.pendingBgm?.requestId !== requestId) {
        audio.pause();
        audio.currentTime = 0;
        return;
      }

      this.pendingBgm = null;
      this.currentBgm = { key, audio };
      this.crossfade(previous?.audio ?? null, audio, crossfadeMs);
    }).catch(() => {
      if (this.pendingBgm?.requestId === requestId) this.pendingBgm = null;
      audio.pause();
      audio.currentTime = 0;
      if (this.requestedBgm === key) this.unlocked = false;
    });
  }

  stopBgm(fadeMs = 500) {
    this.requestedBgm = null;
    this.cancelPendingBgm();
    if (!this.currentBgm) return;
    const current = this.currentBgm.audio;
    this.currentBgm = null;
    this.fadeOutAndStop(current, fadeMs);
  }

  playVictorySting() {
    if (!this.unlocked) return;
    const audio = new Audio(VICTORY_STING_SRC);
    audio.preload = "auto";
    audio.volume = clamp01(0.34 * this.sfxVolume);
    this.duckBgm(0.32, 3200);
    void audio.play().catch(() => {});
    window.setTimeout(() => this.fadeOutAndStop(audio, 900), 8100);
  }

  playSfx(key: SfxKey, options: PlaySfxOptions = {}): AudioPlayback {
    const cue = SFX_CUES[key];
    const now = performance.now();
    const lastPlayed = this.lastPlayedAt.get(key) ?? Number.NEGATIVE_INFINITY;

    const stop = () => this.stopSfx(key);
    const playback = { durationMs: cue.durationMs, motionMs: cue.motionMs, stop };

    if (!this.unlocked || now - lastPlayed < cue.cooldownMs) return playback;
    this.lastPlayedAt.set(key, now);

    if (!cue.polyphonic) this.stopChannel(cue.channel, 55);

    const audio = new Audio(cue.src);
    const voice: ActiveVoice = {
      audio,
      key,
      channel: cue.channel,
      tailTimer: null,
    };
    audio.preload = "auto";
    audio.loop = options.loop ?? cue.loop ?? false;
    audio.playbackRate = options.playbackRate ?? 1;
    audio.volume = clamp01(cue.volume * this.sfxVolume * (options.volume ?? 1));

    if (cue.polyphonic) {
      this.activePolyphonic.add(voice);
      if (this.activePolyphonic.size > 6) {
        const oldest = this.activePolyphonic.values().next().value as ActiveVoice | undefined;
        if (oldest) this.stopVoice(oldest);
      }
    } else {
      this.activeChannels.set(cue.channel, voice);
    }

    const release = () => this.releaseVoice(voice);
    audio.addEventListener("ended", release, { once: true });
    audio.addEventListener("error", release, { once: true });

    if (cue.duckBgm !== undefined) {
      this.duckBgm(cue.duckBgm, Math.min(cue.durationMs, 3600));
    }

    const shouldTrimGeneratedTail =
      !audio.loop && cue.durationMs - cue.motionMs > 140;
    if (shouldTrimGeneratedTail) {
      voice.tailTimer = window.setTimeout(() => {
        voice.tailTimer = null;
        this.stopVoice(voice, 90);
      }, cue.motionMs);
    }

    void audio.play().catch(release);
    return playback;
  }

  stopSfx(key: SfxKey, fadeMs = 80) {
    this.activeChannels.forEach((voice) => {
      if (voice.key === key) this.stopVoice(voice, fadeMs);
    });
    this.activePolyphonic.forEach((voice) => {
      if (voice.key === key) this.stopVoice(voice, fadeMs);
    });
  }

  stopChannel(channel: AudioChannel, fadeMs = 80) {
    const voice = this.activeChannels.get(channel);
    if (voice) this.stopVoice(voice, fadeMs);
  }

  stopAllSfx(fadeMs = 80) {
    [...this.activeChannels.values(), ...this.activePolyphonic].forEach((voice) => {
      this.stopVoice(voice, fadeMs);
    });
  }

  private applyBgmVolume() {
    if (!this.currentBgm) return;
    this.currentBgm.audio.volume = clamp01(
      this.musicVolume * 0.42 * this.bgmDuckFactor
    );
  }

  private cancelPendingBgm() {
    if (!this.pendingBgm) return;
    this.bgmRequestId += 1;
    this.pendingBgm.audio.pause();
    this.pendingBgm.audio.currentTime = 0;
    this.pendingBgm = null;
  }

  private crossfade(
    previous: HTMLAudioElement | null,
    next: HTMLAudioElement,
    durationMs: number
  ) {
    if (this.fadeFrame !== null) cancelAnimationFrame(this.fadeFrame);
    const startedAt = performance.now();
    const previousStart = previous?.volume ?? 0;
    const nextTarget = clamp01(this.musicVolume * 0.42 * this.bgmDuckFactor);

    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs));
      const eased = progress * progress * (3 - 2 * progress);
      next.volume = clamp01(nextTarget * eased);
      if (previous) previous.volume = clamp01(previousStart * (1 - eased));

      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(update);
      } else {
        if (previous) {
          previous.pause();
          previous.currentTime = 0;
        }
        this.fadeFrame = null;
      }
    };

    this.fadeFrame = requestAnimationFrame(update);
  }

  private fadeOutAndStop(audio: HTMLAudioElement, durationMs: number) {
    const startedAt = performance.now();
    const startVolume = audio.volume;

    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, durationMs));
      audio.volume = clamp01(startVolume * (1 - progress));
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    requestAnimationFrame(update);
  }

  private stopVoice(voice: ActiveVoice, fadeMs = 0) {
    this.releaseVoice(voice);
    if (fadeMs <= 0 || voice.audio.paused) {
      voice.audio.pause();
      voice.audio.currentTime = 0;
      return;
    }
    this.fadeOutAndStop(voice.audio, fadeMs);
  }

  private releaseVoice(voice: ActiveVoice) {
    if (voice.tailTimer !== null) {
      window.clearTimeout(voice.tailTimer);
      voice.tailTimer = null;
    }
    if (this.activeChannels.get(voice.channel) === voice) {
      this.activeChannels.delete(voice.channel);
    }
    this.activePolyphonic.delete(voice);
  }

  private duckBgm(factor: number, durationMs: number) {
    this.bgmDuckFactor = clamp01(factor);
    this.applyBgmVolume();
    if (this.duckTimer !== null) window.clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => {
      this.bgmDuckFactor = 1;
      this.applyBgmVolume();
      this.duckTimer = null;
    }, durationMs);
  }
}

export const gameAudio = new GameAudioDirector();
