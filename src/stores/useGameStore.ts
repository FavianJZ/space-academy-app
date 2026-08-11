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
import type { GameState } from "../types/game.types";

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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      character: "pink",
      setCharacter: (character) => set({ character }),
      spacemanColor: "original",
      setSpacemanColor: (spacemanColor) => set({ spacemanColor }),
      spacemanHat: "none",
      setSpacemanHat: (spacemanHat) => set({ spacemanHat }),
      spacemanPet: "none",
      setSpacemanPet: (spacemanPet) => set({ spacemanPet }),

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
      },

      setSfxVolume: (volume) => {
        set({ sfxVolume: volume });
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
      },

      p2Phone: "",

      setP2Phone: (phone) => {
        set({ p2Phone: phone });
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      version: 5,
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
