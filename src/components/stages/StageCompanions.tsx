import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Robot } from '../Robot';
import { SpacemanWhite } from '../SpacemanWhite';

interface StageCompanionsProps {
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const StageCompanions: React.FC<StageCompanionsProps> = ({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) => {
  const robotRef = useRef<THREE.Group>(null);
  const spacemanRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const targetY = THREE.MathUtils.clamp(state.mouse.x * 0.55, -0.55, 0.55);
    const targetX = THREE.MathUtils.clamp(-state.mouse.y * 0.28, -0.32, 0.32);

    if (robotRef.current) {
      robotRef.current.rotation.y = THREE.MathUtils.lerp(robotRef.current.rotation.y, targetY, 8 * delta);
      robotRef.current.rotation.x = THREE.MathUtils.lerp(robotRef.current.rotation.x, targetX, 7 * delta);
      robotRef.current.position.y = Math.sin(time * 2.2) * 0.08;
    }

    if (spacemanRef.current) {
      spacemanRef.current.rotation.y = THREE.MathUtils.lerp(spacemanRef.current.rotation.y, targetY * 0.82 + 0.18, 6 * delta);
      spacemanRef.current.rotation.x = THREE.MathUtils.lerp(spacemanRef.current.rotation.x, targetX * 0.85, 5 * delta);
      spacemanRef.current.position.y = 0.02 + Math.sin(time * 2.2 + 0.9) * 0.06;
    }
  });

  return (
    <group scale={scale} position={position} rotation={rotation}>
      <group ref={spacemanRef} position={[-1.55, -0.08, 0.25]} rotation={[0, 0.28, 0]}>
        <SpacemanWhite scale={0.85} />
      </group>
      <group ref={robotRef} position={[1.15, 0, 0]}>
        <Robot scale={0.95} />
      </group>
    </group>
  );
};

export default StageCompanions;
