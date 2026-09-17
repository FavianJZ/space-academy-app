import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

import { getSpacemanHatOption } from "../../constants/characterCustomization.constants";
import type { SpacemanHatId } from "../../types/customization.types";

type LoadedSpacemanHatProps = {
  hatId: Exclude<SpacemanHatId, "none">;
  targetBone: THREE.Bone;
};

type PreparedHat = {
  attachment: THREE.Group;
};

const LoadedSpacemanHat = ({ hatId, targetBone }: LoadedSpacemanHatProps) => {
  const option = getSpacemanHatOption(hatId);
  const { scene } = useGLTF(option.modelUrl ?? "");

  const preparedHat = useMemo<PreparedHat>(() => {
    const sceneClone = clone(scene);
    const orientedRoot = new THREE.Group();
    const shapeScale = option.shapeScale ?? [1, 1, 1];

    orientedRoot.name = `Headgear_${hatId}`;
    orientedRoot.rotation.set(...option.rotation);
    orientedRoot.scale.set(...shapeScale);
    orientedRoot.add(sceneClone);

    option.partScales?.forEach(({ name, scale }) => {
      const part = sceneClone.getObjectByName(name);
      if (!part) return;

      part.scale.multiply(new THREE.Vector3(...scale));
    });

    sceneClone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      object.castShadow = true;
      object.receiveShadow = true;
    });

    orientedRoot.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(orientedRoot);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const seatRatio = THREE.MathUtils.clamp(option.seatRatio ?? 0, 0, 0.45);
    const centerBias = option.centerBias ?? [0, 0];
    const footprint = Math.max(size.x, size.z);
    const widthScale =
      footprint > Number.EPSILON ? option.targetWidth / footprint : 1;
    const heightScale =
      size.y > Number.EPSILON ? option.maxHeight / size.y : 1;
    const scale = Math.min(widthScale, heightScale);
    const seatY = bounds.min.y + size.y * seatRatio;
    const mountCenterX = center.x + size.x * centerBias[0];
    const mountCenterZ = center.z + size.z * centerBias[1];

    const attachment = new THREE.Group();
    attachment.name = `SpacemanHatAttachment_${hatId}`;
    attachment.position.set(
      option.offset[0] - mountCenterX * scale,
      option.contactY + option.offset[1] - seatY * scale,
      option.offset[2] - mountCenterZ * scale
    );
    attachment.scale.setScalar(scale);
    attachment.userData = {
      attachmentPoint: "Head",
      hatId,
      fit: { scale, seatRatio, centerBias },
    };
    attachment.add(orientedRoot);

    return { attachment };
  }, [hatId, option, scene]);

  useEffect(() => {
    targetBone.add(preparedHat.attachment);

    return () => {
      targetBone.remove(preparedHat.attachment);
    };
  }, [preparedHat, targetBone]);

  return null;
};

export type SpacemanHatProps = {
  hatId: SpacemanHatId;
  targetBone?: THREE.Bone;
};

export const SpacemanHat = ({ hatId, targetBone }: SpacemanHatProps) => {
  if (hatId === "none" || !targetBone) return null;

  return (
    <LoadedSpacemanHat
      key={`${targetBone.uuid}:${hatId}`}
      hatId={hatId}
      targetBone={targetBone}
    />
  );
};
