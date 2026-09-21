import type {
  Character,
  RemoteCoPilot,
} from "./game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "./customization.types";

export type MultiplayerMessageType =
  | "ROOM_JOIN"
  | "ROOM_READY"
  | "RAID_START"
  | "ATTACK_EVENT"
  | "SYNC_TICK"
  | "ROOM_LEAVE";

export interface RoomJoinPayload {
  playerName: string;
  character: Character;
  colorId: SpacemanColorId;
  hatId: SpacemanHatId;
  petId: SpacemanPetId;
  isHost: boolean;
  platform: "PC" | "MOBILE";
  totalScore: number;
  isReady?: boolean;
  timestamp: number;
}

export interface AttackEventPayload {
  senderId: string;
  senderName: string;
  damage: number;
  bugCategory: string;
  combo: number;
  newBossHP: number;
  x?: number;
  y?: number;
  timestamp: number;
}

export interface SyncTickPayload {
  bossHP: number;
  timeLeft: number;
  timestamp: number;
}

export interface RaidStartPayload {
  seed: number;
  duration: number;
  timestamp: number;
}

export type PartyMessage =
  | { type: "ROOM_JOIN"; payload: RoomJoinPayload }
  | { type: "ROOM_READY"; payload: { isReady: boolean; senderId?: string; timestamp: number } }
  | { type: "RAID_START"; payload: RaidStartPayload }
  | { type: "ATTACK_EVENT"; payload: AttackEventPayload }
  | { type: "SYNC_TICK"; payload: SyncTickPayload }
  | { type: "ROOM_LEAVE"; payload: { playerName: string; timestamp: number } };

export interface OnlineRaidSession {
  partyCode: string;
  isHost: boolean;
  isConnected: boolean;
  remotePlayer: RemoteCoPilot | null;
  lastLaserVfx: {
    id: number;
    damage: number;
    playerName: string;
    timestamp: number;
  } | null;
}
