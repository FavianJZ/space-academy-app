
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    Object_2: THREE.Mesh
  }
  materials: {
    Material: THREE.MeshBasicMaterial
  }
  animations: any[]
}

export function Planet3(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/planet_3_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Object_2.geometry} material={materials.Material} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/planet_3_optimized.glb')
