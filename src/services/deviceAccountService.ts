import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Character } from "../types/game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../types/customization.types";
import { useGameStore } from "../stores/useGameStore";
import { getLocalPlayerId, setLocalPlayerId } from "./playerService";

export interface SavedDeviceAccount {
  id: string;
  name: string;
  phone?: string;
  school?: string;
  major?: string;
  character: Character;
  spacemanColor: SpacemanColorId;
  spacemanHat: SpacemanHatId;
  spacemanPet: SpacemanPetId;
  visitedPlanetsCount: number;
  visitedPlanets: number[];
  planetScores: [string, { planetId: number; stageId: number; score: number; completed: boolean }][];
  totalScore: number;
  isGameCompleted: boolean;
  specializationResult?: any;
  createdAt: number;
  updatedAt: number;
}

const DEVICE_ID_KEY = "space-academy-device-uuid";
const DEVICE_ACCOUNTS_KEY = "space-academy-device-accounts";
export const MAX_ACCOUNTS_PER_DEVICE = 2;

/**
 * Get or generate persistent unique device ID
 */
export function getLocalDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeHex = Date.now().toString(36).toUpperCase();
    id = `DEV-${randomHex}-${timeHex}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Read local cached device accounts
 */
export function getLocalSavedAccounts(): SavedDeviceAccount[] {
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ACCOUNTS_PER_DEVICE) : [];
  } catch (err) {
    console.warn("[deviceAccountService] Error parsing device accounts:", err);
    return [];
  }
}

/**
 * Save accounts array to localStorage (capped at 2)
 */
export function setLocalSavedAccounts(accounts: SavedDeviceAccount[]): void {
  try {
    const capped = accounts.slice(0, MAX_ACCOUNTS_PER_DEVICE);
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn("[deviceAccountService] Error saving device accounts:", err);
  }
}

/**
 * Sync and snapshot the currently active player in useGameStore into device accounts
 */
export function snapshotCurrentStoreAccount(): SavedDeviceAccount | null {
  const store = useGameStore.getState();
  const name = store.playerData.name?.trim() || store.p2Name?.trim();
  if (!name) return null;

  const currentLocalId = getLocalPlayerId() || `local_${name.toLowerCase()}`;
  const totalScore = store.getTotalScore();
  const visitedArray = Array.from(store.visitedPlanets);
  const planetScoresArray = Array.from(store.planetScores.entries());

  const account: SavedDeviceAccount = {
    id: currentLocalId,
    name,
    phone: store.playerData.phone || store.p2Phone || "",
    school: store.playerData.school || "",
    major: store.playerData.major || "",
    character: store.character,
    spacemanColor: store.spacemanColor,
    spacemanHat: store.spacemanHat,
    spacemanPet: store.spacemanPet,
    visitedPlanetsCount: visitedArray.length,
    visitedPlanets: visitedArray,
    planetScores: planetScoresArray,
    totalScore,
    isGameCompleted: store.isGameCompleted || visitedArray.length >= 6,
    specializationResult: store.specializationResult,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existing = getLocalSavedAccounts();
  const existingIndex = existing.findIndex(
    (a) => a.id === currentLocalId || a.name.toLowerCase() === name.toLowerCase()
  );

  let updatedList: SavedDeviceAccount[];
  if (existingIndex >= 0) {
    updatedList = [...existing];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...account,
      createdAt: updatedList[existingIndex].createdAt || account.createdAt,
      updatedAt: Date.now(),
    };
  } else if (existing.length < MAX_ACCOUNTS_PER_DEVICE) {
    updatedList = [...existing, account];
  } else {
    // If device is already at max 2, update the first one or leave as is
    updatedList = existing;
  }

  setLocalSavedAccounts(updatedList);
  return account;
}

/**
 * Fetch all device accounts (merges LocalStorage & Supabase)
 */
export async function fetchDeviceAccounts(): Promise<{
  deviceId: string;
  accounts: SavedDeviceAccount[];
  canCreateNew: boolean;
  isFull: boolean;
}> {
  const deviceId = getLocalDeviceId();

  // First sync current active store if valid
  snapshotCurrentStoreAccount();

  const localAccounts = getLocalSavedAccounts();
  const mergedMap = new Map<string, SavedDeviceAccount>();

  // Add local accounts
  for (const acc of localAccounts) {
    mergedMap.set(acc.name.toLowerCase(), acc);
  }

  // Fetch remote players registered with this deviceId from Supabase
  if (isSupabaseEnabled() && supabase) {
    try {
      const { data: remoteRows, error } = await supabase
        .from("players")
        .select("*, leaderboard(total_score)")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: true })
        .limit(MAX_ACCOUNTS_PER_DEVICE);

      if (!error && remoteRows) {
        for (const row of remoteRows) {
          const key = row.name.toLowerCase();
          const existing = mergedMap.get(key);
          const remoteTotalScore = row.leaderboard?.total_score ?? existing?.totalScore ?? 0;

          mergedMap.set(key, {
            id: row.id,
            name: row.name,
            phone: row.phone || existing?.phone || "",
            school: row.school || existing?.school || "",
            major: row.major || existing?.major || "",
            character: (row.character_type as Character) || existing?.character || "pink",
            spacemanColor: (row.spaceman_color as SpacemanColorId) || existing?.spacemanColor || "original",
            spacemanHat: (row.spaceman_hat as SpacemanHatId) || existing?.spacemanHat || "none",
            spacemanPet: (row.spaceman_pet as SpacemanPetId) || existing?.spacemanPet || "none",
            visitedPlanetsCount: existing?.visitedPlanetsCount ?? (row.game_completed ? 6 : 0),
            visitedPlanets: existing?.visitedPlanets ?? [],
            planetScores: existing?.planetScores ?? [],
            totalScore: Math.max(remoteTotalScore, existing?.totalScore ?? 0),
            isGameCompleted: Boolean(row.game_completed || existing?.isGameCompleted),
            specializationResult: existing?.specializationResult,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : existing?.createdAt ?? Date.now(),
            updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
          });
        }
      }
    } catch (err) {
      console.warn("[deviceAccountService] Supabase device check fallback to local:", err);
    }
  }

  const accounts = Array.from(mergedMap.values()).slice(0, MAX_ACCOUNTS_PER_DEVICE);
  setLocalSavedAccounts(accounts);

  return {
    deviceId,
    accounts,
    canCreateNew: accounts.length < MAX_ACCOUNTS_PER_DEVICE,
    isFull: accounts.length >= MAX_ACCOUNTS_PER_DEVICE,
  };
}

/**
 * Load a saved account into useGameStore as active hero
 */
export function activateDeviceAccount(account: SavedDeviceAccount): void {
  // Update local player ID
  setLocalPlayerId(account.id);

  // Reconstitute state
  const visitedSet = new Set<import("../types/planet.types").PlanetId>(
    (account.visitedPlanets || []) as import("../types/planet.types").PlanetId[]
  );
  const planetScoreMap = new Map<string, import("../types/game.types").PlanetScore>(
    (account.planetScores || []) as [string, import("../types/game.types").PlanetScore][]
  );

  useGameStore.setState({
    character: account.character,
    spacemanColor: account.spacemanColor,
    spacemanHat: account.spacemanHat,
    spacemanPet: account.spacemanPet,
    playerData: {
      name: account.name,
      phone: account.phone || "",
      school: account.school || "",
      major: (account.major as any) || "",
    },
    p2Name: account.name,
    p2Phone: account.phone || "",
    visitedPlanets: visitedSet,
    planetScores: planetScoreMap,
    isGameCompleted: account.isGameCompleted,
    introCompleted: true,
    specializationResult: account.specializationResult || null,
  });

  // Re-snapshot to update last active timestamp
  snapshotCurrentStoreAccount();
}

/**
 * Prepare store for a new cadet account (fresh slot)
 */
export function prepareNewCadetSlot(chosenCharacter: Character = "pink"): void {
  const store = useGameStore.getState();
  store.resetGame();
  useGameStore.setState({
    character: chosenCharacter,
  });
  // Clear active player ID so new registration creates fresh UUID
  localStorage.removeItem("space-academy-player-id");
}
