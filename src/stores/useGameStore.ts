import { create } from "zustand";
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
import type { GameState, PlanetId, PlanetScore } from "../types/game.types";
import type { ApiPlayer } from "../types/api.types";
import { api, ApiError } from "../services/api";

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

// --- Debounced background sync helpers ---
// Declared at module scope (not store state) since timers don't need
// to be reactive - they just need to survive between calls to the
// same setter fired in quick succession (slider drags, rapid clicks).

let profileSyncTimer: ReturnType<typeof setTimeout> | null = null;
const PROFILE_SYNC_DELAY_MS = 600;

let settingsSyncTimer: ReturnType<typeof setTimeout> | null = null;
const SETTINGS_SYNC_DELAY_MS = 600;

function scheduleProfileSync(get: () => GameState) {
  if (profileSyncTimer) clearTimeout(profileSyncTimer);

  profileSyncTimer = setTimeout(() => {
    const state = get();

    if (!state.playerId || !state.authToken) return;

    api
      .updatePlayerProfile(state.playerId, state.authToken, {
        spacemanColor: state.spacemanColor,
        spacemanHat: state.spacemanHat,
        spacemanPet: state.spacemanPet,
        p2Name: state.p2Name || undefined,
        p2Phone: state.p2Phone || undefined,
      })
      .catch((error) => {
        console.error("Failed to sync profile to server:", error);
      });
  }, PROFILE_SYNC_DELAY_MS);
}

function scheduleSettingsSync(get: () => GameState) {
  if (settingsSyncTimer) clearTimeout(settingsSyncTimer);

  settingsSyncTimer = setTimeout(() => {
    const state = get();

    if (!state.playerId || !state.authToken) return;

    api
      .updatePlayerSettings(state.playerId, state.authToken, {
        musicVolume: state.musicVolume,
        sfxVolume: state.sfxVolume,
      })
      .catch((error) => {
        console.error("Failed to sync settings to server:", error);
      });
  }, SETTINGS_SYNC_DELAY_MS);
}

// Converts a backend player record (which may carry the player's real
// server-side progress, e.g. for a returning player on a new device)
// into this store's local shape. Server data wins over whatever was
// locally cached.
function buildHydratedState(player: ApiPlayer, token: string, expiresAt: string) {
  const planetScores = new Map<string, PlanetScore>();
  const visitedPlanets = new Set<PlanetId>();

  (player.progress ?? []).forEach((entry) => {
    const planetId = entry.planetId as PlanetId;
    const key = `planet-${entry.planetId}-stage-${entry.stageId}`;

    planetScores.set(key, {
      planetId,
      stageId: entry.stageId,
      score: entry.score,
      completed: entry.completed,
    });

    if (entry.completed) {
      visitedPlanets.add(planetId);
    }
  });

  return {
    playerId: player.id,
    authToken: token,
    authTokenExpiresAt: expiresAt,
    playerData: {
      name: player.name,
      phone: player.phone,
      school: player.school,
      major: player.major ?? ("" as const),
    },
    character: player.character,
    spacemanColor: player.spacemanColor as GameState["spacemanColor"],
    spacemanHat: player.spacemanHat as GameState["spacemanHat"],
    spacemanPet: player.spacemanPet as GameState["spacemanPet"],
    p2Name: player.p2Name ?? "",
    p2Phone: player.p2Phone ?? "",
    musicVolume: player.settings?.musicVolume ?? DEFAULT_MUSIC_VOLUME,
    sfxVolume: player.settings?.sfxVolume ?? DEFAULT_SFX_VOLUME,
    planetScores,
    visitedPlanets,
    introCompleted: player.introCompleted,
    isGameCompleted: player.isGameCompleted,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      character: "pink",
      setCharacter: (character) => set({ character }),
      spacemanColor: "original",
      setSpacemanColor: (spacemanColor) => {
        set({ spacemanColor });
        scheduleProfileSync(get);
      },
      spacemanHat: "none",
      setSpacemanHat: (spacemanHat) => {
        set({ spacemanHat });
        scheduleProfileSync(get);
      },
      spacemanPet: "none",
      setSpacemanPet: (spacemanPet) => {
        set({ spacemanPet });
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

      addPlanetScore: (planetId, stageId, score, completionTime) => {
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

        // Background sync - local state above already updated so the
        // UI is instant regardless of network. A rejected/failed sync
        // (offline, implausible score, etc) is logged, not surfaced,
        // so a flaky connection never blocks gameplay.
        const { playerId, authToken } = get();

        if (playerId && authToken) {
          api
            .submitStageProgress(authToken, {
              planetId,
              stageId,
              score,
              completionTime,
              completed: true,
            })
            .catch((error) => {
              console.error("Failed to sync stage progress to server:", error);
            });
        }
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
        return [...get().planetLeaderboards]
          .filter((entry) => entry.planetId === planetId)
          .sort((a, b) =>
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
        // Local-only, called very frequently (per hit) for instant
        // visual feedback - NOT synced per-call. See submitBossDamage
        // for the actual server sync, fired once per session.
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
      },

      bossDamageLog: [],

      resetBossHP: () => {
        set({
          bossGlobalHP: BOSS_MAX_HP,
          bossMaxHP: BOSS_MAX_HP,
          bossDamageLog: [],
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

      // --- Backend integration ---

      playerId: null,
      authToken: null,
      authTokenExpiresAt: null,
      isRegistering: false,
      registerError: null,

      registerOrLoginPlayer: async () => {
        const { playerData, character } = get();

        set({ isRegistering: true, registerError: null });

        try {
          const { player, token, expiresAt } = await api.createOrLoginPlayer({
            name: playerData.name,
            phone: playerData.phone,
            school: playerData.school,
            major: playerData.major || undefined,
            character,
          });

          set(buildHydratedState(player, token, expiresAt));
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : "Tidak bisa menghubungi server. Cek koneksi internet kamu.";

          set({ registerError: message });
          throw error;
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
          const data = await api.getGlobalLeaderboard(50);
          set({ remoteLeaderboard: data ?? [] });
        } catch (error) {
          console.error("Failed to fetch global leaderboard:", error);
        } finally {
          set({ isLeaderboardLoading: false });
        }
      },

      remotePlanetLeaderboards: {},

      fetchPlanetLeaderboardRemote: async (planetId) => {
        try {
          const data = await api.getPlanetLeaderboard(planetId, 20);

          set((state) => ({
            remotePlanetLeaderboards: {
              ...state.remotePlanetLeaderboards,
              [planetId]: data ?? [],
            },
          }));
        } catch (error) {
          console.error("Failed to fetch planet leaderboard:", error);
        }
      },

      remoteBossStatus: null,

      fetchBossStatus: async () => {
        try {
          const status = await api.getBossStatus();

          if (status) set({ remoteBossStatus: status });
        } catch (error) {
          console.error("Failed to fetch boss status:", error);
        }
      },

      submitBossDamage: (damage) => {
        const { playerId, authToken } = get();

        if (!playerId || !authToken || damage <= 0) return;

        api
          .attackBoss(authToken, damage)
          .then((result) => {
            if (result?.boss) {
              set({ remoteBossStatus: result.boss });
            }
          })
          .catch((error) => {
            console.error("Failed to sync boss damage to server:", error);
          });
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 5,
      // Only new keys were added on top of version 5 (playerId,
      // authToken, remoteLeaderboard, etc) - no existing key's shape
      // changed, so zustand's default shallow merge (persisted state
      // spread over the fresh initial state) already fills them in
      // with their initial values correctly. No new migration branch
      // needed.
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

        return (
          version < 5
            ? { ...hatMigratedState, spacemanPet: "none" as const }
            : hatMigratedState
        ) as GameState;
      },
    }
  )
);
