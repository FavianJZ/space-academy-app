import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Robot } from '../Robot';

export type RobotReaction = 'idle' | 'correct' | 'incorrect' | 'celebrating' | 'waving' | 'thinking';

interface InteractiveRobotProps {
  reaction?: RobotReaction;
  scale?: number;
  position?: [number, number, number];
  onClick?: () => void;
}

export const InteractiveRobot: React.FC<InteractiveRobotProps> = ({
  reaction = 'idle',
  scale = 5,
  position = [0, -1.5, 0],
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const reactionTimeRef = useRef(0);
  const prevReaction = useRef(reaction);
  const baseY = position[1];

  // Reset animation timer when reaction changes
  useEffect(() => {
    if (reaction !== prevReaction.current) {
      reactionTimeRef.current = 0;
      prevReaction.current = reaction;

      // Normalize rotation.y to prevent unwinding from accumulated spin
      if (groupRef.current) {
        const ry = groupRef.current.rotation.y % (Math.PI * 2);
        groupRef.current.rotation.y = ry > Math.PI ? ry - Math.PI * 2 : ry < -Math.PI ? ry + Math.PI * 2 : ry;
      }
    }
  }, [reaction]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const t = state.clock.getElapsedTime();
    reactionTimeRef.current += delta;
    const rt = reactionTimeRef.current;

    // Frame-rate independent smoothing helpers
    const smooth = (speed: number) => 1 - Math.exp(-speed * delta);

    // Entry blend: 0→1 over first 0.3s for extra-smooth state transitions
    const entryBlend = Math.min(1, rt / 0.3);

    // Lerp factors
    const baseFactor = smooth(8) * entryBlend + 0.002; // general smoothing
    const shakeFactor = smooth(30);                      // fast for vibration response

    // ── Compute target transforms for current reaction ──
    let tY = baseY;
    let tRX = 0;
    let tRZ = 0;
    let tSX = scale, tSY = scale, tSZ = scale;
    let tRY: number | null = null; // null = skip Y lerp (use additive spin instead)
    let addRY = 0;                 // additive rotation.y per frame (for spinning)
    let useShakeSmooth = false;    // whether to use fast smoothing for X/Z rotation

    switch (reaction) {
      case 'idle': {
        tY = baseY + Math.sin(t * 1.5) * 0.15;
        tRY = Math.sin(t * 0.5) * 0.1;
        tRZ = Math.sin(t * 0.7) * 0.03;
        tRX = 0;
        break;
      }

      case 'correct': {
        if (rt < 1.8) {
          const jumpPhase = Math.sin(rt * Math.PI / 0.9);
          tY = baseY + Math.max(0, jumpPhase) * 1.5;
          addRY = delta * 8;
          const squash = 1 + Math.sin(rt * Math.PI * 3) * 0.12;
          tSX = scale * squash;
          tSY = scale / squash;
          tSZ = scale * squash;
        } else {
          // Settle back to idle-like motion
          tY = baseY + Math.sin(t * 1.5) * 0.15;
          tRY = Math.sin(t * 0.5) * 0.1;
          tRZ = Math.sin(t * 0.7) * 0.03;
        }
        break;
      }

      case 'incorrect': {
        if (rt < 1.5) {
          const intensity = Math.max(0, 1 - rt / 1.5);
          tRZ = Math.sin(rt * 30) * 0.35 * intensity;
          tRX = Math.sin(rt * 15) * 0.1 * intensity;
          tY = baseY - Math.sin(rt * Math.PI / 1.5) * 0.4;
          const squeeze = 1 - Math.sin(rt * Math.PI / 1.5) * 0.08;
          tSX = scale * (2 - squeeze);
          tSY = scale * squeeze;
          tSZ = scale * (2 - squeeze);
          tRY = g.rotation.y; // keep current Y rotation during shake
          useShakeSmooth = true;
        } else {
          // Settle back to idle-like motion
          tY = baseY + Math.sin(t * 1.5) * 0.15;
          tRY = Math.sin(t * 0.5) * 0.1;
          tRZ = Math.sin(t * 0.7) * 0.03;
        }
        break;
      }

      case 'celebrating': {
        tY = baseY + Math.abs(Math.sin(t * 3)) * 0.6;
        addRY = delta * 2;
        tRZ = Math.sin(t * 4) * 0.15;
        const bounceScale = 1 + Math.abs(Math.sin(t * 3)) * 0.08;
        tSX = scale * bounceScale;
        tSY = scale / bounceScale;
        tSZ = scale * bounceScale;
        break;
      }

      case 'waving': {
        if (rt < 2.5) {
          tRZ = Math.sin(rt * 5) * 0.25 * Math.max(0, 1 - rt / 2.5);
          tY = baseY + Math.sin(rt * 2.5) * 0.3;
          tRY = Math.sin(rt * 3) * 0.2;
        } else {
          // Settle back to idle-like motion
          tY = baseY + Math.sin(t * 1.5) * 0.15;
          tRY = Math.sin(t * 0.5) * 0.1;
          tRZ = Math.sin(t * 0.7) * 0.03;
        }
        break;
      }

      case 'thinking': {
        tRZ = Math.sin(t * 0.8) * 0.12;
        tRX = 0.08 + Math.sin(t * 1.5) * 0.05;
        tY = baseY + Math.sin(t * 1) * 0.1;
        tRY = Math.sin(t * 0.3) * 0.05;
        break;
      }
    }

    // ── Apply all transforms via smooth lerp ──

    // Position Y
    g.position.y += (tY - g.position.y) * baseFactor;

    // Rotation X & Z — use fast smoothing for shake, normal for everything else
    const rotXZFactor = useShakeSmooth ? shakeFactor : baseFactor;
    g.rotation.x += (tRX - g.rotation.x) * rotXZFactor;
    g.rotation.z += (tRZ - g.rotation.z) * rotXZFactor;

    // Rotation Y — either additive (spinning) or lerp to target
    if (addRY !== 0) {
      g.rotation.y += addRY;
    } else if (tRY !== null) {
      g.rotation.y += (tRY - g.rotation.y) * baseFactor;
    }

    // Scale
    g.scale.x += (tSX - g.scale.x) * baseFactor;
    g.scale.y += (tSY - g.scale.y) * baseFactor;
    g.scale.z += (tSZ - g.scale.z) * baseFactor;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <Robot position={[0, 0, 0]} />

      {/* Dynamic lighting based on reaction */}
      {(reaction === 'correct' || reaction === 'celebrating') && (
        <pointLight
          position={[0, 2, 3]}
          intensity={80}
          color="#00ff88"
          distance={10}
        />
      )}
      {reaction === 'incorrect' && (
        <pointLight
          position={[0, 2, 3]}
          intensity={60}
          color="#ff3333"
          distance={10}
        />
      )}
      {reaction === 'waving' && (
        <pointLight
          position={[0, 2, 3]}
          intensity={40}
          color="#ffcc00"
          distance={8}
        />
      )}
    </group>
  );
};
