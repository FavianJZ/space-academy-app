import React, { Suspense, useState } from "react";

import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";
import { SpacemanPet } from "../../components/models";
import type { SpacemanPinkProps } from "../../components/models/SpacemanPink";
import {
  getSpacemanColorOption,
  getSpacemanHatOption,
  getSpacemanPetOption,
} from "../../constants/characterCustomization.constants";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../../types/customization.types";
import type { Character } from "../../types/game.types";
import AvatarCharacterModel from "./AvatarCharacterModel";

type MainHubAvatarBeaconProps = {
  character: Character;
  CharacterModel: React.ComponentType<SpacemanPinkProps>;
  colorId: SpacemanColorId;
  hatId: SpacemanHatId;
  petId: SpacemanPetId;
  isOpen: boolean;
  onOpen: () => void;
};

const PILOT_FLOOR_Y = -1.68;
const PILOT_WITH_PET_X = -0.58;
const PET_X = 0.94;

export const MainHubAvatarBeacon = ({
  character,
  CharacterModel,
  colorId,
  hatId,
  petId,
  isOpen,
  onOpen,
}: MainHubAvatarBeaconProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const selectedColor = getSpacemanColorOption(colorId);
  const selectedHat = getSpacemanHatOption(hatId);
  const selectedPet = getSpacemanPetOption(petId);
  const hasPet = petId !== "none";
  const suitColor = selectedColor.modelColor ?? undefined;
  const accentColor =
    selectedColor.modelColor ??
    (character === "pink" ? "#f46bad" : "#77eaff");
  const petAccentColor = hasPet ? selectedPet.accent : "#7595a0";
  const pilotX = hasPet ? PILOT_WITH_PET_X : 0;

  return (
    <div
      className={`character-avatar-wrapper ${isHovered ? "hovered" : ""} ${
        isOpen ? "is-open" : ""
      } ${hasPet ? "has-pet" : "is-solo"}`}
      style={
        {
          "--avatar-accent": accentColor,
          "--avatar-pet-accent": petAccentColor,
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`character-avatar-ring ${character}`}
        aria-hidden="true"
      >
        <div className="avatar-loadout-viewport">
          <div className="character-avatar-canvas">
            <AdaptiveCanvas
              camera={{ position: [0, 0.38, 6.35], fov: 35 }}
              style={{ background: "transparent" }}
              dpr={[1, 1.15]}
              quality="low"
              gl={{ alpha: true }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.92} />
                <directionalLight
                  position={[2.8, 4, 4.5]}
                  intensity={1.7}
                  color="#effdff"
                />
                <directionalLight
                  position={[-2.5, 1.4, -1]}
                  intensity={0.72}
                  color="#72ccff"
                />
                <pointLight
                  position={[0, 0.2, 2.8]}
                  intensity={2.6}
                  color={accentColor}
                  distance={6}
                />
                {hasPet && (
                  <pointLight
                    position={[1.35, -0.5, 2.4]}
                    intensity={2.2}
                    color={petAccentColor}
                    distance={4.5}
                  />
                )}

                <group position={[pilotX, 0, 0]}>
                  <AvatarCharacterModel
                    CharacterModel={CharacterModel}
                    suitColor={suitColor}
                    hatId={hatId}
                    modelScale={hatId === "none" ? 0.62 : 0.54}
                    modelPosition={
                      hatId === "none" ? [0, -1.72, 0] : [0, -1.62, 0]
                    }
                    rotationSpeed={0}
                    floatAmplitude={0.012}
                  />
                </group>

                {hasPet && (
                  <group
                    position={[PET_X, PILOT_FLOOR_Y, 0.06]}
                    scale={0.86}
                  >
                    <SpacemanPet petId={petId} />
                  </group>
                )}

                <mesh
                  position={[pilotX, PILOT_FLOOR_Y - 0.01, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <ringGeometry args={[0.54, 0.57, 48]} />
                  <meshBasicMaterial
                    color={accentColor}
                    transparent
                    opacity={0.7}
                  />
                </mesh>

                {hasPet && (
                  <>
                    <mesh
                      position={[PET_X, PILOT_FLOOR_Y - 0.015, 0.06]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <ringGeometry args={[0.32, 0.345, 40]} />
                      <meshBasicMaterial
                        color={petAccentColor}
                        transparent
                        opacity={0.76}
                      />
                    </mesh>
                    <mesh
                      position={[
                        (pilotX + PET_X) / 2,
                        PILOT_FLOOR_Y - 0.02,
                        0.035,
                      ]}
                      rotation={[-Math.PI / 2, 0, 0]}
                    >
                      <planeGeometry args={[PET_X - pilotX - 0.62, 0.012]} />
                      <meshBasicMaterial
                        color={petAccentColor}
                        transparent
                        opacity={0.42}
                      />
                    </mesh>
                  </>
                )}
              </Suspense>
            </AdaptiveCanvas>
            <span className="avatar-viewport-scan" aria-hidden="true" />
          </div>

        </div>

      </div>

      <span className={`avatar-pulse-ring ${character}`} aria-hidden="true" />
      <span className="avatar-customize-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3v18M3 12h18" />
          <circle cx="12" cy="12" r="5.5" />
        </svg>
      </span>
      <button
        className="avatar-customize-trigger"
        type="button"
        aria-label={`Customize spaceman. Current color: ${selectedColor.label}. Headgear: ${selectedHat.label}. Companion: ${selectedPet.label}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={onOpen}
      />
    </div>
  );
};
