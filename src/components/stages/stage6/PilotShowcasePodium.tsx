import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

import AdaptiveCanvas from "../../common/AdaptiveCanvas";
import { SpacemanPink, SpacemanWhite } from "../../models";
import { SpacemanPet } from "../../models/SpacemanPet";
import { resolveSpacemanSuitColor } from "../../../constants/characterCustomization.constants";
import type {
  Character,
} from "../../../types/game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../../../types/customization.types";
import "./PilotShowcasePodium.css";

export interface PilotData {
  id: "P1" | "P2";
  name: string;
  role: string;
  character: Character;
  colorId: SpacemanColorId;
  hatId: SpacemanHatId;
  petId: SpacemanPetId;
  platform: "PC" | "MOBILE";
  totalScore: number;
  isReady: boolean;
  isConnected?: boolean;
}

interface PilotShowcasePodiumProps {
  p1Data: PilotData;
  p2Data?: PilotData | null;
  isOnlineCoop: boolean;
  isLocalCoop?: boolean;
  onToggleP1Ready?: () => void;
  onToggleP2Ready?: () => void;
  partyCode?: string;
  onCopyPartyCode?: () => void;
  copyFeedback?: boolean;
}

interface PilotMesh3DProps {
  character: Character;
  colorId: SpacemanColorId;
  hatId: SpacemanHatId;
  petId: SpacemanPetId;
  position: [number, number, number];
  isReady: boolean;
  isHostSlot?: boolean;
}

const PilotAvatar3D: React.FC<PilotMesh3DProps> = ({
  character,
  colorId,
  hatId,
  petId,
  position,
  isReady,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const suitColor = resolveSpacemanSuitColor(colorId);
  const CharacterModel = character === "pink" ? SpacemanPink : SpacemanWhite;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {

      groupRef.current.position.y = position[1] + Math.sin(t * 1.8 + position[0]) * 0.08;

      groupRef.current.rotation.y = Math.sin(t * 0.6 + position[0]) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
    }
  });

  const glowColor = isReady ? "#00ff88" : "#00f3ff";

  return (
    <group position={position}>

      <mesh position={[0, -1.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial
          color="#0d1b2a"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>


      <mesh ref={ringRef} position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.35, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isReady ? 0.95 : 0.6}
        />
      </mesh>


      <mesh position={[0, -1.81, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.75, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.35}
        />
      </mesh>


      <group ref={groupRef}>
        <CharacterModel
          scale={0.78}
          position={[0, -1.8, 0]}
          motion="idle"
          suitColor={suitColor}
          hatId={hatId}
        />


        {petId !== "none" && (
          <group position={[0.85, -1.72, 0.3]} scale={0.82}>
            <SpacemanPet petId={petId} />
          </group>
        )}
      </group>
    </group>
  );
};

export const PilotShowcasePodium: React.FC<PilotShowcasePodiumProps> = ({
  p1Data,
  p2Data,
  isOnlineCoop,
  isLocalCoop,
  onToggleP1Ready,
  onToggleP2Ready,
  partyCode,
  onCopyPartyCode,
  copyFeedback,
}) => {
  const hasP2 = !!p2Data && p2Data.isConnected !== false;

  return (
    <div className="pilot-showcase-container">

      <div className="pilot-podium-canvas-wrapper">
        <AdaptiveCanvas
          camera={{ position: [0, 0.2, 6.4], fov: 44 }}
          dpr={[1, 1.2]}
          quality="low"
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[0, 4, 5]} intensity={1.4} color="#ffffff" />
          <directionalLight position={[-4, 2, 2]} intensity={0.9} color="#00f3ff" />
          <directionalLight position={[4, 2, 2]} intensity={0.9} color="#ff007f" />
          <pointLight position={[0, -1, 3]} intensity={40} color="#00f3ff" />


          <Stars
            radius={80}
            depth={20}
            count={180}
            factor={4}
            saturation={0.5}
            fade
            speed={0.8}
          />


          <PilotAvatar3D
            character={p1Data.character}
            colorId={p1Data.colorId}
            hatId={p1Data.hatId}
            petId={p1Data.petId}
            position={[p2Data ? -1.35 : 0, 0, 0]}
            isReady={p1Data.isReady}
            isHostSlot={true}
          />


          {hasP2 && p2Data && (
            <PilotAvatar3D
              character={p2Data.character}
              colorId={p2Data.colorId}
              hatId={p2Data.hatId}
              petId={p2Data.petId}
              position={[1.35, 0, 0]}
              isReady={p2Data.isReady}
              isHostSlot={false}
            />
          )}
        </AdaptiveCanvas>
      </div>


      <div className="pilot-podium-overlay">

        <div className={`pilot-side-card ${!p2Data ? "centered" : "left-slot"} ${p1Data.isReady ? "ready" : ""}`}>
          <div className="pilot-slot-badge">
            <span className="platform-tag">
              {p1Data.platform === "MOBILE" ? "📱 MOBILE PILOT" : "💻 PC PILOT"}
            </span>
            <span className="slot-id">{p1Data.role}</span>
          </div>

          <div className="pilot-name-header">
            <h3 className="pilot-name">{p1Data.name}</h3>
          </div>

          <div className="pilot-stats-row">
            <div className="pilot-score-pill">
              <span className="score-star">★</span>
              <span className="score-label">TOTAL SCORE</span>
              <span className="score-value">{p1Data.totalScore.toLocaleString()}</span>
            </div>
          </div>

          <div className={`pilot-ready-status-badge ${p1Data.isReady ? "status-ready" : "status-waiting"}`}>
            <span className="status-indicator-dot" />
            <span className="status-text">{p1Data.isReady ? "READY ✓" : "PREPARING..."}</span>
          </div>

          {isLocalCoop && onToggleP1Ready && (
            <button
              type="button"
              className={`pilot-card-ready-toggle ${p1Data.isReady ? "ready" : ""}`}
              onClick={onToggleP1Ready}
            >
              {p1Data.isReady ? "P1: READY ✓" : "P1: KLIK READY"}
            </button>
          )}
        </div>


        {p2Data && (
          <div className={`pilot-side-card right-slot ${p2Data.isReady ? "ready" : ""} ${!hasP2 ? "unoccupied" : ""}`}>
            {hasP2 ? (
              <>
                <div className="pilot-slot-badge">
                  <span className="platform-tag">
                    {p2Data.platform === "MOBILE" ? "📱 MOBILE PILOT" : "💻 PC PILOT"}
                  </span>
                  <span className="slot-id">{p2Data.role}</span>
                </div>

                <div className="pilot-name-header">
                  <h3 className="pilot-name">{p2Data.name}</h3>
                </div>

                <div className="pilot-stats-row">
                  <div className="pilot-score-pill">
                    <span className="score-star">★</span>
                    <span className="score-label">TOTAL SCORE</span>
                    <span className="score-value">{p2Data.totalScore.toLocaleString()}</span>
                  </div>
                </div>

                <div className={`pilot-ready-status-badge ${p2Data.isReady ? "status-ready" : "status-waiting"}`}>
                  <span className="status-indicator-dot" />
                  <span className="status-text">{p2Data.isReady ? "READY ✓" : "PREPARING..."}</span>
                </div>

                {isLocalCoop && onToggleP2Ready && (
                  <button
                    type="button"
                    className={`pilot-card-ready-toggle ${p2Data.isReady ? "ready" : ""}`}
                    onClick={onToggleP2Ready}
                  >
                    {p2Data.isReady ? "P2: READY ✓" : "P2: KLIK READY"}
                  </button>
                )}
              </>
            ) : (

              <div className="pilot-slot-empty">
                <div className="empty-slot-icon">🛸</div>
                <div className="empty-slot-title">AWAITING CO-PILOT</div>
                <div className="empty-slot-desc">
                  Share this 6-digit Party Code with your squadmate:
                </div>
                {isOnlineCoop && partyCode && (
                  <div className="empty-code-badge" onClick={onCopyPartyCode}>
                    <code>{partyCode}</code>
                    <span className="copy-hint">{copyFeedback ? "COPIED! ✓" : "CLICK TO COPY"}</span>
                  </div>
                )}
                <div className="pilot-ready-status-badge status-waiting">
                  <span className="status-indicator-dot" />
                  <span className="status-text">SLOT OPEN...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default PilotShowcasePodium;
