import type { MutableRefObject } from "react";
import * as THREE from "three";

import type { GamePhase, IntroStoryBeat } from "../../types/threejs-intro.types";

/**
 * Where the NAV-02 route is in its player-controlled flight.
 *
 * off      – not a manual route (or not started)
 * flying   – the player has the stick
 * landing  – landing gate cleared, blending into the scripted landing
 * done     – the scripted landing animation owns the shuttle again
 */
export type ManualFlightStage = "off" | "flying" | "landing" | "done";

/* -------------------------------------------------------------------------- */
/*  Input actions                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Gameplay only ever reads named actions, never raw key codes. Rebinding or
 * adding a gamepad later means editing this map, not the flight model.
 */
export type FlightAction =
  | "pitchDown"
  | "pitchUp"
  | "rollLeft"
  | "rollRight"
  | "yawLeft"
  | "yawRight"
  | "throttle";

export const FLIGHT_BINDINGS: Record<string, FlightAction> = {
  KeyW: "pitchDown",
  KeyS: "pitchUp",
  KeyA: "rollLeft",
  KeyD: "rollRight",
  KeyQ: "yawLeft",
  KeyE: "yawRight",
  Space: "throttle",
  ArrowUp: "pitchDown",
  ArrowDown: "pitchUp",
  ArrowLeft: "rollLeft",
  ArrowRight: "rollRight",
};

/* -------------------------------------------------------------------------- */
/*  Flight model tuning                                                        */
/* -------------------------------------------------------------------------- */

export const FLIGHT_TUNING = {
  /** The shuttle never stops; this is the idle cruise speed (units/second). */
  minSpeed: 5.2,
  /** Speed with the throttle fully held. */
  maxSpeed: 11.4,
  /** How fast the throttle ramps up while SPACE is held (per second). */
  throttleAttack: 1.35,
  /** How fast the throttle bleeds off once SPACE is released. */
  throttleRelease: 0.95,

  /** Peak angular rates, radians/second. */
  pitchRate: 1.42,
  rollRate: 2.55,
  yawRate: 0.86,

  /** Control inertia — how quickly a stick input reaches its peak rate. */
  controlSmoothing: 7.4,

  /**
   * A banked shuttle carves the turn on its own, exactly like an aircraft.
   * This is what makes A/D feel like flying instead of barrel-rolling.
   */
  bankTurnGain: 1.05,

  /** Chase camera offset in shuttle-local space (model forward is +Z). */
  cameraOffset: [0, 1.32, -6.1] as [number, number, number],
  cameraLookAhead: 5.4,
  cameraPositionDamping: 5.2,
  cameraRotationDamping: 4.4,
  fovIdle: 52,
  fovBoost: 63,
} as const;

/* -------------------------------------------------------------------------- */
/*  Play area containment                                                      */
/* -------------------------------------------------------------------------- */

export const FLIGHT_BOUNDS = {
  center: new THREE.Vector3(-1, 0.4, -11),
  /** Past this radius ORBIT starts nudging the nose back toward the map. */
  softRadius: 25.5,
  /** Absolute wall — position is clamped here, the shuttle cannot pass it. */
  hardRadius: 31.5,
  /** Strength of the autopilot correction at the hard radius. */
  correctionGain: 3.4,
} as const;

export interface NoFlyVolume {
  center: THREE.Vector3;
  radius: number;
  /** Vertical squash — >1 makes a flat, disc shaped exclusion volume. */
  verticalScale: number;
}

/** Solid world geometry the shuttle must not fly through. */
export const NO_FLY_VOLUMES: NoFlyVolume[] = [
  {
    // planet_earth.glb
    center: new THREE.Vector3(-9.5, 4.2, -17.5),
    radius: 5.9,
    verticalScale: 1,
  },
  {
    // island_flying.glb — wide and flat, so the volume is squashed vertically.
    center: new THREE.Vector3(9, -9.8, -22),
    radius: 11.2,
    verticalScale: 2.4,
  },
];

/* -------------------------------------------------------------------------- */
/*  Gate course                                                                */
/* -------------------------------------------------------------------------- */

export interface FlightGateConfig {
  id: string;
  /** Gate centre in world space. */
  position: [number, number, number];
  /** Direction of travel through the gate; also the ring's facing. */
  normal: [number, number, number];
  radius: number;
  /** Short code shown on the HUD. */
  code: string;
  color: string;
  /** Story beat this gate promotes the scene to. */
  beat: IntroStoryBeat;
  phase: GamePhase;
  alarm: boolean;
  /** ORBIT's line, spoken as an overlay while the player keeps flying. */
  dialogue: string;
}

export const NAV_SPAWN = {
  position: [-8.2, 6.2, 8.5] as [number, number, number],
  forward: [0.38, -0.06, -0.92] as [number, number, number],
};

export const NAV_FLIGHT_BRIEFING =
  "Kendali manual aktif, Komandan. Kapal terus melaju sendiri. W turunkan hidung, S angkat hidung, A dan D miringkan sayap, Q dan E putar ekor, tahan SPASI untuk menambah dorongan. Ikuti panah dan lewati setiap gerbang biru.";

/**
 * Ten exploration gates that loop around the planet and the floating island,
 * then one landing gate that hands control back to ORBIT.
 */
export const NAV_FLIGHT_GATES: FlightGateConfig[] = [
  {
    id: "nav-gate-01",
    position: [-4.4, 5.6, 0.2],
    normal: [0.415, -0.066, -0.907],
    radius: 2.65,
    code: "WP-01",
    color: "#55ecff",
    beat: "route-locked",
    phase: "navigation",
    alarm: false,
    dialogue:
      "Gerbang satu terlewati. Lintasanmu sudah terkunci di sensorku. Panah di depan kokpit akan selalu menunjuk gerbang berikutnya.",
  },
  {
    id: "nav-gate-02",
    position: [-11.8, 8.4, -7.8],
    normal: [-0.643, 0.243, -0.73],
    radius: 2.65,
    code: "WP-02",
    color: "#55ecff",
    beat: "route-locked",
    phase: "navigation",
    alarm: false,
    dialogue:
      "Bagus. Miring ke kiri sambil naik; gerbang berikutnya menyusuri sisi terang planet.",
  },
  {
    id: "nav-gate-03",
    position: [-16.4, 3.2, -18.2],
    normal: [-0.374, -0.423, -0.813],
    radius: 2.7,
    code: "WP-03",
    color: "#55ecff",
    beat: "route-locked",
    phase: "navigation",
    alarm: false,
    dialogue:
      "Kita masuk bayangan planet. Jaga sayap tetap rata, lalu turunkan hidung menuju koridor bawah.",
  },
  {
    id: "nav-gate-04",
    position: [-10.6, -3.6, -26.2],
    normal: [0.483, -0.567, -0.667],
    radius: 2.75,
    code: "WP-04",
    color: "#8fb6ff",
    beat: "route-crisis",
    phase: "crisis",
    alarm: true,
    dialogue:
      "Badai magnetik masuk! Sinyal gerbang mulai berganda. Aku menandai yang asli dengan biru; abaikan bayangan merah muda.",
  },
  {
    id: "nav-gate-05",
    position: [0.6, -6.4, -30.2],
    normal: [0.918, -0.23, -0.328],
    radius: 2.8,
    code: "WP-05",
    color: "#8fb6ff",
    beat: "route-crisis",
    phase: "crisis",
    alarm: true,
    dialogue:
      "Haluan melenceng delapan belas derajat. Ratakan kapal dan susul gerbang berikutnya di dasar koridor.",
  },
  {
    id: "nav-gate-06",
    position: [11.6, -2.6, -24],
    normal: [0.833, 0.288, 0.47],
    radius: 2.8,
    code: "WP-06",
    color: "#8fb6ff",
    beat: "route-crisis",
    phase: "crisis",
    alarm: true,
    dialogue:
      "Kita melintas di bawah daratan terapung. Tambah dorongan; jangan sampai tersedot arus gravitasinya.",
  },
  {
    id: "nav-gate-07",
    position: [14.2, 3.8, -13.4],
    normal: [0.205, 0.504, 0.835],
    radius: 2.75,
    code: "WP-07",
    color: "#8fb6ff",
    beat: "route-crisis",
    phase: "crisis",
    alarm: true,
    dialogue:
      "Sisi kanan aman. Naik memutari daratan itu; sensorku mulai membaca ulang posisi bintang.",
  },
  {
    id: "nav-gate-08",
    position: [8.4, 7.2, -2.6],
    normal: [-0.457, 0.268, 0.851],
    radius: 2.7,
    code: "WP-08",
    color: "#7cf7d0",
    beat: "route-climax",
    phase: "crash",
    alarm: false,
    dialogue:
      "Vektor asli ditemukan lewat posisi bintang. Sinyal palsu padam. Sekarang kita berbalik ke koridor pendaratan.",
  },
  {
    id: "nav-gate-09",
    position: [-1.6, 6.4, 4.8],
    normal: [-0.8, -0.064, 0.592],
    radius: 2.7,
    code: "WP-09",
    color: "#7cf7d0",
    beat: "route-climax",
    phase: "crash",
    alarm: false,
    dialogue:
      "Kita terlalu rendah untuk kembali ke orbit. Aku memilih daratan terapung itu sebagai tujuan akhir.",
  },
  {
    id: "nav-gate-10",
    position: [-7.8, 2.4, -2.8],
    normal: [-0.585, -0.377, -0.717],
    radius: 2.7,
    code: "WP-10",
    color: "#7cf7d0",
    beat: "route-climax",
    phase: "crash",
    alarm: false,
    dialogue:
      "Koridor pendaratan terkunci. Satu gerbang lagi, lalu aku ambil alih kendali untuk pendaratan.",
  },
  {
    id: "nav-gate-landing",
    // Matches NAVIGATION_APPROACH_START so the handoff into the scripted
    // landing animation starts from the pose the cinematic expects.
    position: [0.9, -2.3, -12.7],
    normal: [0.42, -0.36, -0.83],
    radius: 3.1,
    code: "LND-00",
    color: "#ffd76a",
    beat: "route-approach",
    phase: "crash",
    alarm: false,
    dialogue: "",
  },
];

export const LANDING_GATE_INDEX = NAV_FLIGHT_GATES.length - 1;

/**
 * Ghost signals are live from the moment the magnetic storm gate is cleared
 * until the gate that recovers the true vector.
 */
export const GHOST_GATE_RANGE = {
  from: NAV_FLIGHT_GATES.findIndex((gate) => gate.beat === "route-crisis") + 1,
  to: NAV_FLIGHT_GATES.findIndex((gate) => gate.beat === "route-climax"),
} as const;

/** Ghost gates that appear once the magnetic storm beat starts. */
export const NAV_PHANTOM_GATES: {
  position: [number, number, number];
  normal: [number, number, number];
}[] = [
  { position: [-8.2, -1.4, -24.6], normal: [0.48, -0.57, -0.67] },
  { position: [2.9, -8.9, -28.4], normal: [0.92, -0.23, -0.33] },
  { position: [9.4, -5.1, -25.8], normal: [0.83, 0.29, 0.47] },
  { position: [15.9, 6.4, -15.2], normal: [0.21, 0.5, 0.84] },
];

/**
 * Where the cinematic timeline resumes after the landing gate. Slightly before
 * ROUTE_TIMING.approach so the landing gear deploys naturally instead of
 * popping out mid-animation.
 */
export const LANDING_HANDOFF_TIME = 12.2;
/** Seconds spent blending the player's pose into the cinematic pose. */
export const LANDING_ALIGN_DURATION = 1.35;

/* -------------------------------------------------------------------------- */
/*  Course progress shared between the controller and the gate visuals         */
/* -------------------------------------------------------------------------- */

export interface NavCourseState {
  activeIndex: number;
  /** Clock time each gate was cleared, or -1. Drives the clear burst. */
  clearedAt: number[];
  ghostsVisible: boolean;
  stage: "idle" | "flying" | "aligning" | "done";
}

export const createNavCourseState = (): NavCourseState => ({
  activeIndex: 0,
  clearedAt: NAV_FLIGHT_GATES.map(() => -1),
  ghostsVisible: false,
  stage: "idle",
});

export type NavCourseRef = MutableRefObject<NavCourseState>;

/* -------------------------------------------------------------------------- */
/*  Telemetry shared with the HUD                                              */
/* -------------------------------------------------------------------------- */

export interface NavFlightTelemetry {
  active: boolean;
  aligning: boolean;
  gateIndex: number;
  gateTotal: number;
  gateCode: string;
  isLandingGate: boolean;
  distance: number;
  speed: number;
  speedRatio: number;
  throttle: number;
  boundary: number;
  onScreen: boolean;
  /** Normalised 0..1 screen coordinates of the active gate. */
  screenX: number;
  screenY: number;
  /** Screen-space bearing to the gate, degrees, 0 = up. */
  bearingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  idleHint: boolean;
}

export type NavTelemetryRef = MutableRefObject<NavFlightTelemetry>;

export const createNavFlightTelemetry = (): NavFlightTelemetry => ({
  active: false,
  aligning: false,
  gateIndex: 0,
  gateTotal: NAV_FLIGHT_GATES.length,
  gateCode: NAV_FLIGHT_GATES[0].code,
  isLandingGate: false,
  distance: 0,
  speed: FLIGHT_TUNING.minSpeed,
  speedRatio: 0,
  throttle: 0,
  boundary: 0,
  onScreen: true,
  screenX: 0.5,
  screenY: 0.5,
  bearingDeg: 0,
  pitchDeg: 0,
  rollDeg: 0,
  idleHint: false,
});
