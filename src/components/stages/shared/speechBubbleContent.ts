import type { Language } from "../../../types/game.types";
import { getTranslation } from "../../../i18n/translations";

export type EmoteType = "idle" | "flip" | "wave" | "jump" | "dance";

export const getRobotMessages = (lang: Language) => {
  const t = getTranslation(lang).stages.speech;
  return {
    idle: t.robotIdle as unknown as string[],
    correct: t.robotCorrect as unknown as string[],
    incorrect: t.robotIncorrect as unknown as string[],
    thinking: t.robotThinking as unknown as string[],
  };
};

export const getSpacemanMessages = (lang: Language): Record<EmoteType, string[]> => {
  const t = getTranslation(lang).stages.speech;
  return {
    idle: t.spacemanIdle as unknown as string[],
    wave: t.spacemanWave as unknown as string[],
    flip: t.spacemanFlip as unknown as string[],
    jump: t.spacemanJump as unknown as string[],
    dance: t.spacemanDance as unknown as string[],
  };
};

// Backwards-compatible defaults (Indonesian by default if not specified)
export const robotMessages = getRobotMessages("id");
export const spacemanMessages = getSpacemanMessages("id");

export const getRandomMessage = (messages: string[] | readonly string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};
