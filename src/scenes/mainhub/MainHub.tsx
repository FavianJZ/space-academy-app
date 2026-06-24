import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import gsap from "gsap";

import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";
import { useGameStore } from "../../stores/useGameStore";
import { generateSamplePlanetLeaderboard } from "../../utils/leaderboardSeed";

import {
  Planet1,
  Planet2,
  Planet3,
  Planet4,
  Planet5,
  Planet6,
  SpacemanPink,
  SpacemanWhite,
} from "../../components/models";

import {
  DEFAULT_ACTIVE_PLAYERS,
  DIFFICULTY_ICONS,
  PLANET_IDS,
  PLANET_META,
  PLANET_RENDER_CONFIG,
  STAGE_DESCRIPTIONS,
} from "../../constants/planet.constants";

import type {
  PlanetData,
  PlanetId,
  PlanetMeta,
} from "../../types/planet.types";

import "./MainHub.css";

const CameraFollowPlanet: React.FC<{
  selectedPlanet: PlanetId | null;
  planetRefs: { [key in PlanetId]?: React.RefObject<THREE.Group | null> };
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
        ease: "power2.inOut",
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
}> = ({
  planet,
  radius,
  angle,
  scale,
  planetId,
  isVisited,
  isSelected,
  showNameLabel,
  meta,
  orbitFrozen,
  activePlayers,
  isNext,
  occluderRefs,
  onSelect,
  onHover,
  onRefReady,
  onMeshRefReady,
}) => {
  const ref = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [labelPosition, setLabelPosition] = useState<[number, number, number]>([
    0,
    -scale * 1.12,
    0,
  ]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orbitAngleRef = useRef<number>(angle);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
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
      const anchorWorld = new THREE.Vector3(
        centerWorld.x,
        bounds.min.y,
        centerWorld.z
      );
      const anchorLocal = ref.current.worldToLocal(anchorWorld);
      const labelGap = Math.max(
        (bounds.max.y - bounds.min.y) * 0.1,
        scale * 0.2
      );

      setLabelPosition([
        anchorLocal.x,
        anchorLocal.y - labelGap,
        anchorLocal.z,
      ]);
    };

    rafId = window.requestAnimationFrame(updateLabelPosition);

    return () => window.cancelAnimationFrame(rafId);
  }, [planetId, scale]);

  const handlePointerOver = useCallback(
    (event: any) => {
      event.stopPropagation();

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (!isHovered) {
        setIsHovered(true);
        onHover(planetId);

        if (groupRef.current) {
          gsap.to(groupRef.current.scale, {
            x: 1.15,
            y: 1.15,
            z: 1.15,
            duration: 0.3,
          });
        }
      }

      document.body.style.cursor = "pointer";
    },
    [isHovered, onHover, planetId]
  );

  const handlePointerOut = useCallback(
    (event: any) => {
      event.stopPropagation();

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
        onHover(null);

        if (groupRef.current) {
          gsap.to(groupRef.current.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3,
          });
        }

        document.body.style.cursor = "default";
        hoverTimeoutRef.current = null;
      }, 80);
    },
    [onHover]
  );

  useFrame((state, delta) => {
    if (!ref.current) return;

    const time = state.clock.getElapsedTime();

    if (!(orbitFrozen || isSelected)) {
      orbitAngleRef.current += delta * 0.1;
    }

    ref.current.position.x = Math.cos(orbitAngleRef.current) * radius;
    ref.current.position.z = Math.sin(orbitAngleRef.current) * radius;

    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += 0.005;
    }

    if (glowRef.current && isHovered) {
      const pulse = 1 + Math.sin(time * 4) * 0.08;
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
    <group ref={groupRef} onClick={handleClick}>
      <group ref={ref}>
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          visible={false}
        >
          <sphereGeometry args={[hitRadius, 32, 32]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        <group ref={planetMeshRef} scale={scale}>
          {planet}
        </group>

        <mesh
          ref={glowRef}
          rotation={[Math.PI / 2, 0, 0]}
          visible={showTooltip}
        >
          <torusGeometry args={[ringRadius, 0.04, 16, 100]} />
          <meshStandardMaterial
            color={meta.color}
            emissive={meta.color}
            emissiveIntensity={3}
            transparent
            opacity={showTooltip ? 0.9 : 0}
          />
        </mesh>

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

        {showTooltip && (
          <pointLight color={meta.color} intensity={5} distance={scale * 4} />
        )}

        {showNameLabel && (
          <Html
            position={labelPosition}
            center
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className={`planet-label ${
                isLabelActive ? "planet-label--active" : ""
              }`}
              style={{ color: meta.color }}
            >
              {meta.name}
            </div>
          </Html>
        )}

        {isNext && showNameLabel && !showTooltip && (
          <Html
            position={[0, Math.min(scale * 2.5, 4.5), 0]}
            center
            distanceFactor={6}
            zIndexRange={[25, 0]}
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="planet-start-here-indicator"
              style={{ "--accent": meta.color } as React.CSSProperties}
            >
              <div className="indicator-text">YOUR HERE</div>
              <div className="indicator-arrows">
                <span>▼</span>
                <span>▼</span>
                <span>▼</span>
              </div>
            </div>
          </Html>
        )}

        {showTooltip && (
          <Html
            position={[0, scale * 1.8, 0]}
            center
            distanceFactor={4}
            zIndexRange={[30, 0]}
            occlude={occluderRefs.length > 0 ? occluderRefs : undefined}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="planet-tooltip-hologram"
              style={{ "--accent": meta.color } as React.CSSProperties}
            >
              <div
                className="hologram-card"
                style={{
                  borderColor: meta.color,
                  boxShadow: `0 0 20px ${meta.color}30, inset 0 0 30px ${meta.color}08`,
                }}
              >
                <div
                  className="tooltip-corner tl"
                  style={{ borderColor: meta.color }}
                />
                <div
                  className="tooltip-corner tr"
                  style={{ borderColor: meta.color }}
                />
                <div
                  className="tooltip-corner bl"
                  style={{ borderColor: meta.color }}
                />
                <div
                  className="tooltip-corner br"
                  style={{ borderColor: meta.color }}
                />

                {activePlayers > 0 && (
                  <div className="hologram-players-badge">
                    <div className="hologram-players-avatar">
                      <span className="hologram-players-avatar-icon">👾</span>
                    </div>
                    <span className="hologram-players-count">
                      {activePlayers}
                    </span>
                    <span className="hologram-players-label">
                      player{activePlayers > 1 ? "s" : ""} playing
                    </span>
                    <span className="hologram-players-dot" />
                  </div>
                )}

                <div className="hologram-name">{meta.name}</div>
                <div
                  className="hologram-type"
                  style={{ borderColor: meta.color, color: meta.color }}
                >
                  {meta.type.toUpperCase()}
                </div>
                <div className="hologram-desc">{meta.description}</div>
                <div
                  className="hologram-divider"
                  style={{
                    background: `linear-gradient(90deg, ${meta.color}55, transparent)`,
                  }}
                />
                <div className="hologram-stats">
                  <span className="hologram-stat">
                    MISSIONS: <strong>{meta.missions}</strong>
                  </span>
                  <span className="hologram-stat">
                    DIFFICULTY{" "}
                    <span
                      className="hologram-diff-badge"
                      style={{
                        background: `${meta.color}22`,
                        color: meta.color,
                        borderColor: `${meta.color}55`,
                      }}
                    >
                      {meta.difficulty.toUpperCase()}
                    </span>
                  </span>
                </div>
                <div className="hologram-footer" style={{ color: meta.color }}>
                  {isVisited ? "✓ COMPLETED" : "CLICK TO BEGIN MISSION"}
                </div>
              </div>
              <div
                className="hologram-arrow"
                style={{ borderTopColor: meta.color }}
              />
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

const AvatarCharacterModel: React.FC<{ CharacterModel: React.FC<any> }> = ({
  CharacterModel,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      groupRef.current.position.y =
        Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08;
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
  const p2Phone = useGameStore((state) => state.p2Phone);
  const setP2Phone = useGameStore((state) => state.setP2Phone);
  const getPlanetLeaderboard = useGameStore(
    (state) => state.getPlanetLeaderboard
  );
  const addPlanetLeaderboardEntry = useGameStore(
    (state) => state.addPlanetLeaderboardEntry
  );
  const planetLeaderboards = useGameStore((state) => state.planetLeaderboards);
  const getPlanetScore = useGameStore((state) => state.getPlanetScore);
  const getTotalScore = useGameStore((state) => state.getTotalScore);

  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetId | null>(null);
  const [showPlanetUI, setShowPlanetUI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [hoveredRoadmapNode, setHoveredRoadmapNode] =
    useState<PlanetId | null>(null);
  const [showP2Modal, setShowP2Modal] = useState(false);
  const [p2FormName, setP2FormName] = useState(p2Name || "");
  const [p2FormPhone, setP2FormPhone] = useState(p2Phone || "");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

useEffect(() => {
  if (planetLeaderboards.length > 0) return;

  const sampleEntries = generateSamplePlanetLeaderboard();

  sampleEntries.forEach((entry) => {
    addPlanetLeaderboardEntry(entry);
  });
}, [addPlanetLeaderboardEntry, planetLeaderboards.length]);

  const [activePlayers, setActivePlayers] =
    useState<Record<PlanetId, number>>(DEFAULT_ACTIVE_PLAYERS);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlayers((previousPlayers) => {
        const nextPlayers = { ...previousPlayers };
        const count = Math.floor(Math.random() * 3) + 1;

        for (let index = 0; index < count; index++) {
          const planetId = (Math.floor(Math.random() * 6) + 1) as PlanetId;
          const delta = Math.floor(Math.random() * 5) - 2;

          nextPlayers[planetId] = Math.max(
            0,
            Math.min(20, previousPlayers[planetId] + delta)
          );
        }

        return nextPlayers;
      });
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, []);

  const planetRefs = useRef<{
    [key in PlanetId]?: React.RefObject<THREE.Group | null>;
  }>({}).current;

  const planetMeshRefs = useRef<{
    [key in PlanetId]?: React.RefObject<THREE.Group | null>;
  }>({}).current;

  const [, setPlanetMeshRefsVersion] = useState(0);

  const [hubPhase, setHubPhase] = useState<
    "story" | "character" | "input" | "hub"
  >(introCompleted || (playerData.name && playerData.major) ? "hub" : "story");

  useEffect(() => {
    if (playerData.name && playerData.major && !introCompleted) {
      setIntroCompleted(true);
    }
  }, [playerData, introCompleted, setIntroCompleted]);

  const [formData, setFormData] = useState({
    name: playerData.name || "",
    phone: playerData.phone || "",
    school: playerData.school || "",
    major: playerData.major || "",
  });

  const CharacterModel = character === "pink" ? SpacemanPink : SpacemanWhite;

  const planetComponents: Record<PlanetId, React.ReactNode> = {
    1: <Planet1 />,
    2: <Planet2 />,
    3: <Planet3 />,
    4: <Planet4 />,
    5: <Planet5 />,
    6: <Planet6 />,
  };

  const planetData: PlanetData[] = PLANET_RENDER_CONFIG.map((config) => ({
    ...config,
    component: planetComponents[config.id],
  }));

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

    for (let index = 1; index <= 6; index++) {
      stageList.push({
        id: index as PlanetId,
        completed: visitedPlanets.has(index as PlanetId),
      });
    }

    return {
      completedCount,
      totalStages,
      remainingStages,
      stageList,
      completionPercentage: Math.round((completedCount / totalStages) * 100),
    };
  };

  const stageStatus = getStageStatus();

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.name && formData.major) {
      setPlayerData({ ...playerData, ...formData } as any);
      setIntroCompleted(true);
      setHubPhase("hub");
    } else {
      alert("Please fill in Name and Major!");
    }
  };

  if (hubPhase === "story") {
    return (
      <div className="intro-story-container">
        <div className="story-content">
          <h1 className="story-warning-title">
            ⚠️ WARNING: COLLISION DETECTED ⚠️
          </h1>
          <p className="story-text">
            Your rocket has collided with an asteroid field! <br />
            Emergency landing initiated on Unknown Planet Sector 7...
          </p>
          <div className="story-actions">
            <button
              className="story-btn"
              onClick={() => setHubPhase("character")}
            >
              INITIATE EMERGENCY WAKEUP
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hubPhase === "character") {
    return (
      <div className="mh-charselect-container">
        <AdaptiveCanvas
          className="mh-charselect-canvas"
          dpr={[1, 1.25]}
          quality="auto"
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <pointLight
              position={[-4, 3, 2]}
              intensity={10}
              color="#ff69b4"
              distance={10}
            />
            <pointLight
              position={[4, 3, 2]}
              intensity={10}
              color="#6ce7ff"
              distance={10}
            />
            <Stars
              radius={200}
              depth={60}
              count={1400}
              factor={6}
              saturation={0.8}
              fade
              speed={0.5}
            />

            <group position={[-2.5, -0.5, 0]}>
              <AvatarCharacterModel CharacterModel={SpacemanPink} />
            </group>

            <group position={[2.5, -0.5, 0]}>
              <AvatarCharacterModel CharacterModel={SpacemanWhite} />
            </group>
          </Suspense>
        </AdaptiveCanvas>

        <div className="mh-charselect-overlay">
          <div className="mh-charselect-title">
            <h1>SELECT YOUR PILOT</h1>
            <p>Choose wisely, Space Cadet</p>
          </div>

          <div className="mh-charselect-cards">
            <button
              className={`mh-char-card pink ${
                character === "pink" ? "active" : ""
              }`}
              onClick={() => setCharacter("pink")}
            >
              <div className="mh-char-card-glow" />
              <div className="mh-char-card-inner">
                <span className="mh-char-icon">🚀</span>
                <h3>OFFICER PINK</h3>
                <p>Exploration Specialist</p>
                <div className="mh-char-traits">
                  <span>Agile</span>
                  <span>Curious</span>
                  <span>Brave</span>
                </div>
              </div>
              {character === "pink" && (
                <div className="mh-char-selected-badge">✓ SELECTED</div>
              )}
            </button>

            <button
              className={`mh-char-card white ${
                character === "white" ? "active" : ""
              }`}
              onClick={() => setCharacter("white")}
            >
              <div className="mh-char-card-glow" />
              <div className="mh-char-card-inner">
                <span className="mh-char-icon">🛸</span>
                <h3>OFFICER WHITE</h3>
                <p>Engineering Specialist</p>
                <div className="mh-char-traits">
                  <span>Smart</span>
                  <span>Precise</span>
                  <span>Steady</span>
                </div>
              </div>
              {character === "white" && (
                <div className="mh-char-selected-badge">✓ SELECTED</div>
              )}
            </button>
          </div>

          <button
            className="mh-confirm-btn"
            onClick={() => setHubPhase("input")}
          >
            <span className="mh-confirm-text">CONFIRM SELECTION</span>
            <span className="mh-confirm-arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  if (hubPhase === "input") {
    return (
      <div className="player-input-container">
        <div className="input-card">
          <h2 className="input-card-title">
            SYSTEM REBOOT: PILOT DATA REQUIRED
          </h2>
          <p className="input-card-subtitle">
            AI: "Welcome back, Pilot. I need to verify your identity to unlock
            the navigation controls."
          </p>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label>PILOT NAME</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label>PHONE NUMBER</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) =>
                  setFormData({ ...formData, phone: event.target.value })
                }
                placeholder="08..."
              />
            </div>

            <div className="form-group">
              <label>SCHOOL / ACADEMY</label>
              <input
                type="text"
                value={formData.school}
                onChange={(event) =>
                  setFormData({ ...formData, school: event.target.value })
                }
                placeholder="High School Name"
              />
            </div>

            <div className="form-group form-group-last">
              <label>SPECIALIZATION (MAJOR)</label>
              <select
                value={formData.major}
                onChange={(event) =>
                  setFormData({ ...formData, major: event.target.value })
                }
                required
              >
                <option value="">Select Major...</option>
                <option value="IPA">IPA (Science)</option>
                <option value="IPS">IPS (Social)</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">
              ACCESS NAVIGATION
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        position: "relative",
      }}
    >
      <AdaptiveCanvas
        camera={{ position: [0, 5, 25], fov: 60 }}
        dpr={[1, 1.25]}
        quality="auto"
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 10, 0]} intensity={1000} color="#ffdfb3" />
          <Stars
            radius={300}
            depth={50}
            count={1800}
            factor={10}
            saturation={0}
            fade
            speed={1}
          />

          {planetData.map((data, index) => {
            const firstUncompleted = stageStatus.stageList.find(
              (stage) => !stage.completed
            );
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
                meta={PLANET_META[data.id]}
                orbitFrozen={hoveredPlanet !== null || selectedPlanet !== null}
                activePlayers={activePlayers[data.id]}
                isNext={isNext}
                occluderRefs={PLANET_IDS.filter((id) => id !== data.id)
                  .map((id) => planetMeshRefs[id])
                  .filter(
                    (ref): ref is React.RefObject<THREE.Group | null> => !!ref
                  )
                  .map(
                    (ref) =>
                      ref as unknown as React.RefObject<THREE.Object3D>
                  )}
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
          <CameraFollowPlanet
            selectedPlanet={selectedPlanet}
            planetRefs={planetRefs}
          />
        </Suspense>
        <OrbitControls />
      </AdaptiveCanvas>

      {showPlanetUI && selectedPlanet && (
        <div
          className="planet-selection-ui"
          style={{
            borderColor: PLANET_META[selectedPlanet].color,
            boxShadow: `0 0 30px ${
              PLANET_META[selectedPlanet].color
            }50, inset 0 0 20px ${PLANET_META[selectedPlanet].color}15`,
          }}
        >
          {selectedPlanet === 6 && (
            <button
              className={`boss-mode-toggle ${bossMode ? "active" : ""}`}
              onClick={() => {
                if (!bossMode) {
                  resetBossHP();
                }

                setBossMode(!bossMode);
              }}
            >
              {bossMode ? "BOSS MODE" : "NORMAL MODE"}
            </button>
          )}

          <div className="planet-info">
            {selectedPlanet &&
              visitedPlanets.has(selectedPlanet) &&
              (() => {
                const score = getPlanetScore(selectedPlanet, selectedPlanet);
                const totalScore = getTotalScore();

                return (
                  <div className="planet-completed-banner">
                    <div className="planet-completed-icon">✅</div>
                    <div className="planet-completed-text">
                      MISSION COMPLETED
                    </div>
                    <div className="planet-completed-stats">
                      <div className="planet-completed-stat">
                        <span className="planet-completed-stat-label">
                          LAST SCORE
                        </span>
                        <span
                          className="planet-completed-stat-value"
                          style={{ color: PLANET_META[selectedPlanet].color }}
                        >
                          {score > 0 ? score.toLocaleString() : "—"}
                        </span>
                      </div>
                      <div className="planet-completed-stat-divider" />
                      <div className="planet-completed-stat">
                        <span className="planet-completed-stat-label">
                          TOTAL SCORE
                        </span>
                        <span
                          className="planet-completed-stat-value"
                          style={{ color: "#00ffff" }}
                        >
                          {totalScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="planet-completed-stat-divider" />
                      <div className="planet-completed-stat">
                        <span className="planet-completed-stat-label">
                          STATUS
                        </span>
                        <span className="planet-completed-stat-value planet-completed-cleared">
                          CLEARED ★
                        </span>
                      </div>
                    </div>
                    <div className="planet-completed-hint">
                      You can replay this mission to improve your score!
                    </div>
                  </div>
                );
              })()}

            {activePlayers[selectedPlanet] > 0 && (
              <div className="planet-ui-players">
                <span className="planet-ui-players-icon">👾</span>
                <span className="planet-ui-players-count">
                  {activePlayers[selectedPlanet]}
                </span>
                <span className="planet-ui-players-label">
                  player{activePlayers[selectedPlanet] > 1 ? "s" : ""}{" "}
                  currently exploring
                </span>
                <span className="planet-ui-players-dot" />
              </div>
            )}

            <h2 style={{ color: PLANET_META[selectedPlanet].color }}>
              {PLANET_META[selectedPlanet].name}
            </h2>

            <div
              className="planet-info-type"
              style={{ color: PLANET_META[selectedPlanet].color }}
            >
              {PLANET_META[selectedPlanet].type.toUpperCase()}
            </div>

            <p>{PLANET_META[selectedPlanet].description}</p>

            <div className="planet-info-meta">
              <span>
                {STAGE_DESCRIPTIONS[selectedPlanet].title}:{" "}
                {STAGE_DESCRIPTIONS[selectedPlanet].description}
                {selectedPlanet === 6 && bossMode ? " — Boss Mode" : ""}
              </span>
            </div>

            {selectedPlanet !== 1 && (
              <button
                className={`planet-lb-toggle ${
                  showLeaderboard ? "active" : ""
                }`}
                style={{
                  borderColor: `${PLANET_META[selectedPlanet].color}66`,
                  color: PLANET_META[selectedPlanet].color,
                }}
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                🏆 {showLeaderboard ? "HIDE LEADERBOARD" : "VIEW LEADERBOARD"}
              </button>
            )}

            {selectedPlanet !== 1 &&
              showLeaderboard &&
              (() => {
                const fullLeaderboard = getPlanetLeaderboard(selectedPlanet);
                const top10 = fullLeaderboard.slice(0, 10);
                const currentPlayerName = playerData.name || "CADET";

                const playerIndex = fullLeaderboard.findIndex(
                  (entry) => entry.playerName === currentPlayerName
                );
                const playerInTop10 = playerIndex >= 0 && playerIndex < 10;
                const playerEntry =
                  playerIndex >= 0 ? fullLeaderboard[playerIndex] : null;
                const playerRank = playerIndex >= 0 ? playerIndex + 1 : null;

                const playerPlanetScore = getPlanetScore(
                  selectedPlanet,
                  selectedPlanet
                );
                const showPlayerRow =
                  !playerInTop10 && (playerEntry || playerPlanetScore > 0);

                return (
                  <div
                    className="planet-lb-container"
                    style={{
                      borderColor: `${PLANET_META[selectedPlanet].color}33`,
                    }}
                  >
                    <div className="planet-lb-header">
                      <span
                        className="planet-lb-title"
                        style={{ color: PLANET_META[selectedPlanet].color }}
                      >
                        🏆 TOP PILOTS —{" "}
                        {PLANET_META[selectedPlanet].name.toUpperCase()}
                      </span>
                    </div>

                    {fullLeaderboard.length === 0 && !playerPlanetScore ? (
                      <div className="planet-lb-empty">
                        No records yet. Be the first!
                      </div>
                    ) : (
                      <div className="planet-lb-table">
                        <div className="planet-lb-row planet-lb-row-header">
                          <span className="planet-lb-rank">#</span>
                          <span className="planet-lb-name">PILOT</span>
                          <span className="planet-lb-score">SCORE</span>
                          <span className="planet-lb-time">TIME</span>
                        </div>

                        {top10.map((entry, index) => {
                          const minutes = Math.floor(
                            entry.completionTime / 60
                          );
                          const seconds = entry.completionTime % 60;
                          const timeString = `${minutes}m ${
                            seconds < 10 ? "0" : ""
                          }${seconds}s`;
                          const medal =
                            index === 0
                              ? "🥇"
                              : index === 1
                                ? "🥈"
                                : index === 2
                                  ? "🥉"
                                  : "";
                          const isCurrentPlayer =
                            entry.playerName === currentPlayerName;

                          return (
                            <div
                              key={index}
                              className={`planet-lb-row ${
                                index < 3 ? `planet-lb-top${index + 1}` : ""
                              } ${isCurrentPlayer ? "planet-lb-you" : ""}`}
                            >
                              <span className="planet-lb-rank">
                                {medal || index + 1}
                              </span>
                              <span className="planet-lb-name">
                                {entry.playerName}
                                {isCurrentPlayer ? " (YOU)" : ""}
                              </span>
                              <span
                                className="planet-lb-score"
                                style={{
                                  color: PLANET_META[selectedPlanet].color,
                                }}
                              >
                                {entry.score.toLocaleString()}
                              </span>
                              <span className="planet-lb-time">
                                {timeString}
                              </span>
                            </div>
                          );
                        })}

                        {showPlayerRow && (
                          <>
                            <div className="planet-lb-separator">
                              <span>· · ·</span>
                            </div>
                            <div className="planet-lb-row planet-lb-you">
                              <span className="planet-lb-rank">
                                {playerRank
                                  ? `${playerRank}`
                                  : `${fullLeaderboard.length + 1}+`}
                              </span>
                              <span className="planet-lb-name">
                                {currentPlayerName} (YOU)
                              </span>
                              <span
                                className="planet-lb-score"
                                style={{
                                  color: PLANET_META[selectedPlanet].color,
                                }}
                              >
                                {playerEntry
                                  ? playerEntry.score.toLocaleString()
                                  : playerPlanetScore.toLocaleString()}
                              </span>
                              <span className="planet-lb-time">
                                {playerEntry
                                  ? (() => {
                                      const minutes = Math.floor(
                                        playerEntry.completionTime / 60
                                      );
                                      const seconds =
                                        playerEntry.completionTime % 60;

                                      return `${minutes}m ${
                                        seconds < 10 ? "0" : ""
                                      }${seconds}s`;
                                    })()
                                  : "—"}
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
              <button
                className="depart-btn"
                style={{
                  borderColor: PLANET_META[selectedPlanet].color,
                  color: PLANET_META[selectedPlanet].color,
                  boxShadow: `0 0 10px ${
                    PLANET_META[selectedPlanet].color
                  }30`,
                }}
                onClick={() => {
                  if (selectedPlanet === 6 && bossMode) {
                    setP2FormName(p2Name || "");
                    setP2FormPhone(p2Phone || "");
                    setShowP2Modal(true);
                  } else {
                    handleDepart();
                  }
                }}
              >
                {visitedPlanets.has(selectedPlanet) ? "REPLAY" : "DEPART"}
              </button>

              <button className="back-btn" onClick={handleBack}>
                BACK
              </button>
            </div>
          </div>
        </div>
      )}

      {showP2Modal && (
        <div
          className="p2-modal-overlay"
          onClick={() => setShowP2Modal(false)}
        >
          <div className="p2-modal" onClick={(event) => event.stopPropagation()}>
            <div className="p2-modal-header">
              <div className="p2-modal-icon">🎮</div>
              <h3 className="p2-modal-title">CO-OP MODE</h3>
              <p className="p2-modal-subtitle">Enter Player 2 Identity</p>
            </div>

            <div className="p2-modal-body">
              <div className="p2-modal-player p2-modal-p1">
                <div
                  className="p2-player-badge"
                  style={{ borderColor: "#00ffff" }}
                >
                  <span className="p2-player-id" style={{ color: "#00ffff" }}>
                    P1
                  </span>
                  <span className="p2-player-role">Mouse Pilot</span>
                </div>
                <div className="p2-player-name" style={{ color: "#00ffff" }}>
                  {(playerData.name || "CADET").toUpperCase()}
                </div>
              </div>

              <div className="p2-modal-vs">VS</div>

              <div className="p2-modal-player p2-modal-p2">
                <div
                  className="p2-player-badge"
                  style={{ borderColor: "#ffb703" }}
                >
                  <span className="p2-player-id" style={{ color: "#ffb703" }}>
                    P2
                  </span>
                  <span className="p2-player-role">Numpad Runner</span>
                </div>

                <input
                  className="p2-name-input"
                  type="text"
                  placeholder="Enter P2 Name..."
                  value={p2FormName}
                  onChange={(event) => setP2FormName(event.target.value)}
                  maxLength={20}
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && p2FormName.trim()) {
                      setP2Name(p2FormName.trim());
                      setP2Phone(p2FormPhone.trim());
                      setShowP2Modal(false);
                      handleDepart();
                    }
                  }}
                />

                <input
                  className="p2-name-input"
                  type="tel"
                  placeholder="Phone Number (optional)..."
                  value={p2FormPhone}
                  onChange={(event) => setP2FormPhone(event.target.value)}
                  maxLength={16}
                  style={{ marginTop: "8px" }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && p2FormName.trim()) {
                      setP2Name(p2FormName.trim());
                      setP2Phone(p2FormPhone.trim());
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
                    setP2Phone(p2FormPhone.trim());
                    setShowP2Modal(false);
                    handleDepart();
                  }
                }}
              >
                🚀 START RAID
              </button>

              <button
                className="p2-skip-btn"
                onClick={() => {
                  setBossMode(false);
                  setShowP2Modal(false);
                  handleDepart();
                }}
              >
                Skip → Solo Mode
              </button>
            </div>
          </div>
        </div>
      )}

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
                onChange={(event) =>
                  setMusicVolume(parseFloat(event.target.value))
                }
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
                onChange={(event) =>
                  setSfxVolume(parseFloat(event.target.value))
                }
              />
            </div>

            <button
              className="close-settings-btn"
              onClick={() => setShowSettings(false)}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <div className="welcome-message">
        <h1>WELCOME, {playerData.name || "CADET"}</h1>
        <p>CLICK A PLANET TO BEGIN YOUR MISSION</p>
        <div className="hub-buttons">
          <button
            className="leaderboard-btn"
            onClick={() => navigate("/leaderboard")}
          >
            VIEW LEADERBOARD
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            SETTINGS
          </button>
        </div>
      </div>

      <div className="top-right-area">
        <div
          className={`character-avatar-wrapper ${
            avatarHovered ? "hovered" : ""
          }`}
          onMouseEnter={() => setAvatarHovered(true)}
          onMouseLeave={() => setAvatarHovered(false)}
        >
          <div className={`character-avatar-ring ${character}`}>
            <div className="character-avatar-canvas">
              <AdaptiveCanvas
                camera={{ position: [0, 0.5, 3.5], fov: 40 }}
                style={{ background: "transparent" }}
                dpr={[1, 1.1]}
                quality="low"
                gl={{ alpha: true }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={1} />
                  <directionalLight position={[2, 3, 4]} intensity={1.4} />
                  <directionalLight
                    position={[-2, 1, -1]}
                    intensity={0.6}
                    color="#88ccff"
                  />
                  <AvatarCharacterModel CharacterModel={CharacterModel} />
                </Suspense>
              </AdaptiveCanvas>
            </div>
          </div>
          <div className={`avatar-pulse-ring ${character}`} />
        </div>
      </div>

      {!showPlanetUI && (
        <div className="level-roadmap-bar">
          <div className="roadmap-connector-track">
            <div
              className="roadmap-connector-fill"
              style={{
                width: `${Math.max(
                  0,
                  (stageStatus.completedCount / (stageStatus.totalStages - 1)) *
                    100
                )}%`,
              }}
            />
          </div>

          <div className="roadmap-nodes">
            {stageStatus.stageList.map((stage, index) => {
              const meta = PLANET_META[stage.id];
              const description = STAGE_DESCRIPTIONS[stage.id];

              const firstUncompleted = stageStatus.stageList.find(
                (item) => !item.completed
              );
              const isNext = firstUncompleted?.id === stage.id;
              const isCompleted = stage.completed;

              return (
                <div
                  key={stage.id}
                  className={`roadmap-node ${
                    isCompleted ? "completed" : ""
                  } ${isNext ? "next-level" : ""} ${
                    !isCompleted && !isNext ? "locked" : ""
                  } ${hoveredRoadmapNode === stage.id ? "hovered" : ""}`}
                  onClick={() => handlePlanetSelect(stage.id)}
                  onMouseEnter={() => setHoveredRoadmapNode(stage.id)}
                  onMouseLeave={() => setHoveredRoadmapNode(null)}
                  style={
                    {
                      "--node-color": meta.color,
                      "--node-idx": index,
                    } as React.CSSProperties
                  }
                >
                  {isNext && (
                    <>
                      <div
                        className="roadmap-beacon"
                        style={{ borderColor: meta.color }}
                      />
                      <div
                        className="roadmap-beacon roadmap-beacon-2"
                        style={{ borderColor: meta.color }}
                      />
                    </>
                  )}

                  {isCompleted && (
                    <div className="roadmap-check-overlay">✓</div>
                  )}

                  <div
                    className="roadmap-hover-ring"
                    style={{ borderColor: meta.color }}
                  />

                  <div
                    className="roadmap-node-shape"
                    style={{
                      borderColor: isCompleted
                        ? "rgba(0,255,136,0.6)"
                        : isNext
                          ? meta.color
                          : "rgba(100,120,140,0.4)",
                      background: isCompleted
                        ? "rgba(0,255,136,0.1)"
                        : isNext
                          ? `linear-gradient(135deg, ${meta.color}22, ${meta.color}08)`
                          : "rgba(10,20,35,0.7)",
                      boxShadow: isCompleted
                        ? "0 0 15px rgba(0,255,136,0.3), inset 0 0 10px rgba(0,255,136,0.05)"
                        : isNext
                          ? `0 0 20px ${meta.color}40, 0 0 40px ${meta.color}15`
                          : "none",
                    }}
                  >
                    <span
                      className="roadmap-node-number"
                      style={{
                        color: isCompleted
                          ? "#00ff88"
                          : isNext
                            ? meta.color
                            : "#4a5a6a",
                        textShadow: isCompleted
                          ? "0 0 8px rgba(0,255,136,0.5)"
                          : isNext
                            ? `0 0 10px ${meta.color}80`
                            : "none",
                      }}
                    >
                      {stage.id}
                    </span>
                  </div>

                  <div className="roadmap-node-label">
                    <span
                      className="roadmap-planet-name"
                      style={{
                        color: isCompleted
                          ? "#5a8a6e"
                          : isNext
                            ? meta.color
                            : "#3a4a5a",
                      }}
                    >
                      {meta.name}
                    </span>
                    <span
                      className="roadmap-stage-type"
                      style={{
                        color: isCompleted
                          ? "#4a6a5e"
                          : isNext
                            ? "#8ab8cc"
                            : "#2a3a4a",
                      }}
                    >
                      {description.displayTitle}
                    </span>
                    <span
                      className="roadmap-diff"
                      style={{
                        color: isCompleted
                          ? "#3a6a4e"
                          : isNext
                            ? meta.color
                            : "#2a3a4a",
                      }}
                    >
                      {DIFFICULTY_ICONS[meta.difficulty] || "★"}
                    </span>
                  </div>

                  <div
                    className="roadmap-hover-tooltip"
                    style={{ "--accent": meta.color } as React.CSSProperties}
                  >
                    <div className="roadmap-tooltip-arrow" />
                    <div
                      className="roadmap-tooltip-header"
                      style={{ borderBottomColor: `${meta.color}30` }}
                    >
                      <span className="roadmap-tooltip-stage">
                        LEVEL {stage.id}
                      </span>
                      <span
                        className="roadmap-tooltip-status"
                        style={{
                          color: isCompleted
                            ? "#00ff88"
                            : isNext
                              ? meta.color
                              : "#6a7a8a",
                          background: isCompleted
                            ? "rgba(0,255,136,0.1)"
                            : isNext
                              ? `${meta.color}15`
                              : "rgba(100,120,140,0.1)",
                          borderColor: isCompleted
                            ? "rgba(0,255,136,0.3)"
                            : isNext
                              ? `${meta.color}40`
                              : "rgba(100,120,140,0.2)",
                        }}
                      >
                        {isCompleted ? "✓ CLEARED" : isNext ? "▶ NEXT" : "⏳ PENDING"}
                      </span>
                    </div>

                    <div
                      className="roadmap-tooltip-name"
                      style={{ color: meta.color }}
                    >
                      {meta.name}
                    </div>
                    <div className="roadmap-tooltip-type">{meta.type}</div>

                    <div className="roadmap-tooltip-diff">
                      <span>Difficulty:</span>
                      <span style={{ color: meta.color }}>
                        {meta.difficulty}{" "}
                        {DIFFICULTY_ICONS[meta.difficulty] || "★"}
                      </span>
                    </div>

                    {isCompleted && getPlanetScore(stage.id, stage.id) > 0 && (
                      <div className="roadmap-tooltip-score">
                        <span>Score:</span>
                        <span style={{ color: "#00ff88" }}>
                          {getPlanetScore(stage.id, stage.id).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div
                      className="roadmap-tooltip-action"
                      style={{
                        color: isCompleted
                          ? "#00ff88"
                          : isNext
                            ? meta.color
                            : "#4a5a6a",
                        borderColor: isCompleted
                          ? "rgba(0,255,136,0.3)"
                          : isNext
                            ? `${meta.color}40`
                            : "rgba(100,120,140,0.15)",
                      }}
                    >
                      {isCompleted
                        ? "↻ REPLAY MISSION"
                        : isNext
                          ? "→ START MISSION"
                          : "COMPLETE PREVIOUS"}
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