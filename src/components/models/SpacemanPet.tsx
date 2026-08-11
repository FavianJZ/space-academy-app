import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { getSpacemanPetOption } from "../../constants/characterCustomization.constants";
import type {
  SpacemanPetId,
  SpacemanPetOption,
  SpacemanPetProceduralIdle,
} from "../../types/customization.types";

type LoadedSpacemanPetProps = {
  petId: Exclude<SpacemanPetId, "none">;
  position: readonly [number, number, number];
};

type PreparedPet = {
  companion: THREE.Group;
  animationRoot: THREE.Object3D;
  detailPivots: readonly THREE.Group[];
  pivotHeight: number;
};

const PROCEDURAL_DETAIL_NODES: Partial<
  Record<Exclude<SpacemanPetId, "none">, readonly string[]>
> = {
  "nova-sprite": ["Object_4"],
  "ruby-trunk": ["Object_9"],
  "ember-drake": ["Object_18", "Object_20"],
};

const createCenteredPivot = (
  root: THREE.Object3D,
  objectName: string
): THREE.Group | null => {
  const object = root.getObjectByName(objectName);
  const parent = object?.parent;

  if (!object || !parent) return null;

  root.updateMatrixWorld(true);

  const pivotCenter = new THREE.Box3()
    .setFromObject(object)
    .getCenter(new THREE.Vector3());

  parent.worldToLocal(pivotCenter);

  const pivot = new THREE.Group();
  pivot.name = `${objectName}_ProceduralPivot`;
  pivot.position.copy(pivotCenter);
  parent.add(pivot);
  pivot.updateMatrixWorld(true);
  pivot.attach(object);

  return pivot;
};

const positivePulse = (value: number, sharpness: number): number =>
  Math.pow(Math.max(0, Math.sin(value)), sharpness);

type ProceduralMotionTargets = {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  detailPivots: readonly THREE.Group[];
};

const resetProceduralPose = ({
  root,
  bodyPivot,
  detailPivots,
}: ProceduralMotionTargets) => {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  bodyPivot.rotation.set(0, 0, 0);
  bodyPivot.scale.set(1, 1, 1);

  detailPivots.forEach((pivot) => {
    pivot.rotation.set(0, 0, 0);
    pivot.scale.set(1, 1, 1);
  });
};

const applyProceduralIdle = (
  preset: SpacemanPetProceduralIdle,
  elapsed: number,
  strength: number,
  targets: ProceduralMotionTargets
) => {
  resetProceduralPose(targets);

  const { root, bodyPivot, detailPivots } = targets;

  if (preset === "sprite-hover") {
    const hover = Math.sin(elapsed * 1.72);
    const breath = Math.sin(elapsed * 2.34 + 0.45);
    const scanPulse = positivePulse(elapsed * 0.46 + 0.35, 16);

    root.position.x = Math.sin(elapsed * 0.58) * 0.035 * strength;
    root.position.y =
      (0.105 + hover * 0.055 + scanPulse * 0.075) * strength;
    root.position.z = Math.cos(elapsed * 0.58) * 0.025 * strength;
    root.rotation.y = Math.sin(elapsed * 0.42) * 0.15 * strength;
    root.scale.set(
      1 - breath * 0.012 * strength,
      1 + breath * 0.02 * strength,
      1 - breath * 0.012 * strength
    );
    bodyPivot.rotation.x = Math.cos(elapsed * 0.74) * 0.035 * strength;
    bodyPivot.rotation.z =
      (Math.sin(elapsed * 0.84) * 0.055 + scanPulse * 0.08) * strength;

    const signalFin = detailPivots[0];
    if (signalFin) {
      signalFin.rotation.z =
        (Math.sin(elapsed * 5.6) * 0.085 + scanPulse * 0.13) * strength;
      signalFin.scale.y = 1 + breath * 0.025 * strength;
    }

    return;
  }

  if (preset === "elephant-sway") {
    const breath = Math.sin(elapsed * 1.42);
    const weightShift = Math.sin(elapsed * 0.72);
    const trunkSalute = positivePulse(elapsed * 0.37 + 0.8, 18);

    root.position.x = weightShift * 0.018 * strength;
    root.position.y =
      (0.012 + Math.sin(elapsed * 1.42 - 0.4) * 0.008) * strength;
    root.rotation.y = Math.sin(elapsed * 0.46) * 0.085 * strength;
    root.scale.set(
      1 - breath * 0.008 * strength,
      1 + breath * 0.016 * strength,
      1 - breath * 0.008 * strength
    );
    bodyPivot.rotation.x =
      (Math.sin(elapsed * 0.56) * 0.014 - trunkSalute * 0.045) * strength;
    bodyPivot.rotation.z = weightShift * 0.028 * strength;

    const trunk = detailPivots[0];
    if (trunk) {
      trunk.rotation.x =
        (Math.sin(elapsed * 1.15 + 0.6) * 0.045 + trunkSalute * 0.16) *
        strength;
      trunk.rotation.z = Math.sin(elapsed * 0.9) * 0.028 * strength;
      trunk.scale.y = 1 + trunkSalute * 0.035 * strength;
    }

    return;
  }

  if (preset === "cub-curious") {
    const breath = Math.sin(elapsed * 1.78 + 0.2);
    const listen = Math.sin(elapsed * 0.48);
    const alertBeat = positivePulse(elapsed * 0.41 + 1.1, 20);

    root.position.y =
      (0.009 + Math.sin(elapsed * 1.78 - 0.25) * 0.006) * strength;
    root.rotation.y =
      (Math.sin(elapsed * 0.3) * 0.13 + alertBeat * 0.09) * strength;
    root.scale.set(
      1 - breath * 0.009 * strength + alertBeat * 0.008 * strength,
      1 + breath * 0.017 * strength - alertBeat * 0.025 * strength,
      1 - breath * 0.009 * strength + alertBeat * 0.008 * strength
    );
    bodyPivot.rotation.x =
      (Math.sin(elapsed * 0.68) * 0.018 - alertBeat * 0.045) * strength;
    bodyPivot.rotation.z =
      (listen * 0.052 + alertBeat * 0.035) * strength;

    return;
  }

  const wingBeat = Math.sin(elapsed * 5.15);
  const hover = Math.sin(elapsed * 1.28 + 0.5);
  const bank = Math.sin(elapsed * 0.55);
  const glide = positivePulse(elapsed * 0.31 + 0.9, 12);

  root.position.x = Math.sin(elapsed * 0.47) * 0.042 * strength;
  root.position.y = (0.15 + hover * 0.065 + glide * 0.035) * strength;
  root.position.z = Math.cos(elapsed * 0.47) * 0.028 * strength;
  root.rotation.y = Math.sin(elapsed * 0.34) * 0.14 * strength;
  root.scale.set(
    1 - hover * 0.006 * strength,
    1 + hover * 0.012 * strength,
    1 - hover * 0.006 * strength
  );
  bodyPivot.rotation.x =
    (-0.045 + hover * 0.035 - glide * 0.035) * strength;
  bodyPivot.rotation.z = bank * 0.075 * strength;

  const crest = detailPivots[0];
  if (crest) {
    crest.rotation.z = Math.sin(elapsed * 1.7) * 0.025 * strength;
  }

  const wings = detailPivots[1];
  if (wings) {
    const activeWingBeat = wingBeat * (1 - glide * 0.72);
    wings.rotation.x = activeWingBeat * 0.075 * strength;
    wings.scale.y = 1 + activeWingBeat * 0.045 * strength;
    wings.scale.z = 1 + glide * 0.028 * strength;
  }
};

const resolveAnimationName = (
  availableNames: readonly string[],
  preferredNames: readonly string[] | undefined
): string | null => {
  if (availableNames.length === 0) return null;

  for (const preferredName of preferredNames ?? []) {
    const exactMatch = availableNames.find(
      (name) => name.toLowerCase() === preferredName.toLowerCase()
    );

    if (exactMatch) return exactMatch;

    const partialMatch = availableNames.find((name) =>
      name.toLowerCase().includes(preferredName.toLowerCase())
    );

    if (partialMatch) return partialMatch;
  }

  const idleLikeName = availableNames.find((name) =>
    /idle|stand|rest/i.test(name)
  );

  return idleLikeName ?? availableNames[0];
};

const preparePet = (
  scene: THREE.Group,
  option: SpacemanPetOption,
  petId: Exclude<SpacemanPetId, "none">
): PreparedPet => {
  const sourceNode = option.sourceNodeName
    ? scene.getObjectByName(option.sourceNodeName)
    : scene;
  const companion = new THREE.Group();
  const emptyAnimationRoot = new THREE.Group();

  companion.name = `SpacemanPet_${petId}`;
  companion.userData = { petId, sourceNodeName: option.sourceNodeName };

  if (!sourceNode) {
    companion.add(emptyAnimationRoot);
    return {
      companion,
      animationRoot: emptyAnimationRoot,
      detailPivots: [],
      pivotHeight: 0,
    };
  }

  const sourceClone = clone(sourceNode);
  const orientedRoot = new THREE.Group();

  orientedRoot.rotation.set(...option.rotation);
  orientedRoot.add(sourceClone);

  sourceClone.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;
  });

  orientedRoot.updateMatrixWorld(true);

  const detailPivots = (PROCEDURAL_DETAIL_NODES[petId] ?? [])
    .map((objectName) => createCenteredPivot(sourceClone, objectName))
    .filter((pivot): pivot is THREE.Group => pivot !== null);

  orientedRoot.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(orientedRoot);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z);
  const heightScale =
    size.y > Number.EPSILON ? option.targetHeight / size.y : 1;
  const footprintScale =
    footprint > Number.EPSILON
      ? option.targetFootprint / footprint
      : heightScale;
  const scale = Math.min(heightScale, footprintScale);
  const renderedHeight = size.y * scale;

  companion.position.set(
    option.offset[0] - center.x * scale,
    option.offset[1] - bounds.min.y * scale,
    option.offset[2] - center.z * scale
  );
  companion.scale.setScalar(scale);
  companion.userData = {
    ...companion.userData,
    fit: { scale, footprint, height: size.y },
  };
  companion.add(orientedRoot);

  return {
    companion,
    animationRoot: sourceClone,
    detailPivots,
    pivotHeight: option.offset[1] + renderedHeight * 0.52,
  };
};

const LoadedSpacemanPet = ({ petId, position }: LoadedSpacemanPetProps) => {
  const option = getSpacemanPetOption(petId);
  const motionRootRef = useRef<THREE.Group>(null);
  const bodyPivotRef = useRef<THREE.Group>(null);
  const proceduralStrengthRef = useRef(0);
  const animationStartRef = useRef<number | null>(null);
  const { scene, animations } = useGLTF(option.modelUrl ?? "");
  const preparedPet = useMemo(
    () => preparePet(scene, option, petId),
    [option, petId, scene]
  );
  const { actions, mixer, names } = useAnimations(
    animations,
    preparedPet.animationRoot
  );
  const selectedAnimationName = useMemo(
    () => resolveAnimationName(names, option.preferredAnimationClips),
    [names, option.preferredAnimationClips]
  );

  useFrame(({ clock }, delta) => {
    if (!option.proceduralIdle) return;

    const root = motionRootRef.current;
    const bodyPivot = bodyPivotRef.current;

    if (!root || !bodyPivot) return;

    if (animationStartRef.current === null) {
      animationStartRef.current = clock.elapsedTime;
    }

    proceduralStrengthRef.current = THREE.MathUtils.damp(
      proceduralStrengthRef.current,
      1,
      6.5,
      delta
    );

    applyProceduralIdle(
      option.proceduralIdle,
      clock.elapsedTime - animationStartRef.current,
      proceduralStrengthRef.current,
      {
        root,
        bodyPivot,
        detailPivots: preparedPet.detailPivots,
      }
    );
  });

  useEffect(() => {
    if (!selectedAnimationName) return;

    const action = actions[selectedAnimationName];

    if (!action) return;

    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(option.animationSpeed ?? 1);
    action.setLoop(
      option.animationLoop === "ping-pong"
        ? THREE.LoopPingPong
        : THREE.LoopRepeat,
      Number.POSITIVE_INFINITY
    );
    action.reset().fadeIn(0.22).play();

    return () => {
      action.fadeOut(0.12);
      action.stop();
      mixer.stopAllAction();
    };
  }, [
    actions,
    mixer,
    option.animationLoop,
    option.animationSpeed,
    selectedAnimationName,
  ]);

  return (
    <group position={position}>
      <group ref={motionRootRef}>
        <group ref={bodyPivotRef} position={[0, preparedPet.pivotHeight, 0]}>
          <group position={[0, -preparedPet.pivotHeight, 0]}>
            <primitive
              key={petId}
              object={preparedPet.companion}
              dispose={null}
            />
          </group>
        </group>
      </group>
    </group>
  );
};

export type SpacemanPetProps = {
  petId: SpacemanPetId;
  position?: readonly [number, number, number];
};

export const SpacemanPet = ({
  petId,
  position = [0, 0, 0],
}: SpacemanPetProps) => {
  if (petId === "none") return null;

  return (
    <LoadedSpacemanPet
      key={petId}
      petId={petId}
      position={position}
    />
  );
};
