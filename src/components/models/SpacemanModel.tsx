import {
  Suspense,
  type MutableRefObject,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import type { SpacemanHatId } from "../../types/customization.types";
import { SpacemanHat } from "./SpacemanHat";

export type SpacemanMotion = "sleep" | "wake" | "idle" | "speaking";
export type SpacemanMotionCue = "confused";

export type SpacemanModelProps = ThreeElements["group"] & {
  modelUrl: string;
  animation?: string;
  autoPlay?: boolean;
  fadeDuration?: number;
  motion?: SpacemanMotion;
  /**
   * External 0..1 progress for the "wake" motion. Supply this when the scene
   * also animates the character's transform, so the limbs and the body move on
   * exactly the same clock. Omit it and the model times the motion itself.
   */
  motionProgressRef?: MutableRefObject<number>;
  suitColor?: string | null;
  hatId?: SpacemanHatId;
  onAnimationsReady?: (animationNames: string[]) => void;
  onMotionCue?: (cue: SpacemanMotionCue) => void;
};

/** Used only when no external progress is supplied. */
const WAKE_FALLBACK_DURATION = 4.8;

type SuitMaterial = {
  material: THREE.MeshStandardMaterial;
  baseColor: THREE.Color;
};

type RigPart = {
  bone: THREE.Bone;
  baseRotation: THREE.Euler;
};

type SpacemanRig = {
  hips?: RigPart;
  spine?: RigPart;
  head?: RigPart;
  armLeft?: RigPart;
  armRight?: RigPart;
  legLeft?: RigPart;
  legRight?: RigPart;
};

const createRigPart = (
  root: THREE.Object3D,
  ...boneNames: string[]
): RigPart | undefined => {
  const object = boneNames
    .map((boneName) => root.getObjectByName(boneName))
    .find((candidate) => candidate instanceof THREE.Bone);
  if (!(object instanceof THREE.Bone)) return undefined;

  return {
    bone: object,
    baseRotation: object.rotation.clone(),
  };
};

const applyBoneRotation = (
  part: RigPart | undefined,
  x: number,
  y: number,
  z: number,
  response: number
) => {
  if (!part) return;

  part.bone.rotation.x = THREE.MathUtils.lerp(
    part.bone.rotation.x,
    part.baseRotation.x + x,
    response
  );
  part.bone.rotation.y = THREE.MathUtils.lerp(
    part.bone.rotation.y,
    part.baseRotation.y + y,
    response
  );
  part.bone.rotation.z = THREE.MathUtils.lerp(
    part.bone.rotation.z,
    part.baseRotation.z + z,
    response
  );
};

const smoothRange = (value: number, start: number, end: number) => {
  return THREE.MathUtils.smootherstep(value, start, end);
};

const isSuitMaterial = (
  material: THREE.Material
): material is THREE.MeshStandardMaterial => {
  return (
    material instanceof THREE.MeshStandardMaterial &&
    /^Material\.001(?:_White)?$/.test(material.name)
  );
};

export function SpacemanModel({
  modelUrl,
  animation,
  autoPlay = false,
  fadeDuration = 0.25,
  motion = "idle",
  motionProgressRef,
  suitColor,
  hatId = "none",
  onAnimationsReady,
  onMotionCue,
  ...groupProps
}: SpacemanModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const previousIdleCycleRef = useRef<number | null>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const { clonedScene, suitMaterials } = useMemo(() => {
    const sceneClone = clone(scene);
    const materialClones = new Map<THREE.Material, THREE.Material>();
    const colorableMaterials: SuitMaterial[] = [];

    sceneClone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const sourceMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      let materialChanged = false;

      const nextMaterials = sourceMaterials.map((material) => {
        if (!isSuitMaterial(material)) return material;

        materialChanged = true;
        const existingClone = materialClones.get(material);

        if (existingClone instanceof THREE.MeshStandardMaterial) {
          return existingClone;
        }

        const materialClone = material.clone();
        materialClones.set(material, materialClone);
        colorableMaterials.push({
          material: materialClone,
          baseColor: material.color.clone(),
        });

        return materialClone;
      });

      if (materialChanged) {
        object.material = Array.isArray(object.material)
          ? nextMaterials
          : nextMaterials[0];
      }
    });

    return {
      clonedScene: sceneClone,
      suitMaterials: colorableMaterials,
    };
  }, [scene]);
  const { actions, names } = useAnimations(animations, rootRef);
  const wakeProgressRef = useRef(0);
  const wakeFinishedRef = useRef(false);

  const rig = useMemo<SpacemanRig>(() => ({
    hips: createRigPart(clonedScene, "Hips"),
    spine: createRigPart(clonedScene, "Spine"),
    head: createRigPart(clonedScene, "Head"),
    armLeft: createRigPart(clonedScene, "ArmL", "Arm.L"),
    armRight: createRigPart(clonedScene, "ArmR", "Arm.R"),
    legLeft: createRigPart(clonedScene, "LegL", "Leg.L"),
    legRight: createRigPart(clonedScene, "LegR", "Leg.R"),
  }), [clonedScene]);

  useEffect(() => {
    clonedScene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    const selectedColor = suitColor ? new THREE.Color(suitColor) : null;

    suitMaterials.forEach(({ material, baseColor }) => {
      material.color.copy(selectedColor ?? baseColor);
    });
  }, [suitColor, suitMaterials]);

  useEffect(() => {
    return () => {
      suitMaterials.forEach(({ material }) => material.dispose());
    };
  }, [suitMaterials]);

  useEffect(() => {
    onAnimationsReady?.(names);
  }, [names, onAnimationsReady]);

  useEffect(() => {
    const animationName = animation ?? (autoPlay ? names[0] : undefined);
    if (!animationName) return;

    const action = actions[animationName];
    if (!action) return;

    action.reset().fadeIn(fadeDuration).play();

    return () => {
      action.fadeOut(fadeDuration);
    };
  }, [actions, animation, autoPlay, fadeDuration, names]);

  useEffect(() => {
    if (motion !== "wake") return;
    wakeProgressRef.current = 0;
    wakeFinishedRef.current = false;
  }, [motion]);

  useEffect(() => {
    previousIdleCycleRef.current = null;
  }, [motion]);

  useFrame(({ clock }, delta) => {
    if (animation || (autoPlay && names.length > 0)) return;

    const time = clock.getElapsedTime();
    const response = 1 - Math.exp(-delta * 9);
    let activeMotion = motion;

    if (motion === "wake") {
      wakeProgressRef.current = motionProgressRef
        ? THREE.MathUtils.clamp(motionProgressRef.current, 0, 1)
        : Math.min(
            1,
            wakeProgressRef.current + delta / WAKE_FALLBACK_DURATION
          );
      wakeFinishedRef.current = wakeProgressRef.current >= 1;
      // The wake pose is authored to land on the idle rest pose, so handing
      // over at the end is seamless.
      if (wakeFinishedRef.current) activeMotion = "idle";
    }

    if (activeMotion === "sleep") {
      const breath = Math.sin(time * 1.35);
      const dreamTwitch = Math.sin(time * 0.55) * Math.sin(time * 2.7);

      applyBoneRotation(rig.hips, 0.02 + breath * 0.012, 0, 0.08, response);
      applyBoneRotation(rig.spine, 0.08 + breath * 0.025, -0.03, -0.1, response);
      applyBoneRotation(rig.head, 0.12 + breath * 0.018, -0.18 + dreamTwitch * 0.035, 0.08, response);
      applyBoneRotation(rig.armLeft, -0.08, -0.04, 0.16 + breath * 0.018, response);
      applyBoneRotation(rig.armRight, 0.08, 0.04, -0.14 - breath * 0.018, response);
      applyBoneRotation(rig.legLeft, 0.1 + breath * 0.01, -0.02, -0.08, response);
      applyBoneRotation(rig.legRight, -0.04, 0.03, 0.12, response);
      return;
    }

    if (activeMotion === "wake") {
      const progress = wakeProgressRef.current;

      // Six beats, in order: stir under the blanket, lift the head off the
      // pillow, push up onto one arm, swing the legs off and sit, sit there
      // groggy for a moment, then stand and settle.
      const stir = smoothRange(progress, 0.02, 0.18);
      const headLift = smoothRange(progress, 0.16, 0.3);
      const pushUp = smoothRange(progress, 0.28, 0.52);
      const seated = smoothRange(progress, 0.44, 0.64);
      const grogginess =
        smoothRange(progress, 0.55, 0.7) *
        (1 - smoothRange(progress, 0.76, 0.87));
      const rising = smoothRange(progress, 0.78, 0.93);
      const settled = smoothRange(progress, 0.9, 1);
      /** Everything carried over from the sleeping pose fades out on standing. */
      const stillDown = 1 - rising;

      // Transient gestures layered on top of the pose blend.
      const armPush = Math.sin(
        THREE.MathUtils.clamp((progress - 0.26) / 0.3, 0, 1) * Math.PI
      );
      const legSwing = Math.sin(
        THREE.MathUtils.clamp((progress - 0.4) / 0.26, 0, 1) * Math.PI
      );
      const headShake =
        Math.sin(
          THREE.MathUtils.clamp((progress - 0.62) / 0.18, 0, 1) * Math.PI * 3
        ) * grogginess;
      const rubHead =
        Math.sin(
          THREE.MathUtils.clamp((progress - 0.58) / 0.28, 0, 1) * Math.PI
        ) * grogginess;
      // Breathing deepens as the character comes round.
      const breath = Math.sin(time * (1.35 + progress * 1.5));
      const overshoot =
        Math.sin(
          THREE.MathUtils.clamp((progress - 0.88) / 0.12, 0, 1) * Math.PI
        ) * 0.6;

      applyBoneRotation(
        rig.hips,
        0.02 + pushUp * 0.16 + grogginess * 0.05 - rising * 0.18,
        -stir * 0.02 * stillDown + headShake * 0.01,
        0.08 * (1 - pushUp) + overshoot * 0.02,
        response
      );
      applyBoneRotation(
        rig.spine,
        0.08 +
          stir * 0.03 +
          pushUp * 0.22 +
          grogginess * 0.16 +
          breath * 0.02 -
          rising * 0.33,
        (-0.03 + headLift * 0.06) * stillDown + headShake * 0.05,
        -0.1 * (1 - pushUp) + overshoot * 0.03,
        response
      );
      applyBoneRotation(
        rig.head,
        0.12 - headLift * 0.34 + grogginess * 0.3 + rising * 0.22 + breath * 0.01,
        (-0.18 + headLift * 0.3 - seated * 0.16) * stillDown + headShake * 0.16,
        0.08 * (1 - headLift) + headShake * 0.05,
        response
      );
      // Left arm pushes into the mattress, then comes up to rub the head.
      applyBoneRotation(
        rig.armLeft,
        -0.08 * stillDown - armPush * 0.52 - rubHead * 0.5,
        -0.04 * stillDown - armPush * 0.1 - rubHead * 0.22,
        0.16 * stillDown + armPush * 0.52 + rubHead * 0.86 + settled * 0.025,
        response
      );
      // Right arm braces on the bed, then hangs.
      applyBoneRotation(
        rig.armRight,
        0.08 * stillDown - armPush * 0.46,
        0.04 * stillDown + armPush * 0.1,
        -0.14 * stillDown - armPush * 0.5 - settled * 0.025,
        response
      );
      // Legs swing off the mattress, hang while seated, then take the weight.
      applyBoneRotation(
        rig.legLeft,
        0.1 + legSwing * 0.3 + seated * 0.62 - rising * 0.72,
        (-0.02 + seated * 0.05) * stillDown,
        -0.08 * (1 - seated) - overshoot * 0.02 - settled * 0.012,
        response
      );
      applyBoneRotation(
        rig.legRight,
        -0.04 + legSwing * 0.24 + seated * 0.58 - rising * 0.54,
        (0.03 - seated * 0.05) * stillDown,
        0.12 * (1 - seated) + overshoot * 0.02 + settled * 0.012,
        response
      );
      return;
    }

    if (activeMotion === "speaking") {
      const breath = Math.sin(time * 2.15);
      const dialogueCycle = time % 7;
      const leftExplain = smoothRange(dialogueCycle, 0.25, 0.8) *
        (1 - smoothRange(dialogueCycle, 1.6, 2.15));
      const rightExplain = smoothRange(dialogueCycle, 1.55, 2.1) *
        (1 - smoothRange(dialogueCycle, 3, 3.55));
      const openEmphasis = smoothRange(dialogueCycle, 3, 3.6) *
        (1 - smoothRange(dialogueCycle, 4.6, 5.2));
      const conclusion = smoothRange(dialogueCycle, 5, 5.45) *
        (1 - smoothRange(dialogueCycle, 6.25, 6.8));
      const verbalBeat = Math.sin(time * 3.65);
      const headTurn = Math.sin(time * 1.3);
      const weightShift = Math.sin(time * 0.82);

      applyBoneRotation(
        rig.hips,
        breath * 0.014 + conclusion * 0.018,
        headTurn * 0.015,
        verbalBeat * 0.014 + weightShift * 0.012,
        response
      );
      applyBoneRotation(
        rig.spine,
        breath * 0.03 - openEmphasis * 0.02 + conclusion * 0.035,
        headTurn * 0.05 + conclusion * 0.035,
        (rightExplain - leftExplain) * 0.045 + weightShift * 0.018,
        response
      );
      applyBoneRotation(
        rig.head,
        verbalBeat * 0.06 - openEmphasis * 0.02 - conclusion * 0.045,
        headTurn * 0.14 + conclusion * 0.08,
        (leftExplain - rightExplain) * 0.04 + weightShift * 0.018,
        response
      );
      applyBoneRotation(
        rig.armLeft,
        -0.04 - leftExplain * 0.16 - openEmphasis * 0.08,
        -0.03 - leftExplain * 0.16 + openEmphasis * 0.04,
        0.04 + leftExplain * 1.02 + openEmphasis * 0.72 + verbalBeat * 0.025,
        response
      );
      applyBoneRotation(
        rig.armRight,
        -0.04 - rightExplain * 0.16 - openEmphasis * 0.08 - conclusion * 0.1,
        0.03 + rightExplain * 0.16 - openEmphasis * 0.04,
        -0.04 - rightExplain * 1.02 - openEmphasis * 0.72 - conclusion * 0.46 - verbalBeat * 0.025,
        response
      );
      applyBoneRotation(
        rig.legLeft,
        weightShift * 0.025 + verbalBeat * 0.01,
        headTurn * 0.008,
        -0.012 - weightShift * 0.018,
        response
      );
      applyBoneRotation(
        rig.legRight,
        -weightShift * 0.025 - verbalBeat * 0.01,
        -headTurn * 0.008,
        0.012 + weightShift * 0.018,
        response
      );
      return;
    }

    const breath = Math.sin(time * 1.25);
    const headTurn = Math.sin(time * 0.62);
    const weightShift = Math.sin(time * 0.72);
    const idleCycle = time % 12;
    const previousIdleCycle = previousIdleCycleRef.current;
    const crossedConfusedCue = previousIdleCycle !== null &&
      (idleCycle >= previousIdleCycle
        ? previousIdleCycle < 3.7 && idleCycle >= 3.7
        : previousIdleCycle < 3.7 || idleCycle >= 3.7);
    previousIdleCycleRef.current = idleCycle;
    if (crossedConfusedCue) onMotionCue?.("confused");
    const puzzledShrug = smoothRange(idleCycle, 3.7, 4.35) *
      (1 - smoothRange(idleCycle, 5.8, 6.5));
    const thoughtfulHand = smoothRange(idleCycle, 6.1, 6.65) *
      (1 - smoothRange(idleCycle, 8, 8.65));
    const toeTap = smoothRange(idleCycle, 8.3, 8.8) *
      (1 - smoothRange(idleCycle, 10.4, 10.9));
    const toeTapBeat = toeTap * (0.5 + Math.sin(time * 5.4) * 0.5);

    applyBoneRotation(
      rig.hips,
      breath * 0.01 + toeTapBeat * 0.012,
      weightShift * 0.012,
      weightShift * 0.022 + puzzledShrug * 0.018,
      response
    );
    applyBoneRotation(
      rig.spine,
      breath * 0.018 - puzzledShrug * 0.025,
      headTurn * 0.016 + thoughtfulHand * 0.035,
      -weightShift * 0.018 - puzzledShrug * 0.05 + thoughtfulHand * 0.025,
      response
    );
    applyBoneRotation(
      rig.head,
      breath * 0.02 + puzzledShrug * 0.02,
      headTurn * 0.085 - thoughtfulHand * 0.08,
      headTurn * 0.018 - puzzledShrug * 0.1 + thoughtfulHand * 0.08,
      response
    );
    applyBoneRotation(
      rig.armLeft,
      breath * 0.01 - puzzledShrug * 0.1,
      -puzzledShrug * 0.06,
      0.025 + puzzledShrug * 0.56 + weightShift * 0.025,
      response
    );
    applyBoneRotation(
      rig.armRight,
      -breath * 0.01 - puzzledShrug * 0.1 - thoughtfulHand * 0.12,
      thoughtfulHand * 0.1,
      -0.025 - puzzledShrug * 0.56 - thoughtfulHand * 0.74 - weightShift * 0.025,
      response
    );
    applyBoneRotation(
      rig.legLeft,
      weightShift * 0.042 - toeTapBeat * 0.012,
      headTurn * 0.01,
      -0.012 - weightShift * 0.028,
      response
    );
    applyBoneRotation(
      rig.legRight,
      -weightShift * 0.042 + toeTapBeat * 0.11,
      -headTurn * 0.01,
      0.012 + weightShift * 0.028 + toeTap * 0.018,
      response
    );
  });

  return (
    <>
      <group ref={rootRef} {...groupProps} dispose={null}>
        <primitive object={clonedScene} />
      </group>
      <Suspense fallback={null}>
        <SpacemanHat hatId={hatId} targetBone={rig.head?.bone} />
      </Suspense>
    </>
  );
}
