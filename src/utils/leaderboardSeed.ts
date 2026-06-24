import type { PlanetId } from "../types/planet.types";
import type { PlanetLeaderboardEntry } from "../types/game.types";

const SAMPLE_PLAYER_NAMES = [
  "AstroKid",
  "PixelNova",
  "CyberWolf",
  "StarCadet",
  "LunaBot",
  "NeoZero",
  "ByteStorm",
  "QuantumAce",
  "RocketFox",
  "ZenithX",
  "CosmoPilot",
  "VoidRunner",
  "SolarFlare",
  "DarkNebula",
  "IonBlade",
];

const getRandomSampleName = () => {
  const name =
    SAMPLE_PLAYER_NAMES[Math.floor(Math.random() * SAMPLE_PLAYER_NAMES.length)];

  const suffix = Math.random() > 0.5 ? Math.floor(Math.random() * 99) : "";

  return `${name}${suffix}`;
};

export const generateSamplePlanetLeaderboard = () => {
  const entries: PlanetLeaderboardEntry[] = [];

  for (let planetId = 1; planetId <= 6; planetId++) {
    const sampleCount = 3;

    for (let index = 0; index < sampleCount; index++) {
      const baseScore = (7 - planetId) * 150 + Math.floor(Math.random() * 300);
      const baseTime = 30 + planetId * 20 + Math.floor(Math.random() * 120);

      entries.push({
        playerName: getRandomSampleName(),
        planetId: planetId as PlanetId,
        score: baseScore,
        completionTime: baseTime,
        timestamp:
          Date.now() -
          Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return entries;
};