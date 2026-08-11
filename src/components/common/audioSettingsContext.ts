import { createContext, useContext } from "react";

export type AudioSettingsContextValue = {
  isOpen: boolean;
  openAudioSettings: () => void;
  closeAudioSettings: () => void;
};

export const AudioSettingsContext =
  createContext<AudioSettingsContextValue | null>(null);

export const useAudioSettings = () => {
  const context = useContext(AudioSettingsContext);

  if (!context) {
    throw new Error("useAudioSettings must be used inside AudioSettingsProvider");
  }

  return context;
};
