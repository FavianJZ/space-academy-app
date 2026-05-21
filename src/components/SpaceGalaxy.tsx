
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    Object_2: THREE.Points
  }
  materials: {
    ['Scene_-_Root']: THREE.PointsMaterial
  }
  animations: any[]
}

export function SpaceGalaxy(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/space_galaxy_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <points geometry={nodes.Object_2.geometry} material={materials['Scene_-_Root']} rotation={[-Math.PI / 2, 0, 0]} scale={0.013} />
    </group>
  )
}

useGLTF.preload('/models/space_galaxy_optimized.glb')
