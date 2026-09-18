import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Character } from "../types/game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../types/customization.types";
import { useGameStore } from "../stores/useGameStore";
import {
  getLocalPlayerId,
  setLocalPlayerId,
  registerPlayer,
  updatePlayer,
  markGameCompleted,
  markIntroCompleted,
} from "./playerService";
import { submitScore } from "./scoreService";
import { submitLeaderboardEntry } from "./leaderboardService";

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
      let remoteRows: any[] | null = null;
      const { data, error } = await supabase
        .from("players")
        .select("*, leaderboard(total_score)")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: true })
        .limit(MAX_ACCOUNTS_PER_DEVICE);

      if (!error && data) {
        remoteRows = data;
      } else if (error && (error.code === "PGRST204" || error.message?.includes("device_id"))) {
        // Fallback if device_id column doesn't exist yet in Supabase
        if (localAccounts.length > 0) {
          const names = localAccounts.map((a) => a.name);
          const { data: fallbackRows } = await supabase
            .from("players")
            .select("*, leaderboard(total_score)")
            .in("name", names);
          remoteRows = fallbackRows;
        }
      }

      if (remoteRows) {
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

  // Background recovery: sync all local accounts to Supabase
  if (isSupabaseEnabled()) {
    syncAllLocalAccountsToSupabase().catch((err) =>
      console.warn("[deviceAccountService] Background sync warning:", err)
    );
  }

  return {
    deviceId,
    accounts,
    canCreateNew: accounts.length < MAX_ACCOUNTS_PER_DEVICE,
    isFull: accounts.length >= MAX_ACCOUNTS_PER_DEVICE,
  };
}

/**
 * Sync a local SavedDeviceAccount to Supabase database (Player, Scores, Leaderboard, Specialization)
 */
export async function syncAccountToSupabase(account: SavedDeviceAccount): Promise<string | null> {
  if (!isSupabaseEnabled()) return null;
  if (!account.name?.trim()) return null;

  try {
    // 1. Register or retrieve player in Supabase
    const playerId = await registerPlayer({
      name: account.name.trim(),
      phone: account.phone || "",
      school: account.school || "",
      major: account.major || "",
      character_type: account.character,
      spaceman_color: account.spacemanColor,
      spaceman_hat: account.spacemanHat,
      spaceman_pet: account.spacemanPet,
      specialization_result: account.specializationResult,
    });

    if (!playerId) {
      console.warn("[deviceAccountService] Could not resolve playerId in Supabase for account:", account.name);
      return null;
    }

    // 2. Mark progress flags
    if (account.isGameCompleted || account.visitedPlanetsCount >= 6) {
      await markGameCompleted(playerId);
      await markIntroCompleted(playerId);
    }

    // 3. Update specialization if exists
    if (account.specializationResult) {
      await updatePlayer(playerId, {
        specialization_result: account.specializationResult,
      });
    }

    // 4. Sync planet scores
    if (account.planetScores && account.planetScores.length > 0) {
      for (const [, scoreData] of account.planetScores) {
        if (scoreData && scoreData.score > 0) {
          await submitScore(
            scoreData.planetId,
            scoreData.stageId,
            scoreData.score,
            0,
            playerId
          );
        }
      }
    }

    // 5. Sync total score to leaderboard
    if (account.totalScore > 0) {
      await submitLeaderboardEntry(
        account.name,
        account.totalScore,
        account.major || "",
        playerId
      );
    }

    // 6. Update cached account id with real Supabase UUID if it was previously local
    if (account.id !== playerId) {
      account.id = playerId;
      const localList = getLocalSavedAccounts();
      const idx = localList.findIndex(
        (a) => a.name.toLowerCase() === account.name.toLowerCase()
      );
      if (idx >= 0) {
        localList[idx].id = playerId;
        setLocalSavedAccounts(localList);
      }
    }

    console.log(`[deviceAccountService] Sukses sinkronisasi akun "${account.name}" ke Supabase Cloud (ID: ${playerId})!`);
    return playerId;
  } catch (err) {
    console.error("[deviceAccountService] Error saat sinkronisasi akun ke Supabase:", err);
    return null;
  }
}

/**
 * Synchronize all locally saved device accounts to Supabase
 */
export async function syncAllLocalAccountsToSupabase(): Promise<number> {
  if (!isSupabaseEnabled()) return 0;
  const accounts = getLocalSavedAccounts();
  if (accounts.length === 0) return 0;

  let successCount = 0;
  for (const acc of accounts) {
    const res = await syncAccountToSupabase(acc);
    if (res) successCount++;
  }
  return successCount;
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

  // Trigger sync in background for this account
  syncAccountToSupabase(account).catch(console.warn);
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
