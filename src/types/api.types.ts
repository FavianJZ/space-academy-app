// Shapes returned by the backend (space-academy-backend). Kept separate
// from the frontend's own local game.types.ts - the backend's Player
// record and the frontend's local playerData aren't quite the same
// shape, and conflating them makes both harder to change independently.

export type ApiMajor = "IPA" | "IPS";
export type ApiCharacter = "pink" | "white";

export interface ApiPlayerProgress {
  id: string;
  playerId: string;
  planetId: number;
  stageId: number;
  score: number;
  completionTime: number | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPlayerSettings {
  id: string;
  playerId: string;
  playerName: string;
  musicVolume: number;
  sfxVolume: number;
}

export interface ApiPlayer {
  id: string;
  name: string;
  phone: string;
  school: string;
  major: ApiMajor | null;
  character: ApiCharacter;
  spacemanColor: string;
  spacemanHat: string;
  spacemanPet: string;
  p2Name: string | null;
  p2Phone: string | null;
  totalScore: number;
  isGameCompleted: boolean;
  introCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: ApiPlayerSettings | null;
  progress?: ApiPlayerProgress[];
}

export interface ApiAuth {
  token: string;
  expiresAt: string;
}

export interface ApiGlobalLeaderboardEntry {
  id: string;
  name: string;
  school: string;
  major: ApiMajor | null;
  character: ApiCharacter;
  totalScore: number;
  updatedAt: string;
}

export interface ApiPlanetLeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  planetId: number;
  stageId: number;
  score: number;
  completionTime: number | null;
  completedAt: string | null;
  updatedAt: string;
  player: {
    id: string;
    name: string;
    school: string;
    major: ApiMajor | null;
    character: ApiCharacter;
  };
}

export interface ApiBossStatus {
  id: string;
  name: string;
  bossMode: boolean;
  bossGlobalHP: number;
  bossMaxHP: number;
}

export interface ApiBossAttackResult {
  boss: ApiBossStatus;
  log: {
    id: string;
    bossStatusId: string;
    playerId: string;
    playerName: string;
    damage: number;
    createdAt: string;
  };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  auth?: ApiAuth;
}
