/*
  BossUFO — GLTF-based UFO boss with raid mechanics.
  Uses the optimized ufo_optimized.glb model (41KB from 773KB, 95% reduction).
  Original: Graphfun (https://sketchfab.com/the_3d_animate_guy)
  License: CC-BY-4.0
  Source: https://sketchfab.com/3d-models/ufo-f7ac46de718a444384a73e953d49997c
*/

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

/* ─── GLTF Types ─── */
type ActionName = 'ArmatureAction.001';

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = {
  nodes: {
    Object_7: THREE.SkinnedMesh;
    Object_8: THREE.SkinnedMesh;
    Object_9: THREE.SkinnedMesh;
    Object_10: THREE.SkinnedMesh;
    Object_11: THREE.SkinnedMesh;
    GLTF_created_0_rootJoint: THREE.Bone;
  };
  materials: {
    PaletteMaterial001: THREE.MeshStandardMaterial;
    PaletteMaterial002: THREE.MeshStandardMaterial;
    PaletteMaterial003: THREE.MeshStandardMaterial;
    PaletteMaterial004: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

/* ─── Props ─── */
export interface BossUFOProps {
  hp: number;
  maxHP: number;
  hitFlash?: boolean;
  position?: [number, number, number];
  scale?: number;
}

/**
 * 3D UFO Boss built from GLTF model with:
 * - Built-in animation playback
 * - HP-reactive emissive tinting (green → yellow → red)
 * - Bobbing, slow rotation
 * - Wobble when critically low HP
 * - Hit flash on damage
 * - Pulsing abduction beam cone
 * - Rim glow ring
 */
export const BossUFO: React.FC<BossUFOProps> = ({
  hp,
  maxHP,
  hitFlash = false,
  position = [0, 3, 0],
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const hitFlashRef = useRef(0);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);

  // Load & clone the GLTF scene (SkeletonUtils for skinned meshes)
  const { scene, animations } = useGLTF('/models/ufo_optimized.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { actions } = useAnimations(animations, groupRef);

  // HP ratio for visual state
  const hpRatio = hp / maxHP;

  // Emissive colour based on HP
  const emissiveColor = useMemo(() => {
    if (hpRatio > 0.6) return new THREE.Color('#00ff88');
    if (hpRatio > 0.3) return new THREE.Color('#ffaa00');
    return new THREE.Color('#ff3333');
  }, [hpRatio]);

  // Play the built-in animation
  useEffect(() => {
    const action = actions?.['ArmatureAction.001'];
    if (action) {
      action.reset().fadeIn(0.3).play();
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions]);

  // Collect all materials once for tinting
  useEffect(() => {
    const mats: THREE.MeshStandardMaterial[] = [];
    const matValues = Object.values(materials) as THREE.MeshStandardMaterial[];
    for (const m of matValues) {
      if (m && m.isMeshStandardMaterial) {
        m.emissive = emissiveColor.clone();
        m.emissiveIntensity = 0.3;
        mats.push(m);
      }
    }
    materialsRef.current = mats;
  }, [materials, emissiveColor]);

  // Handle hitFlash trigger
  if (hitFlash) hitFlashRef.current = 1;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Bobbing motion
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3;

    // Slow rotation
    groupRef.current.rotation.y += delta * 0.4;

    // Wobble when critically damaged
    if (hpRatio < 0.3) {
      groupRef.current.rotation.z = Math.sin(t * 4) * 0.06;
      groupRef.current.rotation.x = Math.cos(t * 3) * 0.04;
    } else {
      groupRef.current.rotation.z *= 0.95;
      groupRef.current.rotation.x *= 0.95;
    }

    // Hit flash decay
    if (hitFlashRef.current > 0) {
      hitFlashRef.current = Math.max(0, hitFlashRef.current - delta * 4);
    }

    // Tint model materials based on hit flash
    const flashIntensity = hitFlashRef.current;
    for (const mat of materialsRef.current) {
      mat.emissiveIntensity = 0.3 + flashIntensity * 2.5;
      if (flashIntensity > 0.5) {
        mat.emissive.setRGB(1, 1, 1); // White flash
      } else {
        mat.emissive.copy(emissiveColor);
      }
    }

    // Ring rotation + pulse
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2;
      const pulse = 1 + Math.sin(t * 3) * 0.12;
      ringRef.current.scale.setScalar(pulse);
    }

    // Beam pulse
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.1 + Math.sin(t * 2) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* ── GLTF UFO Model ── */}
      <group scale={1.21}>
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.PaletteMaterial001}
          skeleton={nodes.Object_7.skeleton}
        />
        <skinnedMesh
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.PaletteMaterial001}
          skeleton={nodes.Object_8.skeleton}
        />
        <skinnedMesh
          name="Object_9"
          geometry={nodes.Object_9.geometry}
          material={materials.PaletteMaterial002}
          skeleton={nodes.Object_9.skeleton}
        />
        <skinnedMesh
          name="Object_10"
          geometry={nodes.Object_10.geometry}
          material={materials.PaletteMaterial003}
          skeleton={nodes.Object_10.skeleton}
        />
        <skinnedMesh
          name="Object_11"
          geometry={nodes.Object_11.geometry}
          material={materials.PaletteMaterial004}
          skeleton={nodes.Object_11.skeleton}
        />
      </group>

      {/* ── Glow ring overlay ── */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 8, 48]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* ── Abduction beam cone ── */}
      <mesh ref={beamRef} position={[0, -2.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2, 4.5, 32, 1, true]} />
        <meshStandardMaterial
          color="#00ff66"
          emissive="#00ff66"
          emissiveIntensity={1}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Ambient glow light ── */}
      <pointLight color={emissiveColor} intensity={3} distance={8} />
    </group>
  );
};

useGLTF.preload('/models/ufo_optimized.glb');
