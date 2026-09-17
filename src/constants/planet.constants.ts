import type {
  PlanetId,
  PlanetMeta,
  PlanetRenderConfig,
  StageDescription,
} from "../types/planet.types";

export const PLANET_IDS: PlanetId[] = [1, 2, 3, 4, 5, 6];

export const PLANET_META: Record<PlanetId, PlanetMeta> = {
  1: {
    name: "Novaris",
    type: "Terrestrial",
    description: "A welcoming world the perfect launchpad for new recruits.",
    missions: 1,
    difficulty: "Easy",
    color: "#00ff88",
  },
  2: {
    name: "Quizara",
    type: "Gas Giant",
    description: "Swirling storms of knowledge test your wits here.",
    missions: 2,
    difficulty: "Medium",
    color: "#ff8800",
  },
  3: {
    name: "Puzzlon",
    type: "Ice World",
    description: "Frozen puzzles hidden beneath crystalline surfaces.",
    missions: 3,
    difficulty: "Medium",
    color: "#00ccff",
  },
  4: {
    name: "Flowra",
    type: "Volcanic",
    description: "Molten logic flows through volcanic pathways.",
    missions: 4,
    difficulty: "Hard",
    color: "#ff3366",
  },
  5: {
    name: "Logitron",
    type: "Cyber World",
    description: "Digital realm of pure logic and reason.",
    missions: 5,
    difficulty: "Hard",
    color: "#aa66ff",
  },
  6: {
    name: "Ultimara",
    type: "Dark Matter",
    description: "The final frontier only the worthy may pass.",
    missions: 6,
    difficulty: "Expert",
    color: "#ffcc00",
  },
};

export const STAGE_DESCRIPTIONS: Record<PlanetId, StageDescription> = {
  1: {
    title: "STAGE 1",
    description: "Introduction to Software Engineering",
    displayTitle: "Introduction",
  },
  2: {
    title: "STAGE 2",
    description: "Multiple Choice Challenges",
    displayTitle: "Multiple Choice",
  },
  3: {
    title: "STAGE 3",
    description: "Puzzle Game",
    displayTitle: "Puzzle Game",
  },
  4: {
    title: "STAGE 4",
    description: "Flowchart Fixer",
    displayTitle: "Flowchart",
  },
  5: {
    title: "STAGE 5",
    description: "Logic Flow",
    displayTitle: "Logic Flow",
  },
  6: {
    title: "STAGE 6",
    description: "Final Challenge",
    displayTitle: "Final Challenge",
  },
};

export const PLANET_RENDER_CONFIG: PlanetRenderConfig[] = [
  {
    id: 1,
    scale: 3,
    radius: 14,
    initialAngle: 0,
  },
  {
    id: 2,
    scale: 1.5,
    radius: 14,
    initialAngle: Math.PI / 3,
  },
  {
    id: 3,
    scale: 1.5,
    radius: 14,
    initialAngle: (2 * Math.PI) / 3,
  },
  {
    id: 4,
    scale: 0.5,
    radius: 14,
    initialAngle: Math.PI,
  },
  {
    id: 5,
    scale: 1.5,
    radius: 14,
    initialAngle: (4 * Math.PI) / 3,
  },
  {
    id: 6,
    scale: 1.5,
    radius: 14,
    initialAngle: (5 * Math.PI) / 3,
  },
];

export const DEFAULT_ACTIVE_PLAYERS: Record<PlanetId, number> = {
  1: Math.floor(Math.random() * 12) + 2,
  2: Math.floor(Math.random() * 10) + 1,
  3: Math.floor(Math.random() * 8) + 1,
  4: Math.floor(Math.random() * 6) + 1,
  5: Math.floor(Math.random() * 5),
  6: Math.floor(Math.random() * 4),
};

export const DIFFICULTY_ICONS: Record<PlanetMeta["difficulty"], string> = {
  Easy: "★",
  Medium: "★★",
  Hard: "★★★",
  Expert: "★★★★",
};