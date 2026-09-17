import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { type BgmKey, type SfxKey } from "../../audio/audioCatalog";
import { gameAudio } from "../../audio/gameAudio";
import { cancelSpeechNarration } from "../../audio/speechNarration";
import { useGameStore } from "../../stores/useGameStore";

const routeToBgm = (pathname: string): BgmKey => {
  if (pathname === "/intro") return "introRouteSelection";
  if (pathname === "/bedroom") return "bedroomAuthentication";
  if (pathname === "/mainhub") return "mainHub";
  if (pathname === "/leaderboard") return "victory";

  const stageMatch = pathname.match(/^\/stage\/([1-6])/);
  if (stageMatch) return `stage0${stageMatch[1]}` as BgmKey;
  return "characterSelection";
};

const ATTRIBUTE_CUES: Record<string, SfxKey | null> = {
  none: null,
  hover: "uiHover",
  select: "uiSelect",
  confirm: "uiConfirm",
  close: "uiClose",
  tab: "uiTabSwitch",
  customization: "customizationEquip",
  pet: "petEquip",
  dialogue: "dialogueContinue",
  loadout: "loadoutOpen",
};

const getInteractiveElement = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(
    'button, [role="button"], [data-audio-interactive="true"]'
  );
};

const isDisabled = (element: HTMLElement) =>
  element instanceof HTMLButtonElement
    ? element.disabled
    : element.getAttribute("aria-disabled") === "true";

export const GameAudioDirector = () => {
  const location = useLocation();
  const musicVolume = useGameStore((state) => state.musicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const lastHoverRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    gameAudio.setVolumes(musicVolume, sfxVolume);
  }, [musicVolume, sfxVolume]);

  useLayoutEffect(() => {
    cancelSpeechNarration();
  }, [location.pathname]);

  useEffect(() => {
    gameAudio.playBgm(routeToBgm(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const unlock = () => gameAudio.unlock();

    const handlePointerOver = (event: PointerEvent) => {
      const element = getInteractiveElement(event.target);
      if (!element || isDisabled(element) || lastHoverRef.current === element) return;
      lastHoverRef.current = element;
      const attribute = element.dataset.audioCue;
      if (attribute === "none") return;
      gameAudio.playSfx("uiHover");
    };

    const handlePointerOut = (event: PointerEvent) => {
      const element = getInteractiveElement(event.target);
      if (!element || lastHoverRef.current !== element) return;
      const related = event.relatedTarget;
      if (related instanceof Node && element.contains(related)) return;
      lastHoverRef.current = null;
    };

    const handleClick = (event: MouseEvent) => {
      const element = getInteractiveElement(event.target);
      if (!element || isDisabled(element)) return;
      const attribute = element.dataset.audioCue ?? "select";
      const cue = Object.prototype.hasOwnProperty.call(ATTRIBUTE_CUES, attribute)
        ? ATTRIBUTE_CUES[attribute]
        : "uiSelect";
      if (cue) gameAudio.playSfx(cue);
    };

    window.addEventListener("pointerdown", unlock, { capture: true });
    window.addEventListener("keydown", unlock, { capture: true });
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
};

export default GameAudioDirector;
