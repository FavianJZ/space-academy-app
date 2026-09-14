import { useCallback } from "react";

import { SFX_CUES, type SfxKey } from "../audio/audioCatalog";
import { gameAudio, type PlaySfxOptions } from "../audio/gameAudio";

export const useGameAudio = () => {
  const playSfx = useCallback((key: SfxKey, options?: PlaySfxOptions) => {
    return gameAudio.playSfx(key, options);
  }, []);

  const stopSfx = useCallback((key: SfxKey, fadeMs?: number) => {
    gameAudio.stopSfx(key, fadeMs);
  }, []);

  const getMotionMs = useCallback(
    (key: SfxKey) => SFX_CUES[key].motionMs,
    []
  );

  return {
    playSfx,
    stopSfx,
    getMotionMs,
  };
};

export default useGameAudio;
