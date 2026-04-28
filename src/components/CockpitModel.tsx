import React, { useMemo } from 'react';
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

  const cockpit = useMemo(() => {
    const scene = gltf.scene.clone();

    // Apply cockpit-friendly materials that respond to the new interior lighting
    scene.traverse((child: any) => {
    if (child instanceof THREE.Mesh) {
      const namePart = child.name.toLowerCase();
      child.castShadow = true;
      child.receiveShadow = true;

      let material: THREE.Material = new THREE.MeshStandardMaterial({
        color: 0x7a8290,
        roughness: 0.88,
        metalness: 0.06,
        emissive: 0x05070a,
        emissiveIntensity: 0.1,
        flatShading: true,
      });

      // Hide glass
      if (namePart.includes('glass')) {
        child.visible = false;
        return;
      }

      // Dark cockpit controls
      if (
        namePart.includes('handle') ||
        namePart.includes('ball') ||
        namePart.includes('trigger') ||
        namePart.includes('button') ||
        namePart.includes('base') ||
        namePart.includes('control') ||
        namePart.includes('switch')
      ) {
        material = new THREE.MeshStandardMaterial({
          color: 0x1d2128,
          roughness: 0.95,
          metalness: 0.04,
          emissive: 0x050608,
          emissiveIntensity: 0.16,
          flatShading: true,
        });
      }

      // Emissive screens (Neon Green - Matrix effect)
      if (
        namePart.includes('screen') ||
        namePart.includes('monitor') ||
        namePart.includes('display') ||
        namePart.includes('emmissive') ||
        namePart.includes('panel') ||
        namePart.includes('indicator') ||
        namePart.includes('hud')
      ) {
        material = new THREE.MeshStandardMaterial({
          color: 0x163b1b,
          roughness: 0.25,
          metalness: 0.08,
          emissive: 0x39ff14,
          emissiveIntensity: 2.1,
          flatShading: true,
        });
      }

      // Frame and structure - keep lambert material for shading
      if (
        namePart.includes('frame') ||
        namePart.includes('structure') ||
        namePart.includes('canopy') ||
        namePart.includes('shell')
      ) {
        material = new THREE.MeshStandardMaterial({
          color: 0x0f1318,
          roughness: 0.82,
          metalness: 0.08,
          emissive: 0x020408,
          emissiveIntensity: 0.08,
          flatShading: true,
        });
      }

      // Cockpit seat (gray)
      if (
        namePart.includes('seat') ||
        namePart.includes('back') ||
        namePart.includes('headrest') ||
        namePart.includes('armrest') ||
        namePart.includes('cushion')
      ) {
        material = new THREE.MeshStandardMaterial({
          color: 0x444b55,
          roughness: 0.9,
          metalness: 0.03,
          emissive: 0x050608,
          emissiveIntensity: 0.1,
          flatShading: true,
        });
      }

      child.material = material;
    }
    });

    return scene;
  }, [gltf.scene]);

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
