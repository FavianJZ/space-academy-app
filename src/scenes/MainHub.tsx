import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import AdaptiveCanvas from '../components/AdaptiveCanvas';

import { useGameStore } from '../stores/useGameStore';

import { SpacemanPink } from '../components/SpacemanPink';
import { SpacemanWhite } from '../components/SpacemanWhite';
import { Planet1 } from '../components/Planet1';
import { Planet2 } from '../components/Planet2';
import { Planet3 } from '../components/Planet3';
import { Planet4 } from '../components/Planet4';
import { Planet5 } from '../components/Planet5';
import { Planet6 } from '../components/Planet6';
import './MainHub.css';

type PlanetId = 1 | 2 | 3 | 4 | 5 | 6;
const PLANET_IDS: PlanetId[] = [1, 2, 3, 4, 5, 6];

interface PlanetData {
  id: PlanetId;
  component: React.ReactNode;
  scale: number;
  radius: number;
  initialAngle: number;
}

interface PlanetMeta {
  name: string;
  type: string;
  description: string;
  missions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  color: string;
}

const planetMeta: Record<PlanetId, PlanetMeta> = {
  1: { name: 'Novaris', type: 'Terrestrial', description: 'A welcoming world the perfect launchpad for new recruits.', missions: 1, difficulty: 'Easy', color: '#00ff88' },
  2: { name: 'Quizara', type: 'Gas Giant', description: 'Swirling storms of knowledge test your wits here.', missions: 2, difficulty: 'Medium', color: '#ff8800' },
  3: { name: 'Puzzlon', type: 'Ice World', description: 'Frozen puzzles hidden beneath crystalline surfaces.', missions: 3, difficulty: 'Medium', color: '#00ccff' },
  4: { name: 'Flowra', type: 'Volcanic', description: 'Molten logic flows through volcanic pathways.', missions: 4, difficulty: 'Hard', color: '#ff3366' },
  5: { name: 'Logitron', type: 'Cyber World', description: 'Digital realm of pure logic and reason.', missions: 5, difficulty: 'Hard', color: '#aa66ff' },
  6: { name: 'Ultimara', type: 'Dark Matter', description: 'The final frontier only the worthy may pass.', missions: 6, difficulty: 'Expert', color: '#ffcc00' },
};

const CameraFollowPlanet: React.FC<{
  selectedPlanet: PlanetId | null;
  planetRefs: { [key in PlanetId]?: React.RefObject<THREE.Group | null> }
}> = ({ selectedPlanet, planetRefs }) => {
  const { camera } = useThree();
  const cameraOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 8));

  useFrame(() => {
    if (selectedPlanet !== null && planetRefs[selectedPlanet]?.current) {
      const planetPos = new THREE.Vector3();
      planetRefs[selectedPlanet]!.current!.getWorldPosition(planetPos);

      const cameraPos = planetPos.clone().add(cameraOffsetRef.current);

      camera.position.lerp(cameraPos, 0.1);
      camera.lookAt(planetPos);
    }
  });

  return null;
};

const CameraControl: React.FC<{ selectedPlanet: PlanetId | null }> = ({
  selectedPlanet,
}) => {
  const { camera } = useThree();

  useEffect(() => {
    if (selectedPlanet === null) {
      gsap.to(camera.position, {
        x: 0,
        y: 5,
        z: 25,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    }
  }, [selectedPlanet, camera]);

  return null;
};

const PlanetWrapper: React.FC<{
  planet: React.ReactNode;
  radius: number;
  angle: number;
  scale: number;
  planetId: PlanetId;
  isVisited: boolean;
  isSelected: boolean;
  showNameLabel: boolean;
  meta: PlanetMeta;
  orbitFrozen: boolean;
  activePlayers: number;
  isNext: boolean;
  occluderRefs: React.RefObject<THREE.Object3D>[];
  onSelect: (id: PlanetId) => void;
  onHover: (id: PlanetId | null) => void;
  onRefReady?: (ref: React.RefObject<THREE.Group | null>) => void;
  onMeshRefReady?: (ref: React.RefObject<THREE.Group | null>) => void;
}> = ({ planet, radius, angle, scale, planetId, isVisited, isSelected, showNameLabel, meta, orbitFrozen, activePlayers, isNext, occluderRefs, onSelect, onHover, onRefReady, onMeshRefReady }) => {
  const ref = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [labelPosition, setLabelPosition] = useState<[number, number, number]>([0, -scale * 1.12, 0]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orbitAngleRef = useRef<number>(angle);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (onRefReady) {
      onRefReady(ref);
    }
  }, [onRefReady]);

  useEffect(() => {
    if (onMeshRefReady) {
      onMeshRefReady(planetMeshRef);
    }
  }, [onMeshRefReady]);

  useEffect(() => {
    let rafId = 0;
    const updateLabelPosition = () => {
      if (!ref.current || !planetMeshRef.current) return;

      ref.current.updateWorldMatrix(true, true);
      planetMeshRef.current.updateWorldMatrix(true, true);

      const bounds = new THREE.Box3().setFromObject(planetMeshRef.current);
      if (bounds.isEmpty()) return;

      const centerWorld = bounds.getCenter(new THREE.Vector3());
      const anchorWorld = new THREE.Vector3(centerWorld.x, bounds.min.y, centerWorld.z);
      const anchorLocal = ref.current.worldToLocal(anchorWorld);
      const labelGap = Math.max((bounds.max.y - bounds.min.y) * 0.1, scale * 0.2);

      setLabelPosition([anchorLocal.x, anchorLocal.y - labelGap, anchorLocal.z]);
    };

    rafId = window.requestAnimationFrame(updateLabelPosition);
    return () => window.cancelAnimationFrame(rafId);
  }, [planetId, scale]);

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (!isHovered) {
      setIsHovered(true);
      onHover(planetId);
      if (groupRef.current) {
        gsap.to(groupRef.current.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.3 });
      }
    }
    document.body.style.cursor = 'pointer';
  }, [isHovered, isVisited, onHover, planetId]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      onHover(null);
      if (groupRef.current) {
        gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
      }
      document.body.style.cursor = 'default';
      hoverTimeoutRef.current = null;
    }, 80);
  }, [onHover]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();

    if (!(orbitFrozen || isSelected)) {
      orbitAngleRef.current += delta * 0.1;
    }
    ref.current.position.x = Math.cos(orbitAngleRef.current) * radius;
    ref.current.position.z = Math.sin(orbitAngleRef.current) * radius;

    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += 0.005;
    }

    if (glowRef.current && isHovered) {
      const pulse = 1 + Math.sin(t * 4) * 0.08;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const handleClick = () => {
    onSelect(planetId);
  };

  const ringRadius = Math.max(scale * 0.7, 0.8);

  const hitRadius = scale * 1.535;

  const showTooltip = isHovered && !isSelected;
  const isLabelActive = isHovered || isSelected;

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
    >
      <group ref={ref}>
        { }
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          visible={false}
        >
          <sphereGeometry args={[hitRadius, 32, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        { }
        <group ref={planetMeshRef} scale={scale}>
          {planet}
        </group>

        { }
        <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]} visible={showTooltip}>
          <torusGeometry args={[ringRadius, 0.04, 16, 100]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.color}
            emissiveIntensity={3}
            transparent
            opacity={showTooltip ? 0.9 : 0}
          />
        </mesh>

        { }
        <mesh rotation={[Math.PI / 2, 0, 0]} visible={showTooltip}>
          <torusGeometry args={[ringRadius, 0.15, 16, 100]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.color}
            emissiveIntensity={1.5}
            transparent
            opacity={showTooltip ? 0.15 : 0}
          />
        </mesh>

        { }
        {showTooltip && (
          <pointLight color={meta.color} intensity={5} distance={scale * 4} />
        )}

        { }
        {showNameLabel && (
          <Html
            position={labelPosition}
            center
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div className={`planet-label ${isLabelActive ? 'planet-label--active' : ''}`} style={{ color: meta.color }}>
              {meta.name}
            </div>
          </Html>
        )}

        { }
        {isNext && showNameLabel && !showTooltip && (
          <Html
            position={[0, Math.min(scale * 2.5, 4.5), 0]}
            center
            distanceFactor={6}
            zIndexRange={[25, 0]}
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            style={{ pointerEvents: 'none' }}
          >
            <div className="planet-start-here-indicator" style={{ '--accent': meta.color } as React.CSSProperties}>
              <div className="indicator-text">YOUR HERE</div>
              <div className="indicator-arrows">
                <span>▼</span><span>▼</span><span>▼</span>
              </div>
            </div>
          </Html>
        )}

        { }
        {showTooltip && (
          <Html
            position={[0, scale * 1.8, 0]}
            center
            distanceFactor={4}
            zIndexRange={[30, 0]}
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            style={{ pointerEvents: 'none' }}
          >
            <div className="planet-tooltip-hologram" style={{ '--accent': meta.color } as React.CSSProperties}>
              <div className="hologram-card" style={{ borderColor: meta.color, boxShadow: `0 0 20px ${meta.color}30, inset 0 0 30px ${meta.color}08` }}>
                { }
                <div className="tooltip-corner tl" style={{ borderColor: meta.color }} />
                <div className="tooltip-corner tr" style={{ borderColor: meta.color }} />
                <div className="tooltip-corner bl" style={{ borderColor: meta.color }} />
                <div className="tooltip-corner br" style={{ borderColor: meta.color }} />

                { }
                {activePlayers > 0 && (
                  <div className="hologram-players-badge">
                    <div className="hologram-players-avatar">
                      <span className="hologram-players-avatar-icon">👾</span>
                    </div>
                    <span className="hologram-players-count">{activePlayers}</span>
                    <span className="hologram-players-label">player{activePlayers > 1 ? 's' : ''} playing</span>
                    <span className="hologram-players-dot" />
                  </div>
                )}

                <div className="hologram-name">{meta.name}</div>
                <div className="hologram-type" style={{ borderColor: meta.color, color: meta.color }}>
                  {meta.type.toUpperCase()}
                </div>
                <div className="hologram-desc">{meta.description}</div>
                <div className="hologram-divider" style={{ background: `linear-gradient(90deg, ${meta.color}55, transparent)` }} />
                <div className="hologram-stats">
                  <span className="hologram-stat">MISSIONS: <strong>{meta.missions}</strong></span>
                  <span className="hologram-stat">DIFFICULTY <span className="hologram-diff-badge" style={{ background: `${meta.color}22`, color: meta.color, borderColor: `${meta.color}55` }}>{meta.difficulty.toUpperCase()}</span></span>
                </div>
                <div className="hologram-footer" style={{ color: meta.color }}>
                  {isVisited ? '✓ COMPLETED' : 'CLICK TO BEGIN MISSION'}
                </div>
              </div>
              { }
              <div className="hologram-arrow" style={{ borderTopColor: meta.color }} />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

const AvatarCharacterModel: React.FC<{ CharacterModel: React.FC<any> }> = ({ CharacterModel }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {

      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
    }
  });
  return (
    <group ref={groupRef}>
      <CharacterModel scale={0.7} position={[0, -1.8, 0]} />
    </group>
  );
};

const MainHub: React.FC = () => {
  const navigate = useNavigate();
  const character = useGameStore((state) => state.character);
  const setCharacter = useGameStore((state) => state.setCharacter);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const playerData = useGameStore((state) => state.playerData);
  const setPlayerData = useGameStore((state) => state.setPlayerData);
  const introCompleted = useGameStore((state) => state.introCompleted);
  const setIntroCompleted = useGameStore((state) => state.setIntroCompleted);
  const musicVolume = useGameStore((state) => state.musicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const bossMode = useGameStore((state) => state.bossMode);
  const setBossMode = useGameStore((state) => state.setBossMode);
  const resetBossHP = useGameStore((state) => state.resetBossHP);
  const p2Name = useGameStore((state) => state.p2Name);
  const setP2Name = useGameStore((state) => state.setP2Name);
  const getPlanetLeaderboard = useGameStore((state) => state.getPlanetLeaderboard);
  const addPlanetLeaderboardEntry = useGameStore((state) => state.addPlanetLeaderboardEntry);
  const planetLeaderboards = useGameStore((state) => state.planetLeaderboards);
  const getPlanetScore = useGameStore((state) => state.getPlanetScore);
  const getTotalScore = useGameStore((state) => state.getTotalScore);

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetId | null>(null);
  const [showPlanetUI, setShowPlanetUI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [hoveredRoadmapNode, setHoveredRoadmapNode] = useState<PlanetId | null>(null);
  const [showP2Modal, setShowP2Modal] = useState(false);
  const [p2FormName, setP2FormName] = useState(p2Name || '');

  // Leaderboard toggle per planet selection
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Seed sample leaderboard data on first load
  useEffect(() => {
    if (planetLeaderboards.length > 0) return; // Already seeded
    const sampleNames = [
      'AstroKid', 'PixelNova', 'CyberWolf', 'StarCadet', 'LunaBot',
      'NeoZero', 'ByteStorm', 'QuantumAce', 'RocketFox', 'ZenithX',
      'CosmoPilot', 'VoidRunner', 'SolarFlare', 'DarkNebula', 'IonBlade',
    ];
    const entries: Array<{ playerName: string; planetId: PlanetId; score: number; completionTime: number; timestamp: number }> = [];
    for (let pid = 1; pid <= 6; pid++) {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
        const baseScore = (7 - pid) * 150 + Math.floor(Math.random() * 300);
        const baseTime = 30 + pid * 20 + Math.floor(Math.random() * 120);
        entries.push({
          playerName: name + (Math.random() > 0.5 ? Math.floor(Math.random() * 99) : ''),
          planetId: pid as PlanetId,
          score: baseScore,
          completionTime: baseTime,
          timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
    entries.forEach(e => addPlanetLeaderboardEntry(e));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Simulated active players per planet (updates every 8-15 seconds)
  const [activePlayers, setActivePlayers] = useState<Record<PlanetId, number>>(() => ({
    1: Math.floor(Math.random() * 12) + 2,
    2: Math.floor(Math.random() * 10) + 1,
    3: Math.floor(Math.random() * 8) + 1,
    4: Math.floor(Math.random() * 6) + 1,
    5: Math.floor(Math.random() * 5),
    6: Math.floor(Math.random() * 4),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers(prev => {
        const next = { ...prev };
        // Randomly update 1-3 planets each tick
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) {
          const pid = (Math.floor(Math.random() * 6) + 1) as PlanetId;
          const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
          next[pid] = Math.max(0, Math.min(20, prev[pid] + delta));
        }
        return next;
      });
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, []);

  // Planet refs for camera following
  const planetRefs = useRef<{ [key in PlanetId]?: React.RefObject<THREE.Group | null> }>({}).current;
  const planetMeshRefs = useRef<{ [key in PlanetId]?: React.RefObject<THREE.Group | null> }>({}).current;
  const [, setPlanetMeshRefsVersion] = useState(0);

  // Intro States: 'story' -> 'character' -> 'input' -> 'hub'

  const [hubPhase, setHubPhase] = useState<'story' | 'character' | 'input' | 'hub'>(
    introCompleted || (playerData.name && playerData.major) ? 'hub' : 'story'
  );

  useEffect(() => {
    if (playerData.name && playerData.major && !introCompleted) {
      setIntroCompleted(true);
    }
  }, [playerData, introCompleted, setIntroCompleted]);

  const [formData, setFormData] = useState({
    name: playerData.name || '',
    phone: playerData.phone || '',
    school: playerData.school || '',
    major: playerData.major || '',
  });

  const CharacterModel = character === 'pink' ? SpacemanPink : SpacemanWhite;

  const stageDescriptions: Record<PlanetId, { title: string; description: string; displayTitle?: string }> = {
    1: { title: 'STAGE 1', description: 'Introduction to Software Engineering', displayTitle: 'Introduction' },
    2: { title: 'STAGE 2', description: 'Multiple Choice Challenges', displayTitle: 'Multiple Choice' },
    3: { title: 'STAGE 3', description: 'Puzzle Game', displayTitle: 'Puzzle Game' },
    4: { title: 'STAGE 4', description: 'Flowchart Fixer', displayTitle: 'Flowchart' },
    5: { title: 'STAGE 5', description: 'Logic Flow', displayTitle: 'Logic Flow' },
    6: { title: 'STAGE 6', description: 'Final Challenge', displayTitle: 'Final Challenge' },
  };

  const planetData: PlanetData[] = [
    { id: 1, component: <Planet1 />, scale: 3, radius: 14, initialAngle: 0 },
    { id: 2, component: <Planet2 />, scale: 1.5, radius: 14, initialAngle: Math.PI / 3 },
    { id: 3, component: <Planet3 />, scale: 1.5, radius: 14, initialAngle: (2 * Math.PI) / 3 },
    { id: 4, component: <Planet4 />, scale: 0.5, radius: 14, initialAngle: Math.PI },
    { id: 5, component: <Planet5 />, scale: 1.5, radius: 14, initialAngle: (4 * Math.PI) / 3 },
    { id: 6, component: <Planet6 />, scale: 1.5, radius: 14, initialAngle: (5 * Math.PI) / 3 },
  ];

  const handlePlanetSelect = (planetId: PlanetId) => {
    setSelectedPlanet(planetId);
    setShowPlanetUI(true);
    setShowLeaderboard(false);
  };

  const handleDepart = () => {
    if (selectedPlanet) {
      navigate(`/stage/${selectedPlanet}`);
    }
  };

  const handleBack = () => {
    setSelectedPlanet(null);
    setShowPlanetUI(false);
    setShowLeaderboard(false);
  };

  const getStageStatus = () => {
    const completedCount = visitedPlanets.size;
    const totalStages = 6;
    const remainingStages = totalStages - completedCount;

    const stageList: Array<{ id: PlanetId; completed: boolean }> = [];
    for (let i = 1; i <= 6; i++) {
      stageList.push({
        id: i as PlanetId,
        completed: visitedPlanets.has(i as PlanetId)
      });
    }

    return {
      completedCount,
      totalStages,
      remainingStages,
      stageList,
      completionPercentage: Math.round((completedCount / totalStages) * 100)
    };
  };

  const stageStatus = getStageStatus();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.major) {
      setPlayerData({ ...playerData, ...formData } as any);
      setIntroCompleted(true);
      setHubPhase('hub');
    } else {
      alert("Please fill in Name and Major!");
    }
  };

  if (hubPhase === 'story') {
    return (
      <div className="intro-story-container">
        <div className="story-content">
          <h1 className="story-warning-title">⚠️ WARNING: COLLISION DETECTED ⚠️</h1>
          <p className="story-text">
            Your rocket has collided with an asteroid field! <br />
            Emergency landing initiated on Unknown Planet Sector 7...
          </p>
          <div className="story-actions">
            <button className="story-btn" onClick={() => setHubPhase('character')}>
              INITIATE EMERGENCY WAKEUP
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hubPhase === 'character') {
    return (
      <div className="mh-charselect-container">
        { }
        <AdaptiveCanvas
          className="mh-charselect-canvas"
          dpr={[1, 1.25]}
          quality="auto"
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <pointLight position={[-4, 3, 2]} intensity={10} color="#ff69b4" distance={10} />
            <pointLight position={[4, 3, 2]} intensity={10} color="#6ce7ff" distance={10} />
            <Stars radius={200} depth={60} count={1400} factor={6} saturation={0.8} fade speed={0.5} />

            { }
            <group position={[-2.5, -0.5, 0]}>
              <AvatarCharacterModel CharacterModel={SpacemanPink} />
            </group>

            { }
            <group position={[2.5, -0.5, 0]}>
              <AvatarCharacterModel CharacterModel={SpacemanWhite} />
            </group>
          </Suspense>
        </AdaptiveCanvas>

        { }
        <div className="mh-charselect-overlay">
          <div className="mh-charselect-title">
            <h1>SELECT YOUR PILOT</h1>
            <p>Choose wisely, Space Cadet</p>
          </div>

          <div className="mh-charselect-cards">
            <button
              className={`mh-char-card pink ${character === 'pink' ? 'active' : ''}`}
              onClick={() => setCharacter('pink')}
            >
              <div className="mh-char-card-glow" />
              <div className="mh-char-card-inner">
                <span className="mh-char-icon">🚀</span>
                <h3>OFFICER PINK</h3>
                <p>Exploration Specialist</p>
                <div className="mh-char-traits">
                  <span>Agile</span><span>Curious</span><span>Brave</span>
                </div>
              </div>
              {character === 'pink' && <div className="mh-char-selected-badge">✓ SELECTED</div>}
            </button>

            <button
              className={`mh-char-card white ${character === 'white' ? 'active' : ''}`}
              onClick={() => setCharacter('white')}
            >
              <div className="mh-char-card-glow" />
              <div className="mh-char-card-inner">
                <span className="mh-char-icon">🛸</span>
                <h3>OFFICER WHITE</h3>
                <p>Engineering Specialist</p>
                <div className="mh-char-traits">
                  <span>Smart</span><span>Precise</span><span>Steady</span>
                </div>
              </div>
              {character === 'white' && <div className="mh-char-selected-badge">✓ SELECTED</div>}
            </button>
          </div>

          <button className="mh-confirm-btn" onClick={() => setHubPhase('input')}>
            <span className="mh-confirm-text">CONFIRM SELECTION</span>
            <span className="mh-confirm-arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  if (hubPhase === 'input') {
    return (
      <div className="player-input-container">
        <div className="input-card">
          <h2 className="input-card-title">SYSTEM REBOOT: PILOT DATA REQUIRED</h2>
          <p className="input-card-subtitle">AI: "Welcome back, Pilot. I need to verify your identity to unlock the navigation controls."</p>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>PILOT NAME</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label>PHONE NUMBER</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08..."
              />
            </div>
            <div className="form-group">
              <label>SCHOOL / ACADEMY</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="High School Name"
              />
            </div>
            <div className="form-group form-group-last">
              <label>SPECIALIZATION (MAJOR)</label>
              <select
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                required
              >
                <option value="">Select Major...</option>
                <option value="IPA">IPA (Science)</option>
                <option value="IPS">IPS (Social)</option>
              </select>
            </div>
            <button type="submit" className="submit-btn">ACCESS NAVIGATION</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative' }}>
      <AdaptiveCanvas camera={{ position: [0, 5, 25], fov: 60 }} dpr={[1, 1.25]} quality="auto">
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 10, 0]} intensity={1000} color="#ffdfb3" />
          <Stars radius={300} depth={50} count={1800} factor={10} saturation={0} fade speed={1} />

          { }
          {planetData.map((data, index) => {
            const firstUncompleted = stageStatus.stageList.find(s => !s.completed);
            const isNext = firstUncompleted?.id === data.id;

            return (
              <PlanetWrapper
                key={index}
                planet={data.component}
                radius={data.radius}
                angle={data.initialAngle}
                scale={data.scale}
                planetId={data.id}
                isVisited={visitedPlanets.has(data.id)}
                isSelected={selectedPlanet === data.id}
                showNameLabel={selectedPlanet === null}
                meta={planetMeta[data.id]}
                orbitFrozen={hoveredPlanet !== null || selectedPlanet !== null}
                activePlayers={activePlayers[data.id]}
                isNext={isNext}
                occluderRefs={PLANET_IDS
                  .filter((id) => id !== data.id)
                  .map((id) => planetMeshRefs[id])
                  .filter((ref): ref is React.RefObject<THREE.Group | null> => !!ref)
                  .map((ref) => ref as unknown as React.RefObject<THREE.Object3D>)}
                onSelect={handlePlanetSelect}
                onHover={setHoveredPlanet}
                onRefReady={(ref) => {
                  planetRefs[data.id] = ref;
                }}
                onMeshRefReady={(ref) => {
                  const currentRef = planetMeshRefs[data.id];
                  if (currentRef !== ref) {
                    planetMeshRefs[data.id] = ref;
                    setPlanetMeshRefsVersion((version) => version + 1);
                  }
                }}
              />
            );
          })}

          <CameraControl selectedPlanet={selectedPlanet} />
          <CameraFollowPlanet selectedPlanet={selectedPlanet} planetRefs={planetRefs} />
        </Suspense>
        <OrbitControls />
      </AdaptiveCanvas>

      { }
      {showPlanetUI && selectedPlanet && (
        <div className="planet-selection-ui" style={{ borderColor: planetMeta[selectedPlanet].color, boxShadow: `0 0 30px ${planetMeta[selectedPlanet].color}50, inset 0 0 20px ${planetMeta[selectedPlanet].color}15` }}>
          { }
          {selectedPlanet === 6 && (
            <button
              className={`boss-mode-toggle ${bossMode ? 'active' : ''}`}
              onClick={() => {
                if (!bossMode) {
                  resetBossHP();
                }
                setBossMode(!bossMode);
              }}
            >
              {bossMode ? 'BOSS MODE' : 'NORMAL MODE'}
            </button>
          )}
          <div className="planet-info">
            { }
            {selectedPlanet && visitedPlanets.has(selectedPlanet) && (() => {
              const score = getPlanetScore(selectedPlanet, selectedPlanet);
              const totalScore = getTotalScore();
              return (
                <div className="planet-completed-banner">
                  <div className="planet-completed-icon">✅</div>
                  <div className="planet-completed-text">MISSION COMPLETED</div>
                  <div className="planet-completed-stats">
                    <div className="planet-completed-stat">
                      <span className="planet-completed-stat-label">LAST SCORE</span>
                      <span className="planet-completed-stat-value" style={{ color: planetMeta[selectedPlanet].color }}>{score > 0 ? score.toLocaleString() : '—'}</span>
                    </div>
                    <div className="planet-completed-stat-divider" />
                    <div className="planet-completed-stat">
                      <span className="planet-completed-stat-label">TOTAL SCORE</span>
                      <span className="planet-completed-stat-value" style={{ color: '#00ffff' }}>{totalScore.toLocaleString()}</span>
                    </div>
                    <div className="planet-completed-stat-divider" />
                    <div className="planet-completed-stat">
                      <span className="planet-completed-stat-label">STATUS</span>
                      <span className="planet-completed-stat-value planet-completed-cleared">CLEARED ★</span>
                    </div>
                  </div>
                  <div className="planet-completed-hint">You can replay this mission to improve your score!</div>
                </div>
              );
            })()}
            { }
            {activePlayers[selectedPlanet] > 0 && (
              <div className="planet-ui-players">
                <span className="planet-ui-players-icon">👾</span>
                <span className="planet-ui-players-count">{activePlayers[selectedPlanet]}</span>
                <span className="planet-ui-players-label">player{activePlayers[selectedPlanet] > 1 ? 's' : ''} currently exploring</span>
                <span className="planet-ui-players-dot" />
              </div>
            )}
            <h2 style={{ color: planetMeta[selectedPlanet].color }}>{planetMeta[selectedPlanet].name}</h2>
            <div className="planet-info-type" style={{ color: planetMeta[selectedPlanet].color }}>{planetMeta[selectedPlanet].type.toUpperCase()}</div>
            <p>{planetMeta[selectedPlanet].description}</p>
            <div className="planet-info-meta">
              <span>{stageDescriptions[selectedPlanet].title}: {stageDescriptions[selectedPlanet].description}{selectedPlanet === 6 && bossMode ? ' — Boss Mode' : ''}</span>
            </div>

            {/* Per-Planet Leaderboard (hidden for planet 1 - intro stage) */}
            {selectedPlanet !== 1 && (
              <button
                className={`planet-lb-toggle ${showLeaderboard ? 'active' : ''}`}
                style={{ borderColor: `${planetMeta[selectedPlanet].color}66`, color: planetMeta[selectedPlanet].color }}
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                🏆 {showLeaderboard ? 'HIDE LEADERBOARD' : 'VIEW LEADERBOARD'}
              </button>
            )}

            {selectedPlanet !== 1 && showLeaderboard && (() => {
              const fullLb = getPlanetLeaderboard(selectedPlanet);
              const top10 = fullLb.slice(0, 10);
              const currentPlayerName = playerData.name || 'CADET';

              const playerIdx = fullLb.findIndex(e => e.playerName === currentPlayerName);
              const playerInTop10 = playerIdx >= 0 && playerIdx < 10;
              const playerEntry = playerIdx >= 0 ? fullLb[playerIdx] : null;
              const playerRank = playerIdx >= 0 ? playerIdx + 1 : null;

              const playerPlanetScore = getPlanetScore(selectedPlanet, selectedPlanet);
              const showPlayerRow = !playerInTop10 && (playerEntry || playerPlanetScore > 0);

              return (
                <div className="planet-lb-container" style={{ borderColor: `${planetMeta[selectedPlanet].color}33` }}>
                  <div className="planet-lb-header">
                    <span className="planet-lb-title" style={{ color: planetMeta[selectedPlanet].color }}>🏆 TOP PILOTS — {planetMeta[selectedPlanet].name.toUpperCase()}</span>
                  </div>
                  {fullLb.length === 0 && !playerPlanetScore ? (
                    <div className="planet-lb-empty">No records yet. Be the first!</div>
                  ) : (
                    <div className="planet-lb-table">
                      <div className="planet-lb-row planet-lb-row-header">
                        <span className="planet-lb-rank">#</span>
                        <span className="planet-lb-name">PILOT</span>
                        <span className="planet-lb-score">SCORE</span>
                        <span className="planet-lb-time">TIME</span>
                      </div>
                      {top10.map((entry, idx) => {
                        const mins = Math.floor(entry.completionTime / 60);
                        const secs = entry.completionTime % 60;
                        const timeStr = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
                        const isCurrentPlayer = entry.playerName === currentPlayerName;
                        return (
                          <div key={idx} className={`planet-lb-row ${idx < 3 ? `planet-lb-top${idx + 1}` : ''} ${isCurrentPlayer ? 'planet-lb-you' : ''}`}>
                            <span className="planet-lb-rank">{medal || idx + 1}</span>
                            <span className="planet-lb-name">{entry.playerName}{isCurrentPlayer ? ' (YOU)' : ''}</span>
                            <span className="planet-lb-score" style={{ color: planetMeta[selectedPlanet].color }}>{entry.score.toLocaleString()}</span>
                            <span className="planet-lb-time">{timeStr}</span>
                          </div>
                        );
                      })}
                      {/* Player's own row if not in top 10 */}
                      {showPlayerRow && (
                        <>
                          <div className="planet-lb-separator">
                            <span>· · ·</span>
                          </div>
                          <div className="planet-lb-row planet-lb-you">
                            <span className="planet-lb-rank">{playerRank ? `${playerRank}` : `${fullLb.length + 1}+`}</span>
                            <span className="planet-lb-name">{currentPlayerName} (YOU)</span>
                            <span className="planet-lb-score" style={{ color: planetMeta[selectedPlanet].color }}>
                              {playerEntry ? playerEntry.score.toLocaleString() : playerPlanetScore.toLocaleString()}
                            </span>
                            <span className="planet-lb-time">
                              {playerEntry ? (() => { const m = Math.floor(playerEntry.completionTime / 60); const s = playerEntry.completionTime % 60; return `${m}m ${s < 10 ? '0' : ''}${s}s`; })() : '—'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="button-group">
              <button className="depart-btn" style={{ borderColor: planetMeta[selectedPlanet].color, color: planetMeta[selectedPlanet].color, boxShadow: `0 0 10px ${planetMeta[selectedPlanet].color}30` }} onClick={() => {
                if (selectedPlanet === 6 && bossMode) {
                  setP2FormName(p2Name || '');
                  setShowP2Modal(true);
                } else {
                  handleDepart();
                }
              }}>
                {visitedPlanets.has(selectedPlanet) ? 'REPLAY' : 'DEPART'}
              </button>
              <button className="back-btn" onClick={handleBack}>
                BACK
              </button>
            </div>
          </div>
        </div>
      )}

      { }
      {showP2Modal && (
        <div className="p2-modal-overlay" onClick={() => setShowP2Modal(false)}>
          <div className="p2-modal" onClick={(e) => e.stopPropagation()}>
            <div className="p2-modal-header">
              <div className="p2-modal-icon">🎮</div>
              <h3 className="p2-modal-title">CO-OP MODE</h3>
              <p className="p2-modal-subtitle">Enter Player 2 Identity</p>
            </div>

            <div className="p2-modal-body">
              <div className="p2-modal-player p2-modal-p1">
                <div className="p2-player-badge" style={{ borderColor: '#00ffff' }}>
                  <span className="p2-player-id" style={{ color: '#00ffff' }}>P1</span>
                  <span className="p2-player-role">Mouse Pilot</span>
                </div>
                <div className="p2-player-name" style={{ color: '#00ffff' }}>{(playerData.name || 'CADET').toUpperCase()}</div>
              </div>

              <div className="p2-modal-vs">VS</div>

              <div className="p2-modal-player p2-modal-p2">
                <div className="p2-player-badge" style={{ borderColor: '#ffb703' }}>
                  <span className="p2-player-id" style={{ color: '#ffb703' }}>P2</span>
                  <span className="p2-player-role">Numpad Runner</span>
                </div>
                <input
                  className="p2-name-input"
                  type="text"
                  placeholder="Enter P2 Name..."
                  value={p2FormName}
                  onChange={(e) => setP2FormName(e.target.value)}
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && p2FormName.trim()) {
                      setP2Name(p2FormName.trim());
                      setShowP2Modal(false);
                      handleDepart();
                    }
                  }}
                />
              </div>
            </div>

            <div className="p2-modal-actions">
              <button
                className="p2-start-btn"
                disabled={!p2FormName.trim()}
                onClick={() => {
                  if (p2FormName.trim()) {
                    setP2Name(p2FormName.trim());
                    setShowP2Modal(false);
                    handleDepart();
                  }
                }}
              >
                🚀 START RAID
              </button>
              <button className="p2-skip-btn" onClick={() => {
                setShowP2Modal(false);
                handleDepart();
              }}>
                Skip → Solo Mode
              </button>
            </div>
          </div>
        </div>
      )}

      { }
      {showSettings && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h2>SYSTEM SETTINGS</h2>
            <div className="settings-group">
              <label>MUSIC VOLUME: {Math.round(musicVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              />
            </div>
            <div className="settings-group">
              <label>SFX VOLUME: {Math.round(sfxVolume * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              />
            </div>
            <button className="close-settings-btn" onClick={() => setShowSettings(false)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      { }
      <div className="welcome-message">
        <h1>WELCOME, {playerData.name || 'CADET'}</h1>
        <p>CLICK A PLANET TO BEGIN YOUR MISSION</p>
        <div className="hub-buttons">
          <button className="leaderboard-btn" onClick={() => navigate('/leaderboard')}>
            VIEW LEADERBOARD
          </button>
          <button className="settings-btn" onClick={() => setShowSettings(true)}>
            SETTINGS
          </button>
        </div>
      </div>

      { }
      <div className="top-right-area">
        { }
        <div
          className={`character-avatar-wrapper ${avatarHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <div className={`character-avatar-ring ${character}`}>
            <div className="character-avatar-canvas">
              <AdaptiveCanvas
                camera={{ position: [0, 0.5, 3.5], fov: 40 }}
                style={{ background: 'transparent' }}
                dpr={[1, 1.1]}
                quality="low"
                gl={{ alpha: true }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={1} />
                  <directionalLight position={[2, 3, 4]} intensity={1.4} />
                  <directionalLight position={[-2, 1, -1]} intensity={0.6} color="#88ccff" />
                  <AvatarCharacterModel CharacterModel={CharacterModel} />
                </Suspense>
              </AdaptiveCanvas>
            </div>
          </div>
          <div className={`avatar-pulse-ring ${character}`} />
        </div>

      </div> { }

      { }
      {!showPlanetUI && (
        <div className="level-roadmap-bar">
          { }
          <div className="roadmap-connector-track">
            <div
              className="roadmap-connector-fill"
              style={{ width: `${Math.max(0, ((stageStatus.completedCount) / (stageStatus.totalStages - 1)) * 100)}%` }}
            />
          </div>

          <div className="roadmap-nodes">
            {stageStatus.stageList.map((stage, idx) => {
              const meta = planetMeta[stage.id];
              const desc = stageDescriptions[stage.id];

              const firstUncompleted = stageStatus.stageList.find(s => !s.completed);
              const isNext = firstUncompleted?.id === stage.id;
              const isCompleted = stage.completed;
              const diffIcons: Record<string, string> = {
                'Easy': '★',
                'Medium': '★★',
                'Hard': '★★★',
                'Expert': '★★★★',
              };

              return (
                <div
                  key={stage.id}
                  className={`roadmap-node ${isCompleted ? 'completed' : ''} ${isNext ? 'next-level' : ''} ${!isCompleted && !isNext ? 'locked' : ''} ${hoveredRoadmapNode === stage.id ? 'hovered' : ''}`}
                  onClick={() => handlePlanetSelect(stage.id)}
                  onMouseEnter={() => setHoveredRoadmapNode(stage.id)}
                  onMouseLeave={() => setHoveredRoadmapNode(null)}
                  style={{ '--node-color': meta.color, '--node-idx': idx } as React.CSSProperties}
                >
                  { }
                  {isNext && (
                    <>
                      <div className="roadmap-beacon" style={{ borderColor: meta.color }} />
                      <div className="roadmap-beacon roadmap-beacon-2" style={{ borderColor: meta.color }} />
                    </>
                  )}

                  { }
                  {isCompleted && (
                    <div className="roadmap-check-overlay">✓</div>
                  )}

                  { }
                  <div className="roadmap-hover-ring" style={{ borderColor: meta.color }} />

                  { }
                  <div
                    className="roadmap-node-shape"
                    style={{
                      borderColor: isCompleted ? 'rgba(0,255,136,0.6)' : isNext ? meta.color : 'rgba(100,120,140,0.4)',
                      background: isCompleted
                        ? 'rgba(0,255,136,0.1)'
                        : isNext
                          ? `linear-gradient(135deg, ${meta.color}22, ${meta.color}08)`
                          : 'rgba(10,20,35,0.7)',
                      boxShadow: isCompleted
                        ? '0 0 15px rgba(0,255,136,0.3), inset 0 0 10px rgba(0,255,136,0.05)'
                        : isNext
                          ? `0 0 20px ${meta.color}40, 0 0 40px ${meta.color}15`
                          : 'none'
                    }}
                  >
                    <span className="roadmap-node-number" style={{
                      color: isCompleted ? '#00ff88' : isNext ? meta.color : '#4a5a6a',
                      textShadow: isCompleted ? '0 0 8px rgba(0,255,136,0.5)' : isNext ? `0 0 10px ${meta.color}80` : 'none'
                    }}>
                      {stage.id}
                    </span>
                  </div>

                  { }
                  <div className="roadmap-node-label">
                    <span className="roadmap-planet-name" style={{
                      color: isCompleted ? '#5a8a6e' : isNext ? meta.color : '#3a4a5a'
                    }}>
                      {meta.name}
                    </span>
                    <span className="roadmap-stage-type" style={{
                      color: isCompleted ? '#4a6a5e' : isNext ? '#8ab8cc' : '#2a3a4a'
                    }}>
                      {desc.displayTitle}
                    </span>
                    <span className="roadmap-diff" style={{
                      color: isCompleted ? '#3a6a4e' : isNext ? meta.color : '#2a3a4a'
                    }}>
                      {diffIcons[meta.difficulty] || '★'}
                    </span>
                  </div>

                  { }
                  <div className="roadmap-hover-tooltip" style={{ '--accent': meta.color } as React.CSSProperties}>
                    <div className="roadmap-tooltip-arrow" />
                    <div className="roadmap-tooltip-header" style={{ borderBottomColor: `${meta.color}30` }}>
                      <span className="roadmap-tooltip-stage">LEVEL {stage.id}</span>
                      <span className="roadmap-tooltip-status" style={{
                        color: isCompleted ? '#00ff88' : isNext ? meta.color : '#6a7a8a',
                        background: isCompleted ? 'rgba(0,255,136,0.1)' : isNext ? `${meta.color}15` : 'rgba(100,120,140,0.1)',
                        borderColor: isCompleted ? 'rgba(0,255,136,0.3)' : isNext ? `${meta.color}40` : 'rgba(100,120,140,0.2)',
                      }}>
                        {isCompleted ? '✓ CLEARED' : isNext ? '▶ NEXT' : '⏳ PENDING'}
                      </span>
                    </div>
                    <div className="roadmap-tooltip-name" style={{ color: meta.color }}>{meta.name}</div>
                    <div className="roadmap-tooltip-type">{meta.type}</div>
                    <div className="roadmap-tooltip-diff">
                      <span>Difficulty:</span>
                      <span style={{ color: meta.color }}>{meta.difficulty} {diffIcons[meta.difficulty] || '★'}</span>
                    </div>
                    {isCompleted && getPlanetScore(stage.id, stage.id) > 0 && (
                      <div className="roadmap-tooltip-score">
                        <span>Score:</span>
                        <span style={{ color: '#00ff88' }}>{getPlanetScore(stage.id, stage.id).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="roadmap-tooltip-action" style={{
                      color: isCompleted ? '#00ff88' : isNext ? meta.color : '#4a5a6a',
                      borderColor: isCompleted ? 'rgba(0,255,136,0.3)' : isNext ? `${meta.color}40` : 'rgba(100,120,140,0.15)',
                    }}>
                      {isCompleted ? '↻ REPLAY MISSION' : isNext ? '→ START MISSION' : 'COMPLETE PREVIOUS'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default MainHub;
