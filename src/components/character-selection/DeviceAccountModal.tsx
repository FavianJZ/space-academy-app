import React, { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { SpacemanPink, SpacemanWhite, SpacemanPet } from "../models";
import {
  getSpacemanColorOption,
  getSpacemanHatOption,
  getSpacemanPetOption,
} from "../../constants/characterCustomization.constants";
import {
  fetchDeviceAccounts,
  activateDeviceAccount,
  prepareNewCadetSlot,
  type SavedDeviceAccount,
  MAX_ACCOUNTS_PER_DEVICE,
} from "../../services/deviceAccountService";
import { useGameAudio } from "../../hooks/useGameAudio";
import "./DeviceAccountModal.css";

interface DeviceAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreateNew?: () => void;
}

// 3D Mini Hero Stage with front-facing RPG hero stance & gentle breathing sway
const HeroStage = ({ account }: { account: SavedDeviceAccount }) => {
  const selectedColor = getSpacemanColorOption(account.spacemanColor);
  const selectedPet = getSpacemanPetOption(account.spacemanPet);
  const hasPet = account.spacemanPet !== "none";
  const suitColor = selectedColor.modelColor ?? undefined;
  const CharacterModel = account.character === "pink" ? SpacemanPink : SpacemanWhite;

  // Exact RPG hero stage positioning & sizing:
  // With pet: pilot slightly to the left, pet to the right, facing front with slight inwards angle
  // Without pet: pilot centered
  const pilotX = hasPet ? -0.32 : 0;
  const petX = 0.50;
  
  // Pilot scale: calibrated so crown / tall hats don't hit the top border, feet don't clip bottom
  const pilotScale = account.spacemanHat === "none" 
    ? (hasPet ? 0.48 : 0.52) 
    : (hasPet ? 0.42 : 0.46);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Front-facing subtle breathing and gentle hero turn (always facing user, ±7 degrees)
    groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.12;
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.02;
  });

  return (
    <group ref={groupRef}>
      {/* Pilot Model */}
      <group position={[pilotX, -1.08, 0]} rotation={[0, hasPet ? 0.10 : 0, 0]}>
        <CharacterModel
          scale={pilotScale}
          position={[0, 0, 0]}
          motion="idle"
          suitColor={suitColor}
          hatId={account.spacemanHat}
        />
        {/* Glowing holographic pedestal beneath pilot feet */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.30, 0.36, 32]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Pet Companion */}
      {hasPet && (
        <group position={[petX, -0.92, 0.15]} rotation={[0, -0.18, 0]} scale={0.68}>
          <SpacemanPet petId={account.spacemanPet} />
          {/* Companion holographic ring beneath pet */}
          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.28, 32]} />
            <meshBasicMaterial color={selectedPet.accent || "#00e5ff"} transparent opacity={0.35} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 3D Mini Hero Preview Canvas with balanced camera framing
const SlotHeroCanvas = ({ account }: { account: SavedDeviceAccount }) => {
  const selectedPet = getSpacemanPetOption(account.spacemanPet);
  const hasPet = account.spacemanPet !== "none";

  return (
    <div className="slot-canvas-wrap">
      <Canvas
        camera={{
          position: [hasPet ? 0.08 : 0, -0.34, 4.4],
          fov: 36,
        }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.1} color="#c8eeff" />
        <directionalLight position={[2, 4, 3.5]} intensity={2.0} color="#ffffff" />
        <directionalLight position={[-2.5, 2, 1.5]} intensity={1.2} color="#72ccff" />
        <pointLight position={[0, 0, 2.5]} intensity={2.2} color="#00ffcc" distance={6} />
        {hasPet && (
          <pointLight
            position={[0.55, -0.5, 2.0]}
            intensity={2.2}
            color={selectedPet.accent}
            distance={5}
          />
        )}

        <Suspense fallback={null}>
          <HeroStage account={account} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const DeviceAccountModal: React.FC<DeviceAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectCreateNew,
}) => {
  const navigate = useNavigate();
  const { playSfx } = useGameAudio();

  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [accounts, setAccounts] = useState<SavedDeviceAccount[]>([]);
  const [isFull, setIsFull] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetchDeviceAccounts();
      setDeviceId(res.deviceId);
      setAccounts(res.accounts);
      setIsFull(res.isFull);
    } catch (err) {
      console.error("[DeviceAccountModal] Failed to load device accounts:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectAccount = (acc: SavedDeviceAccount) => {
    playSfx("uiConfirm");
    activateDeviceAccount(acc);
    onClose();
    // Navigate straight to MainHub with this account
    navigate("/mainhub");
  };

  const handleCreateNew = () => {
    if (isFull) {
      playSfx("feedbackIncorrect");
      return;
    }
    playSfx("uiConfirm");
    prepareNewCadetSlot("pink");
    onClose();
    if (onSelectCreateNew) {
      onSelectCreateNew();
    }
  };

  return (
    <div className="dam-overlay" onClick={onClose}>
      <div className="dam-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="dam-header">
          <div className="dam-header-left">
            <div className="dam-icon-pulse">🎮</div>
            <div>
              <h2>DEVICE MEMORY & PILOT PROFILES</h2>
              <p>Sistem Kuota Perangkat: Maksimal 2 Akun Pilot per Device</p>
            </div>
          </div>

          <div className="dam-header-right">
            <button
              type="button"
              className={`dam-refresh-btn ${isRefreshing ? "spin" : ""}`}
              onClick={loadData}
              title="Cek Ulang Device & Sinkronisasi"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              className="dam-close-btn"
              onClick={onClose}
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Device Info Bar */}
        <div className="dam-device-bar">
          <div className="dam-device-id">
            <span className="dam-lbl">DEVICE ID:</span>
            <code>{deviceId || "DETECTING..."}</code>
          </div>

          <div className="dam-quota-pill-wrap">
            <span
              className={`dam-quota-pill ${
                isFull ? "full" : accounts.length > 0 ? "active" : "fresh"
              }`}
            >
              {accounts.length === 0
                ? "✨ FRESH DEVICE (0/2 AKUN)"
                : accounts.length === 1
                ? "🚀 1/2 AKUN TERDAFTAR"
                : "🔒 2/2 AKUN PENUH (BATAS DEVICE)"}
            </span>
          </div>
        </div>

        {/* Hero Save Slots */}
        <div className="dam-slots-container">
          {loading ? (
            <div className="dam-loading">
              <span className="dam-spinner" />
              <p>MEMINDAI PROFIL PERANGKAT...</p>
            </div>
          ) : (
            <>
              {/* Slot 1 */}
              <div
                className={`dam-slot-card ${
                  accounts[0] ? "occupied" : "empty"
                }`}
              >
                <div className="dam-slot-header">
                  <span className="dam-slot-badge">SLOT 01</span>
                  {accounts[0] && (
                    <span
                      className={`dam-status-tag ${
                        accounts[0].isGameCompleted ? "completed" : "in-progress"
                      }`}
                    >
                      {accounts[0].isGameCompleted
                        ? "🏆 TAMAT (COMPLETED)"
                        : `🚀 AKTIF (${accounts[0].visitedPlanetsCount}/6 SEKTOR)`}
                    </span>
                  )}
                </div>

                {accounts[0] ? (
                  <div className="dam-slot-body">
                    <SlotHeroCanvas account={accounts[0]} />

                    <div className="dam-slot-info">
                      <h3 className="dam-pilot-name">{accounts[0].name}</h3>
                      <div className="dam-pilot-meta">
                        <span>{accounts[0].major || "GENERAL"}</span>
                        {accounts[0].school && <span>• {accounts[0].school}</span>}
                      </div>

                      <div className="dam-score-box">
                        <span className="dam-score-lbl">HIGH SCORE</span>
                        <span className="dam-score-val">
                          {accounts[0].totalScore.toLocaleString()} PTS
                        </span>
                      </div>

                      <div className="dam-loadout-tags">
                        <span className="dam-tag">
                          🎨 {getSpacemanColorOption(accounts[0].spacemanColor).shortLabel}
                        </span>
                        {accounts[0].spacemanHat !== "none" && (
                          <span className="dam-tag">
                            🎩 {getSpacemanHatOption(accounts[0].spacemanHat).shortLabel}
                          </span>
                        )}
                        {accounts[0].spacemanPet !== "none" && (
                          <span className="dam-tag">
                            🐾 {getSpacemanPetOption(accounts[0].spacemanPet).shortLabel}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="dam-action-btn load"
                        onClick={() => handleSelectAccount(accounts[0])}
                      >
                        ▶ LOAD PILOT (LANJUTKAN)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dam-empty-slot">
                    <div className="dam-empty-icon">➕</div>
                    <h4>SLOT 01 KOSONG</h4>
                    <p>Perangkat ini belum memiliki akun di Slot 1.</p>
                    <button
                      type="button"
                      className="dam-action-btn create"
                      onClick={handleCreateNew}
                    >
                      + BUAT PILOT BARU
                    </button>
                  </div>
                )}
              </div>

              {/* Slot 2 */}
              <div
                className={`dam-slot-card ${
                  accounts[1] ? "occupied" : "empty"
                }`}
              >
                <div className="dam-slot-header">
                  <span className="dam-slot-badge">SLOT 02</span>
                  {accounts[1] && (
                    <span
                      className={`dam-status-tag ${
                        accounts[1].isGameCompleted ? "completed" : "in-progress"
                      }`}
                    >
                      {accounts[1].isGameCompleted
                        ? "🏆 TAMAT (COMPLETED)"
                        : `🚀 AKTIF (${accounts[1].visitedPlanetsCount}/6 SEKTOR)`}
                    </span>
                  )}
                </div>

                {accounts[1] ? (
                  <div className="dam-slot-body">
                    <SlotHeroCanvas account={accounts[1]} />

                    <div className="dam-slot-info">
                      <h3 className="dam-pilot-name">{accounts[1].name}</h3>
                      <div className="dam-pilot-meta">
                        <span>{accounts[1].major || "GENERAL"}</span>
                        {accounts[1].school && <span>• {accounts[1].school}</span>}
                      </div>

                      <div className="dam-score-box">
                        <span className="dam-score-lbl">HIGH SCORE</span>
                        <span className="dam-score-val">
                          {accounts[1].totalScore.toLocaleString()} PTS
                        </span>
                      </div>

                      <div className="dam-loadout-tags">
                        <span className="dam-tag">
                          🎨 {getSpacemanColorOption(accounts[1].spacemanColor).shortLabel}
                        </span>
                        {accounts[1].spacemanHat !== "none" && (
                          <span className="dam-tag">
                            🎩 {getSpacemanHatOption(accounts[1].spacemanHat).shortLabel}
                          </span>
                        )}
                        {accounts[1].spacemanPet !== "none" && (
                          <span className="dam-tag">
                            🐾 {getSpacemanPetOption(accounts[1].spacemanPet).shortLabel}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="dam-action-btn load"
                        onClick={() => handleSelectAccount(accounts[1])}
                      >
                        ▶ LOAD PILOT (LANJUTKAN)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dam-empty-slot">
                    <div className="dam-empty-icon">➕</div>
                    <h4>SLOT 02 KOSONG</h4>
                    <p>
                      {isFull
                        ? "Batas maksimal 2 akun per device tercapai."
                        : "Slot tersedia untuk mendaftarkan akun kedua pada device ini."}
                    </p>
                    <button
                      type="button"
                      className="dam-action-btn create"
                      onClick={handleCreateNew}
                      disabled={isFull}
                    >
                      {isFull ? "BATAS TERCAPAI" : "+ BUAT PILOT BARU"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Quota & Policy Notice */}
        <div className="dam-footer-notice">
          {isFull ? (
            <div className="dam-alert-full">
              <span>⚠️</span>
              <p>
                <strong>Batas 2 Akun Tercapai:</strong> Device ini sudah memiliki 2
                akun pilot. Untuk menjaga integritas penilaian, 1 perangkat
                dibatasi maksimal 2 pengguna. Silakan pilih salah satu hero di
                atas.
              </p>
            </div>
          ) : (
            <div className="dam-alert-avail">
              <span>💡</span>
              <p>
                <strong>Status Device Normal:</strong> Anda masih memiliki{" "}
                <strong>{MAX_ACCOUNTS_PER_DEVICE - accounts.length}</strong> slot
                tersedia untuk membuat akun baru pada perangkat ini.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
