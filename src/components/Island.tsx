import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Island(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('/models/island_1.glb')
  
  return (
    <group {...props} dispose={null}>
      <primitive object={scene.clone()} />
    </group>
  )
}

useGLTF.preload('/models/island_1.glb')
