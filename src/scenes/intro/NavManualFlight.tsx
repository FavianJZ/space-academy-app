import { Sparkles } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, {
  type MutableRefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

import { useFlightControls } from "../../hooks/useFlightControls";
import { MODEL_URLS, NormalizedModel } from "./introModels";
import {
  FLIGHT_BOUNDS,
  FLIGHT_TUNING,
  GHOST_GATE_RANGE,
  LANDING_ALIGN_DURATION,
  LANDING_GATE_INDEX,
  LANDING_HANDOFF_TIME,
  NAV_FLIGHT_GATES,
  NAV_PHANTOM_GATES,
  NAV_SPAWN,
  NO_FLY_VOLUMES,
  type NavCourseRef,
  type NavTelemetryRef,
} from "./navFlightConfig";
import {
  ROUTE_WORLD,
  SHUTTLE_TARGET_SIZE,
  ease01,
  writeRoutePose,
} from "./routeCinematicConfig";

const MODEL_FORWARD = new THREE.Vector3(0, 0, 1);
const MODEL_UP = new THREE.Vector3(0, 1, 0);
const MODEL_LEFT = new THREE.Vector3(1, 0, 0);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

const moveToward = (current: number, target: number, maxDelta: number) => {
  const diff = target - current;
  if (Math.abs(diff) <= maxDelta) return target;
  return current + Math.sign(diff) * maxDelta;
};

/* -------------------------------------------------------------------------- */
/*  Gate visuals                                                               */
/* -------------------------------------------------------------------------- */

interface FlightGateProps {
  index: number;
  courseRef: NavCourseRef;
}

const BRACKET_ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

const FlightGate: React.FC<FlightGateProps> = ({ index, courseRef }) => {
  const gate = NAV_FLIGHT_GATES[index];
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const apertureRef = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...gate.normal).normalize();
    // A torus lies in its local XY plane, so its +Z must face along the normal.
    return new THREE.Quaternion().setFromUnitVectors(MODEL_FORWARD, normal);
  }, [gate.normal]);

  const clearedColor = useMemo(() => new THREE.Color("#7cf7d0"), []);
  const baseColor = useMemo(() => new THREE.Color(gate.color), [gate.color]);
  const workColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    const course = courseRef.current;
    const time = clock.elapsedTime;
    const cleared = course.clearedAt[index] >= 0;
    const isActive = course.activeIndex === index && !cleared;
    const isFuture = index > course.activeIndex;

    const targetOpacity = cleared ? 0.3 : isActive ? 0.95 : isFuture ? 0.2 : 0.5;
    workColor.copy(cleared ? clearedColor : baseColor);

    if (groupRef.current) {
      const pulse = isActive ? 1 + Math.sin(time * 3.4) * 0.035 : 1;
      groupRef.current.scale.setScalar(pulse);
      groupRef.current.rotation.z = isActive ? time * 0.32 : time * 0.06;
    }

    if (ringRef.current) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = targetOpacity;
      material.color.copy(workColor);
    }

    if (innerRef.current) {
      const material = innerRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = targetOpacity * 0.6;
      material.color.copy(workColor);
      innerRef.current.scale.setScalar(
        isActive ? 0.74 + Math.sin(time * 2.1) * 0.04 : 0.74
      );
    }

    if (apertureRef.current) {
      const material = apertureRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isActive ? 0.1 + Math.sin(time * 2.6) * 0.035 : 0.02;
      material.color.copy(workColor);
    }

    if (lightRef.current) {
      lightRef.current.color.copy(workColor);
      lightRef.current.intensity = isActive ? 3.4 : cleared ? 0.9 : 0.35;
    }

    // Clear burst: a ring that expands and fades once, then stays hidden.
    if (burstRef.current) {
      const elapsed = cleared ? time - course.clearedAt[index] : -1;
      const visible = elapsed >= 0 && elapsed < 0.85;
      burstRef.current.visible = visible;
      if (visible) {
        const progress = ease01(elapsed / 0.85);
        burstRef.current.scale.setScalar(1 + progress * 1.5);
        const material = burstRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = (1 - progress) * 0.85;
        material.color.copy(clearedColor);
      }
    }
  });

  return (
    <group position={gate.position} quaternion={quaternion}>
      <group ref={groupRef}>
        <mesh ref={ringRef}>
          <torusGeometry args={[gate.radius, 0.075, 10, 72]} />
          <meshBasicMaterial
            color={gate.color}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <mesh ref={innerRef}>
          <torusGeometry args={[gate.radius, 0.026, 8, 64]} />
          <meshBasicMaterial
            color={gate.color}
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Soft disc so the aperture reads as something to fly *through*. */}
        <mesh ref={apertureRef}>
          <circleGeometry args={[gate.radius * 0.96, 40]} />
          <meshBasicMaterial
            color={gate.color}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        <mesh ref={burstRef} visible={false}>
          <torusGeometry args={[gate.radius, 0.05, 8, 48]} />
          <meshBasicMaterial
            color="#7cf7d0"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {BRACKET_ANGLES.map((angle) => (
          <mesh
            key={angle}
            position={[
              Math.cos(angle) * gate.radius,
              Math.sin(angle) * gate.radius,
              0,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.42, 0.1, 0.1]} />
            <meshBasicMaterial
              color={gate.color}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <pointLight ref={lightRef} color={gate.color} intensity={1} distance={9} />
    </group>
  );
};

const PhantomGate: React.FC<{
  index: number;
  courseRef: NavCourseRef;
}> = ({ index, courseRef }) => {
  const config = NAV_PHANTOM_GATES[index];
  const groupRef = useRef<THREE.Group>(null);

  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        MODEL_FORWARD,
        new THREE.Vector3(...config.normal).normalize()
      ),
    [config.normal]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.elapsedTime;
    groupRef.current.visible = courseRef.current.ghostsVisible;
    if (!groupRef.current.visible) return;
    groupRef.current.position.x = Math.sin(time * 5.1 + index) * 0.26;
    groupRef.current.position.y = Math.sin(time * 3.7 + index * 1.7) * 0.18;
    groupRef.current.rotation.z = time * 0.2;
  });

  return (
    <group position={config.position} quaternion={quaternion}>
      <group ref={groupRef} visible={false}>
        <mesh>
          <torusGeometry args={[2.5, 0.03, 8, 56]} />
          <meshBasicMaterial
            color="#ff5fd8"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

/** Containment shell that only becomes visible as the player nears the edge. */
const BoundaryField: React.FC<{ telemetryRef: NavTelemetryRef }> = ({
  telemetryRef,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const proximity = telemetryRef.current.boundary;
    meshRef.current.visible = proximity > 0.01;
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = proximity * 0.16;
  });

  return (
    <mesh
      ref={meshRef}
      position={FLIGHT_BOUNDS.center.toArray()}
      visible={false}
    >
      <sphereGeometry args={[FLIGHT_BOUNDS.hardRadius, 28, 18]} />
      <meshBasicMaterial
        color="#4ad8ff"
        wireframe
        transparent
        opacity={0}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
};

/**
 * Gates, ghost signals and the containment shell. Kept mounted for the whole
 * Navigasi route so the world does not empty out after the handoff.
 */
export const NavGateField: React.FC<{
  courseRef: NavCourseRef;
  telemetryRef: NavTelemetryRef;
}> = ({ courseRef, telemetryRef }) => (
  <>
    {NAV_FLIGHT_GATES.map((gate, index) => (
      <FlightGate key={gate.id} index={index} courseRef={courseRef} />
    ))}
    {NAV_PHANTOM_GATES.map((phantom, index) => (
      <PhantomGate
        key={`phantom-${phantom.position.join("-")}`}
        index={index}
        courseRef={courseRef}
      />
    ))}
    <BoundaryField telemetryRef={telemetryRef} />
  </>
);

/* -------------------------------------------------------------------------- */
/*  In-world guidance                                                          */
/* -------------------------------------------------------------------------- */

const CHEVRON_STEPS = [3.2, 4.9, 6.6, 8.3, 10] as const;

/**
 * A lead chevron pinned ahead of the shuttle plus a flowing breadcrumb trail,
 * so the next gate is never ambiguous even when it is off screen.
 */
const GuidanceArrow: React.FC<{
  shipRef: MutableRefObject<THREE.Vector3>;
  courseRef: NavCourseRef;
  telemetryRef: NavTelemetryRef;
}> = ({ shipRef, courseRef, telemetryRef }) => {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const chevronRefs = useRef<(THREE.Mesh | null)[]>([]);
  const gatePosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const lookQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;

    const course = courseRef.current;
    const active = course.stage === "flying";
    root.visible = active;
    if (!active) return;

    const gate = NAV_FLIGHT_GATES[course.activeIndex];
    if (!gate) return;

    gatePosition.set(...gate.position);
    direction.copy(gatePosition).sub(shipRef.current);
    const distance = direction.length();
    if (distance < 0.001) return;
    direction.divideScalar(distance);

    root.position.copy(shipRef.current);
    lookMatrix.lookAt(
      root.position,
      // The chevrons are cones aligned to +Z, matching the shuttle's forward.
      gatePosition,
      WORLD_UP
    );
    lookQuaternion.setFromRotationMatrix(lookMatrix);
    // lookAt builds a -Z facing basis; flip it so +Z points at the gate.
    root.quaternion.copy(lookQuaternion);
    root.rotateY(Math.PI);

    const time = clock.elapsedTime;
    const urgency = telemetryRef.current.idleHint ? 1 : 0;

    if (headRef.current) {
      const bob = 1 + Math.sin(time * 6.2) * 0.09;
      headRef.current.scale.setScalar(bob * (1 + urgency * 0.25));
      const material = headRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.72 + Math.sin(time * 4.4) * 0.16 + urgency * 0.2;
      material.color.set(
        course.activeIndex === LANDING_GATE_INDEX ? "#ffd76a" : "#7de9ff"
      );
    }

    CHEVRON_STEPS.forEach((step, index) => {
      const chevron = chevronRefs.current[index];
      if (!chevron) return;
      const visible = distance > step + 1.4;
      chevron.visible = visible;
      if (!visible) return;
      chevron.position.set(0, 0, step);
      // Flow the highlight outward so the trail reads as a direction, not dots.
      const wave = (time * 1.5 + index / CHEVRON_STEPS.length) % 1;
      const material = chevron.material as THREE.MeshBasicMaterial;
      material.opacity = (0.16 + (1 - wave) * 0.42) * (1 + urgency * 0.4);
      chevron.scale.setScalar(0.72 - index * 0.06);
    });
  });

  return (
    <group ref={rootRef} visible={false}>
      <mesh ref={headRef} position={[0, 0, 2.05]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.24, 0.72, 4]} />
        <meshBasicMaterial
          color="#7de9ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>

      {CHEVRON_STEPS.map((step, index) => (
        <mesh
          key={step}
          ref={(mesh) => {
            chevronRefs.current[index] = mesh;
          }}
          position={[0, 0, step]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.2, 0.5, 4]} />
          <meshBasicMaterial
            color="#5fd8ff"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Player shuttle                                                             */
/* -------------------------------------------------------------------------- */

const ManualEngineJet: React.FC<{
  engineIndex: number;
  throttleRef: MutableRefObject<number>;
}> = ({ engineIndex, throttleRef }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const hotRef = useRef<THREE.Mesh>(null);
  const nozzleX = [-0.27, 0, 0.27][engineIndex] ?? 0;

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const thrust =
      (0.42 + throttleRef.current * 0.92) *
      (0.94 + Math.sin(time * 24 + engineIndex * 1.7) * 0.06);
    const coreLength = 0.72 * thrust;
    const hotLength = 0.46 * thrust;

    if (coreRef.current) {
      coreRef.current.position.z = -coreLength * 0.5;
      coreRef.current.scale.set(
        0.78 + thrust * 0.2,
        Math.max(0.01, coreLength),
        0.78 + thrust * 0.2
      );
    }
    if (hotRef.current) {
      hotRef.current.position.z = -hotLength * 0.5 + 0.025;
      hotRef.current.scale.set(
        0.6 + thrust * 0.12,
        Math.max(0.01, hotLength),
        0.6 + thrust * 0.12
      );
    }
  });

  return (
    <group position={[nozzleX, -0.025, -1.19]}>
      <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.09, 1, 12]} />
        <meshBasicMaterial
          color={ROUTE_WORLD.Navigasi.accent}
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={hotRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.045, 1, 10]} />
        <meshBasicMaterial
          color="#fff8da"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  Flight controller                                                          */
/* -------------------------------------------------------------------------- */

interface FlightState {
  position: THREE.Vector3;
  previousPosition: THREE.Vector3;
  quaternion: THREE.Quaternion;
  /** Smoothed -1..1 control-surface deflections. */
  pitchInput: number;
  rollInput: number;
  yawInput: number;
  speed: number;
  /** Decaying 0..1 camera shake energy. */
  trauma: number;
  alignElapsed: number;
  lastGateTime: number;
}

interface NavFlightControllerProps {
  /** Controls respond only while true; the landing sequence turns this off. */
  controlsEnabled: boolean;
  courseRef: NavCourseRef;
  telemetryRef: NavTelemetryRef;
  onGateCleared: (index: number) => void;
  onLandingGate: () => void;
  onHandoffComplete: () => void;
}

export const NavFlightController: React.FC<NavFlightControllerProps> = ({
  controlsEnabled,
  courseRef,
  telemetryRef,
  onGateCleared,
  onLandingGate,
  onHandoffComplete,
}) => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const shuttleRef = useRef<THREE.Group>(null);
  const { actionsRef } = useFlightControls(controlsEnabled);

  const throttleRef = useRef(0);
  const cameraReadyRef = useRef(false);
  const shipPositionRef = useRef(new THREE.Vector3(...NAV_SPAWN.position));

  const flight = useRef<FlightState>({
    position: new THREE.Vector3(...NAV_SPAWN.position),
    previousPosition: new THREE.Vector3(...NAV_SPAWN.position),
    quaternion: new THREE.Quaternion().setFromUnitVectors(
      MODEL_FORWARD,
      new THREE.Vector3(...NAV_SPAWN.forward).normalize()
    ),
    pitchInput: 0,
    rollInput: 0,
    yawInput: 0,
    speed: FLIGHT_TUNING.minSpeed,
    trauma: 0,
    alignElapsed: 0,
    lastGateTime: 0,
  });

  // Scratch objects — never allocate inside the frame loop.
  const scratch = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      left: new THREE.Vector3(),
      up: new THREE.Vector3(),
      delta: new THREE.Vector3(),
      avoidTarget: new THREE.Vector3(),
      toCenter: new THREE.Vector3(),
      gatePosition: new THREE.Vector3(),
      gateNormal: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      euler: new THREE.Euler(),
      deltaQuaternion: new THREE.Quaternion(),
      targetQuaternion: new THREE.Quaternion(),
      lookMatrix: new THREE.Matrix4(),
      ndc: new THREE.Vector3(),
      cameraTarget: new THREE.Vector3(),
      cameraOffset: new THREE.Vector3(),
      desiredCameraPosition: new THREE.Vector3(),
      alignFromPosition: new THREE.Vector3(),
      alignFromQuaternion: new THREE.Quaternion(),
      alignFromCameraPosition: new THREE.Vector3(),
      alignFromCameraQuaternion: new THREE.Quaternion(),
      alignPosition: new THREE.Vector3(),
      alignQuaternion: new THREE.Quaternion(),
      alignCameraPosition: new THREE.Vector3(),
      alignCameraQuaternion: new THREE.Quaternion(),
      routeFuture: new THREE.Vector3(),
      routeDirection: new THREE.Vector3(),
      routeBank: new THREE.Quaternion(),
      recoveryOffset: new THREE.Vector3(
        ...ROUTE_WORLD.Navigasi.cameraOffsets.recovery
      ),
    }),
    []
  );

  /** Resolve the exact pose the cinematic expects at the handoff instant. */
  const computeHandoffPose = useCallback(() => {
    writeRoutePose(
      "Navigasi",
      LANDING_HANDOFF_TIME,
      scratch.alignPosition,
      scratch.alignQuaternion,
      scratch.routeFuture,
      scratch.routeDirection,
      scratch.routeBank
    );

    // Mirror CinematicCameraRig.calculateFrame() at LANDING_HANDOFF_TIME:
    // crisis and recovery blends are saturated, approach and landing are zero.
    scratch.cameraOffset
      .copy(scratch.recoveryOffset)
      .applyQuaternion(scratch.alignQuaternion);
    scratch.alignCameraPosition
      .copy(scratch.alignPosition)
      .add(scratch.cameraOffset);
    scratch.cameraTarget
      .copy(scratch.alignPosition)
      .addScaledVector(scratch.routeDirection, 0.72);
    scratch.lookMatrix.lookAt(
      scratch.alignCameraPosition,
      scratch.cameraTarget,
      WORLD_UP
    );
    scratch.alignCameraQuaternion.setFromRotationMatrix(scratch.lookMatrix);
  }, [scratch]);

  const beginAlignment = useCallback(() => {
    const state = flight.current;
    courseRef.current.stage = "aligning";
    state.alignElapsed = 0;
    scratch.alignFromPosition.copy(state.position);
    scratch.alignFromQuaternion.copy(state.quaternion);
    scratch.alignFromCameraPosition.copy(camera.position);
    scratch.alignFromCameraQuaternion.copy(camera.quaternion);
    computeHandoffPose();
    onLandingGate();
  }, [camera, computeHandoffPose, courseRef, onLandingGate, scratch]);

  /* eslint-disable react-hooks/immutability -- R3F drives camera and flight state through the render loop by design. */
  useFrame(({ clock }, delta) => {
    const state = flight.current;
    const course = courseRef.current;
    const telemetry = telemetryRef.current;
    // A stalled tab must not teleport the shuttle when rendering resumes.
    const dt = THREE.MathUtils.clamp(delta, 0, 1 / 30);
    const time = clock.elapsedTime;

    if (course.stage === "idle") {
      course.stage = "flying";
      state.lastGateTime = time;
    }

    if (course.stage === "flying") {
      const actions = actionsRef.current;
      const pitchTarget =
        (actions.pitchDown ? 1 : 0) - (actions.pitchUp ? 1 : 0);
      const rollTarget =
        (actions.rollRight ? 1 : 0) - (actions.rollLeft ? 1 : 0);
      const yawTarget = (actions.yawLeft ? 1 : 0) - (actions.yawRight ? 1 : 0);

      state.pitchInput = damp(
        state.pitchInput,
        pitchTarget,
        FLIGHT_TUNING.controlSmoothing,
        dt
      );
      state.rollInput = damp(
        state.rollInput,
        rollTarget,
        FLIGHT_TUNING.controlSmoothing,
        dt
      );
      state.yawInput = damp(
        state.yawInput,
        yawTarget,
        FLIGHT_TUNING.controlSmoothing,
        dt
      );

      // A banked shuttle carves its own turn, the way a real aircraft does:
      // left wing low (local +X below the horizon) pulls the nose left.
      scratch.left.copy(MODEL_LEFT).applyQuaternion(state.quaternion);
      const bankYaw = -scratch.left.y * FLIGHT_TUNING.bankTurnGain;

      // Axis signs, with model forward +Z / up +Y (so the left wing is +X and
      // the chase camera sees +X on the left of the screen):
      //   +X rotation -> nose down       (W)
      //   +Y rotation -> yaw left        (Q)
      //   -Z rotation -> left wing down  (A)
      scratch.euler.set(
        state.pitchInput * FLIGHT_TUNING.pitchRate * dt,
        (state.yawInput + bankYaw) * FLIGHT_TUNING.yawRate * dt,
        state.rollInput * FLIGHT_TUNING.rollRate * dt,
        "XYZ"
      );
      scratch.deltaQuaternion.setFromEuler(scratch.euler);
      state.quaternion.multiply(scratch.deltaQuaternion).normalize();

      // Throttle is a held action: press to spool up, release to bleed off.
      const throttleTarget = actions.throttle ? 1 : 0;
      throttleRef.current = moveToward(
        throttleRef.current,
        throttleTarget,
        (throttleTarget > 0
          ? FLIGHT_TUNING.throttleAttack
          : FLIGHT_TUNING.throttleRelease) * dt
      );
      state.speed = THREE.MathUtils.lerp(
        FLIGHT_TUNING.minSpeed,
        FLIGHT_TUNING.maxSpeed,
        throttleRef.current * throttleRef.current * (3 - 2 * throttleRef.current)
      );

      state.previousPosition.copy(state.position);
      scratch.forward.copy(MODEL_FORWARD).applyQuaternion(state.quaternion);
      state.position.addScaledVector(scratch.forward, state.speed * dt);

      /* ---- Solid geometry: never let the shuttle enter the planet or island */
      NO_FLY_VOLUMES.forEach((volume) => {
        scratch.delta.copy(state.position).sub(volume.center);
        scratch.delta.y *= volume.verticalScale;
        const distance = scratch.delta.length();
        if (distance >= volume.radius || distance < 0.0001) return;

        scratch.delta.divideScalar(distance);
        const push = volume.radius - distance;
        state.position.x += scratch.delta.x * push;
        state.position.y += (scratch.delta.y / volume.verticalScale) * push;
        state.position.z += scratch.delta.z * push;

        // Steer the nose away too, otherwise the shuttle grinds along the shell.
        // Matrix4.lookAt puts +Z on the eye->target reverse, so aiming *into*
        // the volume leaves the nose pointing out of it.
        scratch.avoidTarget
          .copy(scratch.delta)
          .multiplyScalar(-6)
          .add(state.position);
        scratch.lookMatrix.lookAt(
          state.position,
          scratch.avoidTarget,
          WORLD_UP
        );
        scratch.targetQuaternion.setFromRotationMatrix(scratch.lookMatrix);
        state.quaternion.slerp(scratch.targetQuaternion, 1 - Math.exp(-4 * dt));
        state.trauma = Math.min(1, state.trauma + 0.22);
      });

      /* ---- Play area containment ---------------------------------------- */
      scratch.toCenter.copy(FLIGHT_BOUNDS.center).sub(state.position);
      const centerDistance = scratch.toCenter.length();
      let boundary = 0;

      if (centerDistance > FLIGHT_BOUNDS.softRadius) {
        boundary = THREE.MathUtils.clamp(
          (centerDistance - FLIGHT_BOUNDS.softRadius) /
            (FLIGHT_BOUNDS.hardRadius - FLIGHT_BOUNDS.softRadius),
          0,
          1
        );

        // Autopilot correction rather than an invisible wall: the nose is
        // eased back toward the map, harder the further out you drift.
        scratch.toCenter.divideScalar(centerDistance);
        scratch.avoidTarget
          .copy(scratch.toCenter)
          .multiplyScalar(-10)
          .add(state.position);
        scratch.lookMatrix.lookAt(
          state.position,
          scratch.avoidTarget,
          WORLD_UP
        );
        scratch.targetQuaternion.setFromRotationMatrix(scratch.lookMatrix);
        state.quaternion.slerp(
          scratch.targetQuaternion,
          1 -
            Math.exp(
              -FLIGHT_BOUNDS.correctionGain * boundary * boundary * dt
            )
        );

        if (centerDistance > FLIGHT_BOUNDS.hardRadius) {
          state.position
            .copy(FLIGHT_BOUNDS.center)
            .addScaledVector(scratch.toCenter, -FLIGHT_BOUNDS.hardRadius);
        }
      }
      telemetry.boundary = boundary;

      /* ---- Gate crossing ------------------------------------------------- */
      const gate = NAV_FLIGHT_GATES[course.activeIndex];
      if (gate) {
        scratch.gatePosition.set(...gate.position);
        scratch.gateNormal.set(...gate.normal).normalize();

        const previousSide = scratch.delta
          .copy(state.previousPosition)
          .sub(scratch.gatePosition)
          .dot(scratch.gateNormal);
        const currentSide = scratch.delta
          .copy(state.position)
          .sub(scratch.gatePosition)
          .dot(scratch.gateNormal);

        if (previousSide * currentSide < 0) {
          const t = previousSide / (previousSide - currentSide);
          scratch.hit
            .copy(state.previousPosition)
            .lerp(state.position, t)
            .sub(scratch.gatePosition);
          scratch.hit.addScaledVector(
            scratch.gateNormal,
            -scratch.hit.dot(scratch.gateNormal)
          );

          if (scratch.hit.length() <= gate.radius * 1.05) {
            const clearedIndex = course.activeIndex;
            course.clearedAt[clearedIndex] = time;
            state.lastGateTime = time;
            state.trauma = Math.min(1, state.trauma + 0.42);

            if (clearedIndex === LANDING_GATE_INDEX) {
              beginAlignment();
            } else {
              course.activeIndex = clearedIndex + 1;
              // Magnetic storm: duplicate gate signals during the crisis leg.
              course.ghostsVisible =
                course.activeIndex >= GHOST_GATE_RANGE.from &&
                course.activeIndex <= GHOST_GATE_RANGE.to;
              onGateCleared(clearedIndex);
            }
          }
        }
      }
    }

    /* ---- Alignment blend into the scripted landing ---------------------- */
    if (course.stage === "aligning") {
      state.alignElapsed += dt;
      const progress = ease01(state.alignElapsed / LANDING_ALIGN_DURATION);

      state.position.copy(scratch.alignFromPosition).lerp(
        scratch.alignPosition,
        progress
      );
      state.quaternion
        .copy(scratch.alignFromQuaternion)
        .slerp(scratch.alignQuaternion, progress);
      throttleRef.current = THREE.MathUtils.lerp(
        throttleRef.current,
        0.35,
        progress
      );

      camera.position
        .copy(scratch.alignFromCameraPosition)
        .lerp(scratch.alignCameraPosition, progress);
      camera.quaternion
        .copy(scratch.alignFromCameraQuaternion)
        .slerp(scratch.alignCameraQuaternion, progress);
      if (Math.abs(camera.fov - 47) > 0.01) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 47, progress);
        camera.updateProjectionMatrix();
      }

      if (state.alignElapsed >= LANDING_ALIGN_DURATION) {
        course.stage = "done";
        onHandoffComplete();
      }
    }

    /* ---- Apply the pose -------------------------------------------------- */
    shipPositionRef.current.copy(state.position);
    if (shuttleRef.current) {
      shuttleRef.current.position.copy(state.position);
      shuttleRef.current.quaternion.copy(state.quaternion);
    }

    /* ---- Chase camera ---------------------------------------------------- */
    if (course.stage === "flying") {
      scratch.cameraOffset
        .set(...FLIGHT_TUNING.cameraOffset)
        .applyQuaternion(state.quaternion);
      scratch.desiredCameraPosition
        .copy(state.position)
        .add(scratch.cameraOffset);

      // Decaying trauma, squared, so light bumps barely register and a gate
      // punch actually lands. Shakes the camera only, never the shuttle.
      state.trauma = Math.max(0, state.trauma - dt * 1.5);
      if (state.trauma > 0) {
        const shake = state.trauma * state.trauma * 0.32;
        scratch.desiredCameraPosition.x += Math.sin(time * 41) * shake;
        scratch.desiredCameraPosition.y += Math.sin(time * 53 + 1.1) * shake;
      }

      scratch.forward.copy(MODEL_FORWARD).applyQuaternion(state.quaternion);
      scratch.up.copy(MODEL_UP).applyQuaternion(state.quaternion);
      scratch.cameraTarget
        .copy(state.position)
        .addScaledVector(scratch.forward, FLIGHT_TUNING.cameraLookAhead);
      scratch.lookMatrix.lookAt(
        scratch.desiredCameraPosition,
        scratch.cameraTarget,
        // Follow part of the shuttle's roll so banking actually reads.
        scratch.up.lerp(WORLD_UP, 0.45).normalize()
      );
      scratch.targetQuaternion.setFromRotationMatrix(scratch.lookMatrix);

      if (cameraReadyRef.current) {
        camera.position.lerp(
          scratch.desiredCameraPosition,
          1 - Math.exp(-FLIGHT_TUNING.cameraPositionDamping * dt)
        );
        camera.quaternion.slerp(
          scratch.targetQuaternion,
          1 - Math.exp(-FLIGHT_TUNING.cameraRotationDamping * dt)
        );
      } else {
        // First frame: the camera is still parked in the cockpit, so snap
        // rather than sweeping across the map to catch up.
        camera.position.copy(scratch.desiredCameraPosition);
        camera.quaternion.copy(scratch.targetQuaternion);
        cameraReadyRef.current = true;
      }

      const desiredFov = THREE.MathUtils.lerp(
        FLIGHT_TUNING.fovIdle,
        FLIGHT_TUNING.fovBoost,
        throttleRef.current
      );
      if (Math.abs(camera.fov - desiredFov) > 0.05) {
        camera.fov = damp(camera.fov, desiredFov, 3.2, dt);
        camera.updateProjectionMatrix();
      }
      if (camera.near !== 0.06 || camera.far !== 250) {
        camera.near = 0.06;
        camera.far = 250;
        camera.updateProjectionMatrix();
      }
    }

    /* ---- Telemetry for the HUD ------------------------------------------ */
    const activeGate = NAV_FLIGHT_GATES[course.activeIndex];
    telemetry.active = course.stage === "flying";
    telemetry.aligning = course.stage === "aligning";
    telemetry.gateIndex = course.activeIndex;
    telemetry.gateCode = activeGate?.code ?? "";
    telemetry.isLandingGate = course.activeIndex === LANDING_GATE_INDEX;
    telemetry.speed = state.speed;
    telemetry.speedRatio = THREE.MathUtils.clamp(
      (state.speed - FLIGHT_TUNING.minSpeed) /
        (FLIGHT_TUNING.maxSpeed - FLIGHT_TUNING.minSpeed),
      0,
      1
    );
    telemetry.throttle = throttleRef.current;
    telemetry.idleHint = time - state.lastGateTime > 20;

    scratch.up.copy(MODEL_UP).applyQuaternion(state.quaternion);
    scratch.forward.copy(MODEL_FORWARD).applyQuaternion(state.quaternion);
    scratch.left.copy(MODEL_LEFT).applyQuaternion(state.quaternion);
    telemetry.pitchDeg = THREE.MathUtils.radToDeg(
      Math.asin(THREE.MathUtils.clamp(scratch.forward.y, -1, 1))
    );
    telemetry.rollDeg = THREE.MathUtils.radToDeg(
      Math.atan2(scratch.left.y, scratch.up.y)
    );

    if (activeGate) {
      scratch.gatePosition.set(...activeGate.position);
      telemetry.distance = scratch.gatePosition.distanceTo(state.position);

      scratch.ndc.copy(scratch.gatePosition).project(camera);
      const behind = scratch.ndc.z > 1;
      if (behind) {
        scratch.ndc.x = -scratch.ndc.x;
        scratch.ndc.y = -scratch.ndc.y;
      }
      telemetry.onScreen =
        !behind &&
        Math.abs(scratch.ndc.x) < 0.88 &&
        Math.abs(scratch.ndc.y) < 0.88;
      telemetry.screenX = scratch.ndc.x * 0.5 + 0.5;
      telemetry.screenY = -scratch.ndc.y * 0.5 + 0.5;
      telemetry.bearingDeg = THREE.MathUtils.radToDeg(
        Math.atan2(telemetry.screenX - 0.5, 0.5 - telemetry.screenY)
      );
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <>
      <group ref={shuttleRef}>
        <NormalizedModel
          url={MODEL_URLS.shuttle}
          targetSize={SHUTTLE_TARGET_SIZE}
        />
        {[0, 1, 2].map((engineIndex) => (
          <ManualEngineJet
            key={engineIndex}
            engineIndex={engineIndex}
            throttleRef={throttleRef}
          />
        ))}
        <pointLight
          position={[0, 0, -1.45]}
          color={ROUTE_WORLD.Navigasi.accent}
          intensity={3.4}
          distance={4.5}
        />
        <Sparkles
          count={14}
          scale={[1.4, 0.5, 2.6]}
          position={[0, 0, -1.9]}
          size={1.2}
          speed={0.9}
          color={ROUTE_WORLD.Navigasi.accent}
        />
      </group>

      <GuidanceArrow
        shipRef={shipPositionRef}
        courseRef={courseRef}
        telemetryRef={telemetryRef}
      />
    </>
  );
};

export default NavFlightController;
