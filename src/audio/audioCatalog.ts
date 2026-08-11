export type BgmKey =
  | "characterSelection"
  | "introRouteSelection"
  | "bedroomAuthentication"
  | "mainHub"
  | "victory"
  | "stage01"
  | "stage02"
  | "stage03"
  | "stage04"
  | "stage05"
  | "stage06";

export type SfxKey =
  | "uiHover"
  | "uiSelect"
  | "uiConfirm"
  | "uiClose"
  | "uiTabSwitch"
  | "customizationEquip"
  | "planetHover"
  | "planetSelect"
  | "loadoutOpen"
  | "introWarp"
  | "rocketEngineHum"
  | "meteorWarning"
  | "meteorGraze"
  | "emergencyRecalibration"
  | "landingTouchdown"
  | "landingDebris"
  | "dialogueType"
  | "robotSpeaking"
  | "dialogueContinue"
  | "feedbackIncorrect"
  | "feedbackCorrect"
  | "puzzlePickup"
  | "puzzlePlace"
  | "circuitConnect"
  | "nodeDragStart"
  | "nodeDrop"
  | "timerTick"
  | "timerLowTime"
  | "bugTarget"
  | "bugSquash"
  | "bossRaidHit"
  | "bossWarning"
  | "petEquip"
  | "petChirp"
  | "petHop"
  | "characterWake"
  | "characterIdleServo"
  | "characterConfused"
  | "missionComplete";

export type AudioChannel =
  | "ui-hover"
  | "ui-action"
  | "ui-tab"
  | "navigation-hover"
  | "navigation-action"
  | "dialogue"
  | "character"
  | "character-accent"
  | "interaction"
  | "feedback"
  | "timer"
  | "combat"
  | "mission"
  | "ambience";

export type SfxCue = {
  src: string;
  durationMs: number;
  /** Duration of the visible attack/reaction, excluding the generated audio tail. */
  motionMs: number;
  volume: number;
  channel: AudioChannel;
  cooldownMs: number;
  loop?: boolean;
  polyphonic?: boolean;
  duckBgm?: number;
};

export const BGM_TRACKS: Record<BgmKey, string> = {
  characterSelection: "/audio/bgm/bgm_character_selection_loop.mp3",
  introRouteSelection: "/audio/bgm/bgm_intro_route_selection_loop.mp3",
  bedroomAuthentication: "/audio/bgm/bgm_bedroom_authentication_loop.mp3",
  mainHub: "/audio/bgm/bgm_mainhub_planet_navigation_loop.mp3",
  victory: "/audio/bgm/music_victory_completion_sting.mp3",
  stage01: "/audio/bgm/bgm_stage01_novaris_loop.mp3",
  stage02: "/audio/bgm/bgm_stage02_quizara_loop.mp3",
  stage03: "/audio/bgm/bgm_stage03_puzzlon_loop.mp3",
  stage04: "/audio/bgm/bgm_stage04_flowra_loop.mp3",
  stage05: "/audio/bgm/bgm_stage05_logitron_loop.mp3",
  stage06: "/audio/bgm/bgm_stage06_ultimara_loop.mp3",
};

export const VICTORY_STING_SRC =
  "/audio/bgm/music_victory_completion_sting.mp3";

export const SFX_CUES: Record<SfxKey, SfxCue> = {
  uiHover: {
    src: "/audio/sfx/sfx_ui_hover.wav",
    durationMs: 1000,
    motionMs: 180,
    volume: 0.2,
    channel: "ui-hover",
    cooldownMs: 420,
  },
  uiSelect: {
    src: "/audio/sfx/sfx-ui-select.wav",
    durationMs: 3000,
    motionMs: 420,
    volume: 0.24,
    channel: "ui-action",
    cooldownMs: 240,
  },
  uiConfirm: {
    src: "/audio/sfx/sfx-ui-confirm.wav",
    durationMs: 2000,
    motionMs: 1450,
    volume: 0.34,
    channel: "ui-action",
    cooldownMs: 900,
    duckBgm: 0.78,
  },
  uiClose: {
    src: "/audio/sfx/sfx_ui_close.wav",
    durationMs: 3000,
    motionMs: 620,
    volume: 0.25,
    channel: "ui-action",
    cooldownMs: 300,
  },
  uiTabSwitch: {
    src: "/audio/sfx/sfx_ui_tab_switch.wav",
    durationMs: 1000,
    motionMs: 360,
    volume: 0.27,
    channel: "ui-tab",
    cooldownMs: 260,
  },
  customizationEquip: {
    src: "/audio/sfx/sfx_customization_equip.wav",
    durationMs: 3000,
    motionMs: 1350,
    volume: 0.35,
    channel: "ui-action",
    cooldownMs: 500,
    duckBgm: 0.86,
  },
  planetHover: {
    src: "/audio/sfx/sfx_planet_hover.wav",
    durationMs: 6000,
    motionMs: 480,
    volume: 0.17,
    channel: "navigation-hover",
    cooldownMs: 900,
  },
  planetSelect: {
    src: "/audio/sfx/sfx_planet_select.wav",
    durationMs: 3000,
    motionMs: 1500,
    volume: 0.38,
    channel: "navigation-action",
    cooldownMs: 900,
    duckBgm: 0.72,
  },
  loadoutOpen: {
    src: "/audio/sfx/sfx_loadout_open.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.36,
    channel: "ui-action",
    cooldownMs: 400,
  },
  introWarp: {
    src: "/audio/sfx/sfx_intro_warp.wav",
    durationMs: 4000,
    motionMs: 4000,
    volume: 0.38,
    channel: "navigation-action",
    cooldownMs: 1800,
    duckBgm: 0.78,
  },
  rocketEngineHum: {
    src: "/audio/sfx/sfx_rocket_engine_hum_loop.wav",
    durationMs: 2000,
    motionMs: 2000,
    volume: 0.2,
    channel: "ambience",
    cooldownMs: 0,
    loop: true,
  },
  meteorWarning: {
    src: "/audio/sfx/sfx_meteor_warning.wav",
    durationMs: 1000,
    motionMs: 1000,
    volume: 0.42,
    channel: "feedback",
    cooldownMs: 800,
    duckBgm: 0.75,
  },
  meteorGraze: {
    src: "/audio/sfx/sfx_meteor_graze.wav",
    durationMs: 3000,
    motionMs: 1800,
    volume: 0.52,
    channel: "combat",
    cooldownMs: 1500,
    duckBgm: 0.55,
  },
  emergencyRecalibration: {
    src: "/audio/sfx/sfx_emergency_recalibration.wav",
    durationMs: 2000,
    motionMs: 2000,
    volume: 0.38,
    channel: "feedback",
    cooldownMs: 1000,
    duckBgm: 0.7,
  },
  landingTouchdown: {
    src: "/audio/sfx/sfx_landing_touchdown.wav",
    durationMs: 2000,
    motionMs: 2000,
    volume: 0.5,
    channel: "combat",
    cooldownMs: 1800,
    duckBgm: 0.6,
  },
  landingDebris: {
    src: "/audio/sfx/sfx_landing_debris.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.28,
    channel: "interaction",
    cooldownMs: 400,
  },
  dialogueType: {
    src: "/audio/sfx/sfx_dialogue_type_loop.wav",
    durationMs: 14000,
    motionMs: 14000,
    volume: 0.12,
    channel: "dialogue",
    cooldownMs: 0,
    loop: true,
  },
  robotSpeaking: {
    src: "/audio/sfx/sfx_robot_speaking_pulse.wav",
    durationMs: 4000,
    motionMs: 4000,
    volume: 0.15,
    channel: "dialogue",
    cooldownMs: 0,
    loop: true,
  },
  dialogueContinue: {
    src: "/audio/sfx/sfx_dialogue_continue.wav",
    durationMs: 5000,
    motionMs: 520,
    volume: 0.2,
    channel: "ui-action",
    cooldownMs: 450,
  },
  feedbackIncorrect: {
    src: "/audio/sfx/sfx_feedback_incorrect.wav",
    durationMs: 1000,
    motionMs: 1000,
    volume: 0.4,
    channel: "feedback",
    cooldownMs: 700,
  },
  feedbackCorrect: {
    src: "/audio/sfx/sfx_feedback_correct.wav",
    durationMs: 3000,
    motionMs: 1750,
    volume: 0.4,
    channel: "feedback",
    cooldownMs: 800,
    duckBgm: 0.82,
  },
  puzzlePickup: {
    src: "/audio/sfx/sfx_puzzle_pickup.wav",
    durationMs: 480,
    motionMs: 300,
    volume: 0.3,
    channel: "interaction",
    cooldownMs: 150,
    polyphonic: true,
  },
  puzzlePlace: {
    src: "/audio/sfx/sfx_puzzle_place.wav",
    durationMs: 480,
    motionMs: 380,
    volume: 0.34,
    channel: "interaction",
    cooldownMs: 120,
    polyphonic: true,
  },
  circuitConnect: {
    src: "/audio/sfx/sfx_circuit_connect.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.4,
    channel: "interaction",
    cooldownMs: 140,
    polyphonic: true,
  },
  nodeDragStart: {
    src: "/audio/sfx/sfx_node_drag_start.wav",
    durationMs: 480,
    motionMs: 220,
    volume: 0.27,
    channel: "interaction",
    cooldownMs: 100,
  },
  nodeDrop: {
    src: "/audio/sfx/sfx_node_drop.wav",
    durationMs: 480,
    motionMs: 300,
    volume: 0.3,
    channel: "interaction",
    cooldownMs: 100,
  },
  timerTick: {
    src: "/audio/sfx/sfx_timer_tick.wav",
    durationMs: 480,
    motionMs: 180,
    volume: 0.12,
    channel: "timer",
    cooldownMs: 750,
  },
  timerLowTime: {
    src: "/audio/sfx/sfx_timer_low_time.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.28,
    channel: "timer",
    cooldownMs: 700,
  },
  bugTarget: {
    src: "/audio/sfx/sfx_bug_target.wav",
    durationMs: 480,
    motionMs: 260,
    volume: 0.2,
    channel: "interaction",
    cooldownMs: 180,
  },
  bugSquash: {
    src: "/audio/sfx/sfx_bug_squash.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.4,
    channel: "combat",
    cooldownMs: 80,
    polyphonic: true,
  },
  bossRaidHit: {
    src: "/audio/sfx/sfx_boss_raid_hit.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.43,
    channel: "combat",
    cooldownMs: 80,
    polyphonic: true,
  },
  bossWarning: {
    src: "/audio/sfx/sfx_boss_warning.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.4,
    channel: "feedback",
    cooldownMs: 900,
    duckBgm: 0.82,
  },
  petEquip: {
    src: "/audio/sfx/sfx_pet_equip.wav",
    durationMs: 480,
    motionMs: 720,
    volume: 0.38,
    channel: "ui-action",
    cooldownMs: 420,
  },
  petChirp: {
    src: "/audio/sfx/sfx_pet_chirp.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.27,
    channel: "character",
    cooldownMs: 1600,
  },
  petHop: {
    src: "/audio/sfx/sfx_pet_hop.wav",
    durationMs: 480,
    motionMs: 480,
    volume: 0.22,
    channel: "character",
    cooldownMs: 900,
  },
  characterWake: {
    src: "/audio/sfx/sfx_character_wake.wav",
    durationMs: 1200,
    motionMs: 2550,
    volume: 0.4,
    channel: "character",
    cooldownMs: 2200,
    duckBgm: 0.78,
  },
  characterIdleServo: {
    src: "/audio/sfx/sfx_character_idle_servo_loop.wav",
    durationMs: 3000,
    motionMs: 3000,
    volume: 0.08,
    channel: "character",
    cooldownMs: 0,
    loop: true,
  },
  characterConfused: {
    src: "/audio/sfx/sfx_character_confused.wav",
    durationMs: 480,
    motionMs: 620,
    volume: 0.3,
    channel: "character-accent",
    cooldownMs: 4500,
  },
  missionComplete: {
    src: "/audio/sfx/sfx_mission_complete.wav",
    durationMs: 1200,
    motionMs: 1200,
    volume: 0.5,
    channel: "mission",
    cooldownMs: 1000,
    duckBgm: 0.42,
  },
};

export const getSfxMotionMs = (key: SfxKey) => SFX_CUES[key].motionMs;
