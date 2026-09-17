import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "./customization.types";
import type {
  ApiGlobalLeaderboardEntry,
  ApiBossStatus,
} from "./api.types";

export type Character = "pink" | "white";

export type PlanetId = 1 | 2 | 3 | 4 | 5 | 6;

export type Major = "IPA" | "IPS" | "";

export interface PlayerData {
  name: string;
  phone: string;
  school: string;
  major: Major;
}

export interface PlanetScore {
  planetId: PlanetId;
  stageId: number;
  score: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  playerName: string;
  totalScore: number;
  timestamp: number;
  major: Major;
}

export interface PlanetLeaderboardEntry {
  playerName: string;
  planetId: PlanetId;
  score: number;
  completionTime: number;
  timestamp: number;
}

export interface BossDamageLog {
  playerName: string;
  damage: number;
  timestamp: number;
}

export interface GameState {
  character: Character;
  setCharacter: (character: Character) => void;
  spacemanColor: SpacemanColorId;
  setSpacemanColor: (color: SpacemanColorId) => void;
  spacemanHat: SpacemanHatId;
  setSpacemanHat: (hat: SpacemanHatId) => void;
  spacemanPet: SpacemanPetId;
  setSpacemanPet: (pet: SpacemanPetId) => void;

  playerData: PlayerData;
  setPlayerData: (data: PlayerData) => void;

  visitedPlanets: Set<PlanetId>;
  currentPlanet: PlanetId | null;
  setCurrentPlanet: (planetId: PlanetId | null) => void;
  markPlanetVisited: (planetId: PlanetId) => void;

  planetScores: Map<string, PlanetScore>;
  addPlanetScore: (
    planetId: PlanetId,
    stageId: number,
    score: number,
    completionTime?: number,
    extraTelemetry?: Partial<import("./specialization.types").StageTelemetryRecord>
  ) => void;
  getTotalScore: () => number;
  getPlanetScore: (planetId: PlanetId, stageId: number) => number;
  isPlanetCompleted: (planetId: PlanetId) => boolean;
  getStageCompleted: (planetId: PlanetId, stageId: number) => boolean;

  leaderboard: LeaderboardEntry[];
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  getLeaderboardEntries: () => LeaderboardEntry[];

  isGameCompleted: boolean;
  completeGame: () => void;
  resetGame: () => void;

  introCompleted: boolean;
  setIntroCompleted: (completed: boolean) => void;

  musicVolume: number;
  sfxVolume: number;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;

  planetLeaderboards: PlanetLeaderboardEntry[];
  addPlanetLeaderboardEntry: (entry: PlanetLeaderboardEntry) => void;
  getPlanetLeaderboard: (planetId: PlanetId) => PlanetLeaderboardEntry[];

  bossMode: boolean;
  setBossMode: (mode: boolean) => void;
  bossGlobalHP: number;
  bossMaxHP: number;
  dealBossDamage: (damage: number, playerName: string) => void;
  bossDamageLog: BossDamageLog[];
  resetBossHP: () => void;

  p2Name: string;
  setP2Name: (name: string) => void;
  p2Phone: string;
  setP2Phone: (phone: string) => void;

playerId: string | null;
  authToken: string | null;
  authTokenExpiresAt: string | null;
  isRegistering: boolean;
  registerError: string | null;
  
  registerOrLoginPlayer: () => Promise<void>;
  
  logout: () => void;

  remoteLeaderboard: ApiGlobalLeaderboardEntry[];
  isLeaderboardLoading: boolean;
  fetchGlobalLeaderboard: () => Promise<void>;

  remotePlanetLeaderboards: Partial<Record<PlanetId, PlanetLeaderboardEntry[]>>;
  fetchPlanetLeaderboardRemote: (planetId: PlanetId) => Promise<void>;

  remoteBossStatus: ApiBossStatus | null;
  fetchBossStatus: () => Promise<void>;
  
  submitBossDamage: (damage: number) => void;

  specializationResult: import("./specialization.types").SpecializationResult | null;
  telemetrySignals: import("./specialization.types").TelemetrySignals;
  recordCustomizationChange: () => void;
  recordRouteSelection: (routeId: string) => void;
  recordStageTelemetry: (record: import("./specialization.types").StageTelemetryRecord) => void;
  refreshSpecializationProfile: () => void;
}
