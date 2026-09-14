import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGLTF } from "@react-three/drei";

import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";
import { useGameAudio } from "../../hooks/useGameAudio";
import {
  SpacemanPet,
  SpacemanPink,
  SpacemanWhite,
} from "../../components/models";
import {
  SPACEMAN_COLOR_OPTIONS,
  SPACEMAN_HAT_OPTIONS,
  SPACEMAN_PET_OPTIONS,
  getSpacemanColorOption,
  getSpacemanHatOption,
  getSpacemanPetOption,
} from "../../constants/characterCustomization.constants";
import type { Character } from "../../types/game.types";
import type {
  CharacterCustomizationTab,
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetIcon,
  SpacemanPetId,
} from "../../types/customization.types";
import AvatarCharacterModel from "./AvatarCharacterModel";

import "./CharacterCustomizationPanel.css";

type CharacterCustomizationPanelProps = {
  character: Character;
  selectedColor: SpacemanColorId;
  selectedHat: SpacemanHatId;
  selectedPet: SpacemanPetId;
  onColorChange: (color: SpacemanColorId) => void;
  onHatChange: (hat: SpacemanHatId) => void;
  onPetChange: (pet: SpacemanPetId) => void;
  onClose: () => void;
};

const CUSTOMIZATION_TABS: readonly {
  id: CharacterCustomizationTab;
  label: string;
  code: string;
}[] = [
  { id: "color", label: "Color", code: "01" },
  { id: "hat", label: "Hat", code: "02" },
  { id: "pet", label: "Pet", code: "03" },
];

const CustomizationIcon = ({
  tab,
}: {
  tab: CharacterCustomizationTab;
}) => {
  if (tab === "color") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="9" r="4.5" />
        <circle cx="15" cy="9" r="4.5" />
        <circle cx="12" cy="15" r="4.5" />
      </svg>
    );
  }

  if (tab === "hat") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 15.5 9 7h6l2 8.5" />
        <path d="M4 16h16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10.5h10v8H7z" />
      <path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
      <circle cx="10" cy="14" r=".8" />
      <circle cx="14" cy="14" r=".8" />
      <path d="M4.5 13.5H7M17 13.5h2.5" />
    </svg>
  );
};

const PetOptionIcon = ({ icon }: { icon: SpacemanPetIcon }) => {
  if (icon === "none") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="13" />
        <path d="m13 35 22-22" />
      </svg>
    );
  }

  if (icon === "elephant") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M14 19c0-7 5-11 10-11s10 4 10 11v10c0 7-4 11-10 11s-10-4-10-11z" />
        <path d="M14 19c-6-1-8 3-6 9 1 4 4 6 7 5M34 19c6-1 8 3 6 9-1 4-4 6-7 5" />
        <path d="M24 25v13c0 3 4 3 5 0" />
        <circle cx="20" cy="21" r="1" />
        <circle cx="28" cy="21" r="1" />
      </svg>
    );
  }

  if (icon === "chick") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M15 28c0-9 4-15 11-15s11 6 11 15-5 13-11 13-11-4-11-13z" />
        <path d="m35 22 7 4-7 4M21 13l3-6 3 6" />
        <circle cx="30" cy="22" r="1.2" />
        <path d="M20 40v4M31 40v4M17 44h6M28 44h6" />
      </svg>
    );
  }

  if (icon === "frog") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="16" cy="17" r="6" />
        <circle cx="32" cy="17" r="6" />
        <path d="M10 27c0-8 6-13 14-13s14 5 14 13-6 14-14 14S10 35 10 27z" />
        <circle cx="16" cy="17" r="1" />
        <circle cx="32" cy="17" r="1" />
        <path d="M17 31c4 3 10 3 14 0" />
      </svg>
    );
  }

  if (icon === "element") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M26 6c3 8-3 10 2 16 1-5 5-7 8-9 2 5 5 9 5 15 0 9-7 15-17 15S7 37 7 28c0-8 6-13 12-19-1 7 1 10 4 12 0-6 3-9 3-15z" />
        <circle cx="19" cy="29" r="1" />
        <circle cx="29" cy="29" r="1" />
        <path d="M20 35h8" />
      </svg>
    );
  }

  if (icon === "pou") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M11 31c0-5 3-9 7-13l6-9 6 9c4 4 7 8 7 13 0 7-5 11-13 11s-13-4-13-11z" />
        <circle cx="20" cy="29" r="1.2" />
        <circle cx="28" cy="29" r="1.2" />
        <path d="M21 35c2 1 4 1 6 0" />
      </svg>
    );
  }

  if (icon === "dragon" || icon === "wyvern") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M16 17 10 8c7 1 11 4 14 9M32 17l6-9c-7 1-11 4-14 9" />
        <path d="M15 24c0-8 4-13 9-13s9 5 9 13v7c0 6-4 10-9 10s-9-4-9-10z" />
        <path d="m15 28-8-5 3 12 7-2M33 28l8-5-3 12-7-2" />
        <circle cx="20" cy="24" r="1" />
        <circle cx="28" cy="24" r="1" />
      </svg>
    );
  }

  if (icon === "cub") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="15" cy="15" r="6" />
        <circle cx="33" cy="15" r="6" />
        <path d="M13 25c0-9 5-14 11-14s11 5 11 14v4c0 8-5 12-11 12s-11-4-11-12z" />
        <circle cx="20" cy="25" r="1" />
        <circle cx="28" cy="25" r="1" />
        <path d="m22 31 2 2 2-2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 22 10 11l10 7M34 22l4-11-10 7" />
      <path d="M12 26c0-9 5-15 12-15s12 6 12 15v3c0 8-5 12-12 12s-12-4-12-12z" />
      <circle cx="20" cy="26" r="1" />
      <circle cx="28" cy="26" r="1" />
      <path d="M21 33h6" />
    </svg>
  );
};

const HatOptionIcon = ({ hatId }: { hatId: SpacemanHatId }) => {
  if (hatId === "none") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M13 29c0-9 4.8-15 11-15s11 6 11 15" />
        <path d="M11 29h26M16 34h16" />
        <path className="slash" d="m10 38 28-28" />
      </svg>
    );
  }

  if (hatId === "arcane" || hatId === "witch") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 34h28" />
        <path d="M15 31c8-4 5-16 17-21-2 8 4 11 1 21" />
        <path d="M18 25c5 2 9 2 14-1" />
      </svg>
    );
  }

  if (hatId === "cowboy") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 31c7 4 27 4 34 0" />
        <path d="M15 29c2-4 2-11 5-14h8c3 3 3 10 5 14" />
        <path d="M16 24h16" />
      </svg>
    );
  }

  if (hatId === "viking") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M15 33v-9c0-7 4-11 9-11s9 4 9 11v9" />
        <path d="M10 25c-5-4-4-10-1-13 0 5 3 7 7 7M38 25c5-4 4-10 1-13 0 5-3 7-7 7" />
        <path d="M13 33h22" />
      </svg>
    );
  }

  if (hatId === "crown") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m12 17 7 7 5-12 5 12 7-7-3 18H15z" />
        <path d="M15 31h18" />
      </svg>
    );
  }

  if (hatId === "top-hat") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M16 12h16l2 21H14z" />
        <path d="M8 34h32M15 27h18" />
      </svg>
    );
  }

  if (hatId === "samurai" || hatId === "captain") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M12 31c3-12 7-18 12-18s9 6 12 18" />
        <path d="M8 32c8 5 24 5 32 0M24 13V8" />
        <path d="M16 23h16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M13 31c1-11 4-17 11-17s10 6 11 17" />
      <path d="M10 32h28M20 14v-4h8v4" />
      <circle cx="24" cy="20" r="3" />
    </svg>
  );
};

const CharacterCustomizationPanel = ({
  character,
  selectedColor,
  selectedHat,
  selectedPet,
  onColorChange,
  onHatChange,
  onPetChange,
  onClose,
}: CharacterCustomizationPanelProps) => {
  const { getMotionMs, playSfx } = useGameAudio();
  const [activeTab, setActiveTab] =
    useState<CharacterCustomizationTab>("color");
  const [petEquipEffect, setPetEquipEffect] = useState<{
    petId: Exclude<SpacemanPetId, "none">;
    sequence: number;
  } | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const petEffectTimerRef = useRef<number | null>(null);
  const petChirpTimerRef = useRef<number | null>(null);
  const petEffectSequenceRef = useRef(0);
  const selectedOption = getSpacemanColorOption(selectedColor);
  const selectedHatOption = getSpacemanHatOption(selectedHat);
  const selectedPetOption = getSpacemanPetOption(selectedPet);
  const resolvedSuitColor = selectedOption.modelColor ?? undefined;
  const accentColor =
    selectedOption.modelColor ??
    (character === "pink" ? "#f46bad" : "#77eaff");
  const CharacterModel =
    character === "pink" ? SpacemanPink : SpacemanWhite;

  useEffect(() => {
    if (activeTab === "hat") {
      SPACEMAN_HAT_OPTIONS.forEach(({ modelUrl }) => {
        if (modelUrl) useGLTF.preload(modelUrl);
      });
    }

    if (activeTab === "pet") {
      const modelUrls = new Set(
        SPACEMAN_PET_OPTIONS.flatMap(({ modelUrl }) =>
          modelUrl ? [modelUrl] : []
        )
      );

      modelUrls.forEach((modelUrl) => useGLTF.preload(modelUrl));
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (petEffectTimerRef.current !== null) {
        window.clearTimeout(petEffectTimerRef.current);
      }
      if (petChirpTimerRef.current !== null) {
        window.clearTimeout(petChirpTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("hidden"));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const panelStyle = {
    "--customizer-accent": accentColor,
  } as CSSProperties;

  const handleTabChange = (tab: CharacterCustomizationTab) => {
    if (tab === activeTab) return;
    playSfx("uiTabSwitch");
    setActiveTab(tab);
  };

  const handleColorChange = (colorId: SpacemanColorId) => {
    if (colorId === selectedColor) return;
    playSfx("customizationEquip");
    onColorChange(colorId);
  };

  const handleHatChange = (hatId: SpacemanHatId) => {
    if (hatId === selectedHat) return;
    playSfx("customizationEquip");
    onHatChange(hatId);
  };

  const handlePetChange = (petId: SpacemanPetId) => {
    if (petId === selectedPet) return;
    playSfx("petEquip");
    onPetChange(petId);

    if (petEffectTimerRef.current !== null) {
      window.clearTimeout(petEffectTimerRef.current);
    }
    if (petChirpTimerRef.current !== null) {
      window.clearTimeout(petChirpTimerRef.current);
      petChirpTimerRef.current = null;
    }

    if (petId === "none") {
      setPetEquipEffect(null);
      return;
    }

    petEffectSequenceRef.current += 1;
    setPetEquipEffect({
      petId,
      sequence: petEffectSequenceRef.current,
    });
    petChirpTimerRef.current = window.setTimeout(() => {
      playSfx("petChirp");
      petChirpTimerRef.current = null;
    }, 520);
    petEffectTimerRef.current = window.setTimeout(() => {
      setPetEquipEffect(null);
      petEffectTimerRef.current = null;
    }, getMotionMs("petEquip"));
  };
  const petEffectOption = petEquipEffect
    ? getSpacemanPetOption(petEquipEffect.petId)
    : null;

  return (
    <div
      className="character-customizer-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="character-customizer-panel"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-customizer-title"
        aria-describedby="character-customizer-description"
      >
        <div className="character-customizer-scan" aria-hidden="true" />
        <div className="character-customizer-corner character-customizer-corner-a" />
        <div className="character-customizer-corner character-customizer-corner-b" />

        <header className="character-customizer-header">
          <div>
            <span className="character-customizer-eyebrow">
              PERSONAL LOADOUT // SUIT-01
            </span>
            <h2 id="character-customizer-title">Customization bay</h2>
            <p id="character-customizer-description">
              Kalibrasi warna, headgear, dan companion spaceman-mu. Loadout
              tersimpan otomatis.
            </p>
          </div>

          <div className="character-customizer-header-actions">
            <span className="character-customizer-live">
              <i />
              LIVE LINK
            </span>
            <button
              ref={closeButtonRef}
              className="character-customizer-close"
              type="button"
              data-audio-cue="none"
              aria-label="Close customization panel"
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="character-customizer-body">
          <aside
            className={`character-customizer-preview ${
              activeTab === "pet" ? "pet-mode" : ""
            }`}
          >
            <div className="character-customizer-preview-label">
              <span>LIVE SUIT FEED</span>
              <small>CAM // 04</small>
            </div>

            <div className="character-customizer-canvas">
              <AdaptiveCanvas
                camera={{ position: [0, 0.55, 7.6], fov: 39 }}
                dpr={[1, 1.15]}
                quality="low"
                gl={{ alpha: true }}
                style={{ background: "transparent" }}
              >
                <Suspense fallback={null}>
                  <ambientLight intensity={0.78} />
                  <directionalLight
                    position={[3, 4, 4]}
                    intensity={1.75}
                    color="#eafcff"
                  />
                  <pointLight
                    position={[-2.8, 1.5, 2]}
                    intensity={4.2}
                    color={accentColor}
                    distance={8}
                  />
                  <pointLight
                    position={[2.4, -1, 1]}
                    intensity={2.4}
                    color="#2c8cff"
                    distance={7}
                  />
                  {activeTab === "pet" && (
                    <pointLight
                      position={[1.55, 0.15, 2.5]}
                      intensity={2.7}
                      color="#f5fdff"
                      distance={5}
                      decay={2}
                    />
                  )}
                  <group position={activeTab === "pet" ? [-0.68, 0, 0] : [0, 0, 0]}>
                    <AvatarCharacterModel
                      CharacterModel={CharacterModel}
                      suitColor={resolvedSuitColor}
                      hatId={selectedHat}
                      modelScale={selectedHat === "none" ? 0.86 : 0.7}
                      modelPosition={[0, -1.62, 0]}
                      rotationSpeed={activeTab === "pet" ? 0 : 0.32}
                      floatAmplitude={activeTab === "pet" ? 0 : 0.045}
                    />
                  </group>
                  {activeTab === "pet" && (
                    <SpacemanPet
                      petId={selectedPet}
                      position={[1.02, -1.75, 0.08]}
                    />
                  )}
                  <mesh
                    position={[
                      activeTab === "pet" ? -0.68 : 0,
                      -1.75,
                      0,
                    ]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <torusGeometry args={[0.9, 0.012, 8, 64]} />
                    <meshBasicMaterial
                      color={accentColor}
                      transparent
                      opacity={0.75}
                    />
                  </mesh>
                  <mesh
                    position={[
                      activeTab === "pet" ? -0.68 : 0,
                      -1.76,
                      0,
                    ]}
                    rotation={[-Math.PI / 2, 0, 0]}
                  >
                    <ringGeometry args={[0.58, 0.6, 64]} />
                    <meshBasicMaterial
                      color="#82eaff"
                      transparent
                      opacity={0.32}
                      side={2}
                    />
                  </mesh>
                  {activeTab === "pet" && selectedPet !== "none" && (
                    <>
                      <mesh
                        position={[1.02, -1.755, 0.08]}
                        rotation={[-Math.PI / 2, 0, 0]}
                      >
                        <torusGeometry args={[0.58, 0.015, 8, 48]} />
                        <meshBasicMaterial
                          color={selectedPetOption.accent}
                          transparent
                          opacity={0.88}
                        />
                      </mesh>
                      <mesh
                        position={[1.02, -1.765, 0.08]}
                        rotation={[-Math.PI / 2, 0, 0]}
                      >
                        <ringGeometry args={[0.36, 0.39, 48]} />
                        <meshBasicMaterial
                          color={selectedPetOption.accent}
                          transparent
                          opacity={0.3}
                          side={2}
                        />
                      </mesh>
                    </>
                  )}
                </Suspense>
              </AdaptiveCanvas>

              {activeTab === "pet" && petEquipEffect && petEffectOption && (
                <div
                  key={`${petEquipEffect.petId}-${petEquipEffect.sequence}`}
                  className="character-customizer-pet-equip-effect"
                  style={
                    {
                      "--pet-effect-accent": petEffectOption.accent,
                    } as CSSProperties
                  }
                  role="status"
                >
                  <span className="character-customizer-pet-equip-burst" />
                  <span className="character-customizer-pet-equip-orbit" />
                  <span className="character-customizer-pet-equip-copy">
                    <small>COMPANION LINKED</small>
                    <strong>{petEffectOption.shortLabel}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="character-customizer-preview-data">
              <div>
                <span>PALETTE</span>
                <strong>{selectedOption.shortLabel.toUpperCase()}</strong>
              </div>
              <div>
                <span>PROFILE</span>
                <strong>{character.toUpperCase()} / ACTIVE</strong>
              </div>
              <div>
                <span>{activeTab === "pet" ? "COMPANION" : "HEADGEAR"}</span>
                <strong>
                  {(activeTab === "pet"
                    ? selectedPetOption.shortLabel
                    : selectedHatOption.shortLabel
                  ).toUpperCase()}
                </strong>
              </div>
            </div>
          </aside>

          <div className="character-customizer-controls">
            <div
              className="character-customizer-tabs"
              role="tablist"
              aria-label="Customization categories"
            >
              {CUSTOMIZATION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  id={`customizer-tab-${tab.id}`}
                  className={activeTab === tab.id ? "active" : ""}
                  type="button"
                  data-audio-cue="none"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`customizer-panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <CustomizationIcon tab={tab.id} />
                  <span>{tab.label}</span>
                  <small>{tab.code}</small>
                </button>
              ))}
            </div>

            {activeTab === "color" && (
              <div
                id="customizer-panel-color"
                className="character-customizer-tab-panel"
                role="tabpanel"
                aria-labelledby="customizer-tab-color"
              >
                <div className="character-customizer-section-heading">
                  <div>
                    <span className="character-customizer-eyebrow">
                      CHROMATIC ARRAY
                    </span>
                    <h3>Select suit color</h3>
                  </div>
                  <span>{SPACEMAN_COLOR_OPTIONS.length} TONES</span>
                </div>

                <div className="character-customizer-color-grid">
                  {SPACEMAN_COLOR_OPTIONS.map((option) => {
                    const isSelected = option.id === selectedColor;

                    return (
                      <button
                        key={option.id}
                        className={isSelected ? "selected" : ""}
                        type="button"
                        data-audio-cue="none"
                        aria-label={`Equip ${option.label}`}
                        aria-pressed={isSelected}
                        onClick={() => handleColorChange(option.id)}
                      >
                        <span
                          className="character-customizer-swatch"
                          style={{ background: option.swatch }}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m6.5 12.5 3.2 3.2 7.8-8" />
                            </svg>
                          )}
                        </span>
                        <span className="character-customizer-color-name">
                          {option.shortLabel}
                        </span>
                        <small>{isSelected ? "EQUIPPED" : "AVAILABLE"}</small>
                      </button>
                    );
                  })}
                </div>

                <p
                  className="character-customizer-announcement"
                  aria-live="polite"
                >
                  {selectedOption.label} equipped.
                </p>
              </div>
            )}

            {activeTab === "hat" && (
              <div
                id="customizer-panel-hat"
                className="character-customizer-tab-panel"
                role="tabpanel"
                aria-labelledby="customizer-tab-hat"
              >
                <div className="character-customizer-section-heading">
                  <div>
                    <span className="character-customizer-eyebrow">
                      HEADGEAR ARRAY
                    </span>
                    <h3>Fit helmet attachment</h3>
                  </div>
                  <span>{SPACEMAN_HAT_OPTIONS.length} UNITS</span>
                </div>

                <div className="character-customizer-hat-grid">
                  {SPACEMAN_HAT_OPTIONS.map((option) => {
                    const isSelected = option.id === selectedHat;

                    return (
                      <button
                        key={option.id}
                        className={isSelected ? "selected" : ""}
                        style={
                          {
                            "--hat-option-accent": option.accent,
                          } as CSSProperties
                        }
                        type="button"
                        data-audio-cue="none"
                        aria-label={`Equip ${option.label} headgear`}
                        aria-pressed={isSelected}
                        onClick={() => handleHatChange(option.id)}
                      >
                        <span className="character-customizer-hat-visual">
                          <HatOptionIcon hatId={option.id} />
                          {isSelected && (
                            <i aria-hidden="true">
                              <svg viewBox="0 0 24 24">
                                <path d="m6.5 12.5 3.2 3.2 7.8-8" />
                              </svg>
                            </i>
                          )}
                        </span>
                        <span className="character-customizer-hat-copy">
                          <strong>{option.shortLabel}</strong>
                          <small>{option.description}</small>
                          <em>{isSelected ? "EQUIPPED" : "AVAILABLE"}</em>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p
                  className="character-customizer-announcement"
                  aria-live="polite"
                >
                  {selectedHatOption.label} equipped.
                </p>
              </div>
            )}

            {activeTab === "pet" && (
              <div
                id="customizer-panel-pet"
                className="character-customizer-tab-panel"
                role="tabpanel"
                aria-labelledby="customizer-tab-pet"
              >
                <div className="character-customizer-section-heading character-customizer-pet-heading">
                  <div>
                    <span className="character-customizer-eyebrow">
                      COMPANION ARRAY
                    </span>
                    <h3>Choose formation partner</h3>
                  </div>
                  <span>{SPACEMAN_PET_OPTIONS.length - 1} SIGNALS</span>
                </div>

                <p className="character-customizer-pet-intro">
                  Pet menjaga posisi di sisi pilot. Preview dikunci agar ukuran
                  dan siluet bisa diperiksa tanpa rotasi otomatis.
                </p>

                <div className="character-customizer-pet-grid">
                  {SPACEMAN_PET_OPTIONS.map((option) => {
                    const isSelected = option.id === selectedPet;

                    return (
                      <button
                        key={option.id}
                        className={isSelected ? "selected" : ""}
                        style={
                          {
                            "--pet-option-accent": option.accent,
                          } as CSSProperties
                        }
                        type="button"
                        data-audio-cue="none"
                        aria-label={`Equip ${option.label} companion`}
                        aria-pressed={isSelected}
                        onClick={() => handlePetChange(option.id)}
                      >
                        <span className="character-customizer-pet-visual">
                          <span className="character-customizer-pet-orbit" />
                          <PetOptionIcon icon={option.icon} />
                          {isSelected && (
                            <i aria-hidden="true">
                              <svg viewBox="0 0 24 24">
                                <path d="m6.5 12.5 3.2 3.2 7.8-8" />
                              </svg>
                            </i>
                          )}
                        </span>

                        <span className="character-customizer-pet-copy">
                          <span className="character-customizer-pet-meta">
                            <strong>{option.shortLabel}</strong>
                            <em>{option.rarity}</em>
                          </span>
                          <small>{option.description}</small>
                          <b>{isSelected ? "LINKED" : "AVAILABLE"}</b>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p
                  className="character-customizer-announcement"
                  aria-live="polite"
                >
                  {selectedPetOption.label} equipped.
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="character-customizer-footer">
          <span>
            <i />
            PROFILE AUTO-SAVED
          </span>
          <button type="button" data-audio-cue="none" onClick={onClose}>
            CLOSE TERMINAL
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M14 7l5 5-5 5" />
            </svg>
          </button>
        </footer>
      </section>
    </div>
  );
};

export default CharacterCustomizationPanel;
