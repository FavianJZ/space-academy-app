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

const PLANET_BOT_PROFILES: Record<PlanetId, PlanetBotProfile> = {
  1: { scoreMin: 320, scoreMax: 420, timeMin: 18, timeMax: 28 }, // Intro Stage
  2: { scoreMin: 680, scoreMax: 840, timeMin: 20, timeMax: 35 }, // Quiz (3 questions ~25s)
  3: { scoreMin: 280, scoreMax: 390, timeMin: 24, timeMax: 42 }, // Pipeline (3 cards ~30s, player ~440)
  4: { scoreMin: 320, scoreMax: 440, timeMin: 18, timeMax: 35 }, // Flowchart (~25s, player ~515)
  5: { scoreMin: 130, scoreMax: 175, timeMin: 20, timeMax: 38 }, // Logic Circuit (~28s, player ~186)
  6: { scoreMin: 150, scoreMax: 230, timeMin: 34, timeMax: 50 }, // Bug Hunt (<60s duration!)
};

export const generateSamplePlanetLeaderboard = (): PlanetLeaderboardEntry[] => {
  const entries: PlanetLeaderboardEntry[] = [];
  const usedNames = new Set<string>();

  for (let planetId = 1; planetId <= 6; planetId++) {
    const config = PLANET_BOT_PROFILES[planetId as PlanetId];
    const sampleCount = 3;

    // Generate sorted descending scores so rank 1, 2, 3 bots feel naturally tiered
    const scoreRange = config.scoreMax - config.scoreMin;
    const step = scoreRange / (sampleCount + 1);

    for (let index = 0; index < sampleCount; index++) {
      const targetScore = Math.round(
        config.scoreMax - index * step - Math.random() * 15
      );
      const targetTime = Math.round(
        config.timeMin +
          index * ((config.timeMax - config.timeMin) / sampleCount) +
          Math.floor(Math.random() * 5)
      );

      entries.push({
        playerName: getRandomPilotName(usedNames),
        planetId: planetId as PlanetId,
        score: targetScore,
        completionTime: targetTime,
        timestamp:
          Date.now() -
          Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return entries;
};