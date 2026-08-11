import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SpacemanPinkProps } from "../../components/models/SpacemanPink";
import type { SpacemanHatId } from "../../types/customization.types";

type AvatarCharacterModelProps = {
  CharacterModel: React.ComponentType<SpacemanPinkProps>;
  suitColor?: string;
  hatId?: SpacemanHatId;
  modelScale?: number;
  modelPosition?: [number, number, number];
  rotationSpeed?: number;
  floatAmplitude?: number;
};

const AvatarCharacterModel: React.FC<AvatarCharacterModelProps> = ({
  CharacterModel,
  suitColor,
  hatId = "none",
  modelScale = 0.7,
  modelPosition = [0, -1.8, 0],
  rotationSpeed = 0.5,
  floatAmplitude = 0.08,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const elapsedTime = state.clock.getElapsedTime();

    groupRef.current.rotation.y = elapsedTime * rotationSpeed;
    groupRef.current.position.y =
      Math.sin(elapsedTime * 1.5) * floatAmplitude;
  });

  return (
    <group ref={groupRef}>
      <CharacterModel
        scale={modelScale}
        position={modelPosition}
        motion="idle"
        suitColor={suitColor}
        hatId={hatId}
      />
    </group>
  );
};

export default AvatarCharacterModel;
