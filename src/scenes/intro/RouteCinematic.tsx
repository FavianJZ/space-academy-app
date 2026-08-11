import { Sparkles, Stars, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, {
  type MutableRefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";

import type {
  IntroStoryBeat,
  NavigationRoute,
} from "../../types/threejs-intro.types";
import {
  FLOATING_CLOUD_PREFIXES,
  MODEL_URLS,
  NormalizedModel,
} from "./introModels";
import { NavFlightController, NavGateField } from "./NavManualFlight";
import {
  LANDING_HANDOFF_TIME,
  type ManualFlightStage,
  type NavCourseRef,
  type NavTelemetryRef,
} from "./navFlightConfig";
import {
  BLACK_HOLE_POSITION,
  ROUTE_TIMING,
  ROUTE_WORLD,
  SHUTTLE_TARGET_SIZE,
  ease01,
  routeGearCompression,
  writeRoutePose,
} from "./routeCinematicConfig";

const CAMERA_UP = new THREE.Vector3(0, 1, 0);
const CAMERA_ROLL_AXIS = new THREE.Vector3(0, 0, 1);
const MACHINE_EJECTION_AT = 8.1;

type RouteTimelineState = {
  elapsed: number;
  previousClock: number | null;
  cap: number;
};

type TimelineRef = MutableRefObject<RouteTimelineState>;

export type { ManualFlightStage };

interface RouteCinematicProps {
  route: NavigationRoute;
  storyBeat: IntroStoryBeat;
  manualStage?: ManualFlightStage;
  courseRef?: NavCourseRef;
  telemetryRef?: NavTelemetryRef;
  onManualGateCleared?: (index: number) => void;
  onManualLandingGate?: () => void;
  onManualHandoffComplete?: () => void;
}

interface TimelineProps {
  route: NavigationRoute;
  timelineRef: TimelineRef;
}

interface CinematicCameraRigProps extends TimelineProps {
  storyBeat: IntroStoryBeat;
  /**
   * After a manual-flight handoff the camera is already sitting on the
   * cinematic pose, so the usual mount-time snap would be a hard cut.
   */
  skipEntrySnap?: boolean;
}

const getTimelineCap = (storyBeat: IntroStoryBeat) => {
  if (storyBeat === "route-crisis") return ROUTE_TIMING.recovery;
  if (storyBeat === "route-climax") return ROUTE_TIMING.approach;
  if (storyBeat === "route-approach") return ROUTE_TIMING.touchdown;
  if (storyBeat === "route-touchdown" || storyBeat === "stranded") {
    return ROUTE_TIMING.complete;
  }

  return ROUTE_TIMING.crisis;
};

const readTimeline = (clock: THREE.Clock, timelineRef: TimelineRef) => {
  const timeline = timelineRef.current;

  if (timeline.previousClock === null) {
    timeline.previousClock = clock.elapsedTime;
    return timeline.elapsed;
  }

  const frameDelta = THREE.MathUtils.clamp(
    clock.elapsedTime - timeline.previousClock,
    0,
    0.1
  );
  timeline.previousClock = clock.elapsedTime;
  timeline.elapsed = Math.min(
    timeline.elapsed + frameDelta,
    timeline.cap,
    ROUTE_TIMING.complete
  );

  return timeline.elapsed;
};

const engineThrust = (
  route: NavigationRoute,
  time: number,
  engineIndex: number
) => {
  const landingFade =
    1 -
    ease01(
      (time - (ROUTE_TIMING.approach + 1.1)) /
        (ROUTE_TIMING.touchdown - ROUTE_TIMING.approach - 0.45)
    );
  const pulse = 0.92 + Math.sin(time * 22 + engineIndex * 1.7) * 0.08;

  if (route === "Mesin") {
    const failure = ease01((time - 3.8) / 1.1);
    const recovered = ease01((time - ROUTE_TIMING.recovery) / 1.1);
    const rightEngineLoss =
      engineIndex === 2
        ? THREE.MathUtils.lerp(1, 0.08, failure) +
          THREE.MathUtils.lerp(0, 0.24, recovered)
        : 1;
    return Math.max(0.015, pulse * rightEngineLoss * landingFade);
  }

  if (route === "Bensin") {
    const leak = ease01((time - 5.1) / 1.6);
    const cutoff = 1 - ease01((time - 8.3) / 0.9);
    const sputter = 0.45 + Math.max(0, Math.sin(time * 31)) * 0.55;
    return Math.max(
      0.008,
      pulse *
        THREE.MathUtils.lerp(1, sputter, leak) *
        cutoff *
        landingFade
    );
  }

  if (route === "Blackhole") {
    const gravityPulse =
      1.12 + Math.sin(time * 12.5 + engineIndex * 0.8) * 0.18;
    const normalized = THREE.MathUtils.lerp(
      gravityPulse,
      pulse,
      ease01((time - ROUTE_TIMING.recovery) / 1.8)
    );
    return Math.max(0.012, normalized * landingFade);
  }

  return Math.max(0.012, pulse * landingFade);
};

const EngineJet: React.FC<TimelineProps & { engineIndex: number }> = ({
  route,
  timelineRef,
  engineIndex,
}) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const hotRef = useRef<THREE.Mesh>(null);
  const nozzleX = [-0.27, 0, 0.27][engineIndex] ?? 0;
  const accent = ROUTE_WORLD[route].accent;

  useFrame(({ clock }) => {
    const time = readTimeline(clock, timelineRef);
    const thrust = engineThrust(route, time, engineIndex);
    const coreLength = 0.66 * thrust;
    const hotLength = 0.42 * thrust;

    if (coreRef.current) {
      coreRef.current.visible = thrust > 0.025;
      coreRef.current.position.z = -coreLength * 0.5;
      coreRef.current.scale.set(
        0.8 + thrust * 0.16,
        Math.max(0.01, coreLength),
        0.8 + thrust * 0.16
      );
    }

    if (hotRef.current) {
      hotRef.current.visible = thrust > 0.04;
      hotRef.current.position.z = -hotLength * 0.5 + 0.025;
      hotRef.current.scale.set(
        0.62 + thrust * 0.1,
        Math.max(0.01, hotLength),
        0.62 + thrust * 0.1
      );
    }
  });

  return (
    <group position={[nozzleX, -0.025, -1.19]}>
      <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.09, 1, 12]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.8}
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

const EngineArray: React.FC<TimelineProps> = ({ route, timelineRef }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const time = readTimeline(clock, timelineRef);
    const averageThrust =
      (engineThrust(route, time, 0) +
        engineThrust(route, time, 1) +
        engineThrust(route, time, 2)) /
      3;
    lightRef.current.intensity = averageThrust * 5.5;
  });

  return (
    <>
      {[0, 1, 2].map((engineIndex) => (
        <EngineJet
          key={engineIndex}
          route={route}
          timelineRef={timelineRef}
          engineIndex={engineIndex}
        />
      ))}
      <pointLight
        ref={lightRef}
        position={[0, 0, -1.45]}
        color={ROUTE_WORLD[route].accent}
        intensity={4}
        distance={4.5}
      />
    </>
  );
};

const LandingGear: React.FC<{ timelineRef: TimelineRef }> = ({
  timelineRef,
}) => {
  const gearRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!gearRef.current) return;
    const time = readTimeline(clock, timelineRef);
    const travel = (time - (ROUTE_TIMING.approach - 0.5)) / 1.5;
    const deploy = ease01(travel);

    // Small damped overshoot as the struts reach full extension and lock.
    const lockPhase = travel - 0.86;
    const lockBounce =
      lockPhase > 0 && lockPhase < 0.6
        ? Math.sin(lockPhase * 12) * Math.exp(-lockPhase * 7.5) * 0.08
        : 0;

    // The hull sinks by routeGearCompression() on contact, so the struts
    // shorten by the same amount and the wheels stay planted on the deck.
    const squash = THREE.MathUtils.clamp(
      routeGearCompression(time) / 0.3,
      -0.12,
      0.32
    );

    gearRef.current.visible = deploy > 0.01;
    gearRef.current.position.y = THREE.MathUtils.lerp(0.29, 0, deploy);
    gearRef.current.scale.set(
      1,
      Math.max(0.06, (deploy + lockBounce) * (1 - squash)),
      1
    );
  });

  const GearLeg: React.FC<{
    position: [number, number, number];
    wheelRotation?: [number, number, number];
  }> = ({ position, wheelRotation = [0, 0, Math.PI / 2] }) => (
    <group position={position}>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.022, 0.032, 0.3, 8]} />
        <meshStandardMaterial
          color="#c7d1d8"
          metalness={0.82}
          roughness={0.3}
        />
      </mesh>
      <mesh rotation={wheelRotation}>
        <cylinderGeometry args={[0.085, 0.085, 0.045, 12]} />
        <meshStandardMaterial color="#111820" roughness={0.86} />
      </mesh>
    </group>
  );

  return (
    <group ref={gearRef}>
      <GearLeg position={[-0.38, -0.61, -0.2]} />
      <GearLeg position={[0.38, -0.61, -0.2]} />
      <GearLeg position={[0, -0.58, 0.67]} />
    </group>
  );
};

const MachineServiceEffects: React.FC<{ timelineRef: TimelineRef }> = ({
  timelineRef,
}) => {
  const dronesRef = useRef<THREE.Group>(null);
  const heatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = readTimeline(clock, timelineRef);
    if (dronesRef.current) {
      dronesRef.current.visible = time < 5.45;
      dronesRef.current.rotation.z = time * 1.2;
      dronesRef.current.rotation.y = Math.sin(time * 0.8) * 0.18;
    }
    if (heatRef.current) {
      heatRef.current.visible = time >= 3.6 && time < 9.7;
      const pulse = 0.82 + Math.max(0, Math.sin(time * 11)) * 0.28;
      heatRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      <group ref={dronesRef} position={[0, 0.08, -0.9]}>
        {[0, 1, 2].map((index) => {
          const angle = (index / 3) * Math.PI * 2;
          return (
            <group
              key={index}
              position={[
                Math.cos(angle) * 0.66,
                Math.sin(angle) * 0.42,
                -0.12 + Math.sin(angle) * 0.08,
              ]}
            >
              <mesh>
                <octahedronGeometry args={[0.075, 0]} />
                <meshStandardMaterial
                  color="#dff9ff"
                  emissive="#4ddcff"
                  emissiveIntensity={1.4}
                  metalness={0.7}
                  roughness={0.24}
                />
              </mesh>
              <pointLight color="#57e9ff" intensity={0.9} distance={1.2} />
            </group>
          );
        })}
      </group>
      <group ref={heatRef} position={[0.27, -0.02, -1.18]}>
        <pointLight color="#ff4c24" intensity={3.6} distance={2.4} />
        <Sparkles
          count={22}
          scale={[0.55, 0.42, 1.1]}
          size={1.9}
          speed={2.1}
          color="#ff6a31"
        />
      </group>
    </>
  );
};

const FuelLeak: React.FC<{ timelineRef: TimelineRef }> = ({ timelineRef }) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleCount = 30;

  useFrame(({ clock }) => {
    const mesh = particlesRef.current;
    if (!mesh) return;

    const time = readTimeline(clock, timelineRef);
    const active = time >= 4.7 && time <= 13.1;
    mesh.visible = active;
    if (!active) return;

    for (let index = 0; index < particleCount; index += 1) {
      const seed = index / particleCount;
      const travel = (seed + time * 0.34) % 1;
      const spread = 0.045 + travel * 0.42;
      dummy.position.set(
        0.38 + Math.sin(index * 7.13) * spread,
        -0.06 + Math.cos(index * 4.91) * spread * 0.55,
        -1.12 - travel * 4.2
      );
      const size = THREE.MathUtils.lerp(0.045, 0.009, travel);
      dummy.scale.setScalar(size);
      dummy.rotation.set(index * 0.31, time + index, index * 0.63);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={particlesRef}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#90ffad"
        transparent
        opacity={0.62}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

const ShuttleActor: React.FC<TimelineProps> = ({ route, timelineRef }) => {
  const shuttleRef = useRef<THREE.Group>(null);
  const posedRef = useRef(false);
  const position = useMemo(() => new THREE.Vector3(), []);
  const futurePosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const bankQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }, delta) => {
    const shuttle = shuttleRef.current;
    if (!shuttle) return;
    const time = readTimeline(clock, timelineRef);
    writeRoutePose(
      route,
      time,
      position,
      quaternion,
      futurePosition,
      direction,
      bankQuaternion
    );
    shuttle.position.copy(position);

    if (!posedRef.current) {
      shuttle.quaternion.copy(quaternion);
      posedRef.current = true;
      return;
    }

    // Absorb the small tangent kinks where one flight curve meets the next.
    // The response tightens on final so the runway alignment at contact is
    // still exact rather than lagging behind.
    const safeDelta = THREE.MathUtils.clamp(delta, 0, 1 / 30);
    const responsiveness = time >= ROUTE_TIMING.approach ? 16 : 9;
    shuttle.quaternion.slerp(
      quaternion,
      1 - Math.exp(-responsiveness * safeDelta)
    );
  });

  return (
    <group ref={shuttleRef}>
      <NormalizedModel
        url={MODEL_URLS.shuttle}
        targetSize={SHUTTLE_TARGET_SIZE}
      />
      <EngineArray route={route} timelineRef={timelineRef} />
      <LandingGear timelineRef={timelineRef} />
      {route === "Mesin" && (
        <MachineServiceEffects timelineRef={timelineRef} />
      )}
      {route === "Bensin" && <FuelLeak timelineRef={timelineRef} />}
    </group>
  );
};

const MachineEjectedPod: React.FC<{ timelineRef: TimelineRef }> = ({
  timelineRef,
}) => {
  const podRef = useRef<THREE.Group>(null);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const future = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const velocity = useMemo(() => new THREE.Vector3(), []);
  const ejectionOffset = useMemo(
    () => new THREE.Vector3(0.27, -0.02, -1.12),
    []
  );
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const bankQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    const pod = podRef.current;
    if (!pod) return;
    const time = readTimeline(clock, timelineRef);
    pod.visible = time >= MACHINE_EJECTION_AT;
    if (!pod.visible) return;

    writeRoutePose(
      "Mesin",
      MACHINE_EJECTION_AT,
      origin,
      quaternion,
      future,
      direction,
      bankQuaternion
    );
    ejectionOffset
      .set(0.27, -0.02, -1.12)
      .applyQuaternion(quaternion);
    origin.add(ejectionOffset);
    velocity.set(0.86, -0.42, -0.2).applyQuaternion(quaternion).normalize();

    const elapsed = time - MACHINE_EJECTION_AT;
    pod.position.copy(origin).addScaledVector(velocity, elapsed * 1.35);
    pod.rotation.set(elapsed * 2.8, elapsed * 3.5, elapsed * 4.1);
  });

  return (
    <group ref={podRef} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.15, 0.42, 12]} />
        <meshStandardMaterial
          color="#46505b"
          emissive="#ff4b25"
          emissiveIntensity={0.7}
          metalness={0.82}
          roughness={0.31}
        />
      </mesh>
      <Sparkles
        count={12}
        scale={0.65}
        size={1.7}
        speed={1.7}
        color="#ff6733"
      />
    </group>
  );
};

const NavigationGate: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  phantom?: boolean;
}> = ({ position, rotation = [0, 0, 0], color, phantom = false }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <torusGeometry args={[1.35, phantom ? 0.022 : 0.045, 8, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={phantom ? 0.28 : 0.74}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
    {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
      <mesh
        key={angle}
        position={[Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0]}
        rotation={[0, 0, angle]}
      >
        <boxGeometry args={[0.3, 0.08, 0.08]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    ))}
  </group>
);

const NavigationWorldEffects: React.FC<{ timelineRef: TimelineRef }> = ({
  timelineRef,
}) => {
  const gatesRef = useRef<THREE.Group>(null);
  const phantomRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = readTimeline(clock, timelineRef);
    if (gatesRef.current) {
      gatesRef.current.rotation.z = Math.sin(time * 0.25) * 0.022;
    }
    if (phantomRef.current) {
      phantomRef.current.visible =
        time >= ROUTE_TIMING.crisis && time < ROUTE_TIMING.approach;
      phantomRef.current.position.x = Math.sin(time * 5.7) * 0.2;
      phantomRef.current.position.y = Math.sin(time * 4.1) * 0.11;
    }
  });

  return (
    <>
      <group ref={gatesRef}>
        <NavigationGate
          position={[-5.35, 5.35, 0.25]}
          rotation={[0.02, -0.16, 0.06]}
          color="#55ecff"
        />
        <NavigationGate
          position={[-2.05, 4.45, -3.65]}
          rotation={[0.08, -0.28, -0.1]}
          color="#70baff"
        />
        <NavigationGate
          position={[-0.45, 1.6, -7.65]}
          rotation={[-0.08, -0.18, 0.13]}
          color="#a77cff"
        />
      </group>
      <group ref={phantomRef} visible={false}>
        <NavigationGate
          position={[-1.15, 5.05, -3.8]}
          rotation={[0.14, -0.31, 0.19]}
          color="#ff5fd8"
          phantom
        />
        <NavigationGate
          position={[0.55, 2.3, -7.15]}
          rotation={[-0.12, -0.26, -0.16]}
          color="#ff5fd8"
          phantom
        />
        <Sparkles
          count={32}
          scale={[10, 4.5, 15]}
          size={0.9}
          speed={0.7}
          color="#c469ff"
        />
      </group>
    </>
  );
};

const BLACK_HOLE_DEBRIS = Array.from({ length: 22 }, (_, index) => ({
  angle: (index / 22) * Math.PI * 2,
  radius: 2.55 + (index % 5) * 0.32,
  height: Math.sin(index * 2.41) * 0.62,
  scale: 0.045 + (index % 4) * 0.025,
}));

const BlackHoleWorldEffects: React.FC<{ timelineRef: TimelineRef }> = ({
  timelineRef,
}) => {
  const diskRef = useRef<THREE.Group>(null);
  const debrisRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = readTimeline(clock, timelineRef);
    if (diskRef.current) {
      diskRef.current.rotation.z = 0.12 + Math.sin(time * 0.22) * 0.035;
    }
    if (debrisRef.current) {
      debrisRef.current.rotation.y = time * 0.31;
    }
    if (innerRingRef.current) {
      const pulse =
        1 +
        ease01(
          (time - ROUTE_TIMING.crisis) /
            (ROUTE_TIMING.recovery - ROUTE_TIMING.crisis)
        ) *
          (0.05 + Math.sin(time * 5.2) * 0.025);
      innerRingRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      <group position={BLACK_HOLE_POSITION.toArray()}>
        <mesh>
          <sphereGeometry args={[1.48, 42, 28]} />
          <meshBasicMaterial color="#010006" toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.62, 32, 20]} />
          <meshBasicMaterial
            color="#7f36d8"
            transparent
            opacity={0.09}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <group ref={diskRef} rotation={[Math.PI / 2, 0, 0.12]}>
          <mesh ref={innerRingRef}>
            <torusGeometry args={[1.92, 0.085, 14, 112]} />
            <meshBasicMaterial
              color="#a954ff"
              transparent
              opacity={0.66}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[0.05, -0.08, 0.08]}>
            <torusGeometry args={[2.28, 0.035, 10, 112]} />
            <meshBasicMaterial
              color="#55b9ff"
              transparent
              opacity={0.58}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh rotation={[-0.04, 0.12, -0.11]}>
            <torusGeometry args={[2.62, 0.015, 8, 112]} />
            <meshBasicMaterial
              color="#ff78df"
              transparent
              opacity={0.42}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
        <pointLight color="#984cff" intensity={9} distance={14} />
      </group>
      <group ref={debrisRef} position={BLACK_HOLE_POSITION.toArray()}>
        {BLACK_HOLE_DEBRIS.map((debris, index) => (
          <mesh
            key={index}
            position={[
              Math.cos(debris.angle) * debris.radius,
              debris.height,
              Math.sin(debris.angle) * debris.radius,
            ]}
            scale={debris.scale}
            rotation={[index * 0.7, index * 1.1, index * 0.37]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? "#76529e" : "#30283c"}
              emissive={index % 4 === 0 ? "#5b248f" : "#000000"}
              emissiveIntensity={0.55}
              roughness={0.9}
            />
          </mesh>
        ))}
      </group>
    </>
  );
};

const LandingPlatform: React.FC<TimelineProps & { forceBeacon?: boolean }> = ({
  route,
  timelineRef,
  forceBeacon = false,
}) => {
  const beaconRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const config = ROUTE_WORLD[route];
  const position: [number, number, number] = [
    config.parkedPosition[0],
    config.deckY,
    config.parkedPosition[2],
  ];

  useFrame(({ clock }) => {
    const time = readTimeline(clock, timelineRef);
    if (beaconRef.current) {
      beaconRef.current.visible =
        forceBeacon ||
        (time >= ROUTE_TIMING.recovery - 0.6 &&
          time < ROUTE_TIMING.touchdown + 0.25);
      beaconRef.current.rotation.y = time * 0.28;
    }
    if (ringRef.current) {
      const pulse = 1 + Math.sin(time * 3.2) * 0.025;
      ringRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2.25, 2.42, 0.16, 48]} />
        <meshStandardMaterial
          color="#101b24"
          emissive={config.accent}
          emissiveIntensity={0.08}
          metalness={0.72}
          roughness={0.42}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.095, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.56, 0.028, 8, 80]} />
        <meshBasicMaterial
          color={config.accent}
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.1, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 2.45]} />
        <meshBasicMaterial
          color={config.accent}
          transparent
          opacity={0.48}
          toneMapped={false}
        />
      </mesh>
      {[-1.55, 1.55].flatMap((x) =>
        [-1.3, 0, 1.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.12, z]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshBasicMaterial color={config.accent} toneMapped={false} />
          </mesh>
        ))
      )}
      {[-1.45, 1.45].map((x) => (
        <mesh key={x} position={[x, -0.38, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.7, 8]} />
          <meshStandardMaterial
            color="#334653"
            metalness={0.8}
            roughness={0.35}
          />
        </mesh>
      ))}
      <group ref={beaconRef} visible={false}>
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.04, 1.45, 2.55, 24, 1, true]} />
          <meshBasicMaterial
            color={config.accent}
            transparent
            opacity={0.055}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

const TouchdownDust: React.FC<TimelineProps> = ({ route, timelineRef }) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleCount = 34;
  const config = ROUTE_WORLD[route];

  useFrame(({ clock }) => {
    const mesh = particlesRef.current;
    if (!mesh) return;
    const time = readTimeline(clock, timelineRef);
    const elapsed = time - ROUTE_TIMING.touchdown;
    mesh.visible = elapsed >= -0.04 && elapsed <= 1.75;
    if (!mesh.visible) return;

    for (let index = 0; index < particleCount; index += 1) {
      const seed = index / particleCount;
      const particleTime = elapsed - seed * 0.34;
      if (particleTime <= 0 || particleTime > 1.35) {
        dummy.scale.setScalar(0.001);
      } else {
        const angle = index * 2.39996;
        const travel = ease01(particleTime / 1.35);
        const radius = 0.28 + travel * (1.15 + (index % 5) * 0.13);
        dummy.position.set(
          Math.cos(angle) * radius,
          0.12 + Math.sin(travel * Math.PI) * 0.34,
          Math.sin(angle) * radius
        );
        const size = Math.sin(travel * Math.PI) * (0.035 + (index % 4) * 0.012);
        dummy.scale.setScalar(Math.max(0.001, size));
      }
      dummy.rotation.set(index, index * 0.42, index * 0.77);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={particlesRef}
      position={[
        config.parkedPosition[0],
        config.deckY,
        config.parkedPosition[2],
      ]}
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
      visible={false}
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial
        color={config.accent}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

const RouteWorld: React.FC<
  TimelineProps & { manualStage: ManualFlightStage }
> = ({ route, timelineRef, manualStage }) => {
  const config = ROUTE_WORLD[route];
  const isManualRoute = manualStage !== "off";
  const islandUrl =
    config.islandModel === "ground"
      ? MODEL_URLS.islandGround
      : config.islandModel === "floating"
        ? MODEL_URLS.islandFloating
        : MODEL_URLS.islandFlying;

  return (
    <>
      <group
        position={config.islandPosition}
        rotation={[0, config.islandRotationY, 0]}
      >
        <NormalizedModel
          url={islandUrl}
          targetSize={config.islandSize}
          clearSite={config.landingSiteLocal}
          hiddenObjectPrefixes={
            config.islandModel === "floating"
              ? FLOATING_CLOUD_PREFIXES
              : undefined
          }
        />
      </group>
      <LandingPlatform
        route={route}
        timelineRef={timelineRef}
        // During manual flight the timeline is frozen, so the pad beacon is
        // lit explicitly once the player is heading for the landing gate.
        forceBeacon={manualStage === "flying" || manualStage === "landing"}
      />
      <TouchdownDust route={route} timelineRef={timelineRef} />

      {route === "Mesin" && <MachineEjectedPod timelineRef={timelineRef} />}

      {route === "Navigasi" && (
        <>
          {/* The scripted gate set is replaced by the playable course. */}
          {!isManualRoute && (
            <NavigationWorldEffects timelineRef={timelineRef} />
          )}
          <group position={[-9.5, 4.2, -17.5]} rotation={[0.12, 0, -0.08]}>
            <NormalizedModel url={MODEL_URLS.planet} targetSize={8.4} />
          </group>
        </>
      )}

      {route === "Bensin" && (
        <group position={[-12, 7.4, -31]} rotation={[0.08, 0, -0.05]}>
          <NormalizedModel url={MODEL_URLS.planet} targetSize={7.5} />
        </group>
      )}

      {route === "Blackhole" && (
        <>
          <BlackHoleWorldEffects timelineRef={timelineRef} />
          <group position={[21, 11.5, -38]} rotation={[0.1, 0, -0.06]}>
            <NormalizedModel url={MODEL_URLS.planet} targetSize={8} />
          </group>
        </>
      )}
    </>
  );
};

const RouteEnvironment: React.FC<{ route: NavigationRoute }> = ({ route }) => {
  const palette: Record<
    NavigationRoute,
    { background: string; fog: string; key: string; fill: string }
  > = {
    Mesin: {
      background: "#03070b",
      fog: "#130b08",
      key: "#ff8b3d",
      fill: "#78d9ff",
    },
    Navigasi: {
      background: "#020711",
      fog: "#071329",
      key: "#43e8ff",
      fill: "#b26cff",
    },
    Bensin: {
      background: "#030a0a",
      fog: "#0d1710",
      key: "#77ff9b",
      fill: "#ffc44d",
    },
    Blackhole: {
      background: "#010104",
      fog: "#090414",
      key: "#bd72ff",
      fill: "#477dff",
    },
  };
  const colors = palette[route];

  return (
    <>
      <color attach="background" args={[colors.background]} />
      <fog attach="fog" args={[colors.fog, 42, 145]} />
      <ambientLight intensity={0.46} color="#b8d8e8" />
      <hemisphereLight
        color={colors.fill}
        groundColor="#07080b"
        intensity={1.05}
      />
      <directionalLight
        castShadow
        position={[9, 15, 9]}
        color={colors.key}
        intensity={2.65}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={65}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0004}
      />
      <pointLight
        position={[-8, 3, 5]}
        color={colors.fill}
        intensity={7}
        distance={38}
      />
      <Stars
        radius={105}
        depth={52}
        count={1500}
        factor={2}
        saturation={0.34}
        fade
        speed={0.35}
      />
    </>
  );
};

/* eslint-disable react-hooks/immutability -- R3F camera state is intentionally updated in the render loop. */
const CinematicCameraRig: React.FC<CinematicCameraRigProps> = ({
  route,
  storyBeat,
  timelineRef,
  skipEntrySnap = false,
}) => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const config = ROUTE_WORLD[route];
  const storyBeatRef = useRef(storyBeat);
  const shipPosition = useMemo(() => new THREE.Vector3(), []);
  const futurePosition = useMemo(() => new THREE.Vector3(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const shipQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const bankQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cameraOffset = useMemo(() => new THREE.Vector3(), []);
  const cruiseOffset = useMemo(
    () => new THREE.Vector3(...config.cameraOffsets.cruise),
    [config.cameraOffsets.cruise]
  );
  const crisisOffset = useMemo(
    () => new THREE.Vector3(...config.cameraOffsets.crisis),
    [config.cameraOffsets.crisis]
  );
  const recoveryOffset = useMemo(
    () => new THREE.Vector3(...config.cameraOffsets.recovery),
    [config.cameraOffsets.recovery]
  );
  const approachOffset = useMemo(
    () => new THREE.Vector3(...config.cameraOffsets.approach),
    [config.cameraOffsets.approach]
  );
  const landingCameraPosition = useMemo(
    () => new THREE.Vector3(...config.landingCameraPosition),
    [config.landingCameraPosition]
  );
  const landingCameraTarget = useMemo(
    () => new THREE.Vector3(...config.landingCameraTarget),
    [config.landingCameraTarget]
  );
  const lookMatrix = useMemo(() => new THREE.Matrix4(), []);
  const desiredQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const rollQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useLayoutEffect(() => {
    storyBeatRef.current = storyBeat;
  }, [storyBeat]);

  const calculateFrame = useCallback(
    (time: number) => {
      writeRoutePose(
        route,
        time,
        shipPosition,
        shipQuaternion,
        futurePosition,
        direction,
        bankQuaternion
      );

      // Start camera moves after a beat is released. This keeps a camera from
      // freezing half-way through a move while narration is still playing.
      const crisisBlend = ease01((time - ROUTE_TIMING.crisis) / 1.65);
      const recoveryBlend = ease01((time - ROUTE_TIMING.recovery) / 1.7);
      const approachBlend = ease01((time - ROUTE_TIMING.approach) / 1.55);
      const landingBlend = ease01(
        (time - (ROUTE_TIMING.approach + 0.9)) /
          (ROUTE_TIMING.touchdown - ROUTE_TIMING.approach - 1.15)
      );

      cameraOffset
        .copy(cruiseOffset)
        .lerp(crisisOffset, crisisBlend)
        .lerp(recoveryOffset, recoveryBlend)
        .lerp(approachOffset, approachBlend)
        .applyQuaternion(shipQuaternion);

      desiredPosition.copy(shipPosition).add(cameraOffset);
      target.copy(shipPosition).addScaledVector(direction, 0.72);

      if (route === "Blackhole" && time < ROUTE_TIMING.recovery + 0.25) {
        const singularityFocus =
          0.2 +
          ease01(
            (time - ROUTE_TIMING.crisis) /
              (ROUTE_TIMING.recovery - ROUTE_TIMING.crisis)
          ) *
            0.24;
        target.lerp(BLACK_HOLE_POSITION, singularityFocus);
      }

      desiredPosition.lerp(landingCameraPosition, landingBlend);
      target.lerp(landingCameraTarget, landingBlend);

      const shakeWindow =
        time >= ROUTE_TIMING.crisis &&
        time < ROUTE_TIMING.approach - 0.15 &&
        (storyBeatRef.current === "route-crisis" ||
          storyBeatRef.current === "route-climax");
      if (shakeWindow) {
        const shakeIn = ease01((time - ROUTE_TIMING.crisis) / 0.8);
        const shakeOut =
          1 -
          ease01(
            (time - (ROUTE_TIMING.approach - 1.05)) / 0.9
          );
        const recoveryFade =
          1 -
          ease01(
            (time - ROUTE_TIMING.recovery) /
              (ROUTE_TIMING.approach - ROUTE_TIMING.recovery)
          );
        const baseStrength =
          route === "Blackhole" ? 0.046 : route === "Mesin" ? 0.03 : 0.022;
        const strength =
          baseStrength *
          shakeIn *
          Math.max(0, shakeOut) *
          Math.max(0.16, recoveryFade);
        desiredPosition.x +=
          (Math.sin(time * 7.4) + Math.sin(time * 11.7) * 0.34) * strength;
        desiredPosition.y +=
          (Math.sin(time * 8.6 + 0.8) + Math.sin(time * 13.1) * 0.28) *
          strength;
      }

      // A short, sharp jolt on wheel contact so the landing has some weight.
      const impactElapsed = time - ROUTE_TIMING.touchdown;
      if (impactElapsed >= 0 && impactElapsed < 1) {
        const impact = Math.exp(-impactElapsed * 5.6) * 0.05;
        desiredPosition.x += Math.sin(time * 57) * impact;
        desiredPosition.y += Math.sin(time * 71 + 0.6) * impact * 1.2;
      }

      lookMatrix.lookAt(desiredPosition, target, CAMERA_UP);
      desiredQuaternion.setFromRotationMatrix(lookMatrix);
      const cameraRoll =
        (route === "Blackhole" ? 0.055 : 0.025) *
        (1 - landingBlend) *
        Math.sin(time * 0.48);
      rollQuaternion.setFromAxisAngle(CAMERA_ROLL_AXIS, cameraRoll);
      desiredQuaternion.multiply(rollQuaternion);

      return THREE.MathUtils.lerp(
        route === "Blackhole" ? 51 : 47,
        43,
        landingBlend
      );
    },
    [
      approachOffset,
      bankQuaternion,
      cameraOffset,
      crisisOffset,
      cruiseOffset,
      desiredPosition,
      desiredQuaternion,
      direction,
      futurePosition,
      landingCameraPosition,
      landingCameraTarget,
      lookMatrix,
      recoveryOffset,
      rollQuaternion,
      route,
      shipPosition,
      shipQuaternion,
      target,
    ]
  );

  useLayoutEffect(() => {
    const fov = calculateFrame(timelineRef.current.elapsed);
    if (!skipEntrySnap) {
      camera.position.copy(desiredPosition);
      camera.quaternion.copy(desiredQuaternion);
      camera.fov = fov;
    }
    camera.near = 0.06;
    camera.far = 250;
    camera.updateProjectionMatrix();
  }, [
    calculateFrame,
    camera,
    desiredPosition,
    desiredQuaternion,
    skipEntrySnap,
    timelineRef,
  ]);

  useFrame(({ clock }, delta) => {
    const time = readTimeline(clock, timelineRef);
    const fov = calculateFrame(time);
    // A suspended tab or a single expensive GLTF frame must not create a
    // one-frame camera teleport when rendering resumes.
    const safeDelta = THREE.MathUtils.clamp(delta, 0, 1 / 30);
    const positionSmoothing = 1 - Math.exp(-safeDelta * 3.8);
    const rotationSmoothing = 1 - Math.exp(-safeDelta * 3.25);
    const lensSmoothing = 1 - Math.exp(-safeDelta * 2.8);

    camera.position.lerp(desiredPosition, positionSmoothing);
    camera.quaternion.slerp(desiredQuaternion, rotationSmoothing);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, lensSmoothing);
      camera.updateProjectionMatrix();
    }
  });

  return null;
};
/* eslint-enable react-hooks/immutability */

export const RouteLoadingBeacon: React.FC = () => (
  <group>
    <mesh>
      <octahedronGeometry args={[0.42, 0]} />
      <meshBasicMaterial color="#72eaff" wireframe toneMapped={false} />
    </mesh>
    <pointLight color="#72eaff" intensity={4} distance={8} />
  </group>
);

/** Timeline value held while the player is flying the shuttle themselves. */
const MANUAL_TIMELINE_HOLD = 0.05;

const RouteCinematic: React.FC<RouteCinematicProps> = ({
  route,
  storyBeat,
  manualStage = "off",
  courseRef,
  telemetryRef,
  onManualGateCleared,
  onManualLandingGate,
  onManualHandoffComplete,
}) => {
  const timelineRef = useRef<RouteTimelineState>({
    elapsed: 0,
    previousClock: null,
    cap:
      manualStage === "off"
        ? getTimelineCap(storyBeat)
        : MANUAL_TIMELINE_HOLD,
  });

  const manualEnabled =
    route === "Navigasi" &&
    manualStage !== "off" &&
    Boolean(courseRef && telemetryRef);
  const playerInControl = manualEnabled && manualStage === "flying";
  const manualActive =
    manualEnabled && (manualStage === "flying" || manualStage === "landing");

  useLayoutEffect(() => {
    if (manualActive) {
      // Freeze the scripted timeline so landing gear, pad dust and the beacon
      // do not run while the player still has the stick.
      timelineRef.current.elapsed = Math.min(
        timelineRef.current.elapsed,
        MANUAL_TIMELINE_HOLD
      );
      timelineRef.current.cap = MANUAL_TIMELINE_HOLD;
      return;
    }

    if (manualEnabled && manualStage === "done") {
      // Resume exactly where the scripted landing expects to begin.
      timelineRef.current.elapsed = Math.max(
        timelineRef.current.elapsed,
        LANDING_HANDOFF_TIME
      );
      timelineRef.current.previousClock = null;
    }

    timelineRef.current.cap = getTimelineCap(storyBeat);
  }, [manualActive, manualEnabled, manualStage, storyBeat]);

  const handoffComplete = useCallback(() => {
    timelineRef.current.elapsed = LANDING_HANDOFF_TIME;
    timelineRef.current.previousClock = null;
    timelineRef.current.cap = getTimelineCap(storyBeat);
    onManualHandoffComplete?.();
  }, [onManualHandoffComplete, storyBeat]);

  return (
    <>
      <RouteEnvironment route={route} />

      {manualActive ? (
        <NavFlightController
          controlsEnabled={playerInControl}
          courseRef={courseRef!}
          telemetryRef={telemetryRef!}
          onGateCleared={onManualGateCleared ?? (() => undefined)}
          onLandingGate={onManualLandingGate ?? (() => undefined)}
          onHandoffComplete={handoffComplete}
        />
      ) : (
        <>
          <CinematicCameraRig
            route={route}
            storyBeat={storyBeat}
            timelineRef={timelineRef}
            skipEntrySnap={manualEnabled}
          />
          <ShuttleActor route={route} timelineRef={timelineRef} />
        </>
      )}

      {manualEnabled && courseRef && telemetryRef && (
        <NavGateField courseRef={courseRef} telemetryRef={telemetryRef} />
      )}

      <RouteWorld
        route={route}
        timelineRef={timelineRef}
        manualStage={manualEnabled ? manualStage : "off"}
      />
    </>
  );
};

useGLTF.preload(MODEL_URLS.shuttle);
useGLTF.preload(MODEL_URLS.planet);
useGLTF.preload(MODEL_URLS.islandGround);
useGLTF.preload(MODEL_URLS.islandFlying);
useGLTF.preload(MODEL_URLS.islandFloating);

export default RouteCinematic;
