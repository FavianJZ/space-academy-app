
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type GLTFResult = {
  nodes: {
    Door_Door_0: THREE.Mesh
    Door_Detail_Door_Detail_0: THREE.Mesh
    Door_Detail_Light_0: THREE.Mesh
    Wall_Wall_0: THREE.Mesh
    Window_Window_0: THREE.Mesh
    Table_Table_0: THREE.Mesh
    Hologram_Emitter_Projector_0: THREE.Mesh
    Hologram_Emitter_Emitter_0: THREE.Mesh
    Keyboard_Keyboard_0: THREE.Mesh
    Screen_Screen_0: THREE.Mesh
    Speaker_Cab_Speaker_Cab_0: THREE.Mesh
    Speaker_Speaker_0: THREE.Mesh
    Door001_Door_Entrance_0: THREE.Mesh
    Sink_Base_Sink_Base_0: THREE.Mesh
    Sink_Sink_0: THREE.Mesh
    Faucet_Faucet_0: THREE.Mesh
    Tap_Interface_Tap_interface_0: THREE.Mesh
    Bookshelf_Book_Shelf_0: THREE.Mesh
    Bookshelf_Panel_Bookshelf_Panel_0: THREE.Mesh
    Data_Disk007_Data_Disk_Main_0: THREE.Mesh
    Drawer_Chest_Drawer_Chest_0: THREE.Mesh
    Drawer_Drawer_0: THREE.Mesh
    Floor_Panel_Floor_Detail_End_0: THREE.Mesh
    Floor_Panel001_Floor_Detail_Mid_0: THREE.Mesh
    Floor_Panel005_Floor_Main_0: THREE.Mesh
    Bed_Base_Bed_Base_0: THREE.Mesh
    Matress_Matress_0: THREE.Mesh
    Bed_Ceiling_Bed_Ceiling_0: THREE.Mesh
    Mirror_Face_Mirror_Face_0: THREE.Mesh
    Mirror_Frame_Mirror_Frame_0: THREE.Mesh
    Pillow_Pillow_0: THREE.Mesh
    Blanket_Blanket_0: THREE.Mesh
    Corner_Piece_Corner_Piece_0: THREE.Mesh
    Upper_Vent_Bridge_Upper_Vent_Bridge_0: THREE.Mesh
    Upper_vent_Upper_Vent_0: THREE.Mesh
    Wall_Panel_Panel_0: THREE.Mesh
    Clock_Projector001_Clock_Projector_0: THREE.Mesh
    Clock_Interface_Clock_Interface_0: THREE.Mesh
    Wall_Vent_Frame_Vent_Frame_0: THREE.Mesh
    Wall_Vent_Section_Vent_Section_0: THREE.Mesh
    Wall_Panel002_Panel_02_0: THREE.Mesh
    Door_Viewer_Door_Viewer_0: THREE.Mesh
    Door_Viewer_Screen_Door_Screen_0: THREE.Mesh
    Door_Screen_Interface_Door_Viewer_Interface_0: THREE.Mesh
    Door_Interface002_Door_Interface_0: THREE.Mesh
    Outer_Corner_Piece_Outer_Corner_Piece_0: THREE.Mesh
  }
  materials: {
    Door: THREE.MeshStandardMaterial
    Door_Detail: THREE.MeshStandardMaterial
    PaletteMaterial001: THREE.MeshStandardMaterial
    Wall: THREE.MeshStandardMaterial
    Window: THREE.MeshStandardMaterial
    Table: THREE.MeshStandardMaterial
    Projector: THREE.MeshStandardMaterial
    PaletteMaterial002: THREE.MeshStandardMaterial
    Keyboard: THREE.MeshStandardMaterial
    Screen: THREE.MeshStandardMaterial
    Speaker_Cab: THREE.MeshStandardMaterial
    Speaker: THREE.MeshStandardMaterial
    Door_Entrance: THREE.MeshStandardMaterial
    Sink_Base: THREE.MeshStandardMaterial
    Sink: THREE.MeshStandardMaterial
    Faucet: THREE.MeshStandardMaterial
    Tap_interface: THREE.MeshStandardMaterial
    Book_Shelf: THREE.MeshStandardMaterial
    Bookshelf_Panel: THREE.MeshStandardMaterial
    Data_Disk_Main: THREE.MeshStandardMaterial
    Drawer_Chest: THREE.MeshStandardMaterial
    Drawer: THREE.MeshStandardMaterial
    Floor_Detail_End: THREE.MeshStandardMaterial
    Floor_Detail_Mid: THREE.MeshStandardMaterial
    Floor_Main: THREE.MeshStandardMaterial
    Bed_Base: THREE.MeshStandardMaterial
    Matress: THREE.MeshStandardMaterial
    Bed_Ceiling: THREE.MeshStandardMaterial
    PaletteMaterial003: THREE.MeshStandardMaterial
    Mirror_Frame: THREE.MeshStandardMaterial
    Pillow: THREE.MeshStandardMaterial
    Blanket: THREE.MeshStandardMaterial
    Corner_Piece: THREE.MeshStandardMaterial
    Upper_Vent_Bridge: THREE.MeshStandardMaterial
    Upper_Vent: THREE.MeshStandardMaterial
    Panel: THREE.MeshStandardMaterial
    Clock_Projector: THREE.MeshStandardMaterial
    Clock_Interface: THREE.MeshStandardMaterial
    Vent_Frame: THREE.MeshStandardMaterial
    Vent_Section: THREE.MeshStandardMaterial
    Panel_02: THREE.MeshStandardMaterial
    Door_Viewer: THREE.MeshStandardMaterial
    Door_Screen: THREE.MeshStandardMaterial
    Door_Viewer_Interface: THREE.MeshStandardMaterial
    Door_Interface: THREE.MeshStandardMaterial
    Outer_Corner_Piece: THREE.MeshStandardMaterial
  }
  animations: any[]
}

export function BedroomModel(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/bedroom_optimized.glb') as unknown as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Door_Door_0.geometry} material={materials.Door} position={[-1, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Door_Detail_Door_Detail_0.geometry} material={materials.Door_Detail} position={[-1, 1, 0.05]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Door_Detail_Light_0.geometry} material={materials.PaletteMaterial001} position={[-1, 1, 0.05]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Wall_Wall_0.geometry} material={materials.Wall} position={[1, 0, -2]} />
      <mesh geometry={nodes.Window_Window_0.geometry} material={materials.Window} position={[6, 1.25, 2]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} />
      <mesh geometry={nodes.Table_Table_0.geometry} material={materials.Table} position={[4.862, 0, 3.504]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Hologram_Emitter_Projector_0.geometry} material={materials.Projector} position={[4.862, 0.755, 3.257]} rotation={[-Math.PI / 2, 0, 0]} scale={0.127} />
      <mesh geometry={nodes.Hologram_Emitter_Emitter_0.geometry} material={materials.PaletteMaterial002} position={[4.862, 0.755, 3.257]} rotation={[-Math.PI / 2, 0, 0]} scale={0.127} />
      <mesh geometry={nodes.Keyboard_Keyboard_0.geometry} material={materials.Keyboard} position={[4.862, 0.889, 3.242]} rotation={[-2.007, 0, 0]} scale={0.127} />
      <mesh geometry={nodes.Screen_Screen_0.geometry} material={materials.Screen} position={[4.862, 1.443, 3.759]} rotation={[Math.PI, 0, 0]} scale={0.1} />
      <mesh geometry={nodes.Speaker_Cab_Speaker_Cab_0.geometry} material={materials.Speaker_Cab} position={[5.438, 0.755, 3.649]} rotation={[-Math.PI / 2, 0, 0.192]} scale={0.227} />
      <mesh geometry={nodes.Speaker_Speaker_0.geometry} material={materials.Speaker} position={[5.536, 0.836, 3.523]} rotation={[0, 0.192, 0]} scale={0.065} />
      <mesh geometry={nodes.Door001_Door_Entrance_0.geometry} material={materials.Door_Entrance} position={[-4, 0, 1.025]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
      <mesh geometry={nodes.Sink_Base_Sink_Base_0.geometry} material={materials.Sink_Base} position={[1.538, 0, 3.4]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Sink_Sink_0.geometry} material={materials.Sink} position={[1.538, 1, 3.428]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.043, 1.078, 1.043]} />
      <mesh geometry={nodes.Faucet_Faucet_0.geometry} material={materials.Faucet} position={[1.538, 1, 3.859]} rotation={[-Math.PI / 2, 0, 0]} scale={0.688} />
      <mesh geometry={nodes.Tap_Interface_Tap_interface_0.geometry} material={materials.Tap_interface} position={[1.538, 1.526, 3.859]} rotation={[Math.PI, 0, 0]} scale={0.283} />
      <mesh geometry={nodes.Bookshelf_Book_Shelf_0.geometry} material={materials.Book_Shelf} position={[3.388, 0, 3.63]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Bookshelf_Panel_Bookshelf_Panel_0.geometry} material={materials.Bookshelf_Panel} position={[3.388, 1, 3.615]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Data_Disk007_Data_Disk_Main_0.geometry} material={materials.Data_Disk_Main} position={[3.408, 0.059, 3.615]} rotation={[-Math.PI / 2, 0, 0]} scale={0.1} />
      <mesh geometry={nodes.Drawer_Chest_Drawer_Chest_0.geometry} material={materials.Drawer_Chest} position={[1.261, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Drawer_Drawer_0.geometry} material={materials.Drawer} position={[1.261, 0.163, -1.1]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Floor_Panel_Floor_Detail_End_0.geometry} material={materials.Floor_Detail_End} position={[-3, 0, 1]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} />
      <mesh geometry={nodes.Floor_Panel001_Floor_Detail_Mid_0.geometry} material={materials.Floor_Detail_Mid} position={[-1, 0, 1]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
      <mesh geometry={nodes.Floor_Panel005_Floor_Main_0.geometry} material={materials.Floor_Main} position={[5, 0, -1]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
      <mesh geometry={nodes.Bed_Base_Bed_Base_0.geometry} material={materials.Bed_Base} position={[5.003, 0.3, -1.491]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Matress_Matress_0.geometry} material={materials.Matress} position={[5.003, 0.45, -1.491]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Bed_Ceiling_Bed_Ceiling_0.geometry} material={materials.Bed_Ceiling} position={[5.003, 1.8, -1.491]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Mirror_Face_Mirror_Face_0.geometry} material={materials.PaletteMaterial003} position={[3, 1.09, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={1.037} />
      <mesh geometry={nodes.Mirror_Frame_Mirror_Frame_0.geometry} material={materials.Mirror_Frame} position={[3, 1.09, -2]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Pillow_Pillow_0.geometry} material={materials.Pillow} position={[5.736, 0.6, -1.491]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} scale={0.101} />
      <mesh geometry={nodes.Blanket_Blanket_0.geometry} material={materials.Blanket} position={[4.793, 0.619, -1.496]} rotation={[-Math.PI / 2, 0, 0]} scale={0.896} />
      <mesh geometry={nodes.Corner_Piece_Corner_Piece_0.geometry} material={materials.Corner_Piece} position={[-4, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} scale={0.115} />
      <mesh geometry={nodes.Upper_Vent_Bridge_Upper_Vent_Bridge_0.geometry} material={materials.Upper_Vent_Bridge} position={[2.092, 2.185, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={0.315} />
      <mesh geometry={nodes.Upper_vent_Upper_Vent_0.geometry} material={materials.Upper_Vent} position={[2.092, 2.273, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={0.315} />
      <mesh geometry={nodes.Wall_Panel_Panel_0.geometry} material={materials.Panel} position={[0.752, 1.567, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={0.181} />
      <mesh geometry={nodes.Clock_Projector001_Clock_Projector_0.geometry} material={materials.Clock_Projector} position={[1.837, 1.435, -2.001]} rotation={[-Math.PI / 2, 0, 0]} scale={0.186} />
      <mesh geometry={nodes.Clock_Interface_Clock_Interface_0.geometry} material={materials.Clock_Interface} position={[1.837, 1.435, -1.937]} scale={0.317} />
      <mesh geometry={nodes.Wall_Vent_Frame_Vent_Frame_0.geometry} material={materials.Vent_Frame} position={[6, 2.093, -0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={0.234} />
      <mesh geometry={nodes.Wall_Vent_Section_Vent_Section_0.geometry} material={materials.Vent_Section} position={[5.985, 2.093, -0.5]} rotation={[-Math.PI / 2, -Math.PI / 4, 0]} scale={0.234} />
      <mesh geometry={nodes.Wall_Panel002_Panel_02_0.geometry} material={materials.Panel_02} position={[-3, 1.278, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.181} />
      <mesh geometry={nodes.Door_Viewer_Door_Viewer_0.geometry} material={materials.Door_Viewer} position={[-3.95, 1.408, 1.025]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Door_Viewer_Screen_Door_Screen_0.geometry} material={materials.Door_Screen} position={[-3.95, 1.408, 1.025]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Door_Screen_Interface_Door_Viewer_Interface_0.geometry} material={materials.Door_Viewer_Interface} position={[-3.938, 1.263, 1.025]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={nodes.Door_Interface002_Door_Interface_0.geometry} material={materials.Door_Interface} position={[-1, 1.096, 0.06]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} />
      <mesh geometry={nodes.Outer_Corner_Piece_Outer_Corner_Piece_0.geometry} material={materials.Outer_Corner_Piece} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/models/bedroom_optimized.glb')
