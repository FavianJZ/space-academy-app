
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    ['Rocket_Ship_01_Material_#28_0']: THREE.Mesh
    ['Rocket_Ship_01_Material_#30_0']: THREE.Mesh
  }
  materials: {
    PaletteMaterial001: THREE.MeshStandardMaterial
    PaletteMaterial002: THREE.MeshStandardMaterial
  }
  animations: any[]
}

export function RocketShip(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/rocket_ship_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes['Rocket_Ship_01_Material_#28_0'].geometry} material={materials.PaletteMaterial001} position={[0.421, 0.421, -0.033]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} scale={0.01} />
      <mesh geometry={nodes['Rocket_Ship_01_Material_#30_0'].geometry} material={materials.PaletteMaterial002} position={[0.421, 0.421, -0.033]} rotation={[-Math.PI / 2, Math.PI / 4, 0]} scale={0.01} />
    </group>
  )
}

useGLTF.preload('/models/rocket_ship_optimized.glb')
