
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    pPlatonic1_lambert1_0: THREE.Mesh
  }
  materials: {
    lambert1: THREE.MeshStandardMaterial
  }
  animations: any[]
}

export function Planet1(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/planet_1_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.pPlatonic1_lambert1_0.geometry} material={materials.lambert1} />
    </group>
  )
}

useGLTF.preload('/models/planet_1_optimized.glb')
