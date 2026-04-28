import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpacemanPink } from '../SpacemanPink';
import { SpacemanWhite } from '../SpacemanWhite';
import { useGameStore } from '../../stores/useGameStore';

export type EmoteType = 'idle' | 'flip' | 'wave' | 'jump' | 'dance';

interface InteractiveSpacemanProps {
  scale?: number;
  position?: [number, number, number];
  onEmote?: (emote: EmoteType) => void;
}

const emoteSequence: EmoteType[] = ['wave', 'flip', 'jump', 'dance'];

export const InteractiveSpaceman: React.FC<InteractiveSpacemanProps> = ({
  scale = 0.7,
  position = [-3.2, -1.5, 0],
  onEmote,
}) => {
  const character = useGameStore((state) => state.character);
  const groupRef = useRef<THREE.Group>(null);
  const [emote, setEmote] = useState<EmoteType>('idle');
  const emoteTimeRef = useRef(0);
  const emoteIndexRef = useRef(0);
  const basePos = position;

  useEffect(() => {
    emoteTimeRef.current = 0;
  }, [emote]);

  const handleClick = () => {
    if (emote !== 'idle') return; // Don't interrupt ongoing emote
    const nextEmote = emoteSequence[emoteIndexRef.current % emoteSequence.length];
    emoteIndexRef.current++;
    setEmote(nextEmote);
    onEmote?.(nextEmote);
    // Reset to idle after animation completes
    setTimeout(() => setEmote('idle'), 2200);
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    emoteTimeRef.current += delta;
    const et = emoteTimeRef.current;

    // Always ensure scale stays consistent
    groupRef.current.scale.setScalar(scale);

    switch (emote) {
      case 'idle': {
        // Gentle float + slow rotation
        groupRef.current.position.x = basePos[0];
        groupRef.current.position.y = basePos[1] + Math.sin(t * 1.2 + 1) * 0.15;
        groupRef.current.position.z = basePos[2];
        groupRef.current.rotation.y = Math.PI * 0.8 + Math.sin(t * 0.3) * 0.15;
        groupRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
        groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.02;
        break;
      }

      case 'flip': {
        // Backflip with moderate height
        if (et < 1.5) {
          const progress = et / 1.5;
          groupRef.current.rotation.x = progress * Math.PI * 2;
          groupRef.current.position.y = basePos[1] + Math.sin(progress * Math.PI) * 1;
        } else {
          groupRef.current.rotation.x *= 0.9;
          groupRef.current.position.y += (basePos[1] - groupRef.current.position.y) * 0.1;
        }
        break;
      }

      case 'wave': {
        // Side-to-side sway + bounce
        if (et < 2) {
          groupRef.current.rotation.z = Math.sin(et * 6) * 0.2 * Math.max(0, 1 - et / 2);
          groupRef.current.position.y = basePos[1] + Math.sin(et * 3) * 0.2;
          groupRef.current.rotation.y = Math.PI * 0.8 + Math.sin(et * 4) * 0.2;
        } else {
          groupRef.current.position.y += (basePos[1] - groupRef.current.position.y) * 0.1;
        }
        break;
      }

      case 'jump': {
        // Jump + spin (reduced height)
        if (et < 1.2) {
          const progress = et / 1.2;
          groupRef.current.position.y = basePos[1] + Math.sin(progress * Math.PI) * 1.2;
          groupRef.current.rotation.y += delta * 5;
        } else {
          groupRef.current.position.y += (basePos[1] - groupRef.current.position.y) * 0.1;
        }
        break;
      }

      case 'dance': {
        // Fun wiggle dance (contained movement)
        if (et < 2) {
          groupRef.current.rotation.z = Math.sin(et * 10) * 0.15;
          groupRef.current.position.y = basePos[1] + Math.abs(Math.sin(et * 5)) * 0.3;
          groupRef.current.rotation.y = Math.PI * 0.8 + Math.sin(et * 5) * 0.3;
          groupRef.current.position.x = basePos[0] + Math.sin(et * 4) * 0.15;
        } else {
          groupRef.current.position.x += (basePos[0] - groupRef.current.position.x) * 0.1;
          groupRef.current.position.y += (basePos[1] - groupRef.current.position.y) * 0.1;
        }
        break;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); handleClick(); }}
    >
      {character === 'pink' ? (
        <SpacemanPink />
      ) : (
        <SpacemanWhite />
      )}

      {/* Subtle glow around spaceman */}
      <pointLight
        position={[0, 1, 1]}
        intensity={10}
        color={character === 'pink' ? '#ff88cc' : '#88ccff'}
        distance={4}
      />

      {/* Emote burst light */}
      {emote !== 'idle' && (
        <pointLight
          position={[0, 1.5, 0]}
          intensity={25}
          color="#ffcc00"
          distance={4}
        />
      )}
    </group>
  );
};
