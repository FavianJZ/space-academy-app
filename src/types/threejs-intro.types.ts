
export type GamePhase = 
  | 'idle'
  | 'initializing'
  | 'intro'
  | 'navigation'
  | 'crisis'
  | 'crash'
  | 'completed';

export type NavigationRoute = 'Mesin' | 'Navigasi' | 'Bensin' | 'Blackhole';

export interface GameState {
  kecepatanWarp: number;
  isAlarmActive: boolean;
  isShaking: boolean;
  phase: GamePhase;
  selectedRoute?: NavigationRoute;
}

export interface AudioAssets {
  bgm: HTMLAudioElement | null;
  suspenseBgm: HTMLAudioElement | null;
  sfxEngine: HTMLAudioElement | null;
  sfxRingtone: HTMLAudioElement | null;
  sfxAlarm: HTMLAudioElement | null;
  sfxWarp: HTMLAudioElement | null;
  sfxExplosion: HTMLAudioElement | null;
  sfxQTEcorrect: HTMLAudioElement | null;
  sfxQTEwrong: HTMLAudioElement | null;
  sfxLaser: HTMLAudioElement | null;
  sfxVehicleDestroyed: HTMLAudioElement | null;
  sfxMissionSuccess: HTMLAudioElement | null;
  sfxMissionFailure: HTMLAudioElement | null;
  sfxGlitch: HTMLAudioElement | null;
  sfxTyping: HTMLAudioElement | null;
}

export interface AIDialogueOptions {
  hideAfterMs?: number;
  useVoice?: boolean;
}

export interface StoryState {
  currentRoute?: NavigationRoute;
  dialogueIndex: number;
  isPlaying: boolean;
}

export interface EnvironmentConfig {
  starsCount: number;
  warpLinesCount: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ambientLightColor: number;
  ambientLightIntensity: number;
  directionalLightColor: number;
  directionalLightIntensity: number;
  pointLightColor: number;
  pointLightIntensity: number;
}

export interface LightingState {
  ambientIntensity: number;
  directionalIntensity: number;
  pointIntensity: number;
}
