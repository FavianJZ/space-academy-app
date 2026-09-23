import { create } from "zustand";
import {
  syncScoreToSupabase,
  syncLeaderboardToSupabase,
  syncBossDamageToSupabase,
} from "../hooks/useSupabaseSync";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BOSS_MAX_HP,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_PLAYER_DATA,
  DEFAULT_SFX_VOLUME,
  MAX_BOSS_DAMAGE_LOGS,
  MAX_LEADERBOARD_ENTRIES,
  STORAGE_KEY,
} from "../constants/game.constants";
import type { GameState, RaidMode } from "../types/game.types";
import { registerPlayer, updatePlayer } from "../services/playerService";
import {
  fetchGlobalLeaderboard as fetchGlobalLeaderboardFromSupabase,
  fetchPlanetLeaderboard,
} from "../services/leaderboardService";
import { fetchBossHP, dealBossDamage } from "../services/bossService";
import type { ApiGlobalLeaderboardEntry } from "../types/api.types";
import {
  calculateSpecializationProfile,
  INITIAL_TELEMETRY_SIGNALS,
} from "../utils/specializationCalculator";

const storage = createJSONStorage<GameState>(
  () => localStorage,
  {
    replacer: (key, value) => {
      if (key === "visitedPlanets" && value instanceof Set) {
        return Array.from(value);
      }

      if (key === "planetScores" && value instanceof Map) {
        return Array.from(value.entries());
      }

      return value;
    },
    reviver: (key, value) => {
      if (key === "visitedPlanets" && Array.isArray(value)) {
        return new Set(value);
      }

      if (key === "planetScores" && Array.isArray(value)) {
        return new Map(value);
      }

      return value;
    },
  }
);

let profileSyncTimer: ReturnType<typeof setTimeout> | null = null;
const PROFILE_SYNC_DELAY_MS = 600;

function scheduleProfileSync(get: () => GameState) {
  if (profileSyncTimer) clearTimeout(profileSyncTimer);

  profileSyncTimer = setTimeout(() => {
    const state = get();
    if (!state.playerId) return;

    updatePlayer(state.playerId, {
      spaceman_color: state.spacemanColor,
      spaceman_hat: state.spacemanHat,
      spaceman_pet: state.spacemanPet,
      specialization_result: state.specializationResult,
    }).catch((error) => {
      console.warn("Failed to sync profile to Supabase:", error);
    });
  }, PROFILE_SYNC_DELAY_MS);
}

function scheduleSettingsSync(_get?: () => GameState) {

}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      character: "pink",
      setCharacter: (character) => set({ character }),
      spacemanColor: "original",
      setSpacemanColor: (spacemanColor) => {
        set({ spacemanColor });
        get().recordCustomizationChange();
        scheduleProfileSync(get);
      },
      spacemanHat: "none",
      setSpacemanHat: (spacemanHat) => {
        set({ spacemanHat });
        get().recordCustomizationChange();
        scheduleProfileSync(get);
      },
      spacemanPet: "none",
      setSpacemanPet: (spacemanPet) => {
        set({ spacemanPet });
        get().recordCustomizationChange();
        scheduleProfileSync(get);
      },

      playerData: DEFAULT_PLAYER_DATA,
      setPlayerData: (data) => set({ playerData: data }),

      visitedPlanets: new Set(),
      currentPlanet: null,

      setCurrentPlanet: (planetId) => {
        set({ currentPlanet: planetId });
      },

      markPlanetVisited: (planetId) => {
        const visited = new Set(get().visitedPlanets);
        visited.add(planetId);

        set({ visitedPlanets: visited });
      },

      planetScores: new Map(),

      addPlanetScore: (planetId, stageId, score, completionTime, extraTelemetry) => {
        const key = `planet-${planetId}-stage-${stageId}`;
        const currentScores = get().planetScores;
        const existing = currentScores.get(key);

        if (!existing || score > existing.score) {
          const scores = new Map(currentScores);

          scores.set(key, {
            planetId,
            stageId,
            score,
            completed: true,
          });

          set({ planetScores: scores });
        }

        get().recordStageTelemetry({
          stageId: Number(stageId),
          timeSpentSeconds: completionTime ?? 0,
          attemptsCount: 1,
          score,
          completed: true,
          completedAt: new Date().toISOString(),
          ...extraTelemetry,
        });

        syncScoreToSupabase(planetId, stageId, score, completionTime);

        const playerName = get().playerData.name || "CADET";
        const elapsed = completionTime ?? 0;
        const boards = [...get().planetLeaderboards];

        const existingIndex = boards.findIndex(
          (entry) =>
            entry.playerName === playerName && entry.planetId === planetId
        );

        if (existingIndex >= 0) {
          const previousEntry = boards[existingIndex];

          if (
            score > previousEntry.score ||
            (score === previousEntry.score &&
              elapsed < previousEntry.completionTime)
          ) {
            boards[existingIndex] = {
              playerName,
              planetId,
              score,
              completionTime: elapsed,
              timestamp: Date.now(),
            };
          }
        } else {
          boards.push({
            playerName,
            planetId,
            score,
            completionTime: elapsed,
            timestamp: Date.now(),
          });
        }

        set({ planetLeaderboards: boards });
      },

      getTotalScore: () => {
        let total = 0;

        get().planetScores.forEach((value) => {
          total += value.score;
        });

        return total;
      },

      getPlanetScore: (planetId, stageId) => {
        const key = `planet-${planetId}-stage-${stageId}`;
        const entry = get().planetScores.get(key);

        return entry ? entry.score : 0;
      },

      isPlanetCompleted: (planetId) => {
        return get().visitedPlanets.has(planetId);
      },

      getStageCompleted: (planetId, stageId) => {
        const key = `planet-${planetId}-stage-${stageId}`;
        const entry = get().planetScores.get(key);

        return entry ? entry.completed : false;
      },

      leaderboard: [],

      addLeaderboardEntry: (entry) => {
        const leaderboard = get().leaderboard;
        const existingIndex = leaderboard.findIndex(
          (item) => item.playerName === entry.playerName
        );

        const newLeaderboard = [...leaderboard];

        if (existingIndex >= 0) {
          const previousEntry = newLeaderboard[existingIndex];

          if (
            entry.totalScore > previousEntry.totalScore ||
            (entry.totalScore === previousEntry.totalScore &&
              entry.timestamp > previousEntry.timestamp)
          ) {
            newLeaderboard[existingIndex] = entry;
          }
        } else {
          newLeaderboard.push(entry);
        }

        newLeaderboard.sort((a, b) => b.totalScore - a.totalScore);

        set({
          leaderboard: newLeaderboard.slice(0, MAX_LEADERBOARD_ENTRIES),
        });

        syncLeaderboardToSupabase(
          entry.playerName,
          entry.totalScore,
          entry.major
        );
      },

      getLeaderboardEntries: () => {
        return [...get().leaderboard].sort(
          (a, b) => b.totalScore - a.totalScore
        );
      },

      isGameCompleted: false,

      completeGame: () => {
        set({ isGameCompleted: true });
      },

      resetGame: () => {
        set({
          character: "pink",
          spacemanColor: "original",
          spacemanHat: "none",
          spacemanPet: "none",
          playerData: DEFAULT_PLAYER_DATA,
          visitedPlanets: new Set(),
          currentPlanet: null,
          planetScores: new Map(),
          isGameCompleted: false,
          introCompleted: false,
          planetLeaderboards: [],
          bossMode: false,
          bossGlobalHP: BOSS_MAX_HP,
          bossMaxHP: BOSS_MAX_HP,
          bossDamageLog: [],
          p2Name: "",
          p2Phone: "",
          playerId: null,
          authToken: null,
          authTokenExpiresAt: null,
          registerError: null,
          remoteLeaderboard: [],
          remotePlanetLeaderboards: {},
          remoteBossStatus: null,
          specializationResult: null,
          telemetrySignals: INITIAL_TELEMETRY_SIGNALS,
        });
      },

      introCompleted: false,

      setIntroCompleted: (completed) => {
        set({ introCompleted: completed });
      },

      musicVolume: DEFAULT_MUSIC_VOLUME,
      sfxVolume: DEFAULT_SFX_VOLUME,

      setMusicVolume: (volume) => {
        set({ musicVolume: volume });
        scheduleSettingsSync(get);
      },

      setSfxVolume: (volume) => {
        set({ sfxVolume: volume });
        scheduleSettingsSync(get);
      },

      language: "id" as const,

      setLanguage: (language) => {
        set({ language });
        scheduleSettingsSync(get);
      },

      planetLeaderboards: [],

      addPlanetLeaderboardEntry: (entry) => {
        const boards = [...get().planetLeaderboards];

        const existingIndex = boards.findIndex(
          (item) =>
            item.playerName === entry.playerName &&
            item.planetId === entry.planetId
        );

        if (existingIndex >= 0) {
          const previousEntry = boards[existingIndex];

          if (
            entry.score > previousEntry.score ||
            (entry.score === previousEntry.score &&
              entry.completionTime < previousEntry.completionTime)
          ) {
            boards[existingIndex] = entry;
          }
        } else {
          boards.push(entry);
        }

        set({ planetLeaderboards: boards });
      },

      getPlanetLeaderboard: (planetId) => {
        const localEntries = get().planetLeaderboards.filter(
          (entry) => entry.planetId === planetId
        );
        const remoteEntries =
          get().remotePlanetLeaderboards[planetId] || [];

        const merged = new Map<string, import("../types/game.types").PlanetLeaderboardEntry>();


        for (const entry of localEntries) {
          merged.set(entry.playerName, entry);
        }


        for (const entry of remoteEntries) {
          const compTime = entry.completionTime ?? 25;
          const existing = merged.get(entry.playerName);
          if (
            !existing ||
            entry.score > existing.score ||
            (entry.score === existing.score &&
              compTime < existing.completionTime)
          ) {
            merged.set(entry.playerName, {
              ...entry,
              completionTime: compTime,
            });
          }
        }


        const currentPlayerData = get().playerData;
        const currentName = currentPlayerData.name?.trim();
        const playerPlanetScore = get().getPlanetScore(planetId, planetId);
        const hasVisited = get().visitedPlanets.has(planetId);
        if (currentName && playerPlanetScore > 0 && hasVisited) {
          const existing = merged.get(currentName);
          if (!existing || playerPlanetScore > existing.score) {
            merged.set(currentName, {
              playerName: currentName,
              planetId,
              score: playerPlanetScore,
              completionTime: existing?.completionTime ?? 25,
              timestamp: Date.now(),
            });
          }
        }

        return [...merged.values()].sort((a, b) =>
          b.score !== a.score
            ? b.score - a.score
            : a.completionTime - b.completionTime
        );
      },

      bossMode: false,

      setBossMode: (mode) => {
        set({ bossMode: mode });
      },

      bossGlobalHP: BOSS_MAX_HP,
      bossMaxHP: BOSS_MAX_HP,

      dealBossDamage: (damage, playerName) => {

        const currentHP = get().bossGlobalHP;
        const newHP = Math.max(0, currentHP - damage);

        const log = [
          ...get().bossDamageLog,
          {
            playerName,
            damage,
            timestamp: Date.now(),
          },
        ];

        set({
          bossGlobalHP: newHP,
          bossDamageLog: log.slice(-MAX_BOSS_DAMAGE_LOGS),
        });

        syncBossDamageToSupabase(damage, playerName);
      },

      bossDamageLog: [],

      resetBossHP: (newMaxHp = BOSS_MAX_HP) => {
        set({
          bossGlobalHP: newMaxHp,
          bossMaxHP: newMaxHp,
          bossDamageLog: [],
        });
      },

      setBossGlobalHP: (hp: number) => {
        const maxHp = get().bossMaxHP || BOSS_MAX_HP;
        set({
          bossGlobalHP: Math.max(0, Math.min(maxHp, hp)),
        });
      },

      p2Name: "",

      setP2Name: (name) => {
        set({ p2Name: name });
        scheduleProfileSync(get);
      },

      p2Phone: "",

      setP2Phone: (phone) => {
        set({ p2Phone: phone });
        scheduleProfileSync(get);
      },

      raidMode: "solo",
      setRaidMode: (mode) => {
        set({ raidMode: mode, bossMode: mode !== "solo" });
      },

      onlinePartyCode: "",
      setOnlinePartyCode: (code) => {
        set({ onlinePartyCode: code.toUpperCase().trim() });
      },

      isPartyHost: false,
      setIsPartyHost: (isHost) => {
        set({ isPartyHost: isHost });
      },

      remoteCoPilot: null,
      setRemoteCoPilot: (coPilot) => {
        set({ remoteCoPilot: coPilot });
      },

      updateRemoteCoPilot: (partial) => {
        set((state) => ({
          remoteCoPilot: state.remoteCoPilot ? { ...state.remoteCoPilot, ...partial } : null,
        }));
      },

      resetMultiplayerSession: () => {
        set({
          remoteCoPilot: null,
          onlinePartyCode: "",
          isPartyHost: false,
          raidMode: "solo",
        });
      },

      playerId: null,
      authToken: null,
      authTokenExpiresAt: null,
      isRegistering: false,
      registerError: null,

      registerOrLoginPlayer: async () => {
        const { playerData, character, spacemanColor, spacemanHat, spacemanPet } = get();

        set({ isRegistering: true, registerError: null });

        try {
          const id = await registerPlayer({
            name: playerData.name,
            phone: playerData.phone,
            school: playerData.school,
            major: playerData.major || "",
            character_type: character,
            spaceman_color: spacemanColor,
            spaceman_hat: spacemanHat,
            spaceman_pet: spacemanPet,
          });

          if (id) {
            set({ playerId: id });
          }
        } catch (error) {
          console.warn("Supabase player registration error (falling back to local):", error);
        } finally {
          set({ isRegistering: false });
        }
      },

      logout: () => {
        set({ playerId: null, authToken: null, authTokenExpiresAt: null });
      },

      remoteLeaderboard: [],
      isLeaderboardLoading: false,

      fetchGlobalLeaderboard: async () => {
        set({ isLeaderboardLoading: true });

        try {
          const data = await fetchGlobalLeaderboardFromSupabase();
          const mapped: ApiGlobalLeaderboardEntry[] = data.map((r) => ({
            id: r.id,
            name: r.player_name,
            school: "",
            major: (r.major === "IPA" || r.major === "IPS" ? r.major : null),
            character: "pink",
            totalScore: r.total_score,
            updatedAt: r.updated_at,
          }));
          set({ remoteLeaderboard: mapped });
        } catch (error) {
          console.warn("Failed to fetch global leaderboard from Supabase:", error);
        } finally {
          set({ isLeaderboardLoading: false });
        }
      },

      remotePlanetLeaderboards: {},

      fetchPlanetLeaderboardRemote: async (planetId) => {
        try {
          const remoteEntries = await fetchPlanetLeaderboard(planetId);
          if (remoteEntries && remoteEntries.length > 0) {
            set((state) => ({
              remotePlanetLeaderboards: {
                ...state.remotePlanetLeaderboards,
                [planetId]: remoteEntries,
              },
            }));
          }
        } catch (error) {
          console.warn(
            `Failed to fetch remote leaderboard for planet ${planetId}:`,
            error
          );
        }
      },

      remoteBossStatus: null,

      fetchBossStatus: async () => {
        try {
          const status = await fetchBossHP();
          if (status) {
            set({
              remoteBossStatus: {
                id: "1",
                name: "Mega Bug",
                bossMode: true,
                bossGlobalHP: status.global_hp,
                bossMaxHP: status.max_hp,
              },
            });
          }
        } catch (error) {
          console.warn("Failed to fetch boss status:", error);
        }
      },

      submitBossDamage: (damage: number) => {
        const { playerData } = get();
        if (damage <= 0) return;

        dealBossDamage(damage, playerData.name || "CADET")
          .then((newHp: number | null) => {
            if (newHp !== null) {
              set((state) => ({
                remoteBossStatus: state.remoteBossStatus
                  ? { ...state.remoteBossStatus, bossGlobalHP: newHp }
                  : null,
              }));
            }
          })
          .catch((error: unknown) => {
            console.warn("Failed to sync boss damage to Supabase:", error);
          });
      },

      specializationResult: null,
      telemetrySignals: INITIAL_TELEMETRY_SIGNALS,

      recordCustomizationChange: () => {
        const currentSignals = get().telemetrySignals || INITIAL_TELEMETRY_SIGNALS;
        const updatedSignals = {
          ...currentSignals,
          customizationChangesCount: (currentSignals.customizationChangesCount || 0) + 1,
        };
        set({ telemetrySignals: updatedSignals });
        get().refreshSpecializationProfile();
      },

      recordRouteSelection: (routeId: string) => {
        const currentSignals = get().telemetrySignals || INITIAL_TELEMETRY_SIGNALS;
        const updatedSignals = {
          ...currentSignals,
          routeSelected: routeId,
        };
        set({ telemetrySignals: updatedSignals });
        get().refreshSpecializationProfile();
      },

      recordStageTelemetry: (record: import("../types/specialization.types").StageTelemetryRecord) => {
        const currentSignals = get().telemetrySignals || INITIAL_TELEMETRY_SIGNALS;
        const stageRecords = {
          ...(currentSignals.stageRecords || {}),
          [record.stageId]: record,
        };
        const totalTime = (currentSignals.totalTimePlayedSeconds || 0) + (record.timeSpentSeconds || 0);
        const updatedSignals = {
          ...currentSignals,
          stageRecords,
          totalTimePlayedSeconds: totalTime,
        };
        set({ telemetrySignals: updatedSignals });
        get().refreshSpecializationProfile();
      },

      refreshSpecializationProfile: () => {
        const state = get();
        const completedStagesCount = Array.from(state.planetScores.values()).filter(
          (s) => s.completed
        ).length;

        const currentSignals = state.telemetrySignals || INITIAL_TELEMETRY_SIGNALS;


        const cleanedStageRecords: Record<number, import("../types/specialization.types").StageTelemetryRecord> = {};


        for (const [, planetScore] of state.planetScores.entries()) {
          if (planetScore.completed && planetScore.stageId) {
            const sid = Number(planetScore.stageId);
            const existingRec = currentSignals.stageRecords?.[sid];
            cleanedStageRecords[sid] = {
              ...(existingRec || {}),
              stageId: sid,
              score: planetScore.score ?? existingRec?.score ?? 100,
              completed: true,
              timeSpentSeconds: existingRec?.timeSpentSeconds ?? 60,
              attemptsCount: existingRec?.attemptsCount ?? 1,
              completedAt: existingRec?.completedAt ?? new Date().toISOString(),
            };
          }
        }


        if (state.visitedPlanets.has(1) && !cleanedStageRecords[1]) {
          const existingRec1 = currentSignals.stageRecords?.[1];
          cleanedStageRecords[1] = {
            ...(existingRec1 || {}),
            stageId: 1,
            score: existingRec1?.score ?? 500,
            completed: true,
            timeSpentSeconds: existingRec1?.timeSpentSeconds ?? 60,
            attemptsCount: existingRec1?.attemptsCount ?? 1,
            completedAt: existingRec1?.completedAt ?? new Date().toISOString(),
          };
        }

        const updatedSignals = {
          ...currentSignals,
          stageRecords: cleanedStageRecords,
        };

        const profile = calculateSpecializationProfile(
          updatedSignals,
          completedStagesCount
        );
        set({
          telemetrySignals: updatedSignals,
          specializationResult: profile,
        });
        scheduleProfileSync(get);
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 9,
      partialize: (state) => {
        const rest = { ...state };
        delete (rest as Partial<GameState>).remoteCoPilot;
        delete (rest as Partial<GameState>).onlinePartyCode;
        delete (rest as Partial<GameState>).isPartyHost;
        delete (rest as Partial<GameState>).bossGlobalHP;
        delete (rest as Partial<GameState>).bossMaxHP;
        delete (rest as Partial<GameState>).bossDamageLog;
        return {
          ...rest,
          remoteCoPilot: null,
          onlinePartyCode: "",
          isPartyHost: false,
          raidMode: "solo" as RaidMode,
        };
      },

      migrate: (persistedState, version) => {
        const state = persistedState as GameState;
        const scoreMigratedState =
          version < 2
            ? {
                ...state,
                visitedPlanets: new Set(),
                planetScores: new Map(),
                planetLeaderboards: [],
                bossGlobalHP: BOSS_MAX_HP,
                bossMaxHP: BOSS_MAX_HP,
                bossDamageLog: [],
                isGameCompleted: false,
                p2Name: "",
                p2Phone: "",
              }
            : state;
        const colorMigratedState =
          version < 3
            ? { ...scoreMigratedState, spacemanColor: "original" as const }
            : scoreMigratedState;
        const hatMigratedState =
          version < 4
            ? { ...colorMigratedState, spacemanHat: "none" as const }
            : colorMigratedState;

        const petMigratedState =
          version < 5
            ? { ...hatMigratedState, spacemanPet: "none" as const }
            : hatMigratedState;

        const botLeaderboardCleanedState =
          version < 6
            ? {
                ...petMigratedState,
                planetLeaderboards: [],
                remotePlanetLeaderboards: {},
              }
            : petMigratedState;

        const botLeaderboardRecalibratedState =
          version < 7
            ? {
                ...botLeaderboardCleanedState,
                planetLeaderboards: [],
                remotePlanetLeaderboards: {},
              }
            : botLeaderboardCleanedState;

        const languageMigratedState =
          version < 8
            ? {
                ...botLeaderboardRecalibratedState,
                language: ((botLeaderboardRecalibratedState as Record<string, unknown>).language as "id" | "en") || "id",
              }
            : botLeaderboardRecalibratedState;

        const bossHPMigratedState =
          version < 9
            ? {
                ...languageMigratedState,
                bossGlobalHP: BOSS_MAX_HP,
                bossMaxHP: BOSS_MAX_HP,
                bossDamageLog: [],
              }
            : languageMigratedState;

        return bossHPMigratedState as GameState;
      },
    }
  )
);
