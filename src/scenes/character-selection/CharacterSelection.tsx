import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { PerspectiveCamera, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import * as THREE from "three";

import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";
import { SpacemanPink, SpacemanWhite } from "../../components/models";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/useGameStore";
import type { Character } from "../../types/game.types";

import "./CharacterSelection.css";

type CandidateProfile = {
  id: Character;
  sequence: string;
  callsign: string;
  role: string;
  description: string;
  accent: string;
  accentRgb: string;
  metrics: readonly { label: string; value: number }[];
  traits: readonly string[];
};

const CANDIDATES: readonly CandidateProfile[] = [
  {
    id: "pink",
    sequence: "01",
    callsign: "NOVA",
    role: "EXPLORATION OFFICER",
    description:
      "Pilot adaptif dengan naluri eksplorasi kuat. Unggul saat misi membutuhkan keberanian dan improvisasi cepat.",
    accent: "#ff86c8",
    accentRgb: "255, 134, 200",
    metrics: [
      { label: "AGILITY", value: 91 },
      { label: "CURIOSITY", value: 96 },
      { label: "RESOLVE", value: 88 },
    ],
    traits: ["ADAPTIVE", "BRAVE", "CURIOUS"],
  },
  {
    id: "white",
    sequence: "02",
    callsign: "PULSE",
    role: "SYSTEMS OFFICER",
    description:
      "Pilot presisi dengan fokus teknis tinggi. Tetap tenang ketika sistem kritis membutuhkan keputusan terukur.",
    accent: "#77eaff",
    accentRgb: "119, 234, 255",
    metrics: [
      { label: "LOGIC", value: 95 },
      { label: "PRECISION", value: 93 },
      { label: "COMPOSURE", value: 90 },
    ],
    traits: ["PRECISE", "STEADY", "ANALYTIC"],
  },
];

const CalibrationParticles = ({ color }: { color: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 84;
    const values = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const ratio = index / count;
      const angle = ratio * Math.PI * 10 + Math.sin(index * 2.17);
      const radius = 1.85 + ((index * 37) % 19) * 0.055;
      values[index * 3] = Math.cos(angle) * radius;
      values[index * 3 + 1] = -2.15 + ((index * 29) % 83) / 14;
      values[index * 3 + 2] = Math.sin(angle) * radius * 0.64;
    }

    return values;
  }, []);

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.09;
    pointsRef.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.035}
        transparent
        opacity={0.72}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

const CalibrationPlatform = ({ color }: { color: string }) => {
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (innerRingRef.current) innerRingRef.current.rotation.z += delta * 0.2;
    if (outerRingRef.current) outerRingRef.current.rotation.z -= delta * 0.11;
    if (scanRef.current) {
      scanRef.current.position.y = -2.1 + ((clock.elapsedTime * 0.46) % 4.8);
      const material = scanRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.045 + Math.sin(clock.elapsedTime * 2.2) * 0.015;
    }
  });

  return (
    <group>
      <mesh position={[0, -2.26, 0]}>
        <cylinderGeometry args={[1.72, 1.92, 0.16, 64]} />
        <meshStandardMaterial color="#07131b" metalness={0.85} roughness={0.3} />
      </mesh>
      <group position={[0, -2.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <circleGeometry args={[1.58, 64]} />
          <meshStandardMaterial color="#0a202a" metalness={0.72} roughness={0.35} />
        </mesh>
        <mesh ref={innerRingRef} position={[0, 0, 0.012]}>
          <ringGeometry args={[1.12, 1.2, 64, 1, 0.2, Math.PI * 1.62]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={outerRingRef} position={[0, 0, 0.018]}>
          <ringGeometry args={[1.48, 1.53, 64, 1, 0.5, Math.PI * 1.38]} />
          <meshBasicMaterial color="#9ff3ff" transparent opacity={0.42} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh ref={scanRef} position={[0, -2.1, 0.15]} renderOrder={1}>
        <cylinderGeometry args={[1.45, 1.45, 0.025, 48, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh position={[0, 0.15, -0.35]}>
        <cylinderGeometry args={[1.25, 1.55, 5.1, 40, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.025}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

type CandidateStageProps = {
  candidate: CandidateProfile;
  onCycle: () => void;
  compact: boolean;
};

const CandidateStage = ({ candidate, onCycle, compact }: CandidateStageProps) => {
  const modelRef = useRef<THREE.Group>(null);
  const hitAreaRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!modelRef.current) return;

    const root = modelRef.current;
    gsap.killTweensOf([root.position, root.rotation, root.scale]);
    root.position.set(0, -2.3, -0.4);
    root.rotation.set(0, candidate.id === "pink" ? -0.72 : 0.72, 0);
    root.scale.setScalar(0.78);

    gsap.to(root.position, {
      y: -2.08,
      z: 0,
      duration: 0.85,
      ease: "power3.out",
    });
    gsap.to(root.rotation, {
      y: candidate.id === "pink" ? 0.12 : -0.12,
      duration: 1.05,
      ease: "power3.out",
    });
    gsap.to(root.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.72,
      ease: "back.out(1.35)",
    });

    return () => {
      gsap.killTweensOf([root.position, root.rotation, root.scale]);
    };
  }, [candidate.id]);

  useEffect(() => {
    if (!hitAreaRef.current) return;
    document.body.style.cursor = hovered ? "pointer" : "default";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [hovered]);

  useFrame(({ clock, pointer }) => {
    if (!modelRef.current) return;
    const time = clock.elapsedTime;
    const hoverBoost = hovered ? 1 : 0;
    const targetRotationY =
      (candidate.id === "pink" ? 0.12 : -0.12) + pointer.x * (0.13 + hoverBoost * 0.08);
    const targetRotationX = -pointer.y * 0.035;

    modelRef.current.rotation.y = THREE.MathUtils.lerp(
      modelRef.current.rotation.y,
      targetRotationY,
      0.045
    );
    modelRef.current.rotation.x = THREE.MathUtils.lerp(
      modelRef.current.rotation.x,
      targetRotationX,
      0.035
    );
    modelRef.current.position.y = -2.08 + Math.sin(time * 1.35) * 0.025;
  });

  return (
    <group>
      <CalibrationPlatform color={candidate.accent} />
      <CalibrationParticles color={candidate.accent} />

      <pointLight position={[-2.4, 2.4, 2.7]} color="#a7f5ff" intensity={18} distance={9} />
      <pointLight position={[2.2, 0.5, 2.2]} color={candidate.accent} intensity={14} distance={8} />
      <spotLight
        position={[0, 5.4, 1.8]}
        target-position={[0, 0, 0]}
        color="#dffbff"
        intensity={34}
        angle={0.42}
        penumbra={0.75}
        distance={11}
      />

      <group ref={modelRef} key={candidate.id}>
        {candidate.id === "pink" ? (
          <SpacemanPink scale={compact ? 0.59 : 0.69} motion="idle" />
        ) : (
          <SpacemanWhite scale={compact ? 0.59 : 0.69} motion="idle" />
        )}
      </group>

      <mesh
        ref={hitAreaRef}
        position={[0, -0.25, 0]}
        visible={false}
        onClick={(event) => {
          event.stopPropagation();
          onCycle();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <capsuleGeometry args={[1.25, 2.75, 8, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
};

const CameraDirector = ({
  compact,
  cameraRef,
}: {
  compact: boolean;
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
}) => {
  const lookTarget = useMemo(() => new THREE.Vector3(0, -0.05, 0), []);

  useFrame(({ clock, pointer }) => {
    const camera = cameraRef.current;
    if (!camera) return;
    const time = clock.elapsedTime;
    const targetX = pointer.x * (compact ? 0.12 : 0.28);
    const targetY = (compact ? 0.72 : 0.9) + pointer.y * 0.09 + Math.sin(time * 0.2) * 0.025;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.025);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.025);
    camera.lookAt(lookTarget);
  });

  return null;
};

const CandidateScene = ({
  candidate,
  onCycle,
  compact,
}: CandidateStageProps) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  return (
    <>
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, compact ? 0.72 : 0.9, compact ? 9.1 : 8.2]}
      fov={compact ? 55 : 48}
      near={0.1}
      far={220}
    />
    <CameraDirector compact={compact} cameraRef={cameraRef} />
    <color attach="background" args={["#03090e"]} />
    <fog attach="fog" args={["#03090e", 10, 30]} />
    <ambientLight intensity={0.46} color="#9ad9e6" />
    <directionalLight position={[-4, 7, 6]} intensity={2.2} color="#dffcff" />
    <Stars radius={80} depth={45} count={compact ? 700 : 1100} factor={2.8} saturation={0.25} fade speed={0.18} />
    <CandidateStage candidate={candidate} onCycle={onCycle} compact={compact} />
    </>
  );
};

const CharacterSelection = () => {
  const navigate = useNavigate();
  const { playSfx } = useGameAudio();
  const storedCharacter = useGameStore((state) => state.character);
  const setCharacter = useGameStore((state) => state.setCharacter);
  const [selected, setSelected] = useState<Character>(storedCharacter);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [interfaceReady, setInterfaceReady] = useState(false);
  const pointerStartX = useRef<number | null>(null);

  const candidateIndex = CANDIDATES.findIndex((candidate) => candidate.id === selected);
  const candidate = CANDIDATES[candidateIndex] ?? CANDIDATES[0];

  useEffect(() => {
    const updateViewport = () => {
      setIsCompact(window.innerWidth < 760 || window.innerHeight < 720);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    const revealTimer = window.setTimeout(() => setInterfaceReady(true), 120);

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.clearTimeout(revealTimer);
    };
  }, []);

  const selectCandidate = useCallback(
    (nextCandidate: Character) => {
      if (isCommitting || nextCandidate === selected) return;
      playSfx("uiTabSwitch");
      setSelected(nextCandidate);
    },
    [isCommitting, playSfx, selected]
  );

  const cycleCandidate = useCallback(
    (direction: -1 | 1) => {
      if (isCommitting) return;
      const nextIndex = (candidateIndex + direction + CANDIDATES.length) % CANDIDATES.length;
      playSfx("uiTabSwitch");
      setSelected(CANDIDATES[nextIndex].id);
    },
    [candidateIndex, isCommitting, playSfx]
  );

  const confirmCandidate = useCallback(() => {
    if (isCommitting) return;
    const confirmation = playSfx("uiConfirm");
    setIsCommitting(true);
    setCharacter(selected);
    window.setTimeout(
      () => navigate("/intro"),
      confirmation.motionMs + 100
    );
  }, [isCommitting, navigate, playSfx, selected, setCharacter]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") cycleCandidate(-1);
      if (event.key === "ArrowRight") cycleCandidate(1);
      if (event.key === "Enter") confirmCandidate();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [confirmCandidate, cycleCandidate]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 56) return;
    cycleCandidate(distance > 0 ? -1 : 1);
  };

  return (
    <main
      className={`cs-container ${interfaceReady ? "is-ready" : ""} ${
        isCommitting ? "is-committing" : ""
      }`}
      style={{ "--candidate-accent": candidate.accent, "--candidate-rgb": candidate.accentRgb } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <AdaptiveCanvas
        className="cs-canvas"
        dpr={[1, isCompact ? 1.15 : 1.4]}
        quality="auto"
        shadows
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.08;
        }}
      >
        <Suspense fallback={null}>
          <CandidateScene candidate={candidate} onCycle={() => cycleCandidate(1)} compact={isCompact} />
        </Suspense>
      </AdaptiveCanvas>

      <div className="cs-atmosphere" aria-hidden="true">
        <div className="cs-vignette" />
        <div className="cs-grid" />
        <div className="cs-scan" />
        <div className="cs-letterbox cs-letterbox-top" />
        <div className="cs-letterbox cs-letterbox-bottom" />
      </div>

      <div className="cs-interface">
        <header className="cs-topbar">
          <div className="cs-brand-lockup">
            <span className="cs-beacon" />
            <div>
              <span>CADET INDUCTION // 00</span>
              <strong>ORBITAL ACADEMY</strong>
            </div>
          </div>

          <div className="cs-link-state">
            <span>BIOMETRIC LINK</span>
            <div className="cs-link-track" aria-hidden="true">
              <i className="active" />
              <i className="active" />
              <i />
              <i />
            </div>
          </div>
        </header>

        <section className="cs-copy" aria-labelledby="candidate-heading">
          <span className="cs-kicker">PILOT CALIBRATION BAY</span>
          <h1 id="candidate-heading">
            Pilih siapa yang
            <em>memulai misi.</em>
          </h1>
          <p>
            Tinjau profil, putar kandidat, lalu kunci pilotmu. Pilihan ini akan
            dibawa ke seluruh perjalanan Space Academy.
          </p>
          <div className="cs-input-hint" aria-label="Kontrol">
            <span><kbd>←</kbd><kbd>→</kbd> GANTI PILOT</span>
            <span><kbd>ENTER</kbd> KONFIRMASI</span>
          </div>
        </section>

        <aside className="cs-dossier" aria-live="polite">
          <div className="cs-dossier-heading">
            <span>CANDIDATE DOSSIER</span>
            <strong>{candidate.sequence} / 02</strong>
          </div>
          <div className="cs-dossier-name">
            <span>CALLSIGN</span>
            <h2>{candidate.callsign}</h2>
            <p>{candidate.role}</p>
          </div>
          <p className="cs-dossier-description">{candidate.description}</p>

          <div className="cs-metrics">
            {candidate.metrics.map((metric) => (
              <div className="cs-metric" key={metric.label}>
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
                <div className="cs-metric-track">
                  <i style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="cs-traits">
            {candidate.traits.map((trait) => <span key={trait}>{trait}</span>)}
          </div>
        </aside>

        <div className="cs-stage-readout" aria-hidden="true">
          <span>LIVE BIOMETRIC SCAN</span>
          <strong>{candidate.callsign} // {candidate.sequence}</strong>
        </div>

        <nav className="cs-selector" aria-label="Pilih kandidat">
          <button
            className="cs-arrow"
            type="button"
            data-audio-cue="none"
            onClick={() => cycleCandidate(-1)}
            disabled={isCommitting}
            aria-label="Kandidat sebelumnya"
          >
            ←
          </button>

          <div className="cs-candidate-tabs" role="radiogroup" aria-label="Daftar kandidat">
            {CANDIDATES.map((item) => {
              const active = item.id === selected;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "active" : ""}
                  role="radio"
                  data-audio-cue="none"
                  aria-checked={active}
                  onClick={() => selectCandidate(item.id)}
                  disabled={isCommitting}
                >
                  <span>{item.sequence}</span>
                  <div>
                    <strong>{item.callsign}</strong>
                    <small>{item.role}</small>
                  </div>
                  <i aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <button
            className="cs-arrow"
            type="button"
            data-audio-cue="none"
            onClick={() => cycleCandidate(1)}
            disabled={isCommitting}
            aria-label="Kandidat berikutnya"
          >
            →
          </button>

          <button
            className="cs-confirm"
            type="button"
            data-audio-cue="none"
            onClick={confirmCandidate}
            disabled={isCommitting}
          >
            <span>{isCommitting ? "SYNCING PROFILE" : "LOCK PILOT"}</span>
            <strong>{isCommitting ? "•••" : "CONFIRM →"}</strong>
          </button>
        </nav>
      </div>

      <div className="cs-transition" aria-hidden={!isCommitting}>
        <div className="cs-transition-line" />
        <span>IDENTITY ACCEPTED</span>
        <strong>{candidate.callsign}</strong>
        <small>OPENING MISSION CHANNEL...</small>
      </div>
    </main>
  );
};

export default CharacterSelection;
