import * as THREE from "three";

import type { NavigationRoute } from "../../types/threejs-intro.types";

export const ROUTE_TIMING = {
  crisis: 4.8,
  recovery: 9.4,
  approach: 12.8,
  touchdown: 16.8,
  settled: 18.4,
  complete: 20,
} as const;

export const SHUTTLE_TARGET_SIZE = 2.45;

type VectorTuple = [number, number, number];
type IslandModel = "ground" | "flying" | "floating";

export interface RouteWorldConfig {
  accent: string;
  islandModel: IslandModel;
  islandPosition: VectorTuple;
  islandRotationY: number;
  islandSize: number;
  landingSiteLocal: [number, number];
  deckY: number;
  landingPosition: VectorTuple;
  parkedPosition: VectorTuple;
  runwayDirection: VectorTuple;
  landingCameraPosition: VectorTuple;
  landingCameraTarget: VectorTuple;
  cameraOffsets: {
    cruise: VectorTuple;
    crisis: VectorTuple;
    recovery: VectorTuple;
    approach: VectorTuple;
  };
}

const MACHINE_DECK_Y = -6.62;
const NAVIGATION_DECK_Y = -5.87;
const FUEL_DECK_Y = -6.52;
const BLACK_HOLE_DECK_Y = -5.87;

const MACHINE_LANDING: VectorTuple = [-6.08, -5.84, -15.97];
const MACHINE_PARKED: VectorTuple = [-6.08, -5.84, -16.72];
const NAVIGATION_LANDING: VectorTuple = [2.4, -5.09, -17.25];
const NAVIGATION_PARKED: VectorTuple = [2.54, -5.09, -18.04];
const FUEL_LANDING: VectorTuple = [-0.65, -5.74, -23.26];
const FUEL_PARKED: VectorTuple = [-0.65, -5.74, -24.01];
const BLACK_HOLE_LANDING: VectorTuple = [5.79, -5.09, -17.63];
const BLACK_HOLE_PARKED: VectorTuple = [5.97, -5.09, -18.41];

export const ROUTE_WORLD: Record<NavigationRoute, RouteWorldConfig> = {
  Mesin: {
    accent: "#ff8a42",
    islandModel: "ground",
    islandPosition: [-2, -9.72, -16.3],
    islandRotationY: 0.22,
    islandSize: 26,
    landingSiteLocal: [-0.15, -0.05],
    deckY: MACHINE_DECK_Y,
    landingPosition: MACHINE_LANDING,
    parkedPosition: MACHINE_PARKED,
    runwayDirection: [0, 0, -1],
    landingCameraPosition: [6.2, 1.2, -2.1],
    landingCameraTarget: [-6.08, -6.05, -16.4],
    cameraOffsets: {
      cruise: [3.9, 2.1, -5.4],
      crisis: [4.45, 1.85, -5.15],
      recovery: [4.7, 2.8, -6.2],
      approach: [2.8, 1.55, -4.8],
    },
  },
  Navigasi: {
    accent: "#55e8ff",
    islandModel: "flying",
    islandPosition: [9, -9.82, -22],
    islandRotationY: -0.48,
    islandSize: 26,
    landingSiteLocal: [-0.15, 0.25],
    deckY: NAVIGATION_DECK_Y,
    landingPosition: NAVIGATION_LANDING,
    parkedPosition: NAVIGATION_PARKED,
    runwayDirection: [0.18, 0, -0.984],
    landingCameraPosition: [14.8, 2.1, -3.3],
    landingCameraTarget: [2.54, -5.2, -17.65],
    cameraOffsets: {
      cruise: [-4.5, 2.8, -5.8],
      crisis: [-4.9, 2.2, -5.45],
      recovery: [-4.3, 3.1, -6.8],
      approach: [-3.1, 1.7, -5.1],
    },
  },
  Bensin: {
    accent: "#82ff9f",
    islandModel: "floating",
    islandPosition: [0, -12.92, -20],
    islandRotationY: -0.16,
    islandSize: 26,
    landingSiteLocal: [-0.05, -0.15],
    deckY: FUEL_DECK_Y,
    landingPosition: FUEL_LANDING,
    parkedPosition: FUEL_PARKED,
    runwayDirection: [0, 0, -1],
    landingCameraPosition: [10.8, 1.5, -8],
    landingCameraTarget: [-0.65, -6.7, -23.62],
    cameraOffsets: {
      cruise: [3.3, 2.1, -5.5],
      crisis: [4.65, 1.95, -5.25],
      recovery: [4.2, 2.5, -6.2],
      approach: [2.7, 1.5, -5],
    },
  },
  Blackhole: {
    accent: "#bd79ff",
    islandModel: "flying",
    islandPosition: [12, -9.82, -23],
    islandRotationY: -0.38,
    islandSize: 26,
    landingSiteLocal: [-0.15, 0.25],
    deckY: BLACK_HOLE_DECK_Y,
    landingPosition: BLACK_HOLE_LANDING,
    parkedPosition: BLACK_HOLE_PARKED,
    runwayDirection: [0.22, 0, -0.976],
    landingCameraPosition: [19.2, 2.8, -3.5],
    landingCameraTarget: [5.97, -5.2, -18.05],
    cameraOffsets: {
      cruise: [5.8, 3.8, -7.4],
      crisis: [6.15, 4.65, -7.75],
      recovery: [5.2, 3.1, -6.7],
      approach: [3.2, 1.8, -5.2],
    },
  },
};

const curve = (...points: VectorTuple[]) =>
  new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    "centripetal",
    0.5
  );

const approachCurve = (
  start: VectorTuple,
  controlA: VectorTuple,
  controlB: VectorTuple,
  end: VectorTuple
) =>
  new THREE.CubicBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(...controlA),
    new THREE.Vector3(...controlB),
    new THREE.Vector3(...end)
  );

const MACHINE_APPROACH_START: VectorTuple = [-5.25, -3.15, -12.2];
const NAVIGATION_APPROACH_START: VectorTuple = [0.9, -2.3, -12.7];
const FUEL_APPROACH_START: VectorTuple = [-0.85, -2.55, -18.4];
const BLACK_HOLE_APPROACH_START: VectorTuple = [4.2, -2.3, -13.2];

const CRUISE_CURVES: Partial<
  Record<NavigationRoute, THREE.CatmullRomCurve3>
> = {
  Mesin: curve(
    [-6.2, 5.1, 5.5],
    [-4.9, 4.8, 2],
    [-3.1, 4.25, -2.1],
    [-2.7, 2.7, -6.4],
    [-4.1, -0.2, -9.7],
    MACHINE_APPROACH_START
  ),
  Navigasi: curve(
    [-8.2, 6.2, 6.2],
    [-6.2, 5.7, 2],
    [-2.4, 4.75, -2.8],
    [-0.9, 2.7, -6.2],
    [0.4, -0.2, -10.1],
    NAVIGATION_APPROACH_START
  ),
  Bensin: curve(
    [-6.5, 5.1, 5.2],
    [-5.3, 4.4, 1.2],
    [-3.2, 3.45, -4],
    [-1.25, 1.15, -9.8],
    [-0.95, -0.8, -15],
    FUEL_APPROACH_START
  ),
};

/**
 * Re-aims a Bézier's first handle along the heading the shuttle already has
 * when it arrives, so the tangent is continuous across the seam between two
 * curves. Handle length is preserved, so the descent keeps its tuned shape.
 *
 * Without this the heading snaps by tens of degrees at the seam, and because
 * orientation is derived from the heading, the shuttle visibly flips.
 */
const smoothSeam = (
  curveToFix: THREE.CubicBezierCurve3,
  incomingTangent: THREE.Vector3 | null
) => {
  if (!incomingTangent) return curveToFix;
  const handleLength = curveToFix.v1.distanceTo(curveToFix.v0);
  curveToFix.v1
    .copy(curveToFix.v0)
    .addScaledVector(incomingTangent, handleLength);
  return curveToFix;
};

const cruiseExitTangent = (route: NavigationRoute) =>
  CRUISE_CURVES[route]?.getTangent(1).normalize() ?? null;

const APPROACH_CURVES: Record<NavigationRoute, THREE.CubicBezierCurve3> = {
  Mesin: smoothSeam(
    approachCurve(
      MACHINE_APPROACH_START,
      [-5.45, -4.05, -13.35],
      [-5.9, -5.8, -14.85],
      MACHINE_LANDING
    ),
    cruiseExitTangent("Mesin")
  ),
  Navigasi: smoothSeam(
    approachCurve(
      NAVIGATION_APPROACH_START,
      [1.25, -3.2, -14],
      [1.95, -4.95, -15.95],
      NAVIGATION_LANDING
    ),
    cruiseExitTangent("Navigasi")
  ),
  Bensin: smoothSeam(
    approachCurve(
      FUEL_APPROACH_START,
      [-0.78, -3.35, -19.75],
      [-0.66, -5.25, -22.25],
      FUEL_LANDING
    ),
    cruiseExitTangent("Bensin")
  ),
  // Blackhole arrives from the ejection curve, which is aligned to this one
  // below rather than the other way round.
  Blackhole: approachCurve(
    BLACK_HOLE_APPROACH_START,
    [4.45, -3.2, -14.45],
    [5.15, -4.95, -16.35],
    BLACK_HOLE_LANDING
  ),
};

export const BLACK_HOLE_POSITION = new THREE.Vector3(-3.2, 4.1, -5.8);

const blackHoleOrbitPosition = (
  time: number,
  target: THREE.Vector3
) => {
  const progress = THREE.MathUtils.clamp(
    time / ROUTE_TIMING.recovery,
    0,
    1
  );
  const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
  const angle = -1.22 + progress * 4.2;
  const radius = THREE.MathUtils.lerp(8.7, 3.75, eased);

  target.set(
    BLACK_HOLE_POSITION.x + Math.cos(angle) * radius,
    BLACK_HOLE_POSITION.y + Math.sin(time * 0.72) * (0.58 + progress * 0.42),
    BLACK_HOLE_POSITION.z + Math.sin(angle) * radius
  );
};

const blackHoleEjectionStart = new THREE.Vector3();
blackHoleOrbitPosition(ROUTE_TIMING.recovery, blackHoleEjectionStart);

/** Heading the shuttle carries out of the singularity orbit. */
const blackHoleExitTangent = (() => {
  const before = new THREE.Vector3();
  blackHoleOrbitPosition(ROUTE_TIMING.recovery - 0.08, before);
  return blackHoleEjectionStart.clone().sub(before).normalize();
})();

/** Heading the approach curve expects the shuttle to arrive on. */
const blackHoleEntryTangent = APPROACH_CURVES.Blackhole.getTangent(0).normalize();

// Both handles are derived rather than hand-placed so the ejection is tangent
// continuous with the orbit it leaves and the descent it feeds.
const BLACK_HOLE_EJECTION = new THREE.CubicBezierCurve3(
  blackHoleEjectionStart.clone(),
  blackHoleEjectionStart.clone().addScaledVector(blackHoleExitTangent, 4.8),
  new THREE.Vector3(...BLACK_HOLE_APPROACH_START).addScaledVector(
    blackHoleEntryTangent,
    -5.2
  ),
  new THREE.Vector3(...BLACK_HOLE_APPROACH_START)
);

export const ease01 = (value: number) =>
  THREE.MathUtils.smootherstep(THREE.MathUtils.clamp(value, 0, 1), 0, 1);

/**
 * How far the hull sinks toward the deck as the gear takes the load, in world
 * units. Positive is compressed. Shared with the landing gear so the struts
 * shorten by exactly the amount the body drops and the wheels stay planted.
 */
export const routeGearCompression = (time: number) => {
  const impactElapsed = time - ROUTE_TIMING.touchdown;
  if (impactElapsed < 0) return 0;
  return (
    Math.sin(impactElapsed * 15.5) * Math.exp(-impactElapsed * 5.4) * 0.075
  );
};

export const sampleRoutePosition = (
  route: NavigationRoute,
  time: number,
  target: THREE.Vector3
) => {
  const safeTime = THREE.MathUtils.clamp(time, 0, ROUTE_TIMING.complete);
  const config = ROUTE_WORLD[route];

  if (safeTime >= ROUTE_TIMING.touchdown) {
    const rollProgress = ease01(
      (safeTime - ROUTE_TIMING.touchdown) /
        (ROUTE_TIMING.settled - ROUTE_TIMING.touchdown)
    );
    target.set(
      THREE.MathUtils.lerp(
        config.landingPosition[0],
        config.parkedPosition[0],
        rollProgress
      ),
      THREE.MathUtils.lerp(
        config.landingPosition[1],
        config.parkedPosition[1],
        rollProgress
      ),
      THREE.MathUtils.lerp(
        config.landingPosition[2],
        config.parkedPosition[2],
        rollProgress
      )
    );

    // Gear compresses DOWN on contact and rebounds, rather than bouncing the
    // whole shuttle upward off the deck.
    target.y -= routeGearCompression(safeTime);
    return target;
  }

  if (safeTime >= ROUTE_TIMING.approach) {
    const progress =
      (safeTime - ROUTE_TIMING.approach) /
      (ROUTE_TIMING.touchdown - ROUTE_TIMING.approach);
    APPROACH_CURVES[route].getPoint(ease01(progress), target);
    return target;
  }

  if (route === "Blackhole") {
    if (safeTime < ROUTE_TIMING.recovery) {
      blackHoleOrbitPosition(safeTime, target);
      return target;
    }

    const progress =
      (safeTime - ROUTE_TIMING.recovery) /
      (ROUTE_TIMING.approach - ROUTE_TIMING.recovery);
    BLACK_HOLE_EJECTION.getPoint(ease01(progress), target);
    return target;
  }

  const cruiseCurve = CRUISE_CURVES[route];
  if (!cruiseCurve) {
    target.set(...config.parkedPosition);
    return target;
  }

  cruiseCurve.getPoint(ease01(safeTime / ROUTE_TIMING.approach), target);
  return target;
};

const MODEL_FORWARD = new THREE.Vector3(0, 0, 1);
/** Rotating positively about this pitches the nose down. */
const MODEL_PITCH_AXIS = new THREE.Vector3(1, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);
/** Used only if the shuttle is ever pointed straight up or straight down. */
const POLAR_UP = new THREE.Vector3(0, 0, 1);

const RUNWAY_DIRECTIONS = Object.fromEntries(
  (Object.keys(ROUTE_WORLD) as NavigationRoute[]).map((route) => [
    route,
    new THREE.Vector3(...ROUTE_WORLD[route].runwayDirection).normalize(),
  ])
) as Record<NavigationRoute, THREE.Vector3>;

/**
 * Seconds of nose-up flare before the wheels touch. Long enough that pulling
 * out of a steep emergency descent reads as a flare rather than a snap.
 */
const FLARE_DURATION = 2.1;
/** Peak flare angle, radians (~8°). */
const FLARE_ANGLE = 0.14;
/** Seconds for the nose wheel to settle after main gear contact. */
const DEROTATE_DURATION = 0.95;

/**
 * Nose attitude through the landing: eased up into the flare, held at contact,
 * then lowered onto the deck.
 */
const routeFlare = (time: number) => {
  const flareBegin = ROUTE_TIMING.touchdown - FLARE_DURATION;
  if (time <= flareBegin) return 0;
  if (time < ROUTE_TIMING.touchdown) {
    return ease01((time - flareBegin) / FLARE_DURATION) * FLARE_ANGLE;
  }
  return (
    FLARE_ANGLE *
    (1 - ease01((time - ROUTE_TIMING.touchdown) / DEROTATE_DURATION))
  );
};

const tangentScratch = new THREE.Vector3();

/**
 * The shuttle's heading at a point in time.
 *
 * This reads each curve's own tangent instead of differencing sampled
 * positions. Position sampling is eased with smootherstep, whose derivative is
 * zero at both ends of every segment, so a finite difference collapses to a
 * zero-length vector exactly at the seams — which used to leave the heading
 * undefined right where the shuttle transitions to its descent.
 */
export const sampleRouteTangent = (
  route: NavigationRoute,
  time: number,
  target: THREE.Vector3,
  scratch: THREE.Vector3 = tangentScratch
) => {
  const safeTime = THREE.MathUtils.clamp(time, 0, ROUTE_TIMING.complete);

  if (safeTime >= ROUTE_TIMING.touchdown) {
    return target.copy(RUNWAY_DIRECTIONS[route]);
  }

  if (safeTime >= ROUTE_TIMING.approach) {
    const progress =
      (safeTime - ROUTE_TIMING.approach) /
      (ROUTE_TIMING.touchdown - ROUTE_TIMING.approach);
    APPROACH_CURVES[route].getTangent(ease01(progress), target);
    return target.normalize();
  }

  if (route === "Blackhole") {
    if (safeTime < ROUTE_TIMING.recovery) {
      // The orbit is analytic and well conditioned, so a central difference is
      // safe here.
      blackHoleOrbitPosition(Math.max(0, safeTime - 0.05), scratch);
      blackHoleOrbitPosition(
        Math.min(ROUTE_TIMING.recovery, safeTime + 0.05),
        target
      );
      target.sub(scratch);
      if (target.lengthSq() < 1e-8) target.copy(RUNWAY_DIRECTIONS[route]);
      return target.normalize();
    }

    const progress =
      (safeTime - ROUTE_TIMING.recovery) /
      (ROUTE_TIMING.approach - ROUTE_TIMING.recovery);
    BLACK_HOLE_EJECTION.getTangent(ease01(progress), target);
    return target.normalize();
  }

  const cruiseCurve = CRUISE_CURVES[route];
  if (!cruiseCurve) return target.copy(RUNWAY_DIRECTIONS[route]);

  cruiseCurve.getTangent(ease01(safeTime / ROUTE_TIMING.approach), target);
  return target.normalize();
};

const routeBank = (route: NavigationRoute, time: number) => {
  const crisis = ease01(
    (time - ROUTE_TIMING.crisis) /
      (ROUTE_TIMING.recovery - ROUTE_TIMING.crisis)
  );
  const recovery = ease01(
    (time - ROUTE_TIMING.recovery) /
      (ROUTE_TIMING.approach - ROUTE_TIMING.recovery)
  );
  const levelOut = 1 - ease01(
    (time - (ROUTE_TIMING.approach - 0.7)) / 2.35
  );

  if (route === "Mesin") {
    return (
      (Math.sin(time * 0.48) * 0.045 +
        crisis * 0.17 -
        recovery * 0.12) *
      levelOut
    );
  }

  if (route === "Navigasi") {
    return (
      (Math.sin(time * 0.56) * 0.12 +
        crisis * (0.24 + Math.sin(time * 1.8) * 0.08) -
        recovery * 0.16) *
      levelOut
    );
  }

  if (route === "Bensin") {
    return (-0.07 + Math.sin(time * 0.34) * 0.035 + recovery * 0.06) * levelOut;
  }

  // Blackhole. One continuous expression across the recovery beat: the tumble
  // the singularity induces is damped out rather than cut to zero. The old
  // two-branch version jumped ~34 degrees of roll in a single frame exactly at
  // t = recovery, which snapped the shuttle upright mid-flight.
  const tumbleAmplitude =
    0.18 + crisis * (0.48 + Math.sin(time * 2.4) * 0.12);
  const spin =
    time < ROUTE_TIMING.recovery
      ? 1
      : Math.cos((time - ROUTE_TIMING.recovery) * 3.7) * (1 - recovery);
  return tumbleAmplitude * spin * levelOut;
};

const poseLookMatrix = new THREE.Matrix4();
const poseLookTarget = new THREE.Vector3();
const poseUpReference = new THREE.Vector3();
const poseFlareQuaternion = new THREE.Quaternion();

export const writeRoutePose = (
  route: NavigationRoute,
  time: number,
  position: THREE.Vector3,
  quaternion: THREE.Quaternion,
  futurePosition: THREE.Vector3,
  direction: THREE.Vector3,
  bankQuaternion: THREE.Quaternion
) => {
  sampleRoutePosition(route, time, position);
  sampleRouteTangent(route, time, direction, futurePosition);

  // Ease the heading onto the runway centreline through the flare so the
  // shuttle is already aligned at contact, instead of snapping to it.
  const flareBegin = ROUTE_TIMING.touchdown - FLARE_DURATION;
  if (time > flareBegin && time < ROUTE_TIMING.touchdown) {
    direction.lerp(
      RUNWAY_DIRECTIONS[route],
      ease01((time - flareBegin) / FLARE_DURATION)
    );
    if (direction.lengthSq() < 1e-8) direction.copy(RUNWAY_DIRECTIONS[route]);
    direction.normalize();
  }

  // Orientation is built from a world-up reference frame.
  //
  // The previous implementation used setFromUnitVectors(+Z, heading), which is
  // singular when the heading approaches -Z — and this whole scene flies toward
  // -Z. Near that antipode the minimal rotation amplifies a fraction of a
  // degree of descent into tens of degrees of roll, which is what rolled the
  // shuttle onto its back on final approach.
  poseUpReference.copy(
    Math.abs(direction.y) > 0.999 ? POLAR_UP : WORLD_UP
  );
  poseLookTarget.copy(position).sub(direction);
  poseLookMatrix.lookAt(position, poseLookTarget, poseUpReference);
  quaternion.setFromRotationMatrix(poseLookMatrix);

  // Flare the nose up for contact, then derotate onto the deck.
  poseFlareQuaternion.setFromAxisAngle(MODEL_PITCH_AXIS, -routeFlare(time));
  quaternion.multiply(poseFlareQuaternion);

  bankQuaternion.setFromAxisAngle(MODEL_FORWARD, routeBank(route, time));
  quaternion.multiply(bankQuaternion);
};
