import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type AvatarCharacterModelProps = {
  CharacterModel: React.ComponentType<{
    scale?: number;
    position?: [number, number, number];
  }>;
};

const AvatarCharacterModel: React.FC<AvatarCharacterModelProps> = ({
  CharacterModel,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const elapsedTime = state.clock.getElapsedTime();

    groupRef.current.rotation.y = elapsedTime * 0.5;
    groupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <CharacterModel scale={0.7} position={[0, -1.8, 0]} />
    </group>
  );
};

export default AvatarCharacterModel;