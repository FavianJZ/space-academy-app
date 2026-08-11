import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

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

export interface BossUFOProps {
  hp: number;
  maxHP: number;
  hitFlash?: boolean;
  position?: [number, number, number];
  scale?: number;
}

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
  const ufoMeshRefs = useRef<Array<THREE.SkinnedMesh | null>>([]);

  const { scene, animations } = useGLTF('/models/ufo_optimized.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { actions } = useAnimations(animations, groupRef);

  const hpRatio = maxHP > 0 ? hp / maxHP : 0;

  const emissiveColor = useMemo(() => {
    if (hpRatio > 0.6) return new THREE.Color('#00ff88');
    if (hpRatio > 0.3) return new THREE.Color('#ffaa00');
    return new THREE.Color('#ff3333');
  }, [hpRatio]);

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

  useEffect(() => {
    if (hitFlash) hitFlashRef.current = 1;
  }, [hitFlash]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3;

    groupRef.current.rotation.y += delta * 0.4;

    if (hpRatio < 0.3) {
      groupRef.current.rotation.z = Math.sin(t * 4) * 0.06;
      groupRef.current.rotation.x = Math.cos(t * 3) * 0.04;
    } else {
      groupRef.current.rotation.z *= 0.95;
      groupRef.current.rotation.x *= 0.95;
    }

    if (hitFlashRef.current > 0) {
      hitFlashRef.current = Math.max(0, hitFlashRef.current - delta * 4);
    }

    const flashIntensity = hitFlashRef.current;
    for (const mesh of ufoMeshRefs.current) {
      if (!mesh) continue;

      const meshMaterials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const material of meshMaterials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;

        material.emissiveIntensity = 0.3 + flashIntensity * 2.5;
        if (flashIntensity > 0.5) {
          material.emissive.setRGB(1, 1, 1);
        } else {
          material.emissive.copy(emissiveColor);
        }
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 2;
      const pulse = 1 + Math.sin(t * 3) * 0.12;
      ringRef.current.scale.setScalar(pulse);
    }

    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.1 + Math.sin(t * 2) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <group scale={1.21}>
        <primitive object={nodes.GLTF_created_0_rootJoint} />
        <skinnedMesh
          ref={(mesh) => {
            ufoMeshRefs.current[0] = mesh;
          }}
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.PaletteMaterial001}
          skeleton={nodes.Object_7.skeleton}
        />
        <skinnedMesh
          ref={(mesh) => {
            ufoMeshRefs.current[1] = mesh;
          }}
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.PaletteMaterial001}
          skeleton={nodes.Object_8.skeleton}
        />
        <skinnedMesh
          ref={(mesh) => {
            ufoMeshRefs.current[2] = mesh;
          }}
          name="Object_9"
          geometry={nodes.Object_9.geometry}
          material={materials.PaletteMaterial002}
          skeleton={nodes.Object_9.skeleton}
        />
        <skinnedMesh
          ref={(mesh) => {
            ufoMeshRefs.current[3] = mesh;
          }}
          name="Object_10"
          geometry={nodes.Object_10.geometry}
          material={materials.PaletteMaterial003}
          skeleton={nodes.Object_10.skeleton}
        />
        <skinnedMesh
          ref={(mesh) => {
            ufoMeshRefs.current[4] = mesh;
          }}
          name="Object_11"
          geometry={nodes.Object_11.geometry}
          material={materials.PaletteMaterial004}
          skeleton={nodes.Object_11.skeleton}
        />
      </group>

      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.8, 0.04, 8, 48]} />
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

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

      <pointLight color={emissiveColor} intensity={3} distance={8} />
    </group>
  );
};

useGLTF.preload('/models/ufo_optimized.glb');
