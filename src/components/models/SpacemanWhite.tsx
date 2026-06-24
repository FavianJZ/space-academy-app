
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    Cube011_Material001_0: THREE.Mesh
    Cube012_Material002_0: THREE.Mesh
    Cube020_Material005_0: THREE.Mesh
    Cylinder002_Material003_0: THREE.Mesh
  }
  materials: {
    PaletteMaterial001: THREE.MeshPhysicalMaterial
    PaletteMaterial002: THREE.MeshPhysicalMaterial
    PaletteMaterial003: THREE.MeshStandardMaterial
    PaletteMaterial004: THREE.MeshPhysicalMaterial
  }
  animations: any[]
}

export function SpacemanWhite(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/spaceman_white_optimized.glb') as unknown as GLTFResult

  return (
    <group {...props} dispose={null}>
      <mesh 
        geometry={nodes.Cube011_Material001_0.geometry} 
        material={materials.PaletteMaterial001} 
        position={[-0.405, 2.52, -0.44]} 
        rotation={[-Math.PI, -0.972, -Math.PI]} 
        scale={0.015} 
      />
      <mesh 
        geometry={nodes.Cube012_Material002_0.geometry} 
        material={materials.PaletteMaterial002} 
        position={[-0.428, 2.52, -0.41]} 
        rotation={[-Math.PI, -0.972, -Math.PI]} 
        scale={[0.018, 0.0165, 0.018]} 
      />
      <mesh 
        geometry={nodes.Cube020_Material005_0.geometry} 
        material={materials.PaletteMaterial003} 
        position={[0.238, 1.097, -1.392]} 
        rotation={[-Math.PI, -0.972, -Math.PI]} 
        scale={[0.006, 0.012, 0.0135]} 
      />
      <mesh 
        geometry={nodes.Cylinder002_Material003_0.geometry} 
        material={materials.PaletteMaterial004} 
        position={[0.627, 1.9, -0.927]} 
        rotation={[-Math.PI, -0.972, -Math.PI]} 
        scale={0.015} 
      />
    </group>
  )
}

useGLTF.preload('/models/spaceman_white_optimized.glb')
