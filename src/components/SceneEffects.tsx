import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIntroGameState } from '../hooks/useIntroGameState';

interface StarFieldProps {
  count?: number;
}

export const StarField = ({ count = 220 }: StarFieldProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const updateBudgetRef = useRef(0);
  const { state: gameState } = useIntroGameState();

  useEffect(() => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    group.clear();

    const geometry = new THREE.IcosahedronGeometry(8, 0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < count; i++) {
      const star = new THREE.Mesh(geometry, material);

      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      let z = (Math.random() - 0.5) * 2000;

      if (z > -100 && z < 100) {
        z += 400;
      }

      star.position.set(x, y, z);
      star.rotation.x = Math.random() * Math.PI;
      star.rotation.y = Math.random() * Math.PI;

      group.add(star);
    }

    return () => {
      group.clear();
      geometry.dispose();
      material.dispose();
    };
  }, [count]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    updateBudgetRef.current += delta;
    if (updateBudgetRef.current < 1 / 30) return;

    const step = updateBudgetRef.current;
    updateBudgetRef.current = 0;
    const moveStep = gameState.kecepatanWarp * step * 60;

    const group = groupRef.current;
    for (let i = 0; i < group.children.length; i++) {
      const child = group.children[i];
      child.position.z -= moveStep;

      if (child.position.z < -200) {
        child.position.z = 1500;
        child.position.x = (Math.random() - 0.5) * 2000;
        child.position.y = (Math.random() - 0.5) * 2000;
      }
    }
  });

  return <group ref={groupRef} />;
};

interface WarpLinesProps {
  count?: number;
}

export const WarpLines = ({ count = 420 }: WarpLinesProps) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const updateBudgetRef = useRef(0);
  const { state: gameState } = useIntroGameState();

  useEffect(() => {
    if (!geometryRef.current) return;

    const vertices: number[] = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      const lineLength = Math.random() * 20 + 10;

      vertices.push(x, y, z);
      vertices.push(x, y, z + lineLength);
    }

    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3)
    );

    return () => {
      geometryRef.current?.dispose();
    };
  }, [count]);

  useFrame((_, delta) => {
    if (!geometryRef.current || !materialRef.current || !geometryRef.current.attributes.position) return;
    updateBudgetRef.current += delta;
    if (updateBudgetRef.current < 1 / 30) return;

    const step = updateBudgetRef.current;
    updateBudgetRef.current = 0;
    const moveStep = gameState.kecepatanWarp * step * 60;

    const posisiGaris = geometryRef.current.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const indexZ1 = i * 6 + 2;
      const indexZ2 = i * 6 + 5;

      posisiGaris[indexZ1] -= moveStep;
      posisiGaris[indexZ2] -= moveStep;

      if (posisiGaris[indexZ1] < -5) {
        const newZ = 200;
        const panjangGaris = Math.random() * 20 + 10;

        posisiGaris[indexZ1] = newZ;
        posisiGaris[indexZ2] = newZ + panjangGaris;
      }
    }

    geometryRef.current.attributes.position.needsUpdate = true;

    if (gameState.kecepatanWarp > 0.1) {
      materialRef.current.opacity = Math.min(gameState.kecepatanWarp * 0.5, 1);
    } else {
      materialRef.current.opacity = 0;
    }
  });

  return (
    <group>
      <lineSegments>
        <bufferGeometry ref={geometryRef} />
        <lineBasicMaterial
          ref={materialRef}
          color={0xff00ff}
          transparent={true}
          opacity={0}
        />
      </lineSegments>
    </group>
  );
};

export const SceneEffects = () => {
  const { starCount, warpCount } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { starCount: 220, warpCount: 420 };
    }

    const compact = window.matchMedia('(max-width: 900px)').matches;
    return compact
      ? { starCount: 140, warpCount: 240 }
      : { starCount: 220, warpCount: 420 };
  }, []);

  return (
    <>
      <StarField count={starCount} />
      <WarpLines count={warpCount} />
    </>
  );
};

export default SceneEffects;
