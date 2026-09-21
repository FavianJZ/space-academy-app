import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Character } from "../types/game.types";
import type {
  SpacemanColorId,
  SpacemanHatId,
  SpacemanPetId,
} from "../types/customization.types";
import type { TelemetrySignals } from "../types/specialization.types";
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
  specializationResult?: any;
  telemetrySignals?: TelemetrySignals;
  createdAt: number;
  updatedAt: number;
}

const DEVICE_ID_KEY = "space-academy-device-uuid";
const DEVICE_ACCOUNTS_KEY = "space-academy-device-accounts";
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


export function setLocalSavedAccounts(accounts: SavedDeviceAccount[]): void {
  try {
    const capped = accounts.slice(0, MAX_ACCOUNTS_PER_DEVICE);
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(capped));
  } catch (err) {
    console.warn("[deviceAccountService] Error saving device accounts:", err);
  }
}


export function snapshotCurrentStoreAccount(): SavedDeviceAccount | null {
  const store = useGameStore.getState();
  const name = store.playerData.name?.trim();
  if (!name) return null;

  const currentLocalId = store.playerId || getLocalPlayerId() || `local_${name.toLowerCase()}`;
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


  snapshotCurrentStoreAccount();

  const localAccounts = getLocalSavedAccounts();
  const mergedMap = new Map<string, SavedDeviceAccount>();


  for (const acc of localAccounts) {
    mergedMap.set(acc.name.toLowerCase(), acc);
  }


  if (isSupabaseEnabled() && supabase) {
    try {
      let remoteRows: any[] | null = null;
      const { data, error } = await supabase
        .from("players")
        .select("*, leaderboard(total_score)")
        .eq("device_id", deviceId)
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
      major: (account.major as any) || "",
    },
    p2Name: account.name,
    p2Phone: account.phone || "",
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
