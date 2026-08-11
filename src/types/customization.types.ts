export type SpacemanColorId =
  | "original"
  | "mars-red"
  | "solar-orange"
  | "signal-yellow"
  | "bio-lime"
  | "orbit-teal"
  | "ion-cyan"
  | "deep-blue"
  | "nebula-violet"
  | "nova-pink"
  | "lunar-white"
  | "graphite";

export type SpacemanHatId =
  | "none"
  | "arcane"
  | "cowboy"
  | "samurai"
  | "crew"
  | "captain"
  | "miner"
  | "viking"
  | "crown"
  | "witch"
  | "top-hat";

export type SpacemanPetId =
  | "none"
  | "solar-chick"
  | "pulse-frog"
  | "ember-element"
  | "orbit-pou"
  | "sky-wyvern"
  | "nova-sprite"
  | "ruby-trunk"
  | "ion-cub"
  | "ember-drake";

export type SpacemanPetIcon =
  | "none"
  | "chick"
  | "frog"
  | "element"
  | "pou"
  | "wyvern"
  | "sprite"
  | "elephant"
  | "cub"
  | "dragon";

export type SpacemanPetRarity =
  | "STANDARD"
  | "COMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY";

export type SpacemanPetAnimationLoop = "repeat" | "ping-pong";

export type SpacemanPetProceduralIdle =
  | "sprite-hover"
  | "elephant-sway"
  | "cub-curious"
  | "drake-flight";

export type CharacterCustomizationTab = "color" | "hat" | "pet";

export interface SpacemanColorOption {
  id: SpacemanColorId;
  label: string;
  shortLabel: string;
  modelColor: string | null;
  swatch: string;
}

export interface SpacemanHatOption {
  id: SpacemanHatId;
  label: string;
  shortLabel: string;
  description: string;
  modelUrl: string | null;
  accent: string;
  targetWidth: number;
  maxHeight: number;
  contactY: number;
  rotation: readonly [number, number, number];
  offset: readonly [number, number, number];
  shapeScale?: readonly [number, number, number];
  partScales?: readonly {
    name: string;
    scale: readonly [number, number, number];
  }[];
  seatRatio?: number;
  centerBias?: readonly [number, number];
}

export interface SpacemanPetOption {
  id: SpacemanPetId;
  label: string;
  shortLabel: string;
  description: string;
  modelUrl: string | null;
  sourceNodeName: string | null;
  icon: SpacemanPetIcon;
  rarity: SpacemanPetRarity;
  accent: string;
  targetHeight: number;
  targetFootprint: number;
  rotation: readonly [number, number, number];
  offset: readonly [number, number, number];
  preferredAnimationClips?: readonly string[];
  animationSpeed?: number;
  animationLoop?: SpacemanPetAnimationLoop;
  proceduralIdle?: SpacemanPetProceduralIdle;
}
