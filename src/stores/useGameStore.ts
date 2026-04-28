import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Character = 'pink' | 'white';
type PlanetId = 1 | 2 | 3 | 4 | 5 | 6;

interface PlayerData {
  name: string;
  phone: string;
  school: string;
  major: 'IPA' | 'IPS' | '';
}

interface PlanetScore {
  planetId: PlanetId;
  stageId: number;
  score: number;
  completed: boolean;
}

interface LeaderboardEntry {
  playerName: string;
  totalScore: number;
  timestamp: number;
  major: 'IPA' | 'IPS' | '';
}

interface PlanetLeaderboardEntry {
  playerName: string;
  planetId: PlanetId;
  score: number;
  completionTime: number; // seconds
  timestamp: number;
}

interface GameState {
  // Character selection
  character: Character;
  setCharacter: (character: Character) => void;

  // Player data
  playerData: PlayerData;
  setPlayerData: (data: PlayerData) => void;

  // Game progress
  visitedPlanets: Set<PlanetId>;
  currentPlanet: PlanetId | null;
  setCurrentPlanet: (planetId: PlanetId | null) => void;
  markPlanetVisited: (planetId: PlanetId) => void;

  // Scores and stages
  planetScores: Map<string, PlanetScore>;
  addPlanetScore: (planetId: PlanetId, stageId: number, score: number, completionTime?: number) => void;
  getTotalScore: () => number;
  getPlanetScore: (planetId: PlanetId, stageId: number) => number;
  isPlanetCompleted: (planetId: PlanetId) => boolean;
  getStageCompleted: (planetId: PlanetId, stageId: number) => boolean;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  getLeaderboardEntries: () => LeaderboardEntry[];

  // Game completion
  isGameCompleted: boolean;
  completeGame: () => void;
  resetGame: () => void;

  // Intro State
  introCompleted: boolean;
  setIntroCompleted: (completed: boolean) => void;

  // Settings
  musicVolume: number;
  sfxVolume: number;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;

  // Per-planet leaderboards
  planetLeaderboards: PlanetLeaderboardEntry[];
  addPlanetLeaderboardEntry: (entry: PlanetLeaderboardEntry) => void;
  getPlanetLeaderboard: (planetId: PlanetId) => PlanetLeaderboardEntry[];

  // Boss Mode (Stage 6)
  bossMode: boolean;
  setBossMode: (mode: boolean) => void;
  bossGlobalHP: number;
  bossMaxHP: number;
  dealBossDamage: (damage: number, playerName: string) => void;
  bossDamageLog: Array<{ playerName: string; damage: number; timestamp: number }>;
  resetBossHP: () => void;
}

// Create a custom storage to handle Set serialization
const storage = {
  getItem: (name: string): string | null => {
    const item = localStorage.getItem(name);
    return item;
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      character: 'pink',
      setCharacter: (character) => set({ character }),

      playerData: {
        name: '',
        phone: '',
        school: '',
        major: '',
      },
      setPlayerData: (data) => set({ playerData: data }),

      visitedPlanets: new Set(),
      currentPlanet: null,
      setCurrentPlanet: (planetId) => set({ currentPlanet: planetId }),
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
        
        // Always update: store highest score
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

        // Auto-update planet leaderboard for current player
        const playerName = get().playerData.name || 'CADET';
        const elapsed = completionTime ?? 0;
        const boards = [...get().planetLeaderboards];
        const existingIdx = boards.findIndex(
          (e) => e.playerName === playerName && e.planetId === planetId
        );
        if (existingIdx >= 0) {
          // Update if higher score (or same score but faster time)
          const prev = boards[existingIdx];
          if (score > prev.score || (score === prev.score && elapsed < prev.completionTime)) {
            boards[existingIdx] = { playerName, planetId, score, completionTime: elapsed, timestamp: Date.now() };
            set({ planetLeaderboards: boards });
          }
        } else {
          // New entry
          boards.push({ playerName, planetId, score, completionTime: elapsed, timestamp: Date.now() });
          set({ planetLeaderboards: boards });
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
        // Check if all 5 stages of a planet are completed (for now just stage 1)
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
        const newLeaderboard = [...leaderboard, entry];
        // Sort by score descending
        newLeaderboard.sort((a, b) => b.totalScore - a.totalScore);
        // Keep top 100
        set({ leaderboard: newLeaderboard.slice(0, 100) });
      },
      getLeaderboardEntries: () => {
        return get().leaderboard.sort((a, b) => b.totalScore - a.totalScore);
      },

      isGameCompleted: false,
      completeGame: () => set({ isGameCompleted: true }),
      resetGame: () =>
        set({
          character: 'pink',
          playerData: {
            name: '',
            phone: '',
            school: '',
            major: '',
          },
          visitedPlanets: new Set(),
          currentPlanet: null,
          planetScores: new Map(),
          isGameCompleted: false,
        }),

      introCompleted: false,
      setIntroCompleted: (completed) => set({ introCompleted: completed }),

      musicVolume: 0.5,
      sfxVolume: 0.5,
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setSfxVolume: (volume) => set({ sfxVolume: volume }),

      // Per-planet leaderboards
      planetLeaderboards: [],
      addPlanetLeaderboardEntry: (entry) => {
        const boards = [...get().planetLeaderboards];
        // Upsert: update existing entry for same player+planet if new score is higher
        const existingIdx = boards.findIndex(
          (e) => e.playerName === entry.playerName && e.planetId === entry.planetId
        );
        if (existingIdx >= 0) {
          const prev = boards[existingIdx];
          if (entry.score > prev.score || (entry.score === prev.score && entry.completionTime < prev.completionTime)) {
            boards[existingIdx] = entry;
          }
        } else {
          boards.push(entry);
        }
        set({ planetLeaderboards: boards });
      },
      getPlanetLeaderboard: (planetId) => {
        return get().planetLeaderboards
          .filter(e => e.planetId === planetId)
          .sort((a, b) => b.score !== a.score ? b.score - a.score : a.completionTime - b.completionTime);
      },

      // Boss Mode
      bossMode: false,
      setBossMode: (mode) => set({ bossMode: mode }),
      bossGlobalHP: 500000,
      bossMaxHP: 500000,
      dealBossDamage: (damage, playerName) => {
        const currentHP = get().bossGlobalHP;
        const newHP = Math.max(0, currentHP - damage);
        const log = [...get().bossDamageLog, { playerName, damage, timestamp: Date.now() }];
        // Keep last 50 entries
        set({ bossGlobalHP: newHP, bossDamageLog: log.slice(-50) });
      },
      bossDamageLog: [],
      resetBossHP: () => set({ bossGlobalHP: 500000, bossDamageLog: [] }),
    }),
    {
      name: 'space-academy-storage',
      storage: {
        getItem: (name: string): string | null => {
          const item = localStorage.getItem(name);
          if (!item) return null;

          try {
            const parsed = JSON.parse(item);
            // Convert arrays back to Map and Set
            if (parsed.state.visitedPlanets) {
              parsed.state.visitedPlanets = new Set(parsed.state.visitedPlanets);
            }
            if (parsed.state.planetScores) {
              parsed.state.planetScores = new Map(parsed.state.planetScores);
            }
            return JSON.stringify(parsed);
          } catch {
            return item;
          }
        },
        setItem: (name: string, value: string): void => {
          try {
            const parsed = JSON.parse(value);
            // Convert Set and Map to arrays for storage
            if (parsed.state.visitedPlanets instanceof Set) {
              parsed.state.visitedPlanets = Array.from(parsed.state.visitedPlanets);
            }
            if (parsed.state.planetScores instanceof Map) {
              parsed.state.planetScores = Array.from(parsed.state.planetScores);
            }
            localStorage.setItem(name, JSON.stringify(parsed));
          } catch {
            localStorage.setItem(name, value);
          }
        },
        removeItem: (name: string): void => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
