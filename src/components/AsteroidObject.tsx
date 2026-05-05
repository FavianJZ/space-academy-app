import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidObjectProps {
  visible: boolean;
  isAnimating: boolean;
}

/**
 * AsteroidObject - Large asteroid that approaches during crash sequence
 */
export const AsteroidObject: React.FC<AsteroidObjectProps> = ({
  visible,
  isAnimating,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !visible || !isAnimating) return;

    // Asteroid bergerak mendekat ke kamera dengan kecepatan tinggi
    groupRef.current.position.x -= 1.5; // Bergeser ke kiri
    groupRef.current.position.y -= 1.2; // Bergeser ke bawah
    groupRef.current.position.z -= 8.0; // Mendekat SANGAT CEPAT

    // Rotasi asteroid yang mengerikan
    groupRef.current.rotation.x -= 0.02;
    groupRef.current.rotation.y += 0.03;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[150, 120, 800]}>
      {/* Illuminate the asteroid slightly so its color and flat planes are visible */}
      <ambientLight intensity={0.5} color={0xffffff} />
      <directionalLight position={[-1, 1, 1]} intensity={0.8} />
      
      {/* Asteroid low-poly dodecahedron */}
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
