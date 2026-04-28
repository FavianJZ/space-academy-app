import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Planet(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('/models/planet_1_optimized.glb')
  
  return (
    <group {...props} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/planet_1_optimized.glb')
