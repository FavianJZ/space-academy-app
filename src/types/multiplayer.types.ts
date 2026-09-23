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
  | "ROOM_LEAVE"
  | "HEARTBEAT_PING"
  | "PLAYER_DISCONNECTED"
  | "RECONNECT_REQUEST"
  | "RECONNECT_SYNC"
  | "RECONNECT_RESUME";

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

export interface ReconnectSyncPayload {
  bossHP: number;
  timeLeft: number;
  score: number;
  combo: number;
  timestamp: number;
}

export type PartyMessage =
  | { type: "ROOM_JOIN"; payload: RoomJoinPayload }
  | { type: "ROOM_READY"; payload: { isReady: boolean; senderId?: string; timestamp: number } }
  | { type: "RAID_START"; payload: RaidStartPayload }
  | { type: "ATTACK_EVENT"; payload: AttackEventPayload }
  | { type: "SYNC_TICK"; payload: SyncTickPayload }
  | { type: "ROOM_LEAVE"; payload: { playerName: string; timestamp: number } }
  | { type: "HEARTBEAT_PING"; payload: { senderId: string; playerName: string; isHost: boolean; timestamp: number } }
  | { type: "PLAYER_DISCONNECTED"; payload: { senderId: string; playerName: string; reason?: string; timestamp: number } }
  | { type: "RECONNECT_REQUEST"; payload: { senderId: string; playerName: string; timestamp: number } }
  | { type: "RECONNECT_SYNC"; payload: ReconnectSyncPayload }
  | { type: "RECONNECT_RESUME"; payload: { timestamp: number } };

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
