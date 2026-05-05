import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

export function Planet(props: ThreeElements['group']) {
  const { scene } = useGLTF('/models/planet_1_optimized.glb')
  
  return (
    <group {...props} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/planet_1_optimized.glb')
