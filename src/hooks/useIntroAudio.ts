import { useCallback, useEffect } from "react";

import type { SfxKey } from "../audio/audioCatalog";
import { gameAudio } from "../audio/gameAudio";
import type { AudioAssets } from "../types/threejs-intro.types";

type IntroAudioKey = keyof AudioAssets;

const INTRO_AUDIO_CUES: Partial<Record<IntroAudioKey, SfxKey>> = {
  sfxEngine: "rocketEngineHum",
  sfxRingtone: "dialogueContinue",
  sfxAlarm: "meteorWarning",
  sfxWarp: "introWarp",
  sfxExplosion: "meteorGraze",
  sfxQTEcorrect: "landingTouchdown",
  sfxQTEwrong: "feedbackIncorrect",
  sfxLaser: "bossRaidHit",
  sfxVehicleDestroyed: "meteorGraze",
  sfxMissionSuccess: "missionComplete",
  sfxMissionFailure: "feedbackIncorrect",
  sfxGlitch: "emergencyRecalibration",
  sfxTyping: "robotSpeaking",
};

const activeIntroCues = new Set<SfxKey>();

/**
 * Compatibility adapter for the intro's existing story controls.
 * Route BGM is owned by GameAudioDirector; this hook only directs cinematic SFX.
 */
export const useIntroAudio = () => {
  const playSound = useCallback((key: IntroAudioKey) => {
    const cue = INTRO_AUDIO_CUES[key];
    if (!cue) return;
    activeIntroCues.add(cue);
    gameAudio.playSfx(cue);
  }, []);

  const stopSound = useCallback((key: IntroAudioKey) => {
    const cue = INTRO_AUDIO_CUES[key];
    if (!cue) return;
    activeIntroCues.delete(cue);
    gameAudio.stopSfx(cue, 100);
  }, []);

  const pauseSound = stopSound;
  const resumeSound = playSound;

  useEffect(() => {
    return () => {
      activeIntroCues.forEach((cue) => gameAudio.stopSfx(cue, 120));
      activeIntroCues.clear();
    };
  }, []);

  return {
    playSound,
    stopSound,
    pauseSound,
    resumeSound,
    setVolume: (key: IntroAudioKey, volume: number) => {
      void key;
      void volume;
    },
  };
};
