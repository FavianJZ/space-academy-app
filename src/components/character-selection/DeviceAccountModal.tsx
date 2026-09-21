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
  syncAllLocalAccountsToSupabase,
  removeDeviceAccount,
  clearAllDeviceAccounts,
  getLocalDeviceId,
  type SavedDeviceAccount,
  MAX_ACCOUNTS_PER_DEVICE,
} from "../../services/deviceAccountService";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import "./DeviceAccountModal.css";

interface DeviceAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreateNew?: () => void;
}


const HeroStage = ({ account }: { account: SavedDeviceAccount }) => {
  const selectedColor = getSpacemanColorOption(account.spacemanColor);
  const selectedPet = getSpacemanPetOption(account.spacemanPet);
  const hasPet = account.spacemanPet !== "none";
  const suitColor = selectedColor.modelColor ?? undefined;
  const CharacterModel = account.character === "pink" ? SpacemanPink : SpacemanWhite;


  const pilotX = hasPet ? -0.32 : 0;
  const petX = 0.50;


  const pilotScale = account.spacemanHat === "none"
    ? (hasPet ? 0.48 : 0.52)
    : (hasPet ? 0.42 : 0.46);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.rotation.y = Math.sin(t * 0.9) * 0.12;
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.02;
  });

  return (
    <group ref={groupRef}>

      <group position={[pilotX, -1.08, 0]} rotation={[0, hasPet ? 0.10 : 0, 0]}>
        <CharacterModel
          scale={pilotScale}
          position={[0, 0, 0]}
          motion="idle"
          suitColor={suitColor}
          hatId={account.spacemanHat}
        />

        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.30, 0.36, 32]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.4} />
        </mesh>
      </group>


      {hasPet && (
        <group position={[petX, -0.92, 0.15]} rotation={[0, -0.18, 0]} scale={0.68}>
          <SpacemanPet petId={account.spacemanPet} />

          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.28, 32]} />
            <meshBasicMaterial color={selectedPet.accent || "#00e5ff"} transparent opacity={0.35} />
          </mesh>
        </group>
      )}
    </group>
  );
};


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
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).deviceModal;

  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [accounts, setAccounts] = useState<SavedDeviceAccount[]>([]);
  const [isFull, setIsFull] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsRefreshing(true);
      await syncAllLocalAccountsToSupabase().catch((e) =>
        console.warn("[DeviceAccountModal] Auto sync warning:", e)
      );
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

    navigate("/mainhub");
  };

  const handleRemoveAccount = (index: number) => {
    const acc = accounts[index];
    const confirmMsg =
      language === "en"
        ? `Remove account "${acc?.name}" from this device?`
        : `Hapus akun "${acc?.name}" dari perangkat ini?`;
    if (!window.confirm(confirmMsg)) return;

    playSfx("uiConfirm");
    const updated = removeDeviceAccount(index);
    setAccounts([...updated]);
    setIsFull(updated.length >= MAX_ACCOUNTS_PER_DEVICE);
  };

  const handleClearAll = () => {
    const confirmMsg =
      language === "en"
        ? "Reset all account data from this device memory and start fresh?"
        : "Reset semua data akun dari memori perangkat ini dan mulai baru?";
    if (!window.confirm(confirmMsg)) return;

    playSfx("uiConfirm");
    clearAllDeviceAccounts();
    setAccounts([]);
    setIsFull(false);
    setDeviceId(getLocalDeviceId());
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

        <div className="dam-header">
          <div className="dam-header-left">
            <div className="dam-icon-pulse">🎮</div>
            <div>
              <h2>{t.title}</h2>
              <p>{t.subtitle}</p>
            </div>
          </div>

          <div className="dam-header-right">
            <button
              type="button"
              className="dam-reset-btn"
              onClick={handleClearAll}
              title={language === "en" ? "Reset device memory" : "Reset perangkat"}
            >
              🧹 {language === "en" ? "Reset Device" : "Reset Perangkat"}
            </button>
            <button
              type="button"
              className="dam-refresh-btn"
              onClick={loadData}
              disabled={isRefreshing}
              title={t.refreshTitle}
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              className="dam-close-btn"
              onClick={onClose}
              aria-label={t.closeBtn}
            >
              ✕
            </button>
          </div>
        </div>


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
                ? (language === "en" ? "✨ FRESH DEVICE (0/2 ACCOUNTS)" : "✨ FRESH DEVICE (0/2 AKUN)")
                : accounts.length === 1
                ? (language === "en" ? "🚀 1/2 ACCOUNT REGISTERED" : "🚀 1/2 AKUN TERDAFTAR")
                : (language === "en" ? "🔒 2/2 ACCOUNTS FULL (DEVICE LIMIT)" : "🔒 2/2 AKUN PENUH (BATAS DEVICE)")}
            </span>
          </div>
        </div>


        <div className="dam-slots-container">
          {loading ? (
            <div className="dam-loading">
              <span className="dam-spinner" />
              <p>{t.scanning}</p>
            </div>
          ) : (
            <>

              <div
                className={`dam-slot-card ${
                  accounts[0] ? "occupied" : "empty"
                }`}
              >
                <div className="dam-slot-header">
                  <span className="dam-slot-badge">{t.slotBadge} 01</span>
                  {accounts[0] && (
                    <span
                      className={`dam-status-tag ${
                        accounts[0].isGameCompleted ? "completed" : "in-progress"
                      }`}
                    >
                      {accounts[0].isGameCompleted
                        ? t.completedTag
                        : `${t.activeTag} (${accounts[0].visitedPlanetsCount}/6 ${t.sectors})`}
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
                        <span className="dam-score-lbl">{t.highScore}</span>
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

                      <div className="dam-slot-actions">
                        <button
                          type="button"
                          className="dam-action-btn load"
                          onClick={() => handleSelectAccount(accounts[0])}
                        >
                          {t.loadPilot}
                        </button>
                        <button
                          type="button"
                          className="dam-action-btn unlink"
                          onClick={() => handleRemoveAccount(0)}
                          title={language === "en" ? "Remove from this device" : "Hapus dari perangkat"}
                        >
                          🗑️ {language === "en" ? "Remove" : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dam-empty-slot">
                    <div className="dam-empty-icon">➕</div>
                    <h4>{t.slotBadge} 01 {t.emptySlotTitle}</h4>
                    <p>{t.emptySlotDesc}</p>
                    <button
                      type="button"
                      className="dam-action-btn create"
                      onClick={handleCreateNew}
                    >
                      {t.createNewPilot}
                    </button>
                  </div>
                )}
              </div>


              <div
                className={`dam-slot-card ${
                  accounts[1] ? "occupied" : "empty"
                }`}
              >
                <div className="dam-slot-header">
                  <span className="dam-slot-badge">{t.slotBadge} 02</span>
                  {accounts[1] && (
                    <span
                      className={`dam-status-tag ${
                        accounts[1].isGameCompleted ? "completed" : "in-progress"
                      }`}
                    >
                      {accounts[1].isGameCompleted
                        ? t.completedTag
                        : `${t.activeTag} (${accounts[1].visitedPlanetsCount}/6 ${t.sectors})`}
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
                        <span className="dam-score-lbl">{t.highScore}</span>
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

                      <div className="dam-slot-actions">
                        <button
                          type="button"
                          className="dam-action-btn load"
                          onClick={() => handleSelectAccount(accounts[1])}
                        >
                          {t.loadPilot}
                        </button>
                        <button
                          type="button"
                          className="dam-action-btn unlink"
                          onClick={() => handleRemoveAccount(1)}
                          title={language === "en" ? "Remove from this device" : "Hapus dari perangkat"}
                        >
                          🗑️ {language === "en" ? "Remove" : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dam-empty-slot">
                    <div className="dam-empty-icon">➕</div>
                    <h4>{t.slotBadge} 02 {t.emptySlotTitle}</h4>
                    <p>
                      {isFull
                        ? (language === "en" ? "Maximum limit of 2 accounts per device reached." : "Batas maksimal 2 akun per device tercapai.")
                        : (language === "en" ? "Slot available to register a second account on this device." : "Slot tersedia untuk mendaftarkan akun kedua pada device ini.")}
                    </p>
                    <button
                      type="button"
                      className="dam-action-btn create"
                      onClick={handleCreateNew}
                      disabled={isFull}
                    >
                      {isFull ? (language === "en" ? "LIMIT REACHED" : "BATAS TERCAPAI") : t.createNewPilot}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>


        <div className="dam-footer-notice">
          {isFull ? (
            <div className="dam-alert-full">
              <span>⚠️</span>
              <p>
                <strong>{language === "en" ? "Device Limit Reached:" : "Batas 2 Akun Tercapai:"}</strong>{" "}
                {language === "en"
                  ? "This device already has 2 pilot profiles. To preserve test integrity, 1 device is limited to maximum 2 users. Please select one of the heroes above."
                  : "Device ini sudah memiliki 2 akun pilot. Untuk menjaga integritas penilaian, 1 perangkat dibatasi maksimal 2 pengguna. Silakan pilih salah satu hero di atas."}
              </p>
            </div>
          ) : (
            <div className="dam-alert-avail">
              <span>💡</span>
              <p>
                <strong>{language === "en" ? "Normal Device Status:" : "Status Device Normal:"}</strong>{" "}
                {language === "en"
                  ? `You still have ${MAX_ACCOUNTS_PER_DEVICE - accounts.length} slot(s) available to create a new account on this device.`
                  : `Anda masih memiliki ${MAX_ACCOUNTS_PER_DEVICE - accounts.length} slot tersedia untuk membuat akun baru pada perangkat ini.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
