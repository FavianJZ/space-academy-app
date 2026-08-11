export type SpeechNarrationResult =
  | "completed"
  | "cancelled"
  | "error"
  | "unavailable";

export type SpeechNarrationOptions = {
  lang?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  preferredVoiceLanguage?: string;
};

type ActiveNarration = {
  id: number;
  utterance: SpeechSynthesisUtterance;
  watchdog: number;
  resolve: (result: SpeechNarrationResult) => void;
};

let narrationSequence = 0;
let activeNarration: ActiveNarration | null = null;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const normalizeNarrationText = (text: string) =>
  text
    .replaceAll("\u26a0", " ")
    .replaceAll("\ufe0f", " ")
    .replace(/\s+/g, " ")
    .trim();

export const estimateNarrationDurationMs = (text: string, rate = 1) => {
  const wordCount = Math.max(1, normalizeNarrationText(text).split(" ").length);
  const wordsPerSecond = 2.05 * clamp(rate, 0.5, 2);

  return clamp(Math.round((wordCount / wordsPerSecond) * 1000 + 650), 1200, 30000);
};

const resolveActiveNarration = (
  id: number,
  result: SpeechNarrationResult
) => {
  if (!activeNarration || activeNarration.id !== id) return;

  const current = activeNarration;
  activeNarration = null;
  window.clearTimeout(current.watchdog);
  current.utterance.onend = null;
  current.utterance.onerror = null;
  current.resolve(result);
};

export const cancelSpeechNarration = () => {
  narrationSequence += 1;

  if (activeNarration) {
    const current = activeNarration;
    activeNarration = null;
    window.clearTimeout(current.watchdog);
    current.utterance.onend = null;
    current.utterance.onerror = null;
    current.resolve("cancelled");
  }

  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
  window.speechSynthesis.cancel();
};

export const speakNarration = (
  text: string,
  options: SpeechNarrationOptions = {}
): Promise<SpeechNarrationResult> => {
  const normalizedText = normalizeNarrationText(text);

  cancelSpeechNarration();

  if (
    !normalizedText ||
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return Promise.resolve("unavailable");
  }

  const id = ++narrationSequence;
  const rate = clamp(options.rate ?? 1, 0.5, 2);
  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.lang = options.lang ?? "id-ID";
  utterance.pitch = clamp(options.pitch ?? 1, 0, 2);
  utterance.rate = rate;
  utterance.volume = clamp(options.volume ?? 1, 0, 1);

  const preferredLanguage = (
    options.preferredVoiceLanguage ?? utterance.lang
  ).toLowerCase();
  const preferredVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith(preferredLanguage));

  if (preferredVoice) utterance.voice = preferredVoice;

  return new Promise<SpeechNarrationResult>((resolve) => {
    utterance.onend = () => resolveActiveNarration(id, "completed");
    utterance.onerror = () => resolveActiveNarration(id, "error");

    const watchdogDuration = Math.max(
      30000,
      estimateNarrationDurationMs(normalizedText, rate) * 2 + 5000
    );
    const watchdog = window.setTimeout(() => {
      if (!activeNarration || activeNarration.id !== id) return;
      window.speechSynthesis.cancel();
      resolveActiveNarration(id, "error");
    }, watchdogDuration);

    activeNarration = {
      id,
      utterance,
      watchdog,
      resolve,
    };

    window.speechSynthesis.speak(utterance);
  });
};
