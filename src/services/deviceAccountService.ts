import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Character, Major } from "../types/game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../types/customization.types";
import type { SpecializationResult, TelemetrySignals } from "../types/specialization.types";
import { INITIAL_TELEMETRY_SIGNALS } from "../utils/specializationCalculator";
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
  specializationResult?: SpecializationResult | null;
  telemetrySignals?: TelemetrySignals;
  createdAt: number;
  updatedAt: number;
}

const DEVICE_ID_KEY = "space-academy-device-uuid";
const DEVICE_ACCOUNTS_KEY = "space-academy-device-accounts";
const UNLINKED_PILOTS_KEY = "space-academy-unlinked-pilots";
export const MAX_ACCOUNTS_PER_DEVICE = 2;

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

export function getUnlinkedPilots(): { names: string[]; ids: string[] } {
  try {
    const raw = localStorage.getItem(UNLINKED_PILOTS_KEY);
    if (!raw) return { names: [], ids: [] };
    const parsed = JSON.parse(raw);
    return {
      names: Array.isArray(parsed?.names) ? parsed.names : [],
      ids: Array.isArray(parsed?.ids) ? parsed.ids : [],
    };
  } catch {
    return { names: [], ids: [] };
  }
}

export function isPilotUnlinked(
  id?: string | null,
  name?: string | null,
  cache?: { names: string[]; ids: string[] }
): boolean {
  const list = cache || getUnlinkedPilots();
  const cleanName = name?.trim().toLowerCase();
  const cleanId = id?.trim();

  if (cleanName && list.names.includes(cleanName)) return true;
  if (cleanId && !cleanId.startsWith("local_") && list.ids.includes(cleanId)) return true;
  return false;
}

export function addUnlinkedPilot(id?: string | null, name?: string | null): void {
  try {
    const list = getUnlinkedPilots();
    const cleanName = name?.trim().toLowerCase();
    const cleanId = id?.trim();

    let changed = false;
    if (cleanName && !list.names.includes(cleanName)) {
      list.names.push(cleanName);
      changed = true;
    }
    if (cleanId && !cleanId.startsWith("local_") && !list.ids.includes(cleanId)) {
      list.ids.push(cleanId);
      changed = true;
    }
    if (changed) {
      localStorage.setItem(UNLINKED_PILOTS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn("[deviceAccountService] Error adding unlinked pilot tombstone:", e);
  }
}

export function removeUnlinkedPilot(name?: string | null, id?: string | null): void {
  try {
    const list = getUnlinkedPilots();
    const cleanName = name?.trim().toLowerCase();
    const cleanId = id?.trim();

    const filteredNames = cleanName ? list.names.filter((n) => n !== cleanName) : list.names;
    const filteredIds = cleanId ? list.ids.filter((i) => i !== cleanId) : list.ids;

    localStorage.setItem(
      UNLINKED_PILOTS_KEY,
      JSON.stringify({ names: filteredNames, ids: filteredIds })
    );
  } catch (e) {
    console.warn("[deviceAccountService] Error removing unlinked pilot tombstone:", e);
  }
}

export function clearUnlinkedPilots(): void {
  try {
    localStorage.removeItem(UNLINKED_PILOTS_KEY);
  } catch (e) {
    console.warn("[deviceAccountService] Error clearing unlinked pilots:", e);
  }
}

export function getLocalSavedAccounts(): SavedDeviceAccount[] {
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unlinked = getUnlinkedPilots();
    const valid = parsed.filter((acc) => !isPilotUnlinked(acc.id, acc.name, unlinked));
    if (valid.length !== parsed.length) {
      localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(valid.slice(0, MAX_ACCOUNTS_PER_DEVICE)));
    }
    return valid.slice(0, MAX_ACCOUNTS_PER_DEVICE);
  } catch (err) {
    console.warn("[deviceAccountService] Error parsing device accounts:", err);
    return [];
  }
}

export function setLocalSavedAccounts(accounts: SavedDeviceAccount[]): void {
  try {
    const unlinked = getUnlinkedPilots();
    const valid = accounts.filter((acc) => !isPilotUnlinked(acc.id, acc.name, unlinked));
    const capped = valid.slice(0, MAX_ACCOUNTS_PER_DEVICE);
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn("[deviceAccountService] Error saving device accounts:", err);
  }
}

export const DEVICE_HAS_PLAYED_KEY = "space-academy-device-has-played";

/**
 * Checks if this device has ever played through the story / game at least once.
 * Returns false if the device is brand new or freshly reset.
 */
export function hasDevicePlayedBefore(): boolean {
  try {
    // 1. Explicit persistent flag in localStorage
    if (localStorage.getItem(DEVICE_HAS_PLAYED_KEY) === "true") {
      return true;
    }

    // 2. Check current store progress (intro completed, game completed, visited planets, or registered pilot)
    const store = useGameStore.getState();
    if (
      store.introCompleted ||
      store.isGameCompleted ||
      (store.visitedPlanets && store.visitedPlanets.size > 0)
    ) {
      markDeviceAsPlayed();
      return true;
    }

    if (store.playerData?.name?.trim() && store.playerData?.major) {
      markDeviceAsPlayed();
      return true;
    }

    // 3. Check existing saved accounts on this device
    const saved = getLocalSavedAccounts();
    if (saved && saved.length > 0) {
      const hasProgress = saved.some(
        (acc) =>
          acc.visitedPlanetsCount > 0 ||
          acc.isGameCompleted ||
          (acc.name && acc.name.trim().length > 0 && acc.major)
      );
      if (hasProgress) {
        markDeviceAsPlayed();
        return true;
      }
    }

    // 4. Check if player ID exists in storage from past active session
    const playerId = localStorage.getItem("space-academy-player-id");
    if (playerId) {
      markDeviceAsPlayed();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Marks this device as having completed a playthrough / experienced the story.
 */
export function markDeviceAsPlayed(): void {
  try {
    localStorage.setItem(DEVICE_HAS_PLAYED_KEY, "true");
  } catch (err) {
    console.warn("[deviceAccountService] Error marking device as played:", err);
  }
}

/**
 * Clears the device play history (used when resetting device).
 */
export function clearDevicePlayHistory(): void {
  try {
    localStorage.removeItem(DEVICE_HAS_PLAYED_KEY);
  } catch (err) {
    console.warn("[deviceAccountService] Error clearing device play history:", err);
  }
}


export function snapshotCurrentStoreAccount(): SavedDeviceAccount | null {
  const store = useGameStore.getState();
  const name = store.playerData.name?.trim();
  if (!name) return null;

  const currentLocalId = store.playerId || getLocalPlayerId() || `local_${name.toLowerCase()}`;

  // If this account has been unlinked/deleted from this device, never re-snapshot it
  if (isPilotUnlinked(currentLocalId, name)) {
    return null;
  }

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
    telemetrySignals: store.telemetrySignals,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const existing = getLocalSavedAccounts();

  const existingIndex = existing.findIndex(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );

  let updatedList: SavedDeviceAccount[];
  if (existingIndex >= 0) {
    const target = existing[existingIndex];
    updatedList = [...existing];
    updatedList[existingIndex] = {
      ...target,
      ...account,
      id: currentLocalId.startsWith("local_") ? target.id || currentLocalId : currentLocalId,
      createdAt: target.createdAt || account.createdAt,
      updatedAt: Date.now(),
    };
  } else if (existing.length < MAX_ACCOUNTS_PER_DEVICE) {
    updatedList = [...existing, account];
  } else {
    updatedList = existing;
  }

  setLocalSavedAccounts(updatedList);
  return account;
}

export async function fetchDeviceAccounts(): Promise<{
  deviceId: string;
  accounts: SavedDeviceAccount[];
  canCreateNew: boolean;
  isFull: boolean;
}> {
  const deviceId = getLocalDeviceId();

  // Snapshot active store cadet if there's any active player in memory
  snapshotCurrentStoreAccount();

  const localAccounts = getLocalSavedAccounts();
  const unlinked = getUnlinkedPilots();
  const mergedMap = new Map<string, SavedDeviceAccount>();

  // Start with clean local accounts
  for (const acc of localAccounts) {
    if (!isPilotUnlinked(acc.id, acc.name, unlinked)) {
      mergedMap.set(acc.name.toLowerCase(), acc);
    }
  }

  // If Supabase is connected, query by device_id
  if (isSupabaseEnabled() && supabase && deviceId && deviceId.trim().length > 5) {
    try {
      let remoteRows: any[] | null = null;
      const { data, error } = await supabase
        .from("players")
        .select("*, leaderboard(total_score)")
        .eq("device_id", deviceId)
        .neq("device_id", "")
        .not("device_id", "is", null)
        .order("created_at", { ascending: true })
        .limit(20);

      if (!error && data) {
        remoteRows = data;
      } else if (error && (error.code === "PGRST204" || error.message?.includes("device_id"))) {
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
          // Permanently ignore any pilot that was unlinked from this device
          if (isPilotUnlinked(row.id, row.name, unlinked)) {
            // Proactively clear device_id in Supabase in background
            supabase
              .from("players")
              .update({ device_id: "" })
              .eq("id", row.id)
              .then();
            continue;
          }

          const key = row.name.toLowerCase();
          const existing = mergedMap.get(key);

          const lbData = row.leaderboard;
          const lbScore = Array.isArray(lbData)
            ? lbData[0]?.total_score
            : lbData?.total_score;
          const remoteTotalScore = lbScore ?? existing?.totalScore ?? 0;

          if (existing && existing.totalScore > 0 && remoteTotalScore === 0) {
            continue;
          }

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
            telemetrySignals: existing?.telemetrySignals,
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


export async function syncAccountToSupabase(account: SavedDeviceAccount): Promise<string | null> {
  if (!isSupabaseEnabled()) return null;
  if (!account.name?.trim()) return null;
  if (isPilotUnlinked(account.id, account.name)) return null;

  try {
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

    if (account.isGameCompleted || account.visitedPlanetsCount >= 6) {
      await markGameCompleted(playerId);
      await markIntroCompleted(playerId);
    }

    if (account.specializationResult) {
      await updatePlayer(playerId, {
        specialization_result: account.specializationResult,
      });
    }

    if (account.totalScore > 0 && account.planetScores && account.planetScores.length > 0) {
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

    if (account.totalScore > 0) {
      await submitLeaderboardEntry(
        account.name,
        account.totalScore,
        account.major || "",
        playerId
      );
    }

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


export function activateDeviceAccount(account: SavedDeviceAccount): void {
  // If this account was previously tombstoned, clear it as the user intentionally activated it
  removeUnlinkedPilot(account.name, account.id);

  setLocalPlayerId(account.id);

  const visitedSet = new Set<import("../types/planet.types").PlanetId>(
    (account.visitedPlanets || []) as import("../types/planet.types").PlanetId[]
  );
  const planetScoreMap = new Map<string, import("../types/game.types").PlanetScore>(
    (account.planetScores || []) as [string, import("../types/game.types").PlanetScore][]
  );

  useGameStore.setState({
    playerId: account.id,
    character: account.character,
    spacemanColor: account.spacemanColor,
    spacemanHat: account.spacemanHat,
    spacemanPet: account.spacemanPet,
    playerData: {
      name: account.name,
      phone: account.phone || "",
      school: account.school || "",
      major: ((account.major === "IPA" || account.major === "IPS") ? account.major : "") as Major,
    },
    p2Name: "",
    p2Phone: "",
    visitedPlanets: visitedSet,
    planetScores: planetScoreMap,
    planetLeaderboards: [],
    remotePlanetLeaderboards: {},
    isGameCompleted: account.isGameCompleted,
    introCompleted: true,
    specializationResult: account.specializationResult || null,
    telemetrySignals: account.telemetrySignals || INITIAL_TELEMETRY_SIGNALS,
  });

  useGameStore.getState().refreshSpecializationProfile();

  snapshotCurrentStoreAccount();

  syncAccountToSupabase(account).catch(console.warn);
}


export function prepareNewCadetSlot(chosenCharacter: Character = "pink"): void {
  const store = useGameStore.getState();
  store.resetGame();
  useGameStore.setState({
    character: chosenCharacter,
    spacemanColor: "original",
    spacemanHat: "none",
    spacemanPet: "none",
    playerData: { name: "", phone: "", school: "", major: "IPA" },
    p2Name: "",
    p2Phone: "",
    planetScores: new Map(),
    visitedPlanets: new Set(),
    planetLeaderboards: [],
    remotePlanetLeaderboards: {},
    isGameCompleted: false,
    introCompleted: false,
    specializationResult: null,
    telemetrySignals: INITIAL_TELEMETRY_SIGNALS,
    playerId: null,
  });

  localStorage.removeItem("space-academy-player-id");
}

export async function removeDeviceAccount(
  accountIndexOrIdentifier: number | string
): Promise<SavedDeviceAccount[]> {
  const accounts = getLocalSavedAccounts();
  let targetIndex = -1;

  if (typeof accountIndexOrIdentifier === "number") {
    targetIndex = accountIndexOrIdentifier;
  } else {
    const cleanQuery = accountIndexOrIdentifier.trim().toLowerCase();
    targetIndex = accounts.findIndex(
      (a) => a.id === accountIndexOrIdentifier || a.name.trim().toLowerCase() === cleanQuery
    );
  }

  if (targetIndex >= 0 && targetIndex < accounts.length) {
    const [removed] = accounts.splice(targetIndex, 1);
    const oldDeviceId = getLocalDeviceId();

    // 1. Blacklist / tombstone this pilot on this device
    addUnlinkedPilot(removed.id, removed.name);

    // 2. Clear store if current active player matches removed pilot
    const store = useGameStore.getState();
    const localPlayerId = getLocalPlayerId();
    const isCurrentActive = Boolean(
      removed &&
        ((store.playerData.name &&
          removed.name &&
          store.playerData.name.trim().toLowerCase() === removed.name.trim().toLowerCase()) ||
          (store.playerId && removed.id && store.playerId === removed.id) ||
          (localPlayerId && removed.id && localPlayerId === removed.id))
    );

    if (isCurrentActive) {
      prepareNewCadetSlot(store.character || "pink");
    }

    // 3. Generate a fresh device ID for this device
    // This gives the exact same 100% guarantee that "Reset Perangkat" has,
    // so Supabase cannot accidentally resurrect the deleted pilot
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeHex = Date.now().toString(36).toUpperCase();
    const freshDeviceId = `DEV-${randomHex}-${timeHex}`;
    localStorage.setItem(DEVICE_ID_KEY, freshDeviceId);

    // 4. Save remaining accounts locally
    setLocalSavedAccounts(accounts);

    // 5. Supabase remote unlinking & re-tagging remaining accounts
    if (isSupabaseEnabled() && supabase) {
      try {
        // Disassociate removed pilot by ID
        if (removed.id && !removed.id.startsWith("local_")) {
          await supabase
            .from("players")
            .update({ device_id: "" })
            .eq("id", removed.id);
        }
        // Disassociate removed pilot by name & oldDeviceId
        if (removed.name) {
          await supabase
            .from("players")
            .update({ device_id: "" })
            .ilike("name", removed.name.trim())
            .eq("device_id", oldDeviceId);
        }

        // Re-tag remaining accounts to freshDeviceId
        for (const rem of accounts) {
          if (rem.id && !rem.id.startsWith("local_")) {
            await supabase
              .from("players")
              .update({ device_id: freshDeviceId })
              .eq("id", rem.id);
          } else if (rem.name) {
            await supabase
              .from("players")
              .update({ device_id: freshDeviceId })
              .ilike("name", rem.name.trim());
          }
        }
        console.log(`[deviceAccountService] Sukses menghapus pilot "${removed.name}" dari memori device dan Supabase`);
      } catch (err) {
        console.warn("[deviceAccountService] Error unlinking device_id in Supabase:", err);
      }
    }
  }

  return getLocalSavedAccounts();
}

export async function clearAllDeviceAccounts(): Promise<void> {
  const currentDeviceId = getLocalDeviceId();
  try {
    clearUnlinkedPilots();
    clearDevicePlayHistory();
    localStorage.removeItem(DEVICE_ACCOUNTS_KEY);
    localStorage.removeItem("space-academy-player-id");

    if (isSupabaseEnabled() && supabase && currentDeviceId) {
      await supabase
        .from("players")
        .update({ device_id: "" })
        .eq("device_id", currentDeviceId);
    }

    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeHex = Date.now().toString(36).toUpperCase();
    const freshId = `DEV-${randomHex}-${timeHex}`;
    localStorage.setItem(DEVICE_ID_KEY, freshId);
  } catch (err) {
    console.warn("[deviceAccountService] Error clearing device accounts:", err);
  }
  prepareNewCadetSlot("pink");
}

export async function updateCadetProfile(updatedData: {
  name: string;
  phone: string;
  school: string;
  major: Major;
}): Promise<boolean> {
  const store = useGameStore.getState();
  const oldName = store.playerData.name || "";
  const trimmedName = updatedData.name.trim();
  const trimmedPhone = updatedData.phone.trim();
  const trimmedSchool = updatedData.school.trim();
  const validMajor: Major = updatedData.major;

  store.setPlayerData({
    ...store.playerData,
    name: trimmedName,
    phone: trimmedPhone,
    school: trimmedSchool,
    major: validMajor,
  });

  const localList = getLocalSavedAccounts();
  const idx = localList.findIndex(
    (a) =>
      (oldName && a.name.toLowerCase() === oldName.toLowerCase()) ||
      (store.playerId && a.id === store.playerId)
  );

  const pId = store.playerId || getLocalPlayerId() || (idx >= 0 ? localList[idx]?.id : null);

  if (idx >= 0) {
    localList[idx] = {
      ...localList[idx],
      name: trimmedName,
      phone: trimmedPhone,
      school: trimmedSchool,
      major: validMajor,
      updatedAt: Date.now(),
    };
    setLocalSavedAccounts(localList);
  } else {
    snapshotCurrentStoreAccount();
  }

  if (isSupabaseEnabled() && pId && !pId.startsWith("local_")) {
    try {
      // 1. Update players table in-place (ID tetap sama, data profil diperbarui)
      await updatePlayer(pId, {
        name: trimmedName,
        phone: trimmedPhone,
        school: trimmedSchool,
        major: validMajor,
      });

      // 2. Update leaderboard table in-place (player_name & major diperbarui, skor tetap utuh)
      if (supabase) {
        await supabase
          .from("leaderboard")
          .update({
            player_name: trimmedName,
            major: validMajor,
            updated_at: new Date().toISOString(),
          })
          .eq("player_id", pId);
      }
    } catch (e) {
      console.warn("[deviceAccountService] updateCadetProfile Supabase error:", e);
    }
  }

  return true;
}


