import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface CockpitModelProps {
  visible?: boolean;
  onLoaded?: (model: THREE.Group) => void;
}

/**
 * CockpitModel component - loads and renders the GLTF cockpit model
 */
export const CockpitModel: React.FC<CockpitModelProps> = ({
  visible = true,
  onLoaded,
}) => {
  let gltf;
  try {
    gltf = useGLTF('/models/scene.gltf');
  } catch (error) {
    console.error('Failed to load model:', error);
    return <group />;
  }

  if (!gltf || !gltf.scene) {
    return <group />;
  }

  const cockpit = gltf.scene.clone();

  // Apply cartoon material and effects
  cockpit.traverse((child: any) => {
    if (child instanceof THREE.Mesh) {
      const namePart = child.name.toLowerCase();

      // Apply Lambert material for cartoon look
      child.material = new THREE.MeshLambertMaterial({
        color: 0x888888,
        flatShading: true,
      });

      // Hide glass
      if (namePart.includes('glass')) {
        child.visible = false;
      }

      // Dark cockpit controls
      if (
        namePart.includes('handle') ||
        namePart.includes('ball') ||
        namePart.includes('trigger') ||
        namePart.includes('button') ||
        namePart.includes('base')
      ) {
        (child.material as THREE.MeshLambertMaterial).color.setHex(0x222222);
      }

      // Emissive screens (Neon Green - Matrix effect)
      if (
        namePart.includes('screen') ||
        namePart.includes('monitor') ||
        namePart.includes('display') ||
        namePart.includes('emmissive')
      ) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x39ff14 // Exact neon green from original
        });
        child.material = mat;
      }

      // Frame and structure - keep lambert material for shading
      if (
        namePart.includes('frame') ||
        namePart.includes('structure') ||
        namePart.includes('canopy')
      ) {
        (child.material as THREE.MeshLambertMaterial).color.setHex(0x111111);
      }

      // Cockpit seat (gray)
      if (
        namePart.includes('seat') ||
        namePart.includes('back') ||
        namePart.includes('headrest') ||
        namePart.includes('armrest')
      ) {
        (child.material as THREE.MeshLambertMaterial).color.setHex(0x444444);
      }
    }
  });

  React.useEffect(() => {
    if (onLoaded) {
      onLoaded(cockpit);
    }
  }, [onLoaded]);

  return (
    <group position={[0, 0, 0]} scale={[10, 10, 10]} visible={visible}>
      <primitive object={cockpit} />
    </group>
  );
};

useGLTF.preload('/models/scene.gltf');

export default CockpitModel;
