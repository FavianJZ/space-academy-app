
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    Rock_LowPoly_Rock_LowPoly_0: THREE.Mesh
  }
  materials: {
    Rock_LowPoly: THREE.MeshStandardMaterial
  }
  animations: any[]
}

export function Asteroid(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/asteroid_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Rock_LowPoly_Rock_LowPoly_0.geometry} material={materials.Rock_LowPoly} />
    </group>
  )
}

useGLTF.preload('/models/asteroid_optimized.glb')
