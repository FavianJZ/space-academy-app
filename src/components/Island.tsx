import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

export function Island(props: ThreeElements['group']) {
  const { scene } = useGLTF('/models/island_1.glb')
  
  return (
    <group {...props} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/island_1.glb')
