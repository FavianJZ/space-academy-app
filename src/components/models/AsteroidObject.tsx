import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidObjectProps {
  visible: boolean;
  isAnimating: boolean;
}

export const AsteroidObject: React.FC<AsteroidObjectProps> = ({
  visible,
  isAnimating,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !visible || !isAnimating) return;

    groupRef.current.position.x -= 1.5; 
    groupRef.current.position.y -= 1.2; 
    groupRef.current.position.z -= 8.0; 

    groupRef.current.rotation.x -= 0.02;
    groupRef.current.rotation.y += 0.03;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[150, 120, 800]}>
      {}
      <ambientLight intensity={0.5} color={0xffffff} />
      <directionalLight position={[-1, 1, 1]} intensity={0.8} />
      
      {}
      <mesh>
        <dodecahedronGeometry args={[80, 0]} />
        <meshStandardMaterial
          color={'#4a3c31'}
          roughness={0.8}
          metalness={0.2}
          flatShading={true}
        />
      </mesh>
    </group>
  );
};

export default AsteroidObject;
