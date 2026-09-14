import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

import { gameAudio } from "../../audio/gameAudio";
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
} from "../../constants/game.constants";
import { useGameStore } from "../../stores/useGameStore";
import {
  AudioSettingsContext,
  useAudioSettings,
} from "./audioSettingsContext";

import "./AudioSettings.css";

type AudioSettingsProviderProps = {
  children: ReactNode;
};

type AudioSettingsButtonProps = {
  className?: string;
  label?: string;
};

type SceneAudioProfile = {
  id: "selection" | "intro" | "bedroom" | "mainhub" | "leaderboard" | "stage";
  code: string;
  label: string;
  accent: string;
};

type SliderStyle = CSSProperties & {
  "--audio-fill": string;
};

const STAGE_ACCENTS: Record<string, string> = {
  "1": "#72e9ff",
  "2": "#76d8ff",
  "3": "#9be8ff",
  "4": "#ff8fc9",
  "5": "#bda7ff",
  "6": "#78f0dc",
};

const getSceneAudioProfile = (pathname: string): SceneAudioProfile => {
  const stageMatch = pathname.match(/^\/stage\/([1-6])/);
  if (stageMatch) {
    return {
      id: "stage",
      code: `MODULE ${stageMatch[1].padStart(2, "0")}`,
      label: "Academy simulation",
      accent: STAGE_ACCENTS[stageMatch[1]],
    };
  }

  if (pathname === "/intro") {
    return { id: "intro", code: "FLIGHT 01", label: "Flight record", accent: "#67e8ff" };
  }

  if (pathname === "/bedroom") {
    return { id: "bedroom", code: "CABIN 01", label: "Recovery cabin", accent: "#54f4de" };
  }

  if (pathname === "/mainhub") {
    return { id: "mainhub", code: "NAV 02", label: "Orbital navigation", accent: "#4fffc2" };
  }

  if (pathname === "/leaderboard") {
    return { id: "leaderboard", code: "RANK 07", label: "Pilot archive", accent: "#ffd166" };
  }

  return { id: "selection", code: "SUIT 00", label: "Pilot calibration", accent: "#8bdcff" };
};

const clampVolume = (value: number) => Math.max(0, Math.min(1, value));
const toPercent = (value: number) => Math.round(clampVolume(value) * 100);

const SoundMixerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h8M16 7h4M4 17h4M12 17h8M8 4v6M12 14v6" />
    <circle cx="14" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18V6l10-2v12M9 9l10-2" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

const EffectsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 14a7 7 0 0 1 14 0v3M5 17h3v3H6a1 1 0 0 1-1-1v-2ZM19 17h-3v3h2a1 1 0 0 0 1-1v-2ZM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4" />
  </svg>
);

const VolumeGlyph = ({ muted }: { muted: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" />
    {muted ? <path d="m17 9 4 6M21 9l-4 6" /> : <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />}
  </svg>
);

export const AudioSettingsButton = ({
  className = "",
  label = "AUDIO",
}: AudioSettingsButtonProps) => {
  const { openAudioSettings } = useAudioSettings();

  return (
    <button
      type="button"
      className={`audio-settings-launcher ${className}`.trim()}
      aria-label="Open audio settings"
      data-audio-cue="none"
      onClick={openAudioSettings}
    >
      <SoundMixerIcon />
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  );
};

export const AudioSettingsProvider = ({ children }: AudioSettingsProviderProps) => {
  const location = useLocation();
  const musicVolume = useGameStore((state) => state.musicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastMusicVolumeRef = useRef(musicVolume || DEFAULT_MUSIC_VOLUME);
  const lastSfxVolumeRef = useRef(sfxVolume || DEFAULT_SFX_VOLUME);
  const lastMixRef = useRef({
    music: musicVolume || DEFAULT_MUSIC_VOLUME,
    sfx: sfxVolume || DEFAULT_SFX_VOLUME,
  });
  const scene = useMemo(
    () => getSceneAudioProfile(location.pathname),
    [location.pathname]
  );

  const openAudioSettings = useCallback(() => {
    gameAudio.playSfx("loadoutOpen");
    setIsOpen(true);
  }, []);

  const closeAudioSettings = useCallback(() => {
    gameAudio.playSfx("uiClose");
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(closeTimer);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAudioSettings();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = closeButtonRef.current?.closest<HTMLElement>("[role='dialog']");
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [closeAudioSettings, isOpen]);

  const handleMusicChange = (value: number) => {
    const next = clampVolume(value);
    if (next > 0) lastMusicVolumeRef.current = next;
    setMusicVolume(next);
  };

  const handleSfxChange = (value: number) => {
    const next = clampVolume(value);
    if (next > 0) lastSfxVolumeRef.current = next;
    setSfxVolume(next);
  };

  const toggleMusic = () => {
    if (musicVolume > 0) {
      lastMusicVolumeRef.current = musicVolume;
      setMusicVolume(0);
    } else {
      setMusicVolume(lastMusicVolumeRef.current || DEFAULT_MUSIC_VOLUME);
    }
  };

  const toggleSfx = () => {
    if (sfxVolume > 0) {
      lastSfxVolumeRef.current = sfxVolume;
      setSfxVolume(0);
    } else {
      setSfxVolume(lastSfxVolumeRef.current || DEFAULT_SFX_VOLUME);
    }
  };

  const allMuted = musicVolume === 0 && sfxVolume === 0;
  const toggleAllAudio = () => {
    if (!allMuted) {
      lastMixRef.current = {
        music: musicVolume || lastMusicVolumeRef.current,
        sfx: sfxVolume || lastSfxVolumeRef.current,
      };
      setMusicVolume(0);
      setSfxVolume(0);
      return;
    }

    setMusicVolume(lastMixRef.current.music || DEFAULT_MUSIC_VOLUME);
    setSfxVolume(lastMixRef.current.sfx || DEFAULT_SFX_VOLUME);
  };

  const resetAudio = () => {
    lastMusicVolumeRef.current = DEFAULT_MUSIC_VOLUME;
    lastSfxVolumeRef.current = DEFAULT_SFX_VOLUME;
    setMusicVolume(DEFAULT_MUSIC_VOLUME);
    setSfxVolume(DEFAULT_SFX_VOLUME);
    window.setTimeout(() => gameAudio.playSfx("customizationEquip"), 0);
  };

  const averageSignal = Math.round((toPercent(musicVolume) + toPercent(sfxVolume)) / 2);
  const contextValue = useMemo(
    () => ({ isOpen, openAudioSettings, closeAudioSettings }),
    [closeAudioSettings, isOpen, openAudioSettings]
  );
  const panelStyle = { "--audio-settings-accent": scene.accent } as CSSProperties;
  const musicSliderStyle = { "--audio-fill": `${toPercent(musicVolume)}%` } as SliderStyle;
  const sfxSliderStyle = { "--audio-fill": `${toPercent(sfxVolume)}%` } as SliderStyle;

  return (
    <AudioSettingsContext.Provider value={contextValue}>
      {children}

      {!isOpen && (
        <AudioSettingsButton className={`audio-settings-launcher--${scene.id}`} />
      )}

      {isOpen &&
        createPortal(
          <div
            className="audio-settings-overlay"
            style={panelStyle}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAudioSettings();
            }}
          >
            <section
              className="audio-settings-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="audio-settings-title"
              aria-describedby="audio-settings-description"
            >
              <div className="audio-settings-scanline" aria-hidden="true" />
              <span className="audio-settings-corner audio-settings-corner--tl" aria-hidden="true" />
              <span className="audio-settings-corner audio-settings-corner--br" aria-hidden="true" />

              <header className="audio-settings-header">
                <div>
                  <span className="audio-settings-eyebrow">
                    SYSTEM CONFIGURATION // {scene.code}
                  </span>
                  <h2 id="audio-settings-title">Sound calibration</h2>
                  <p id="audio-settings-description">
                    Atur keseimbangan musik dan efek secara langsung. Profil audio tersimpan otomatis.
                  </p>
                </div>

                <div className="audio-settings-header-actions">
                  <span className="audio-settings-live"><i /> LIVE MIX</span>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="audio-settings-close"
                    aria-label="Close audio settings"
                    data-audio-cue="none"
                    onClick={closeAudioSettings}
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="audio-settings-body">
                <aside className="audio-settings-monitor" aria-label="Current audio output">
                  <div className="audio-settings-monitor-head">
                    <span>OUTPUT ROUTING</span>
                    <strong>{allMuted ? "MUTED" : "ONLINE"}</strong>
                  </div>

                  <div className="audio-settings-wave" aria-hidden="true">
                    {[28, 54, 76, 46, 88, 62, 94, 52, 72, 36, 66, 44].map((height, index) => (
                      <i
                        key={`${height}-${index}`}
                        style={{ "--wave-height": `${height}%`, "--wave-delay": `${index * -70}ms` } as CSSProperties}
                      />
                    ))}
                  </div>

                  <div className="audio-settings-signal">
                    <span>MASTER SIGNAL</span>
                    <strong>{averageSignal}%</strong>
                    <div><i style={{ width: `${averageSignal}%` }} /></div>
                  </div>

                  <dl>
                    <div><dt>SECTOR</dt><dd>{scene.label}</dd></div>
                    <div><dt>PROFILE</dt><dd>AUTO-SAVED</dd></div>
                    <div><dt>OUTPUT</dt><dd>STEREO WEB</dd></div>
                  </dl>

                  <button
                    type="button"
                    className={`audio-settings-master ${allMuted ? "is-muted" : ""}`}
                    onClick={toggleAllAudio}
                  >
                    <VolumeGlyph muted={allMuted} />
                    {allMuted ? "RESTORE ALL" : "MUTE ALL"}
                  </button>
                </aside>

                <div className="audio-settings-mixer">
                  <div className="audio-settings-channel">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon"><MusicIcon /></div>
                      <div>
                        <span>CHANNEL 01</span>
                        <h3>Background music</h3>
                        <p>Ambient loop dan tema setiap scene.</p>
                      </div>
                      <output htmlFor="audio-music-volume">{toPercent(musicVolume)}%</output>
                    </div>

                    <div className="audio-settings-slider-row">
                      <button
                        type="button"
                        className={musicVolume === 0 ? "is-muted" : ""}
                        aria-label={musicVolume === 0 ? "Unmute background music" : "Mute background music"}
                        aria-pressed={musicVolume === 0}
                        onClick={toggleMusic}
                      >
                        <VolumeGlyph muted={musicVolume === 0} />
                      </button>
                      <label className="sr-only" htmlFor="audio-music-volume">Background music volume</label>
                      <input
                        id="audio-music-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        style={musicSliderStyle}
                        aria-valuetext={`${toPercent(musicVolume)} percent`}
                        onChange={(event) => handleMusicChange(Number(event.target.value))}
                      />
                    </div>
                    <div className="audio-settings-scale" aria-hidden="true">
                      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                  </div>

                  <div className="audio-settings-channel">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon"><EffectsIcon /></div>
                      <div>
                        <span>CHANNEL 02</span>
                        <h3>Interface &amp; effects</h3>
                        <p>UI, dialog, karakter, pet, dan gameplay.</p>
                      </div>
                      <output htmlFor="audio-sfx-volume">{toPercent(sfxVolume)}%</output>
                    </div>

                    <div className="audio-settings-slider-row">
                      <button
                        type="button"
                        className={sfxVolume === 0 ? "is-muted" : ""}
                        aria-label={sfxVolume === 0 ? "Unmute sound effects" : "Mute sound effects"}
                        aria-pressed={sfxVolume === 0}
                        onClick={toggleSfx}
                      >
                        <VolumeGlyph muted={sfxVolume === 0} />
                      </button>
                      <label className="sr-only" htmlFor="audio-sfx-volume">Sound effects volume</label>
                      <input
                        id="audio-sfx-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sfxVolume}
                        style={sfxSliderStyle}
                        aria-valuetext={`${toPercent(sfxVolume)} percent`}
                        onChange={(event) => handleSfxChange(Number(event.target.value))}
                      />
                    </div>
                    <div className="audio-settings-scale" aria-hidden="true">
                      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="audio-settings-footer">
                <div className="audio-settings-shortcuts">
                  <span><kbd>ESC</kbd> CLOSE</span>
                  <span><kbd>←</kbd><kbd>→</kbd> ADJUST</span>
                </div>
                <div className="audio-settings-footer-actions">
                  <button
                    type="button"
                    className="audio-settings-secondary"
                    data-audio-cue="none"
                    onClick={resetAudio}
                  >
                    RESET 50 / 50
                  </button>
                  <button
                    type="button"
                    className="audio-settings-secondary"
                    data-audio-cue="none"
                    disabled={sfxVolume === 0}
                    onClick={() => gameAudio.playSfx("uiConfirm")}
                  >
                    TEST SIGNAL
                  </button>
                  <button
                    type="button"
                    className="audio-settings-primary"
                    data-audio-cue="none"
                    onClick={closeAudioSettings}
                  >
                    APPLY &amp; CLOSE <span aria-hidden="true">→</span>
                  </button>
                </div>
              </footer>
            </section>
          </div>,
          document.body
        )}
    </AudioSettingsContext.Provider>
  );
};

export default AudioSettingsProvider;
