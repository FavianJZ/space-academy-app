import type { PlanetId } from "../types/planet.types";
import type { PlanetLeaderboardEntry } from "../types/game.types";

const REALISTIC_PILOT_NAMES = [
  "AstroPilot",
  "NovaCadet",
  "CyberAce",
  "StarDrifter",
  "VortexSky",
  "ZenithPilot",
  "CosmicRay",
  "ByteRider",
  "PulseWave",
  "SkyForge",
  "OrionHunter",
  "ShadowFlyer",
  "AeroFox",
  "SolarEcho",
  "QuantumRacer",
];

const getRandomPilotName = (usedNames: Set<string>): string => {
  const available = REALISTIC_PILOT_NAMES.filter((n) => !usedNames.has(n));
  const pool = available.length > 0 ? available : REALISTIC_PILOT_NAMES;
  const name = pool[Math.floor(Math.random() * pool.length)];
  const suffix = Math.random() > 0.4 ? Math.floor(10 + Math.random() * 89) : "";
  const fullName = `${name}${suffix}`;
  usedNames.add(fullName);
  return fullName;
};

// Logical configuration per planet: short realistic times & beatable scores
interface PlanetBotProfile {
  scoreMin: number;
  scoreMax: number;
  timeMin: number;
  timeMax: number;
}

// Calibrated against player normal high scores (Grade S benchmarks):
// Stage 1 (Novaris): Player 500 pts (~60s)
// Stage 2 (Quizara): Player 689 pts (~25-30s)
// Stage 3 (Puzzlon): Player 470 pts (~35-45s)
// Stage 4 (Flowra): Player 592 pts (~30-40s)
// Stage 5 (Logitron): Player 242 pts (32s)
// Stage 6 (Ultimara): Player 2695 pts (~50-60s)
const PLANET_BOT_PROFILES: Record<PlanetId, PlanetBotProfile> = {
  1: { scoreMin: 290, scoreMax: 450, timeMin: 68, timeMax: 105 }, // Novaris
  2: { scoreMin: 360, scoreMax: 615, timeMin: 28, timeMax: 52 }, // Quizara
  3: { scoreMin: 220, scoreMax: 415, timeMin: 38, timeMax: 72 }, // Puzzlon
  4: { scoreMin: 290, scoreMax: 520, timeMin: 36, timeMax: 68 }, // Flowra
  5: { scoreMin: 95, scoreMax: 215, timeMin: 38, timeMax: 70 }, // Logitron
  6: { scoreMin: 1150, scoreMax: 2380, timeMin: 58, timeMax: 102 }, // Ultimara
};

export const generateSamplePlanetLeaderboard = (): PlanetLeaderboardEntry[] => {
  const entries: PlanetLeaderboardEntry[] = [];
  const usedNames = new Set<string>();

  for (let planetId = 1; planetId <= 6; planetId++) {
    const config = PLANET_BOT_PROFILES[planetId as PlanetId];
    const sampleCount = 4; // 4 tiered bots per planet

    const scoreStep = (config.scoreMax - config.scoreMin) / (sampleCount - 1);
    const timeStep = (config.timeMax - config.timeMin) / (sampleCount - 1);

    for (let index = 0; index < sampleCount; index++) {
      // Natural descending scores with slight offset so bots have distinct ranks
      const baseScore = Math.round(config.scoreMax - index * scoreStep);
      const scoreVariance = (index % 2 === 0 ? 3 : -4);
      const targetScore = Math.max(config.scoreMin, baseScore + scoreVariance);

      const baseTime = Math.round(config.timeMin + index * timeStep);
      const timeVariance = (index % 2 === 0 ? 1 : 3);
      const targetTime = baseTime + timeVariance;

      entries.push({
        playerName: getRandomPilotName(usedNames),
        planetId: planetId as PlanetId,
        score: targetScore,
        completionTime: targetTime,
        timestamp:
          Date.now() -
          Math.floor((index + 1) * 3600 * 1000 + Math.random() * 86400000),
      });
    }
  }

  return entries;
};