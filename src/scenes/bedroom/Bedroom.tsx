import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Stars } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";
import {
  BedroomModel,
  Robot,
  SpacemanPink,
  SpacemanWhite,
} from "../../components/models";
import { resolveSpacemanSuitColor } from "../../constants/characterCustomization.constants";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/useGameStore";
import {
  cancelSpeechNarration,
  speakNarration,
} from "../../audio/speechNarration";

import "./Bedroom.css";

type DialoguePhase = 0 | 1 | 2 | 3 | 5;
type IdentityStep =
  | "intro"
  | "name"
  | "phone"
  | "school"
  | "major"
  | "confirm"
  | "submitted";
type FieldKey = "name" | "phone" | "school" | "major";
type StoryTone = "info" | "warn" | "success";
type ActiveSpeaker = "robot" | "spaceman" | null;

type StoryLine = {
  speaker: "AI Robot" | "Spaceman";
  text: string;
  tone?: StoryTone;
};

type IdentityFormData = {
  name: string;
  phone: string;
  school: string;
  major: "IPA" | "IPS" | "";
};

type StepConfig = {
  step: IdentityStep;
  field?: FieldKey;
  label?: string;
  placeholder?: string;
  required?: boolean;
  inputType?: "text" | "tel" | "select";
  options?: Array<{ value: string; label: string }>;
  preDialogue: StoryLine[];
  postSubmit: (value: string, currentData: IdentityFormData) => StoryLine[];
};

const fieldStepOrder: IdentityStep[] = ["name", "phone", "school", "major"];

const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
  skip?: boolean;
}> = ({ text, speed = 28, onComplete, skip = false }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    idxRef.current = 0;
    if (textRef.current) textRef.current.textContent = "";
    if (cursorRef.current) cursorRef.current.hidden = false;

    if (text.length === 0) {
      if (cursorRef.current) cursorRef.current.hidden = true;
      return;
    }

    timerRef.current = setInterval(() => {
      idxRef.current += 1;
      if (textRef.current) {
        textRef.current.textContent = text.substring(0, idxRef.current);
      }

      if (idxRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (cursorRef.current) cursorRef.current.hidden = true;
        onCompleteRef.current?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  useEffect(() => {
    if (skip && idxRef.current < text.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      idxRef.current = text.length;
      if (textRef.current) textRef.current.textContent = text;
      if (cursorRef.current) cursorRef.current.hidden = true;
      onCompleteRef.current?.();
    }
  }, [skip, text]);

  return (
    <>
      <span ref={textRef} />
      <span ref={cursorRef} className="tw-cursor">▌</span>
    </>
  );
};

const SoundWaveBars: React.FC<{ active: boolean; small?: boolean }> = ({
  active,
  small,
}) => {
  if (!active) return null;

  return (
    <div className={`sound-wave ${small ? "sm" : ""}`}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
};

const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const fillTimer = setTimeout(() => setProgress(100), 0);
      const resetTimer = setTimeout(() => setProgress(0), 500);

      return () => {
        clearTimeout(fillTimer);
        clearTimeout(resetTimer);
      };
    }

    return undefined;
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className={`loading-screen ${isLoading ? "active" : "fade-out"}`}>
      <div className="loading-content">
        <h2>LOADING SECTOR...</h2>

        <div className="loading-bar-container">
          <div
            className="loading-bar"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <p className="loading-text">{Math.min(Math.floor(progress), 100)}%</p>

        <div className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
};

const CameraAnimator: React.FC<{
  phase: DialoguePhase;
  activeSpeaker: ActiveSpeaker;
  showInputCard: boolean;
  identityStep: IdentityStep;
}> = ({ phase, activeSpeaker, showInputCard, identityStep }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(2.15, 0.28, 3.4));
  const targetLookAt = useRef(new THREE.Vector3(4.35, -0.82, -0.15));
  const currentLookAt = useRef(new THREE.Vector3(4.35, -0.82, -0.15));
  const transitionStartPosition = useRef(camera.position.clone());
  const transitionStartLookAt = useRef(
    new THREE.Vector3(4.35, -0.82, -0.15)
  );
  const transitionElapsed = useRef(0);
  const framePosition = useRef(new THREE.Vector3());
  const frameLookAt = useRef(new THREE.Vector3());
  const shotEnergy = useRef(0.45);
  const shotDuration = useRef(1.2);

  useEffect(() => {
    let position: [number, number, number] = [2.15, 0.18, 3.4];
    let lookAt: [number, number, number] = [4.35, -0.82, -0.15];
    let energy = 0.45;
    let duration = 1.2;

    if (phase === 0) {
      position = [2.08, 0.24, 2.72];
      lookAt = [4.72, -0.72, -1.22];
      energy = 0.18;
    } else if (phase === 1) {
      // Slow drift across the whole wake-up: starts framed on the bunk and
      // eases out as the character stands. Handheld sway is kept low so it
      // does not fight the character animation.
      position = [2.32, 0.06, 3.02];
      lookAt = [4.86, -0.98, -0.22];
      energy = 0.24;
      duration = WAKE_DURATION * 0.82;
    } else if (phase === 2) {
      position = [1.98, 0.08, 3.18];
      lookAt = [4.28, -0.86, 0.08];
      energy = 0.52;
    } else if (phase === 5) {
      position = [2.42, 0.16, 3.7];
      lookAt = [4.3, -0.86, 0.05];
      energy = 0.72;
    } else if (showInputCard || identityStep === "confirm") {
      position = [2.2, 0.22, 3.72];
      lookAt = [4.24, -0.88, 0.05];
      energy = 0.25;
    } else if (activeSpeaker === "robot") {
      position = [2.08, -0.12, 2.42];
      lookAt = [3.52, -0.72, 0.03];
      energy = 0.42;
    } else if (activeSpeaker === "spaceman") {
      position = [3.08, -0.08, 3.02];
      lookAt = [5.02, -0.82, 0.7];
      energy = 0.58;
    }

    transitionStartPosition.current.copy(camera.position);
    transitionStartLookAt.current.copy(currentLookAt.current);
    transitionElapsed.current = 0;
    targetPosition.current.set(...position);
    targetLookAt.current.set(...lookAt);
    shotEnergy.current = energy;
    shotDuration.current = duration;
  }, [camera, phase, activeSpeaker, showInputCard, identityStep]);

  useFrame(({ clock, pointer }, delta) => {
    const shot = shotDuration.current;
    transitionElapsed.current = Math.min(shot, transitionElapsed.current + delta);
    const progress = THREE.MathUtils.clamp(transitionElapsed.current / shot, 0, 1);
    const easedProgress = THREE.MathUtils.smootherstep(progress, 0, 1);
    const time = clock.getElapsedTime();
    const breathing = shotEnergy.current;

    framePosition.current.lerpVectors(
      transitionStartPosition.current,
      targetPosition.current,
      easedProgress
    );
    framePosition.current.x += pointer.x * 0.045 + Math.sin(time * 0.23) * 0.012 * breathing;
    framePosition.current.y += pointer.y * 0.028 + Math.cos(time * 0.29) * 0.01 * breathing;
    framePosition.current.z += Math.sin(time * 0.18) * 0.016 * breathing;

    currentLookAt.current.lerpVectors(
      transitionStartLookAt.current,
      targetLookAt.current,
      easedProgress
    );
    frameLookAt.current.copy(currentLookAt.current);
    frameLookAt.current.x += Math.sin(time * 0.2) * 0.008 * breathing;
    frameLookAt.current.y += Math.sin(time * 0.31) * 0.006 * breathing;

    camera.position.copy(framePosition.current);
    camera.lookAt(frameLookAt.current);
  });

  return null;
};

const SPACEMAN_FLOOR_Y = -1.48;
const SPACEMAN_SLEEP_POSITION = {
  x: 4.72,
  y: -0.78,
  z: -1.22,
} as const;
const SPACEMAN_SLEEP_ROTATION: [number, number, number] = [-0.96, 0.08, 4.72];
const SPACEMAN_STAND_POSITION = { x: 5.02, y: SPACEMAN_FLOOR_Y, z: 0.72 } as const;
const SPACEMAN_STAND_ROTATION: [number, number, number] = [0, 5.12, 0];

/**
 * Where the character perches on the edge of the bed, expressed as a fraction
 * of the way from the pillow to the standing mark so it always sits on the
 * path between the two, plus a small nudge toward the room.
 */
const SPACEMAN_SIT_BLEND = 0.45;
const SPACEMAN_SIT_OFFSET = { x: 0.03, y: 0.08, z: 0.06 } as const;

/** Total length of the wake-up, seconds. Shared with the limb animation. */
export const WAKE_DURATION = 4.8;

/**
 * Beat windows as fractions of WAKE_DURATION. These mirror the limb beats in
 * SpacemanModel so the body and the pose move on one clock.
 */
const WAKE_BEATS = {
  /** Torso rotates from lying to upright. */
  uprightFrom: 0.2,
  uprightTo: 0.62,
  /** Slide from the pillow to the edge of the bed. */
  sitFrom: 0.24,
  sitTo: 0.56,
  /** Groggy pause perched on the edge. */
  groggyFrom: 0.58,
  groggyTo: 0.66,
  groggyFadeFrom: 0.78,
  groggyFadeTo: 0.86,
  /** Feet reach the deck and take the weight. */
  standFrom: 0.76,
  standTo: 0.94,
} as const;

const FORWARD_AXIS = new THREE.Vector3(0, 0, 1);

const SpacemanAnimator: React.FC<{
  phase: DialoguePhase;
  charRef: React.RefObject<THREE.Group | null>;
  isSpeaking: boolean;
  wakeProgressRef: React.MutableRefObject<number>;
  onWakeComplete: () => void;
}> = ({ phase, charRef, isSpeaking, wakeProgressRef, onWakeComplete }) => {
  const startedRef = useRef(false);
  const runningRef = useRef(false);
  const elapsedRef = useRef(0);
  const completeRef = useRef(onWakeComplete);

  useEffect(() => {
    completeRef.current = onWakeComplete;
  }, [onWakeComplete]);

  const poses = useMemo(() => {
    const sleep = new THREE.Vector3(
      SPACEMAN_SLEEP_POSITION.x,
      SPACEMAN_SLEEP_POSITION.y,
      SPACEMAN_SLEEP_POSITION.z
    );
    const stand = new THREE.Vector3(
      SPACEMAN_STAND_POSITION.x,
      SPACEMAN_STAND_POSITION.y,
      SPACEMAN_STAND_POSITION.z
    );
    const sit = sleep
      .clone()
      .lerp(stand, SPACEMAN_SIT_BLEND)
      .add(
        new THREE.Vector3(
          SPACEMAN_SIT_OFFSET.x,
          SPACEMAN_SIT_OFFSET.y,
          SPACEMAN_SIT_OFFSET.z
        )
      );

    return {
      sleep,
      sit,
      stand,
      sleepQuaternion: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...SPACEMAN_SLEEP_ROTATION)
      ),
      standQuaternion: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(...SPACEMAN_STAND_ROTATION)
      ),
    };
  }, []);

  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      sway: new THREE.Quaternion(),
    }),
    []
  );

  useEffect(() => {
    const group = charRef.current;
    if (!group) return;

    if (phase === 0) {
      startedRef.current = false;
      runningRef.current = false;
      elapsedRef.current = 0;
      wakeProgressRef.current = 0;
      group.position.copy(poses.sleep);
      group.quaternion.copy(poses.sleepQuaternion);
      return;
    }

    if (!startedRef.current) {
      startedRef.current = true;
      runningRef.current = true;
      elapsedRef.current = 0;
      wakeProgressRef.current = 0;
    }
  }, [charRef, phase, poses, wakeProgressRef]);

  /* eslint-disable react-hooks/immutability -- transforms are driven in the render loop by design. */
  useFrame(({ clock }, delta) => {
    const group = charRef.current;
    if (!group || phase < 1) return;

    const t = clock.getElapsedTime();
    const safeDelta = THREE.MathUtils.clamp(delta, 0, 1 / 30);

    if (runningRef.current) {
      elapsedRef.current += safeDelta;
      const progress = THREE.MathUtils.clamp(
        elapsedRef.current / WAKE_DURATION,
        0,
        1
      );
      wakeProgressRef.current = progress;

      // Pillow -> perched on the edge of the bed -> feet planted on the deck.
      const toSit = THREE.MathUtils.smootherstep(
        progress,
        WAKE_BEATS.sitFrom,
        WAKE_BEATS.sitTo
      );
      const toStand = THREE.MathUtils.smootherstep(
        progress,
        WAKE_BEATS.standFrom,
        WAKE_BEATS.standTo
      );
      scratch.position
        .copy(poses.sleep)
        .lerp(poses.sit, toSit)
        .lerp(poses.stand, toStand);

      const grogginess =
        THREE.MathUtils.smootherstep(
          progress,
          WAKE_BEATS.groggyFrom,
          WAKE_BEATS.groggyTo
        ) *
        (1 -
          THREE.MathUtils.smootherstep(
            progress,
            WAKE_BEATS.groggyFadeFrom,
            WAKE_BEATS.groggyFadeTo
          ));

      // A slow drift while sitting there, and one soft settle once upright.
      scratch.position.x += Math.sin(t * 1.6) * 0.014 * grogginess;
      scratch.position.y += Math.sin(t * 1.1) * 0.008 * grogginess;
      const settle = Math.sin(
        THREE.MathUtils.clamp((progress - 0.9) / 0.1, 0, 1) * Math.PI
      );
      scratch.position.y += settle * 0.024;

      group.position.copy(scratch.position);

      // The whole turn toward the room happens during the sit-up.
      group.quaternion.slerpQuaternions(
        poses.sleepQuaternion,
        poses.standQuaternion,
        THREE.MathUtils.smootherstep(
          progress,
          WAKE_BEATS.uprightFrom,
          WAKE_BEATS.uprightTo
        )
      );
      scratch.sway.setFromAxisAngle(
        FORWARD_AXIS,
        Math.sin(t * 1.9) * 0.055 * grogginess
      );
      group.quaternion.multiply(scratch.sway);

      if (progress >= 1) {
        runningRef.current = false;
        completeRef.current();
      }
      return;
    }

    const response = 1 - Math.exp(-safeDelta * (isSpeaking ? 8 : 4));

    group.position.y = THREE.MathUtils.lerp(
      group.position.y,
      SPACEMAN_FLOOR_Y,
      response
    );
    group.rotation.z = THREE.MathUtils.lerp(
      group.rotation.z,
      isSpeaking ? Math.sin(t * 2.6) * 0.028 : Math.sin(t * 0.7) * 0.012,
      response
    );
    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      isSpeaking ? Math.sin(t * 3.1) * 0.018 : Math.sin(t * 0.54) * 0.006,
      response
    );
  });
  /* eslint-enable react-hooks/immutability */

  return null;
};

const RobotAnimator: React.FC<{
  isActive: boolean;
  phase: DialoguePhase;
  robotRef: React.RefObject<THREE.Group | null>;
  isSpeaking: boolean;
}> = ({ isActive, phase, robotRef, isSpeaking }) => {
  useEffect(() => {
    if (!robotRef.current) return;

    if (phase >= 1) {
      // Held back until the character is already sitting up, so the robot
      // reads as arriving in response rather than popping in on the cut.
      gsap.to(robotRef.current.position, {
        x: 3.5,
        y: -0.95,
        z: 0.02,
        duration: 1.25,
        delay: WAKE_DURATION * 0.34,
        ease: "power3.out",
      });
      gsap.to(robotRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.95,
        delay: WAKE_DURATION * 0.34,
        ease: "back.out(1.5)",
      });
    }
  }, [phase, robotRef]);

  useFrame(({ clock }, delta) => {
    if (!robotRef.current || !isActive) return;

    const t = clock.getElapsedTime();
    const response = 1 - Math.exp(-delta * (isSpeaking ? 9 : 4));
    const targetY = -0.95 + Math.sin(t * (isSpeaking ? 3.4 : 1.2)) *
      (isSpeaking ? 0.05 : 0.018);
    const targetRotation = isSpeaking
      ? Math.sin(t * 2.8) * 0.13
      : -0.18 + Math.sin(t * 0.55) * 0.045;

    robotRef.current.position.y = THREE.MathUtils.lerp(
      robotRef.current.position.y,
      targetY,
      response
    );
    robotRef.current.rotation.y = THREE.MathUtils.lerp(
      robotRef.current.rotation.y,
      targetRotation,
      response
    );
  });

  return null;
};

const SpeakerSpotlight: React.FC<{ activeSpeaker: ActiveSpeaker }> = ({
  activeSpeaker,
}) => {
  const robotLightRef = useRef<THREE.PointLight>(null);
  const spacemanLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (robotLightRef.current) {
      const targetIntensity = activeSpeaker === "robot" ? 5.2 : 0.7;

      robotLightRef.current.intensity = THREE.MathUtils.lerp(
        robotLightRef.current.intensity,
        targetIntensity,
        0.06
      );
    }

    if (spacemanLightRef.current) {
      const targetIntensity = activeSpeaker === "spaceman" ? 5.4 : 0.7;

      spacemanLightRef.current.intensity = THREE.MathUtils.lerp(
        spacemanLightRef.current.intensity,
        targetIntensity,
        0.06
      );
    }
  });

  return (
    <>
      <pointLight
        ref={robotLightRef}
        position={[3.5, 0.35, 0.85]}
        color="#00ffff"
        intensity={0}
        distance={4.5}
        decay={2}
      />

      <pointLight
        ref={spacemanLightRef}
        position={[5, 0.35, 1.25]}
        color="#77dfff"
        intensity={0}
        distance={4.5}
        decay={2}
      />
    </>
  );
};

const CharacterGrounding: React.FC<{
  activeSpeaker: ActiveSpeaker;
  wakeProgressRef: React.MutableRefObject<number>;
  isWaking: boolean;
}> = ({ activeSpeaker, wakeProgressRef, isWaking }) => {
  const robotRingRef = useRef<THREE.Mesh>(null);
  const spacemanRingRef = useRef<THREE.Mesh>(null);
  const spacemanShadowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.getElapsedTime() * 2.2) * 0.12;
    // The floor marker belongs to the standing spot, so it only fades in as
    // the character actually plants their feet there.
    const planted = isWaking
      ? THREE.MathUtils.smootherstep(wakeProgressRef.current, 0.74, 0.96)
      : 1;

    if (robotRingRef.current) {
      const material = robotRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = activeSpeaker === "robot" ? pulse : 0.13;
      robotRingRef.current.rotation.z += 0.003;
    }

    if (spacemanShadowRef.current) {
      const material = spacemanShadowRef.current
        .material as THREE.MeshBasicMaterial;
      material.opacity = 0.34 * planted;
    }

    if (spacemanRingRef.current) {
      const material = spacemanRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity =
        (activeSpeaker === "spaceman" ? pulse : 0.26) * planted;
      spacemanRingRef.current.rotation.z -= 0.0025;
    }
  });

  return (
    <>
      <mesh ref={robotRingRef} position={[3.5, -1.47, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.36, 48]} />
        <meshBasicMaterial color="#42e8ff" transparent opacity={0.13} depthWrite={false} />
      </mesh>
      <mesh
        ref={spacemanShadowRef}
        position={[5.02, -1.468, 0.72]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 0.58, 1]}
      >
        <circleGeometry args={[0.52, 48]} />
        <meshBasicMaterial color="#00070b" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <mesh ref={spacemanRingRef} position={[5.02, -1.455, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.58, 48]} />
        <meshBasicMaterial color="#9cecff" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </>
  );
};

/**
 * Cabin lighting through the wake-up: the emergency strobe over the bunk dies
 * back as the character comes round and the normal cabin rim light returns.
 */
const WakeLighting: React.FC<{
  isWaking: boolean;
  phase: DialoguePhase;
  wakeProgressRef: React.MutableRefObject<number>;
}> = ({ isWaking, phase, wakeProgressRef }) => {
  const alertRef = useRef<THREE.PointLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, delta) => {
    const progress = isWaking
      ? wakeProgressRef.current
      : phase === 0
        ? 0
        : 1;
    const time = clock.getElapsedTime();
    const response = 1 - Math.exp(-THREE.MathUtils.clamp(delta, 0, 1 / 30) * 4);

    if (alertRef.current) {
      const alarm = 1 - THREE.MathUtils.smootherstep(progress, 0.5, 0.95);
      const strobe = 0.42 + Math.abs(Math.sin(time * 3.1)) * 0.58;
      alertRef.current.intensity = THREE.MathUtils.lerp(
        alertRef.current.intensity,
        alarm * strobe * 3.2,
        response
      );
    }

    if (rimRef.current) {
      const revived = THREE.MathUtils.smootherstep(progress, 0.15, 0.85);
      rimRef.current.intensity = THREE.MathUtils.lerp(
        rimRef.current.intensity,
        0.3 + revived * 1.6,
        response
      );
    }
  });

  return (
    <>
      <pointLight
        ref={alertRef}
        position={[4.9, 0.6, -1.1]}
        color="#ff5a3c"
        intensity={0}
        distance={5.5}
        decay={2}
      />
      <pointLight
        ref={rimRef}
        position={[5.95, 0.7, 1.25]}
        color="#8fdcff"
        intensity={0.3}
        distance={6.5}
        decay={2}
      />
    </>
  );
};

const DustMotes: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(75 * 3);
    for (let index = 0; index < 75; index += 1) {
      const randomX = (Math.sin(index * 91.73 + 12.4) + 1) * 0.5;
      const randomY = (Math.sin(index * 47.11 + 38.2) + 1) * 0.5;
      const randomZ = (Math.sin(index * 73.57 + 8.9) + 1) * 0.5;
      values[index * 3] = -1 + randomX * 8;
      values[index * 3 + 1] = -1.25 + randomY * 3.6;
      values[index * 3 + 2] = -1.8 + randomZ * 5;
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.08) * 0.045;
    pointsRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.22) * 0.035;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8be9ff"
        size={0.012}
        transparent
        opacity={0.3}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

const Bedroom: React.FC = () => {
  const navigate = useNavigate();
  const { playSfx, stopSfx } = useGameAudio();

  const setPlayerData = useGameStore((state) => state.setPlayerData);
  const character = useGameStore((state) => state.character);
  const spacemanColor = useGameStore((state) => state.spacemanColor);
  const spacemanHat = useGameStore((state) => state.spacemanHat);
  const speechVolume = useGameStore((state) => state.sfxVolume);
  const resolvedSpacemanSuitColor = resolveSpacemanSuitColor(spacemanColor);

  const [dialoguePhase, setDialoguePhase] = useState<DialoguePhase>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<IdentityFormData>({
    name: "",
    phone: "",
    school: "",
    major: "",
  });

  const [identityStep, setIdentityStep] = useState<IdentityStep>("intro");
  const [storyQueue, setStoryQueue] = useState<StoryLine[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showInputCard, setShowInputCard] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [stepError, setStepError] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [narrationDone, setNarrationDone] = useState(false);
  const [skipTyping, setSkipTyping] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [skipModeActive, setSkipModeActive] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);

  const wakeProgressRef = useRef(0);

  /**
   * The wake-up owns the character until it finishes, independently of how
   * fast the player clicks through the opening line. Tying it to
   * dialoguePhase === 1 used to snap the pose straight to idle mid-animation.
   */
  const isWaking = dialoguePhase >= 1 && !wakeComplete;
  const handleWakeComplete = useCallback(() => setWakeComplete(true), []);

  const robotRef = useRef<THREE.Group | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const navigateTimeoutRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current);
      }

      if (autoPlayTimerRef.current !== null) {
        clearTimeout(autoPlayTimerRef.current);
      }

      cancelSpeechNarration();
    };
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setTypingDone(false);
      setNarrationDone(false);
      setSkipTyping(false);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [dialoguePhase, currentStoryIndex, identityStep, storyQueue]);

  const introDialogues = [
    {
      phase: 0,
      speaker: "AI System",
      text: "⚠ PROTOKOL DARURAT AKTIF ⚠\n\nCadet... bangun! Tabrakan asteroid membuat sistem utama lumpuh.",
      buttons: [{ text: "Siapa kamu? Aku di mana?", action: 1 }],
    },
    {
      phase: 1,
      speaker: "AI Robot",
      text: "Kita terdampar di planet asing. Untuk menstabilkan kapal dan membuka navigasi, aku harus verifikasi identitasmu.",
      buttons: [
        { text: "Kondisi kapalnya bagaimana?", action: 2 },
        { text: "Apa yang harus aku lakukan?", action: 2 },
      ],
    },
    {
      phase: 2,
      speaker: "AI Robot",
      text: "Tenang, kabin masih aman. Ikuti verifikasi bertahap. Aku akan pandu satu per satu agar cepat dan jelas.",
      buttons: [{ text: "Mulai verifikasi sekarang", action: 3 }],
    },
  ];

  const getStepConfig = useCallback((step: IdentityStep): StepConfig | null => {
    switch (step) {
      case "intro":
        return {
          step,
          preDialogue: [
            {
              speaker: "AI Robot",
              text: "Cadet, sebelum sistem navigasi kubuka, aku perlu sinkronisasi identitas bertahap.",
              tone: "info",
            },
            {
              speaker: "Spaceman",
              text: "Baik. Aku siap. Pandu aku pelan-pelan.",
              tone: "info",
            },
            {
              speaker: "AI Robot",
              text: "Kita mulai dari data paling penting dulu.",
              tone: "success",
            },
          ],
          postSubmit: () => [],
        };

      case "name":
        return {
          step,
          field: "name",
          label: "NAMA PILOT",
          placeholder: "Masukkan nama identitas pilot",
          required: true,
          inputType: "text",
          preDialogue: [
            {
              speaker: "AI Robot",
              text: "Cadet, aku butuh identitas pilot untuk membuka lapisan keamanan inti.",
              tone: "info",
            },
          ],
          postSubmit: (value) => [
            {
              speaker: "AI Robot",
              text: `Sinkronisasi biometrik cocok. Senang melihatmu kembali sadar, ${value.trim()}.`,
              tone: "success",
            },
            {
              speaker: "Spaceman",
              text: "Lanjut. Kita selesaikan verifikasi ini.",
              tone: "info",
            },
          ],
        };

      case "phone":
        return {
          step,
          field: "phone",
          label: "NOMOR TELEPON",
          placeholder: "Kontak darurat (opsional)",
          required: false,
          inputType: "tel",
          preDialogue: [
            {
              speaker: "AI Robot",
              text: "Masukkan kanal kontak darurat. Jika tidak ada, kita tetap bisa lanjut.",
              tone: "info",
            },
          ],
          postSubmit: (value) => {
            const hasValue = value.trim().length > 0;

            return hasValue
              ? [
                  {
                    speaker: "AI Robot",
                    text: "Kanal darurat tercatat. Prioritas komunikasi berhasil dipetakan.",
                    tone: "success",
                  },
                ]
              : [
                  {
                    speaker: "AI Robot",
                    text: "Kontak darurat belum tersedia. Tidak masalah, kita lanjut ke data berikutnya.",
                    tone: "warn",
                  },
                ];
          },
        };

      case "school":
        return {
          step,
          field: "school",
          label: "SEKOLAH / AKADEMI",
          placeholder: "Asal sekolah atau akademi (opsional)",
          required: false,
          inputType: "text",
          preDialogue: [
            {
              speaker: "AI Robot",
              text: "Afiliasi akademimu membantuku memuat modul pelatihan yang tepat.",
              tone: "info",
            },
          ],
          postSubmit: (value) => {
            const hasValue = value.trim().length > 0;

            return hasValue
              ? [
                  {
                    speaker: "AI Robot",
                    text: `Afiliasi ${value.trim()} dikenali. Profil pendidikan berhasil ditautkan.`,
                    tone: "success",
                  },
                ]
              : [
                  {
                    speaker: "AI Robot",
                    text: "Afiliasi belum ditemukan. Kamu bisa memperbaruinya nanti di terminal utama.",
                    tone: "warn",
                  },
                ];
          },
        };

      case "major":
        return {
          step,
          field: "major",
          label: "JURUSAN SPESIALISASI",
          required: true,
          inputType: "select",
          options: [
            { value: "", label: "Pilih jurusan..." },
            { value: "IPA", label: "IPA - Sains & Teknologi" },
            { value: "IPS", label: "IPS - Ilmu Sosial" },
          ],
          preDialogue: [
            {
              speaker: "AI Robot",
              text: "Pilih spesialisasi utama. Ini menentukan paket misi yang akan aktif.",
              tone: "info",
            },
          ],
          postSubmit: (value, currentData) => [
            {
              speaker: "AI Robot",
              text: `Profil ${
                currentData.name || "cadet"
              } dikonfigurasi untuk jalur ${value}.`,
              tone: "success",
            },
            {
              speaker: "Spaceman",
              text: "Bagus. Sekarang buka akses sistem intinya.",
              tone: "info",
            },
          ],
        };

      default:
        return null;
    }
  }, []);

  const stepMetadata = useMemo(
    () => ({
      name: { title: "Langkah 1/4 - Identitas Utama" },
      phone: { title: "Langkah 2/4 - Kontak Darurat" },
      school: { title: "Langkah 3/4 - Afiliasi Akademi" },
      major: { title: "Langkah 4/4 - Spesialisasi" },
    }),
    []
  );

  const startStep = useCallback(
    (step: IdentityStep, forceSkipMode: boolean = skipModeActive) => {
      const cfg = getStepConfig(step);

      setIdentityStep(step);
      setStepError("");
      setIsSubmittingStep(false);
      setTypingDone(false);
      setSkipTyping(false);

      if (forceSkipMode && cfg?.field) {
        setShowInputCard(true);
        setStoryQueue([]);
        setCurrentStoryIndex(0);
      } else {
        setShowInputCard(false);
        setStoryQueue(cfg ? cfg.preDialogue : []);
        setCurrentStoryIndex(0);
      }
    },
    [getStepConfig, skipModeActive]
  );

  const goToNextFieldStep = useCallback(
    (step: IdentityStep, forceSkipMode: boolean = skipModeActive) => {
      const index = fieldStepOrder.indexOf(step);

      if (index === -1 || index === fieldStepOrder.length - 1) {
        setIdentityStep("confirm");
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
        return;
      }

      startStep(fieldStepOrder[index + 1], forceSkipMode);
    },
    [startStep, skipModeActive]
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinueStory = useCallback(() => {
    if (!typingDone || !narrationDone) return;
    if (isTransitioningRef.current) return;
    if (storyQueue.length === 0) return;

    const safeIndex = Math.min(currentStoryIndex, storyQueue.length - 1);

    if (safeIndex < storyQueue.length - 1) {
      setTypingDone(false);
      setSkipTyping(false);
      setCurrentStoryIndex(safeIndex + 1);
      return;
    }

    isTransitioningRef.current = true;

    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 300);

    if (isSubmittingStep) {
      setIsSubmittingStep(false);
      setStepError("");

      if (identityStep === "major") {
        setIdentityStep("confirm");
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
      } else {
        goToNextFieldStep(identityStep);
      }

      return;
    }

    const cfg = getStepConfig(identityStep);

    if (cfg?.field) {
      setShowInputCard(true);
    }
  }, [
    storyQueue,
    currentStoryIndex,
    isSubmittingStep,
    identityStep,
    goToNextFieldStep,
    getStepConfig,
    typingDone,
    narrationDone,
  ]);

  const handleSkipDialogue = useCallback(() => {
    if (dialoguePhase >= 5) return;

    cancelSpeechNarration();
    setNarrationDone(true);
    setSkipModeActive(true);

    if (dialoguePhase < 3 || identityStep === "intro") {
      setDialoguePhase(3);
      startStep("name", true);
    } else if (identityStep !== "confirm") {
      if (isSubmittingStep) {
        setIsSubmittingStep(false);
        setStepError("");

        if (identityStep === "major") {
          setIdentityStep("confirm");
          setStoryQueue([]);
          setCurrentStoryIndex(0);
          setShowInputCard(false);
        } else {
          goToNextFieldStep(identityStep, true);
        }
      } else {
        setShowInputCard(true);
      }
    }
  }, [
    dialoguePhase,
    identityStep,
    isSubmittingStep,
    startStep,
    goToNextFieldStep,
  ]);

  const handleSendStep = () => {
    const cfg = getStepConfig(identityStep);
    if (!cfg?.field) return;

    const rawValue = formData[cfg.field];
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (cfg.required && !value) {
      setStepError(
        cfg.field === "major" ? "Jurusan wajib dipilih." : "Nama pilot wajib diisi."
      );
      return;
    }

    setStepError("");

    if (skipModeActive) {
      if (identityStep === "major") {
        setIdentityStep("confirm");
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
      } else {
        goToNextFieldStep(identityStep, true);
      }
    } else {
      const postLines = cfg.postSubmit(String(rawValue), formData);

      setStoryQueue(postLines);
      setCurrentStoryIndex(0);
      setShowInputCard(false);
      setIsSubmittingStep(true);
    }
  };

  const handleEditData = () => {
    startStep("name");
  };

  const handleFinalAuthentication = () => {
    if (!formData.name.trim()) {
      setStepError("Nama pilot wajib diisi sebelum autentikasi final.");
      startStep("name");
      return;
    }

    if (!formData.major) {
      setStepError("Jurusan wajib dipilih sebelum autentikasi final.");
      startStep("major");
      return;
    }

    if (navigateTimeoutRef.current !== null) {
      window.clearTimeout(navigateTimeoutRef.current);
    }

    cancelSpeechNarration();

    setPlayerData({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      school: formData.school.trim(),
      major: formData.major,
    });

    setIdentityStep("submitted");
    setDialoguePhase(5);

    navigateTimeoutRef.current = window.setTimeout(() => {
      navigate("/mainhub");
    }, 3000);
  };

  const currentDialogue = introDialogues.find(
    (dialogue) => dialogue.phase === dialoguePhase
  );

  const currentStepConfig = getStepConfig(identityStep);

  const atStoryEnd =
    storyQueue.length > 0 && currentStoryIndex === storyQueue.length - 1;

  const canContinueStory =
    storyQueue.length > 0 &&
    !(identityStep === "intro" && atStoryEnd && !isSubmittingStep);

  const inStoryboardStep = ["intro", "name", "phone", "school", "major"].includes(
    identityStep
  );

  const activeSpeaker = useMemo<ActiveSpeaker>(() => {
    if (dialoguePhase === 5) return null;

    if (dialoguePhase < 3 && currentDialogue) {
      return currentDialogue.speaker.includes("Robot") ||
        currentDialogue.speaker.includes("System")
        ? "robot"
        : "spaceman";
    }

    if (
      dialoguePhase === 3 &&
      storyQueue.length > 0 &&
      currentStoryIndex < storyQueue.length
    ) {
      return storyQueue[currentStoryIndex].speaker === "AI Robot"
        ? "robot"
        : "spaceman";
    }

    return null;
  }, [dialoguePhase, currentDialogue, storyQueue, currentStoryIndex]);

  const activeNarrationText = useMemo(() => {
    if (isLoading || dialoguePhase === 5) return "";

    if (dialoguePhase < 3) {
      return currentDialogue?.text ?? "";
    }

    if (
      dialoguePhase === 3 &&
      storyQueue.length > 0 &&
      currentStoryIndex < storyQueue.length
    ) {
      return storyQueue[currentStoryIndex].text;
    }

    return "";
  }, [
    currentDialogue,
    currentStoryIndex,
    dialoguePhase,
    isLoading,
    storyQueue,
  ]);

  useEffect(() => {
    let disposed = false;
    const startTimer = window.setTimeout(() => {
      if (disposed) return;

      cancelSpeechNarration();

      if (!activeNarrationText || skipModeActive || speechVolume <= 0) {
        setNarrationDone(true);
        return;
      }

      setNarrationDone(false);
      void speakNarration(activeNarrationText, {
        lang: "id-ID",
        preferredVoiceLanguage: "id",
        pitch: activeSpeaker === "robot" ? 1.24 : 0.96,
        rate: activeSpeaker === "robot" ? 1.06 : 1.02,
        volume: speechVolume,
      }).then(() => {
        if (!disposed) setNarrationDone(true);
      });
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      cancelSpeechNarration();
    };
  }, [activeNarrationText, activeSpeaker, skipModeActive, speechVolume]);

  const canAdvanceDialogue = typingDone && narrationDone;
  const isActiveSpeech =
    activeSpeaker !== null && (!typingDone || !narrationDone);

  useEffect(() => {
    if (isLoading || !isWaking) return;
    playSfx("characterWake");
    return () => stopSfx("characterWake", 120);
  }, [isLoading, isWaking, playSfx, stopSfx]);

  useEffect(() => {
    if (isLoading || dialoguePhase === 0 || dialoguePhase === 5) return;

    if (isActiveSpeech) {
      const cue = activeSpeaker === "robot" ? "robotSpeaking" : "dialogueType";
      playSfx(cue);
      return () => stopSfx(cue, 100);
    }

    playSfx("characterIdleServo");
    return () => stopSfx("characterIdleServo", 120);
  }, [activeSpeaker, dialoguePhase, isActiveSpeech, isLoading, playSfx, stopSfx]);

  useEffect(() => {
    if (dialoguePhase !== 5) return;
    stopSfx("characterIdleServo", 120);
    stopSfx("robotSpeaking", 120);
    stopSfx("dialogueType", 120);
    playSfx("missionComplete");
  }, [dialoguePhase, playSfx, stopSfx]);

  const spacemanMotion = dialoguePhase === 0
    ? "sleep"
    : isWaking
      ? "wake"
      : activeSpeaker === "spaceman" && isActiveSpeech
        ? "speaking"
        : "idle";

  const handleSpacemanMotionCue = useCallback(() => {
    if (spacemanMotion === "idle") playSfx("characterConfused");
  }, [playSfx, spacemanMotion]);

  const handleDialogueClick = useCallback(() => {
    if (isTransitioningRef.current) return;
    if (!typingDone) setSkipTyping(true);
  }, [typingDone]);

  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    if (!autoPlay || !canAdvanceDialogue) return;
    if (dialoguePhase === 5) return;

    if (dialoguePhase < 3 && currentDialogue) {
      autoPlayTimerRef.current = setTimeout(() => {
        const button = currentDialogue.buttons[0];

        if (button.action === 3) {
          setDialoguePhase(3);
          startStep("intro");
        } else {
          setDialoguePhase(button.action as DialoguePhase);
        }
      }, 2500);

      return;
    }

    if (
      dialoguePhase === 3 &&
      inStoryboardStep &&
      !showInputCard &&
      identityStep !== "confirm"
    ) {
      if (identityStep === "intro" && atStoryEnd && !isSubmittingStep) {
        autoPlayTimerRef.current = setTimeout(() => {
          startStep("name");
        }, 2500);

        return;
      }

      if (canContinueStory) {
        autoPlayTimerRef.current = setTimeout(() => {
          handleContinueStory();
        }, 2500);
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [
    autoPlay,
    canAdvanceDialogue,
    dialoguePhase,
    currentStoryIndex,
    identityStep,
    showInputCard,
    isSubmittingStep,
    atStoryEnd,
    canContinueStory,
    inStoryboardStep,
    currentDialogue,
    startStep,
    handleContinueStory,
  ]);

  return (
    <div className="bedroom-scene-container">
      <LoadingScreen isLoading={isLoading} />

      {!isLoading && (
        <>
          <AdaptiveCanvas dpr={[1, 1.25]} quality="auto" shadows>
            <Suspense fallback={null}>
              <PerspectiveCamera
                makeDefault
                position={[2.15, 0.28, 3.4]}
                fov={46}
                near={0.1}
                far={80}
              />

              <ambientLight intensity={0.24} color="#b8d8ff" />
              <hemisphereLight args={["#79cfff", "#071018", 0.38]} />
              <directionalLight
                position={[2.5, 4.5, 3]}
                intensity={0.82}
                color="#d8efff"
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <pointLight position={[4.4, 1.4, 2.4]} intensity={1.2} color="#00bfe8" distance={8} decay={2} />
              <pointLight position={[5.5, 0.2, -1]} intensity={0.7} color="#d7b04a" distance={5} decay={2} />

              <Stars
                radius={50}
                depth={30}
                count={220}
                factor={2}
                saturation={0.5}
                fade
              />

              <BedroomModel scale={1} position={[0, -1.5, 0]} />
              <DustMotes />

              <group
                ref={charRef}
                position={[
                  SPACEMAN_SLEEP_POSITION.x,
                  SPACEMAN_SLEEP_POSITION.y,
                  SPACEMAN_SLEEP_POSITION.z,
                ]}
                rotation={[-0.96, 0.08, 4.72]}
                scale={1.1}
              >
                {character === "pink" ? (
                  <SpacemanPink
                    scale={0.2}
                    motion={spacemanMotion}
                    motionProgressRef={wakeProgressRef}
                    suitColor={resolvedSpacemanSuitColor}
                    hatId={spacemanHat}
                    onMotionCue={handleSpacemanMotionCue}
                  />
                ) : (
                  <SpacemanWhite
                    scale={0.2}
                    motion={spacemanMotion}
                    motionProgressRef={wakeProgressRef}
                    suitColor={resolvedSpacemanSuitColor}
                    hatId={spacemanHat}
                    onMotionCue={handleSpacemanMotionCue}
                  />
                )}
              </group>

              <group
                ref={robotRef}
                position={[3.5, -0.95, 0.02]}
                scale={0.001}
              >
                <Robot
                  scale={0.92}
                  isSpeaking={activeSpeaker === "robot" && isActiveSpeech}
                />
              </group>

              <CameraAnimator
                phase={dialoguePhase}
                activeSpeaker={activeSpeaker}
                showInputCard={showInputCard}
                identityStep={identityStep}
              />

              <SpacemanAnimator
                phase={dialoguePhase}
                charRef={charRef}
                isSpeaking={activeSpeaker === "spaceman" && isActiveSpeech}
                wakeProgressRef={wakeProgressRef}
                onWakeComplete={handleWakeComplete}
              />

              <WakeLighting
                isWaking={isWaking}
                phase={dialoguePhase}
                wakeProgressRef={wakeProgressRef}
              />

              <RobotAnimator
                isActive={dialoguePhase >= 1 && dialoguePhase <= 3}
                phase={dialoguePhase}
                robotRef={robotRef}
                isSpeaking={activeSpeaker === "robot" && isActiveSpeech}
              />

              <SpeakerSpotlight activeSpeaker={activeSpeaker} />
              {dialoguePhase >= 1 && (
                <CharacterGrounding
                  activeSpeaker={activeSpeaker}
                  wakeProgressRef={wakeProgressRef}
                  isWaking={isWaking}
                />
              )}
            </Suspense>
          </AdaptiveCanvas>

          <div
            className={`dialogue-overlay phase-${dialoguePhase}`}
            data-speaker={activeSpeaker ?? "system"}
          >
            <div className="scene-vignette" />
            <div className="scene-grain" />

            <header className="scene-hud-top" aria-label="Mission status">
              <div className="mission-identity">
                <span className="mission-beacon" />
                <div>
                  <span className="mission-eyebrow">CABIN RECOVERY // 01</span>
                  <strong>ORBITAL ACADEMY</strong>
                </div>
              </div>

              <div className="sequence-status">
                <span>IDENTITY LINK</span>
                <div className="sequence-track" aria-hidden="true">
                  {[0, 1, 2, 3].map((step) => (
                    <i
                      key={step}
                      className={dialoguePhase >= step ? "active" : ""}
                    />
                  ))}
                </div>
              </div>
            </header>

            {dialoguePhase < 5 && (
              <div className="playback-controls">
                <button
                  className={`auto-play-toggle ${autoPlay ? "active" : ""}`}
                  data-audio-cue="tab"
                  onClick={() => setAutoPlay((prev) => !prev)}
                  title={autoPlay ? "Auto-play ON" : "Auto-play OFF"}
                >
                  {autoPlay ? "⏸ AUTO" : "▶ AUTO"}
                </button>

                <button
                  className={`skip-dialog-btn ${
                    skipModeActive ? "active" : ""
                  }`}
                  data-audio-cue="tab"
                  onClick={() => {
                    if (skipModeActive) {
                      setSkipModeActive(false);
                    } else {
                      handleSkipDialogue();
                    }
                  }}
                  title="Toggle Fast Mode (skip all dialogues)"
                >
                  {skipModeActive ? "⏩ FAST MODE ON" : "⏭ FAST MODE"}
                </button>
              </div>
            )}

            {dialoguePhase < 3 && currentDialogue && (
              <div
                className={`dialogue-bubble speaker-${activeSpeaker ?? "system"} ${
                  activeSpeaker === "spaceman" ? "pos-right" : "pos-left"
                }`}
                onClick={handleDialogueClick}
                aria-live="polite"
              >
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />

                <div className="dialogue-speaker">
                  <div
                    className={`speaker-avatar ${
                      currentDialogue.speaker === "AI System" ? "system" : "robot"
                    }`}
                  >
                    {currentDialogue.speaker === "AI System" ? "⚠" : "🤖"}
                  </div>

                  <span className="speaker-name">{currentDialogue.speaker}</span>
                  <SoundWaveBars active={isActiveSpeech} />
                </div>

                <p className="dialogue-text">
                  <TypewriterText
                    text={currentDialogue.text}
                    speed={25}
                    skip={skipTyping}
                    onComplete={() => setTypingDone(true)}
                  />
                </p>

                <div
                  className={`dialogue-actions ${
                    canAdvanceDialogue ? "visible" : ""
                  }`}
                >
                  {currentDialogue.buttons.map((button, index) => (
                    <button
                      key={`${button.text}-${index}`}
                      className="dialogue-btn"
                      data-audio-cue="dialogue"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (
                          isTransitioningRef.current ||
                          !canAdvanceDialogue
                        ) {
                          return;
                        }

                        isTransitioningRef.current = true;

                        setTimeout(() => {
                          isTransitioningRef.current = false;
                        }, 300);

                        if (button.action === 3) {
                          setDialoguePhase(3);
                          startStep("intro");
                        } else {
                          setDialoguePhase(button.action as DialoguePhase);
                        }
                      }}
                    >
                      ▸ {button.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dialoguePhase === 3 &&
              inStoryboardStep &&
              !showInputCard &&
              identityStep !== "confirm" && (
                <div
                  className={`dialogue-bubble speaker-${activeSpeaker ?? "system"} ${
                    activeSpeaker === "spaceman" ? "pos-right" : "pos-left"
                  }`}
                  onClick={handleDialogueClick}
                  aria-live="polite"
                >
                  <div className="dialogue-holo-border" />
                  <div className="dialogue-scanline" />

                  <div className="story-chat-log">
                    {storyQueue
                      .slice(0, currentStoryIndex + 1)
                      .map((line, index) => {
                        const isLatest = index === currentStoryIndex;
                        const isRobot = line.speaker === "AI Robot";

                        return (
                          <div
                            key={`line-${identityStep}-${index}`}
                            className={`story-line ${
                              isRobot ? "ai" : "spaceman"
                            } ${line.tone ?? "info"} ${
                              isLatest ? "latest" : ""
                            }`}
                          >
                            <div className="story-line-header">
                              <div
                                className={`speaker-avatar-sm ${
                                  isRobot ? "robot" : "spaceman"
                                }`}
                              >
                                {isRobot ? "🤖" : "👨‍🚀"}
                              </div>

                              <span className="line-speaker">{line.speaker}</span>
                              <SoundWaveBars
                                active={isLatest && isActiveSpeech}
                                small
                              />
                            </div>

                            <span className="line-text">
                              {isLatest ? (
                                <TypewriterText
                                  text={line.text}
                                  speed={22}
                                  skip={skipTyping}
                                  onComplete={() => setTypingDone(true)}
                                />
                              ) : (
                                line.text
                              )}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {identityStep === "intro" && atStoryEnd && !isSubmittingStep && (
                    <div
                      className={`dialogue-actions ${
                        canAdvanceDialogue ? "visible" : ""
                      }`}
                    >
                      <button
                        className="dialogue-btn blue-btn"
                        data-audio-cue="dialogue"
                        onClick={(event) => {
                          event.stopPropagation();

                          if (
                            isTransitioningRef.current ||
                            !canAdvanceDialogue
                          ) {
                            return;
                          }

                          isTransitioningRef.current = true;

                          setTimeout(() => {
                            isTransitioningRef.current = false;
                          }, 300);

                          startStep("name");
                        }}
                      >
                        ▸ Mulai Verifikasi
                      </button>
                    </div>
                  )}

                  {canContinueStory && (
                    <div
                      className={`dialogue-actions ${
                        canAdvanceDialogue ? "visible" : ""
                      }`}
                    >
                      <button
                        className="dialogue-btn"
                        data-audio-cue="dialogue"
                        onClick={(event) => {
                          event.stopPropagation();

                          if (isTransitioningRef.current) return;

                          handleContinueStory();
                        }}
                      >
                        ▸ Lanjut Dialog
                      </button>
                    </div>
                  )}
                </div>
              )}

            {dialoguePhase === 3 && showInputCard && currentStepConfig?.field && (
              <div className="dialogue-bubble pos-center">
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />

                <div className="step-card" onClick={(event) => event.stopPropagation()}>
                  <p className="step-progress">
                    {
                      stepMetadata[
                        currentStepConfig.step as
                          | "name"
                          | "phone"
                          | "school"
                          | "major"
                      ].title
                    }
                  </p>

                  <div className="form-section">
                    <label className="form-label">{currentStepConfig.label}</label>

                    {currentStepConfig.inputType === "select" ? (
                      <select
                        name={currentStepConfig.field}
                        value={formData[currentStepConfig.field]}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        {currentStepConfig.options?.map((option) => (
                          <option
                            key={option.value || "empty"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={currentStepConfig.inputType}
                        name={currentStepConfig.field}
                        value={formData[currentStepConfig.field]}
                        onChange={handleInputChange}
                        placeholder={currentStepConfig.placeholder}
                        className="form-input"
                      />
                    )}
                  </div>

                  {stepError && <p className="inline-error">{stepError}</p>}

                  <button
                    className="send-btn"
                    data-audio-cue="confirm"
                    onClick={handleSendStep}
                  >
                    ▸ KIRIM DATA
                  </button>
                </div>
              </div>
            )}

            {dialoguePhase === 3 && identityStep === "confirm" && (
              <div className="dialogue-bubble pos-center">
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />

                <div className="step-card" onClick={(event) => event.stopPropagation()}>
                  <p className="step-progress">Ringkasan Verifikasi</p>

                  <div className="confirm-summary">
                    <div className="summary-row">
                      <span>Nama Pilot</span>
                      <strong>{formData.name || "-"}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Nomor Telepon</span>
                      <strong>{formData.phone || "-"}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Sekolah / Akademi</span>
                      <strong>{formData.school || "-"}</strong>
                    </div>

                    <div className="summary-row">
                      <span>Jurusan</span>
                      <strong>{formData.major || "-"}</strong>
                    </div>
                  </div>

                  {stepError && <p className="inline-error">{stepError}</p>}

                  <p className="form-hint">
                    AI Robot: "Data sudah lengkap. Satu autentikasi lagi, lalu
                    sistem navigasi kubuka penuh."
                  </p>

                  <div className="dialogue-actions visible">
                    <button
                      className="form-submit"
                      data-audio-cue="confirm"
                      onClick={handleFinalAuthentication}
                    >
                      ⚡ AUTHENTIKASI FINAL
                    </button>

                    <button
                      className="dialogue-btn blue-btn"
                      data-audio-cue="tab"
                      onClick={handleEditData}
                    >
                      ✎ Edit Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {dialoguePhase === 5 && identityStep === "submitted" && (
              <div className="completion-message">
                <div className="completion-glow" />

                <div className="message-content">
                  <h3>✓ AUTENTIKASI BERHASIL</h3>

                  <p>
                    <TypewriterText
                      text={`Selamat datang, Pilot ${formData.name}. Akses sistem telah kubuka penuh. Kita bisa pulang sekarang.`}
                      speed={30}
                    />
                  </p>

                  <div className="hyperspace-bar">
                    <div className="hyperspace-fill" />
                  </div>

                  <p className="message-hint">Menyiapkan rute ke Main Hub...</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Bedroom;
