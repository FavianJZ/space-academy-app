
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

type ActionName = 'Scene'

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName
}

type GLTFResult = {
  nodes: {
    Mouth_Blue_Light_0: THREE.Mesh
    Wave_Blue_Light_0: THREE.Mesh
    Wave002_Blue_Light_0: THREE.Mesh
    Wave001_Blue_Light_0: THREE.Mesh
    Wave003_Blue_Light_0: THREE.Mesh
    Ears_Black_Matt_0: THREE.Mesh
    Eyes_Blue_Light_0: THREE.Mesh
    hANDS_White_Glossy_0: THREE.Mesh
    hANDS002_White_Glossy_0: THREE.Mesh
    Robot_White_Glossy_0: THREE.Mesh
    Robot_Blue_Light_0: THREE.Mesh
    Robot_Black_Matt_0: THREE.Mesh
  }
  materials: {
    Blue_Light: THREE.MeshStandardMaterial
    Black_Matt: THREE.MeshPhysicalMaterial
    White_Glossy: THREE.MeshPhysicalMaterial
  }
  animations: GLTFAction[]
}

type RobotProps = ThreeElements['group'] & {
  isSpeaking?: boolean
}

const MOUTH_BASE_SCALE = 2.881

export function Robot({ isSpeaking = false, ...props }: RobotProps) {
  const group = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Group>(null)
  const leftHandRef = useRef<THREE.Group>(null)
  const rightHandRef = useRef<THREE.Group>(null)
  const { nodes, materials, animations } = useGLTF('/models/robot_optimized.glb') as unknown as GLTFResult
  const { actions } = useAnimations(animations, group)
  
  useEffect(() => {
    actions?.Scene?.play();
  }, [actions]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speakingBlend = isSpeaking ? 1 : 0

    if (mouthRef.current) {
      const mouthOpen = isSpeaking
        ? 1.04 + Math.abs(Math.sin(t * 11.5)) * 0.28
        : 0.98 + Math.sin(t * 2) * 0.015

      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, mouthOpen, isSpeaking ? 0.28 : 0.12)
      mouthRef.current.scale.z = THREE.MathUtils.lerp(
        mouthRef.current.scale.z,
        MOUTH_BASE_SCALE + (isSpeaking ? 0.3 + Math.abs(Math.sin(t * 10.5)) * 0.12 : 0),
        isSpeaking ? 0.22 : 0.08
      )
      mouthRef.current.position.y = THREE.MathUtils.lerp(
        mouthRef.current.position.y,
        -0.504 + (isSpeaking ? Math.sin(t * 12) * 0.02 : Math.sin(t * 1.4) * 0.004),
        0.24
      )
    }

    if (leftHandRef.current) {
      const leftTargetX = 0.723 + (isSpeaking ? Math.sin(t * 3.4) * 0.05 : Math.sin(t * 1.1) * 0.015)
      const leftTargetY = (isSpeaking ? 0.06 : 0.02) + Math.sin(t * (isSpeaking ? 5.2 : 1.6)) * (isSpeaking ? 0.04 : 0.015)
      const leftTargetZ = (isSpeaking ? 0.23 : 0.08) + Math.sin(t * (isSpeaking ? 7.2 : 1.7)) * (0.18 + speakingBlend * 0.08)

      leftHandRef.current.position.x = THREE.MathUtils.lerp(leftHandRef.current.position.x, leftTargetX, 0.18)
      leftHandRef.current.position.y = THREE.MathUtils.lerp(leftHandRef.current.position.y, leftTargetY, 0.18)
      leftHandRef.current.rotation.x = THREE.MathUtils.lerp(leftHandRef.current.rotation.x, isSpeaking ? 0.18 : 0.03, 0.18)
      leftHandRef.current.rotation.z = THREE.MathUtils.lerp(leftHandRef.current.rotation.z, leftTargetZ, 0.18)
    }

    if (rightHandRef.current) {
      const rightTargetX = -0.723 + (isSpeaking ? -Math.sin(t * 3.4) * 0.05 : -Math.sin(t * 1.1) * 0.015)
      const rightTargetY = (isSpeaking ? 0.06 : 0.02) + Math.sin(t * (isSpeaking ? 5.2 : 1.6) + 1.1) * (isSpeaking ? 0.04 : 0.015)
      const rightTargetZ = -Math.PI - (isSpeaking ? 0.23 : 0.08) - Math.sin(t * (isSpeaking ? 7.2 : 1.7)) * (0.18 + speakingBlend * 0.08)

      rightHandRef.current.position.x = THREE.MathUtils.lerp(rightHandRef.current.position.x, rightTargetX, 0.18)
      rightHandRef.current.position.y = THREE.MathUtils.lerp(rightHandRef.current.position.y, rightTargetY, 0.18)
      rightHandRef.current.rotation.x = THREE.MathUtils.lerp(rightHandRef.current.rotation.x, isSpeaking ? -0.14 : -0.02, 0.18)
      rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, rightTargetZ, 0.18)
    }
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <group name="RootNode" scale={0.002}>
          <group name="Robot_Origin" position={[0, 9.763, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <group ref={mouthRef} name="Mouth" position={[0, -0.504, 2.573]} scale={[1, 1, 2.881]}>
              <mesh name="Mouth_Blue_Light_0" geometry={nodes.Mouth_Blue_Light_0.geometry} material={materials.Blue_Light} />
            </group>
            <group name="Wave" position={[0, 0, 0.113]} scale={[1, 1, 0.186]}>
              <mesh name="Wave_Blue_Light_0" geometry={nodes.Wave_Blue_Light_0.geometry} material={materials.Blue_Light} />
            </group>
            <group name="Wave002" position={[0, 0, 0.879]} scale={[1, 1, 0.889]}>
              <mesh name="Wave002_Blue_Light_0" geometry={nodes.Wave002_Blue_Light_0.geometry} material={materials.Blue_Light} />
            </group>
            <group name="Wave001" position={[0, 0, -0.089]} scale={[1, 1, 0.001]}>
              <mesh name="Wave001_Blue_Light_0" geometry={nodes.Wave001_Blue_Light_0.geometry} material={materials.Blue_Light} />
            </group>
            <group name="Wave003" position={[0, 0, 0.511]} scale={[1, 1, 0.552]}>
              <mesh name="Wave003_Blue_Light_0" geometry={nodes.Wave003_Blue_Light_0.geometry} material={materials.Blue_Light} />
            </group>
            <group name="Ears" position={[0, 0, 2.967]}>
              <mesh name="Ears_Black_Matt_0" geometry={nodes.Ears_Black_Matt_0.geometry} material={materials.Black_Matt} />
            </group>
            <group name="Empty" position={[0, -0.06, 2.786]}>
              <group name="Eyes" position={[0, -0.431, 0.076]}>
                <mesh name="Eyes_Blue_Light_0" geometry={nodes.Eyes_Blue_Light_0.geometry} material={materials.Blue_Light} />
              </group>
            </group>
            <group ref={leftHandRef} name="Hand_origin" position={[0.723, 0, 2.015]} rotation={[0, -0.064, 0]}>
              <group name="hANDS" position={[-0.723, 0, -1.963]}>
                <mesh name="hANDS_White_Glossy_0" geometry={nodes.hANDS_White_Glossy_0.geometry} material={materials.White_Glossy} />
              </group>
            </group>
            <group ref={rightHandRef} name="Hand_origin002" position={[-0.723, 0, 2.015]} rotation={[0, 0.064, -Math.PI]}>
              <group name="hANDS002" position={[-0.723, 0, -1.963]}>
                <mesh name="hANDS002_White_Glossy_0" geometry={nodes.hANDS002_White_Glossy_0.geometry} material={materials.White_Glossy} />
              </group>
            </group>
            <group name="Robot" position={[0, 0, 0.051]}>
              <mesh name="Robot_White_Glossy_0" geometry={nodes.Robot_White_Glossy_0.geometry} material={materials.White_Glossy} />
              <mesh name="Robot_Blue_Light_0" geometry={nodes.Robot_Blue_Light_0.geometry} material={materials.Blue_Light} />
              <mesh name="Robot_Black_Matt_0" geometry={nodes.Robot_Black_Matt_0.geometry} material={materials.Black_Matt} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload('/models/robot_optimized.glb')
