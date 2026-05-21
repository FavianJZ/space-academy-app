import React, { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera, MeshDistortMaterial } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import * as THREE from 'three';
import { SpacemanPink } from '../components/SpacemanPink';
import { SpacemanWhite } from '../components/SpacemanWhite';
import AdaptiveCanvas from '../components/AdaptiveCanvas';
import { useGameStore } from '../stores/useGameStore';
import './CharacterSelection.css';

const FloatingParticles: React.FC<{ color: string; count?: number; radius?: number; isActive?: boolean }> = ({ 
  color, count = 30, radius = 3, isActive = false 
}) => {
  const ref = useRef<THREE.Points>(null);
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius * (0.5 + Math.random() * 0.5);
      positions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 1.5;
    }
    return positions;
  }, [count, radius]);

  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      const activity = isActive ? 1 : 0.45;
      ref.current.rotation.y = time * (0.15 + activity * 0.08);
      ref.current.rotation.z = Math.sin(time * 0.2) * 0.04 * activity;
      ref.current.position.y = Math.sin(time * (0.5 + activity * 0.18)) * (0.18 + activity * 0.08);
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlesPosition, 3]}
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={color} transparent opacity={isActive ? 0.86 : 0.7} sizeAttenuation />
    </points>
  );
};

const HoloRing: React.FC<{ color: string; isActive: boolean }> = ({ color, isActive }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.3;
      const pulse = isActive ? 0.8 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2 : 0.4;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -state.clock.getElapsedTime() * 0.2;
      const pulse = isActive ? 0.5 + Math.sin(state.clock.getElapsedTime() * 2) * 0.2 : 0.2;
      (outerRingRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[1.2, 1.5, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={outerRingRef}>
        <ringGeometry args={[1.7, 1.85, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <circleGeometry args={[1.2, 40]} />
        <meshBasicMaterial color={color} transparent opacity={isActive ? 0.12 : 0.04} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const EnergyBeam: React.FC<{ color: string; isActive: boolean }> = ({ color, isActive }) => {
  const beamRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (beamRef.current) {
      const scale = isActive ? 1 : 0;
      beamRef.current.scale.y = THREE.MathUtils.lerp(beamRef.current.scale.y, scale, 0.08);
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 
        isActive ? 0.08 + Math.sin(state.clock.getElapsedTime() * 4) * 0.04 : 0;
    }
  });

  return (
    <mesh ref={beamRef} position={[0, 2, 0]} scale={[1, 0, 1]}>
      <cylinderGeometry args={[0.6, 1.4, 8, 20, 1, true]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
};

const SpacemanMagneticResponse: React.FC<{ charRef: React.RefObject<THREE.Group | null>; baseRotY?: number; isActive?: boolean }> = ({ 
  charRef, baseRotY = 0, isActive = false 
}) => {
  const cursorTarget = useRef(new THREE.Vector3());
  const previousMouse = useRef(new THREE.Vector2());
  const mouseVelocity = useRef(new THREE.Vector2());
  const floatPhase = useRef(Math.random() * Math.PI * 2);

  useFrame(({ mouse, clock }, delta) => {
    if (charRef.current) {
      const time = clock.getElapsedTime();

      mouseVelocity.current.x = THREE.MathUtils.lerp(
        mouseVelocity.current.x,
        (mouse.x - previousMouse.current.x) / Math.max(delta, 0.016),
        0.16
      );
      mouseVelocity.current.y = THREE.MathUtils.lerp(
        mouseVelocity.current.y,
        (mouse.y - previousMouse.current.y) / Math.max(delta, 0.016),
        0.16
      );
      previousMouse.current.set(mouse.x, mouse.y);

      const pointerEnergy = Math.min(1, Math.hypot(mouse.x, mouse.y));
      const motionBoost = Math.min(1, Math.hypot(mouseVelocity.current.x, mouseVelocity.current.y) * 0.012);
      const blend = isActive ? 1 : 0.35;
      const floatLift = Math.sin(time * 1.25 + floatPhase.current) * (0.03 + blend * 0.04);

      const targetY = baseRotY + mouse.x * (0.14 + blend * 0.22) + mouseVelocity.current.x * 0.0022;
      const targetX = -mouse.y * (0.08 + blend * 0.06) + mouseVelocity.current.y * 0.002 + Math.sin(time * 1.1 + baseRotY * 3) * 0.02;
      const targetZ = mouse.x * mouse.y * (0.03 + blend * 0.05) - mouseVelocity.current.x * 0.0012;

      charRef.current.rotation.y = THREE.MathUtils.lerp(charRef.current.rotation.y, targetY, isActive ? 0.08 : 0.045);
      charRef.current.rotation.x = THREE.MathUtils.lerp(charRef.current.rotation.x, targetX, isActive ? 0.06 : 0.035);
      charRef.current.rotation.z = THREE.MathUtils.lerp(charRef.current.rotation.z, targetZ, 0.04);

      cursorTarget.current.set(
        mouse.x * (0.1 + blend * 0.22) + mouseVelocity.current.x * 0.0014,
        mouse.y * (0.05 + blend * 0.12) + floatLift * 0.45,
        pointerEnergy * 0.18 + motionBoost * 0.08
      );
      charRef.current.position.x = THREE.MathUtils.lerp(charRef.current.position.x, cursorTarget.current.x, 0.07);
      charRef.current.position.y = THREE.MathUtils.lerp(charRef.current.position.y, cursorTarget.current.y, 0.07);
      charRef.current.position.z = THREE.MathUtils.lerp(charRef.current.position.z, cursorTarget.current.z, 0.05);
    }
  });
  return null;
};

const CursorAura: React.FC<{ activeCharacter: 'pink' | 'white' | null }> = ({ activeCharacter }) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const targetRef = useRef(new THREE.Vector3());
  const previousMouse = useRef(new THREE.Vector2());
  const mouseVelocity = useRef(new THREE.Vector2());

  const auraColor = activeCharacter === 'pink'
    ? '#ff69b4'
    : activeCharacter === 'white'
      ? '#6ce7ff'
      : '#00d4ff';

  useFrame((state) => {
    const { mouse, clock } = state;
    mouseVelocity.current.x = THREE.MathUtils.lerp(mouseVelocity.current.x, mouse.x - previousMouse.current.x, 0.14);
    mouseVelocity.current.y = THREE.MathUtils.lerp(mouseVelocity.current.y, mouse.y - previousMouse.current.y, 0.14);
    previousMouse.current.set(mouse.x, mouse.y);

    const motionBoost = Math.min(1, Math.hypot(mouseVelocity.current.x, mouseVelocity.current.y) * 16);
    targetRef.current.set(mouse.x * 3.25, 1.2 + mouse.y * 1.65, 4.3 - motionBoost * 0.2);

    if (glowRef.current) {
      glowRef.current.position.lerp(targetRef.current, activeCharacter ? 0.12 : 0.08);
      glowRef.current.rotation.z = clock.getElapsedTime() * (activeCharacter ? 0.42 : 0.28);
      const pulse = (activeCharacter ? 0.96 : 0.64) + Math.sin(clock.getElapsedTime() * (activeCharacter ? 5 : 4)) * (activeCharacter ? 0.09 : 0.05) + motionBoost * 0.08;
      glowRef.current.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.color.set(auraColor);
      material.opacity = activeCharacter ? 0.22 + motionBoost * 0.05 : 0.1 + motionBoost * 0.04;
    }

    if (ringRef.current) {
      ringRef.current.position.lerp(targetRef.current, 0.08);
      ringRef.current.rotation.z = -clock.getElapsedTime() * 0.26;
      const ringScale = (activeCharacter ? 1.12 : 0.86) + motionBoost * 0.24;
      ringRef.current.scale.lerp(new THREE.Vector3(ringScale, ringScale, ringScale), 0.12);
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.color.set(auraColor);
      material.opacity = activeCharacter ? 0.3 + motionBoost * 0.08 : 0.14 + motionBoost * 0.05;
    }

    if (lightRef.current) {
      lightRef.current.position.lerp(targetRef.current, 0.08);
      lightRef.current.color.set(auraColor);
      lightRef.current.intensity = activeCharacter ? 8.5 + motionBoost * 2.2 : 3.4 + motionBoost * 1.2;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} distance={14} intensity={3.4} />
      <mesh ref={ringRef} renderOrder={-2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.98, 0.05, 14, 64]} />
        <meshBasicMaterial transparent opacity={0.12} color={auraColor} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={glowRef} renderOrder={-1}>
        <sphereGeometry args={[0.25, 24, 24]} />
        <meshBasicMaterial transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const CharacterStage: React.FC<{
  charType: 'pink' | 'white';
  position: [number, number, number];
  modelScale: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
  charRef: React.RefObject<THREE.Group | null>;
}> = ({ charType, position, modelScale, isHovered, isSelected, onHover, onLeave, onSelect, charRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(1);
  const isActive = isHovered || isSelected;
  const isPink = charType === 'pink';
  const color = isPink ? '#ff2d78' : '#00d4ff';
  const lightColor = isPink ? '#ff69b4' : '#6ce7ff';

  useEffect(() => {
    targetScale.current = isHovered || isSelected ? 1.15 : 1;
  }, [isHovered, isSelected]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      const bobStrength = isActive ? 0.2 : 0.13;
      groupRef.current.position.y = position[1] + Math.sin(time * (1.2 + (isActive ? 0.12 : 0)) + (isPink ? 0 : Math.PI)) * bobStrength;
      const s = groupRef.current.scale.x;
      const target = targetScale.current;
      const newScale = THREE.MathUtils.lerp(s, target, 0.08);
      groupRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <pointLight position={[0, 2, 2]} intensity={isActive ? 15 : 5} color={lightColor} distance={6} />
      <pointLight position={[0, -1, 1]} intensity={isActive ? 8 : 3} color={color} distance={4} />

      <HoloRing color={color} isActive={isActive} />
      <EnergyBeam color={color} isActive={isActive} />
      <FloatingParticles color={lightColor} count={isActive ? 32 : 18} radius={2.5} isActive={isActive} />

      <group
        ref={charRef}
        onClick={onSelect}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        {isPink ? <SpacemanPink scale={modelScale} /> : <SpacemanWhite scale={modelScale} />}
      </group>

      {}
      <mesh
        visible={false}
        onClick={onSelect}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <boxGeometry args={[3, 5, 3]} />
      </mesh>
    </group>
  );
};

const SelectionBurst: React.FC<{ active: boolean; color: string; position: [number, number, number] }> = ({ 
  active, color, position 
}) => {
  const ref = useRef<THREE.Points>(null);
  const burstCount = 48;
  const burstPositions = useMemo(() => {
    const count = burstCount;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.1;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, [burstCount]);

  useFrame((state) => {
    if (ref.current && active) {
      const geo = ref.current.geometry;
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const expand = 2 + Math.sin(state.clock.getElapsedTime() * 5) * 0.5;
        pos.setXYZ(
          i,
          expand * Math.sin(phi) * Math.cos(theta) * Math.random(),
          expand * Math.cos(phi) * Math.random(),
          expand * Math.sin(phi) * Math.sin(theta) * Math.random()
        );
      }
      pos.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <points ref={ref} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[burstPositions, 3]}
          count={burstCount}
          array={burstPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} color={color} transparent opacity={0.9} sizeAttenuation />
    </points>
  );
};

const NebulaBackground: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.01;
    }
  });
  return (
    <mesh ref={ref} scale={50}>
      <sphereGeometry args={[1, 20, 20]} />
      <MeshDistortMaterial
        color="#0a1428"
        emissive="#001a33"
        emissiveIntensity={0.3}
        roughness={1}
        metalness={0}
        distort={0.2}
        speed={0.8}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

const CameraSway: React.FC = () => {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.mouse.x * 0.45, 0.018);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.05 + state.mouse.y * 0.22, 0.018);
    camera.lookAt(0, 0.12, 0);
  });
  return null;
};

const CharacterSelection: React.FC = () => {
  const navigate = useNavigate();
  const setCharacter = useGameStore((state) => state.setCharacter);
  const pinkRef = useRef<THREE.Group>(null);
  const whiteRef = useRef<THREE.Group>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<'pink' | 'white' | null>(null);
  const [selectedChar, setSelectedChar] = useState<'pink' | 'white' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCompactHeight, setIsCompactHeight] = useState(false);

  useEffect(() => {
    const updateViewportFlags = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
      setIsCompactHeight(window.innerHeight <= 820);
    };

    updateViewportFlags();
    window.addEventListener('resize', updateViewportFlags);
    return () => window.removeEventListener('resize', updateViewportFlags);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowUI(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectCharacter = useCallback((char: 'pink' | 'white') => {
    if (isTransitioning) return;
    setSelectedChar(char);
    setCharacter(char);
    setIsTransitioning(true);

    const selectedRef = char === 'pink' ? pinkRef : whiteRef;
    const otherRef = char === 'pink' ? whiteRef : pinkRef;

    if (selectedRef.current) {
      gsap.to(selectedRef.current.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.6, ease: 'back.out(1.7)' });
      gsap.to(selectedRef.current.position, { z: 2, duration: 0.6, ease: 'power2.out' });
    }
    if (otherRef.current) {
      gsap.to(otherRef.current.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.5, ease: 'power2.in' });
    }

    setTimeout(() => navigate('/intro'), 1200);
  }, [isTransitioning, navigate, setCharacter]);

  const handleHover = useCallback((char: 'pink' | 'white') => {
    if (isTransitioning) return;
    setHoveredCharacter(char);
  }, [isTransitioning]);

  const handleLeave = useCallback(() => {
    if (isTransitioning) return;
    setHoveredCharacter(null);
  }, [isTransitioning]);

  const updateCardMagnetics = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile || isTransitioning) return;

    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const pointerGlow = Math.min(1, Math.hypot(pointerX, pointerY));

    element.style.setProperty('--pointer-x', pointerX.toFixed(3));
    element.style.setProperty('--pointer-y', pointerY.toFixed(3));
    element.style.setProperty('--pointer-glow', pointerGlow.toFixed(3));
  }, [isMobile, isTransitioning]);

  const resetCardMagnetics = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    element.style.setProperty('--pointer-x', '0');
    element.style.setProperty('--pointer-y', '0');
    element.style.setProperty('--pointer-glow', '0');
  }, []);

  const charInfo = {
    pink: {
      name: 'SPACEMAN PINK',
      subtitle: 'Officer of Exploration',
      color: '#ff2d78',
      lightColor: '#ff69b4',
      traits: ['Agile', 'Curious', 'Brave'],
      icon: '🚀',
    },
    white: {
      name: 'SPACEMAN WHITE',
      subtitle: 'Officer of Engineering',
      color: '#00d4ff',
      lightColor: '#6ce7ff',
      traits: ['Smart', 'Precise', 'Steady'],
      icon: '🛸',
    },
  };
  const focusCharacter = hoveredCharacter ?? selectedChar;
  const focusInfo = focusCharacter ? charInfo[focusCharacter] : null;
  const focusLabel = selectedChar ? 'SELECTED PILOT' : 'CURSOR FOCUS';

  return (
    <div className="cs-container">
      {}
      <AdaptiveCanvas
        dpr={[1, isMobile ? 1.15 : 1.35]}
        className="cs-canvas"
        quality="auto"
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, isCompactHeight ? 0.8 : 1, 10]} fov={isMobile ? 75 : isCompactHeight ? 62 : 55} />
          <CameraSway />

          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
          <pointLight position={[0, 5, 0]} intensity={20} color="#4488ff" distance={15} />
          <CursorAura activeCharacter={focusCharacter} />

          <NebulaBackground />
          <Stars radius={200} depth={60} count={1600} factor={6} saturation={0.8} fade speed={0.5} />

          <CharacterStage
            charType="pink"
            position={[isMobile ? -2.2 : -3.5, isCompactHeight ? -0.42 : 0, 0]}
            modelScale={isCompactHeight ? 0.94 : 1.1}
            isHovered={hoveredCharacter === 'pink'}
            isSelected={selectedChar === 'pink'}
            onHover={() => handleHover('pink')}
            onLeave={handleLeave}
            onSelect={() => handleSelectCharacter('pink')}
            charRef={pinkRef}
          />

          <CharacterStage
            charType="white"
            position={[isMobile ? 2.2 : 3.5, isCompactHeight ? -0.42 : 0, 0]}
            modelScale={isCompactHeight ? 0.94 : 1.1}
            isHovered={hoveredCharacter === 'white'}
            isSelected={selectedChar === 'white'}
            onHover={() => handleHover('white')}
            onLeave={handleLeave}
            onSelect={() => handleSelectCharacter('white')}
            charRef={whiteRef}
          />

          <SpacemanMagneticResponse charRef={pinkRef} baseRotY={0.4} isActive={hoveredCharacter === 'pink' || selectedChar === 'pink'} />
          <SpacemanMagneticResponse charRef={whiteRef} baseRotY={-0.4} isActive={hoveredCharacter === 'white' || selectedChar === 'white'} />

          <SelectionBurst active={selectedChar === 'pink'} color="#ff69b4" position={[-3.5, 0, 0]} />
          <SelectionBurst active={selectedChar === 'white'} color="#6ce7ff" position={[3.5, 0, 0]} />
        </Suspense>
      </AdaptiveCanvas>

      {}
      <div className={`cs-overlay ${showUI ? 'visible' : ''} ${isTransitioning ? 'transitioning' : ''}`}>
        {}
        <div className="cs-title-section">
          <h1 className="cs-title">
            <span className="cs-title-main">SPACE ACADEMY</span>
            <span className="cs-title-sub">CODE THE GALAXY</span>
          </h1>
          <p className="cs-instruction">
            <span className="cs-instruction-icon">◆</span>
            {isMobile ? 'TAP A CHARACTER TO SELECT' : 'CHOOSE YOUR CHARACTER'}
            <span className="cs-instruction-icon">◆</span>
          </p>

          <div className={`cs-focus-panel ${focusInfo ? 'active' : ''}`}>
            {focusInfo ? (
              <>
                <div className="cs-focus-label">{focusLabel}</div>
                <div className="cs-focus-name" style={{ color: focusInfo.color }}>{focusInfo.name}</div>
                <div className="cs-focus-subtitle">{focusInfo.subtitle}</div>
                <div className="cs-focus-traits">
                  {focusInfo.traits.map((trait) => (
                    <span key={trait} className="cs-focus-trait" style={{ color: focusInfo.color }}>
                      {trait}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="cs-focus-empty">Hover a spaceman to activate the tactical readout.</div>
            )}
          </div>
        </div>

        {}
        <div className="cs-cards-container">
          {(['pink', 'white'] as const).map((type) => {
            const info = charInfo[type];
            const isHovered = hoveredCharacter === type;
            const isActive = selectedChar === type;

            return (
              <button
                key={type}
                className={`cs-card ${type} ${isHovered ? 'hovered' : ''} ${isActive ? 'selected' : ''}`}
                onClick={() => handleSelectCharacter(type)}
                onPointerEnter={(event) => {
                  if (isMobile) return;
                  handleHover(type);
                  updateCardMagnetics(event);
                }}
                onPointerMove={updateCardMagnetics}
                onPointerLeave={(event) => {
                  if (isMobile) return;
                  handleLeave();
                  resetCardMagnetics(event);
                }}
                onPointerDown={updateCardMagnetics}
                onTouchStart={() => handleHover(type)}
                disabled={isTransitioning}
              >
                <div className="cs-card-border" />
                <div className="cs-card-content">
                  <div className="cs-card-icon">{info.icon}</div>
                  <h3 className="cs-card-name">{info.name}</h3>
                  <p className="cs-card-subtitle">{info.subtitle}</p>
                  <div className="cs-card-traits">
                    {info.traits.map((trait) => (
                      <span key={trait} className="cs-trait-pill">{trait}</span>
                    ))}
                  </div>
                  <div className="cs-card-action">
                    {isActive ? '✓ SELECTED' : 'SELECT →'}
                  </div>
                </div>
                <div className="cs-card-shimmer" />
              </button>
            );
          })}
        </div>

        {}
        {isTransitioning && (
          <div className="cs-transition-overlay">
            <div className="cs-transition-flash" />
            <p className="cs-transition-text">INITIALIZING PILOT SYSTEMS...</p>
          </div>
        )}
      </div>

      {}
      <div className="cs-scanlines" />
    </div>
  );
};

export default CharacterSelection;
