import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Stars } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

import AdaptiveCanvas from "../../common/AdaptiveCanvas";
import { useGameAudio } from "../../../hooks/useGameAudio";
import { useGameStore } from "../../../stores/useGameStore";
import { CadetDossierModal } from "../../specialization/CadetDossierModal";

import {
  InteractiveRobot,
  type RobotReaction,
} from "../shared/InteractiveRobot";
import { FloatingParticles } from "../shared/FloatingParticles";
import {
  SpeechBubble,
} from "../shared/SpeechBubble";
import {
  getRobotMessages,
  getRandomMessage,
} from "../shared/speechBubbleContent";
import { BossUFO } from "../shared/BossUFO";
import { getTranslation } from "../../../i18n/translations";
import type { Language } from "../../../types/game.types";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

interface Stage6BugHuntProps {
  planetId: number;
}

interface CodeSnippet {
  id: number;
  code: string;
  isBug: boolean;
  category: string;
}

const bugSnippets: CodeSnippet[] = [
  { id: 1, code: "if (x = 5) {", isBug: true, category: "Condition" },
  { id: 2, code: 'console.log("hello)', isBug: true, category: "String" },
  { id: 3, code: "for(i=0; i<10; i--)", isBug: true, category: "Loop" },
  { id: 4, code: 'let 1name = "test"', isBug: true, category: "Variable" },
  { id: 5, code: "array.lenght", isBug: true, category: "Property" },
  { id: 6, code: "fucntion start() {}", isBug: true, category: "Function" },
  { id: 7, code: "retrun true;", isBug: true, category: "Return" },
  { id: 8, code: "Class App extends {}", isBug: true, category: "Class" },
  { id: 9, code: "var x = = 5;", isBug: true, category: "Assign" },
  { id: 10, code: 'getElementByld("id")', isBug: true, category: "DOM" },
  { id: 11, code: "cosnt data = [];", isBug: true, category: "Declare" },
  { id: 12, code: "whlie (true) { }", isBug: true, category: "Loop" },
  { id: 13, code: 'new Erorr("fail")', isBug: true, category: "Error" },
  { id: 14, code: "async awiat fetch()", isBug: true, category: "Async" },
  { id: 15, code: "import Rect from", isBug: true, category: "Import" },
  { id: 16, code: "str.toupperCase()", isBug: true, category: "Method" },
  { id: 17, code: "Math.PI = 3.14;", isBug: true, category: "Const" },
  { id: 18, code: 'parselnt("10", 10)', isBug: true, category: "Parse" },
  { id: 19, code: "documnet.title", isBug: true, category: "DOM" },
  { id: 20, code: "arry.push(item)", isBug: true, category: "Typo" },
];

const cleanSnippets: CodeSnippet[] = [
  { id: 101, code: "if (x === 5) {", isBug: false, category: "Condition" },
  { id: 102, code: 'console.log("hello")', isBug: false, category: "String" },
  { id: 103, code: "for(let i=0; i<10; i++)", isBug: false, category: "Loop" },
  { id: 104, code: 'let name = "test"', isBug: false, category: "Variable" },
  { id: 105, code: "array.length", isBug: false, category: "Property" },
  { id: 106, code: "function start() {}", isBug: false, category: "Function" },
  { id: 107, code: "return true;", isBug: false, category: "Return" },
  { id: 108, code: "class App extends {}", isBug: false, category: "Class" },
  { id: 109, code: "let x = 5;", isBug: false, category: "Assign" },
  { id: 110, code: 'getElementById("id")', isBug: false, category: "DOM" },
  { id: 111, code: "const data = [];", isBug: false, category: "Declare" },
  { id: 112, code: "while (true) { }", isBug: false, category: "Loop" },
  { id: 113, code: 'new Error("fail")', isBug: false, category: "Error" },
  { id: 114, code: "await fetch(url)", isBug: false, category: "Async" },
  { id: 115, code: "import React from", isBug: false, category: "Import" },
  { id: 116, code: "str.toUpperCase()", isBug: false, category: "Method" },
  { id: 117, code: "const PI = Math.PI;", isBug: false, category: "Const" },
  { id: 118, code: 'parseInt("10", 10)', isBug: false, category: "Parse" },
  { id: 119, code: "document.title", isBug: false, category: "DOM" },
  { id: 120, code: "array.push(item)", isBug: false, category: "Typo" },
];

interface ActiveCell {
  snippet: CodeSnippet;
  spawnTime: number;
  lifetime: number;
  animState: "entering" | "active" | "exiting";
  abducted?: boolean;
}

interface CellFeedback {
  type: "squash" | "wrong" | "miss" | "abducted";
  time: number;
}

interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  time: number;
}

interface TickerMessage {
  id: number;
  text: string;
  time: number;
}

const GAME_DURATION = 60;
const BUG_RATIO = 0.6;
const BOSS_BUG_RATIO = 0.55;
const ABDUCTION_PENALTY = 300;
const BOSS_DAMAGE_PER_BUG = 100;

type CoopPlayerId = "P1" | "P2";

interface CoopPlayerSnapshot {
  hits: number;
  misses: number;
  damage: number;
  score: number;
  lastAction: string;
}

interface CoopPlayerProfile {
  id: CoopPlayerId;
  title: string;
  subtitle: string;
  inputHint: string;
  description: string;
  keyRows: string[][];
  accent: string;
}

const COOP_PLAYER_ORDER: CoopPlayerId[] = ["P1", "P2"];

const getCoopProfiles = (
  p1Name?: string,
  p2Name?: string,
  lang: Language = "id"
): Record<CoopPlayerId, CoopPlayerProfile> => {
  const isEn = lang === "en";
  return {
    P1: {
      id: "P1",
      title: p1Name?.toUpperCase() || (isEn ? "MOUSE PILOT" : "PILOT MOUSE"),
      subtitle: isEn ? "Click to blast bugs instantly" : "Klik untuk basmi bug langsung",
      inputHint: isEn ? "Mouse click" : "Klik mouse",
      description: isEn
        ? "Click any active bug tile. This is the primary raid control for the lead player."
        : "Klik kotak bug aktif. Ini adalah kontrol raid utama untuk pilot pertama.",
      keyRows: [["LMB"], [isEn ? "Click active bugs directly" : "Klik bug aktif langsung"]],
      accent: "#00ffff",
    },
    P2: {
      id: "P2",
      title: p2Name?.toUpperCase() || (isEn ? "NUMPAD RUNNER" : "PELARI NUMPAD"),
      subtitle: isEn ? "Numpad 1-9 keys" : "Tombol Numpad 1-9",
      inputHint: "Numpad 1-9",
      description: isEn
        ? "Use numpad digits in grid order, from top-left to bottom-right."
        : "Gunakan angka numpad sesuai urutan grid, dari kiri-atas ke kanan-bawah.",
      keyRows: [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
      ],
      accent: "#ffb703",
    },
  };
};

const COOP_PLAYER_PROFILES = getCoopProfiles();

const NUMPAD_KEY_MAP: Record<string, number> = {
  "7": 0,
  "8": 1,
  "9": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "1": 6,
  "2": 7,
  "3": 8,
};

const LETTER_KEY_MAP: Record<string, number> = {
  q: 0,
  w: 1,
  e: 2,
  a: 3,
  s: 4,
  d: 5,
  z: 6,
  x: 7,
  c: 8,
};

const createDefaultCoopSnapshot = (): Record<
  CoopPlayerId,
  CoopPlayerSnapshot
> => ({
  P1: {
    hits: 0,
    misses: 0,
    damage: 0,
    score: 0,
    lastAction: "Ready",
  },
  P2: {
    hits: 0,
    misses: 0,
    damage: 0,
    score: 0,
    lastAction: "Ready",
  },
});

const CoopLegend: React.FC<{
  compact?: boolean;
  stats?: Record<CoopPlayerId, CoopPlayerSnapshot>;
  profiles?: Record<CoopPlayerId, CoopPlayerProfile>;
}> = ({ compact = false, stats, profiles }) => {
  const activeProfiles = profiles || COOP_PLAYER_PROFILES;

  return (
    <div className={`coop-legend ${compact ? "compact" : "full"}`}>
      {COOP_PLAYER_ORDER.map((playerId) => {
        const profile = activeProfiles[playerId];
        const snapshot = stats?.[playerId];

        return (
          <div
            key={playerId}
            className={`coop-card ${compact ? "compact" : "full"}`}
            style={{
              borderColor: profile.accent,
              boxShadow: `0 0 0 1px ${profile.accent}22 inset, 0 0 26px ${profile.accent}14`,
            }}
          >
            <div className="coop-card-header">
              <span className="coop-card-id" style={{ color: profile.accent }}>
                {profile.id}
              </span>

              <div>
                <div
                  className="coop-card-title"
                  style={{ color: profile.accent }}
                >
                  {profile.title}
                </div>
                <div className="coop-card-subtitle">{profile.subtitle}</div>
              </div>
            </div>

            <div className="coop-card-hint">{profile.inputHint}</div>

            {!compact && (
              <>
                <div className="coop-key-grid">
                  {profile.keyRows.map((row, rowIndex) => (
                    <div key={`${playerId}-${rowIndex}`} className="coop-key-row">
                      {row.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </div>
                  ))}
                </div>

                <p className="coop-card-description">{profile.description}</p>
              </>
            )}

            {compact && snapshot && (
              <div className="coop-card-mini-stats">
                <span>{snapshot.hits} hit</span>
                <span>{snapshot.damage} DMG</span>
                <span>{snapshot.misses} miss</span>
              </div>
            )}

            {compact && !snapshot && (
              <div className="coop-card-mini-stats">
                <span>{profile.description}</span>
              </div>
            )}

            {!compact && snapshot && (
              <div className="coop-card-live">
                <span>{snapshot.hits} hit</span>
                <span>{snapshot.damage} DMG</span>
                <span>{snapshot.misses} miss</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const Stage6BugHunt: React.FC<Stage6BugHuntProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const { getMotionMs, playSfx } = useGameAudio();

  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const addLeaderboardEntry = useGameStore(
    (state) => state.addLeaderboardEntry
  );
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const playerData = useGameStore((state) => state.playerData);

  const isBossMode = useGameStore((state) => state.bossMode);
  const bossGlobalHP = useGameStore((state) => state.bossGlobalHP);
  const bossMaxHP = useGameStore((state) => state.bossMaxHP);
  const dealBossDamage = useGameStore((state) => state.dealBossDamage);
  const submitBossDamage = useGameStore((state) => state.submitBossDamage);
  const p2NameFromStore = useGameStore((state) => state.p2Name);

  const stageStartRef = useRef(0);

  const specializationResult = useGameStore(
    (state) => state.specializationResult
  );
  const refreshSpecializationProfile = useGameStore(
    (state) => state.refreshSpecializationProfile
  );
  const [showDossier, setShowDossier] = useState(false);

  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);
  const robotMessages = getRobotMessages(language);

  const coopProfiles = React.useMemo(
    () => getCoopProfiles(playerData.name || undefined, p2NameFromStore || undefined, language),
    [playerData.name, p2NameFromStore, language]
  );

  const [phase, setPhase] = useState<
    "intro" | "countdown" | "playing" | "results" | "completion"
  >("intro");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const [cells, setCells] = useState<(ActiveCell | null)[]>(
    Array(18).fill(null)
  );
  const [feedbacks, setFeedbacks] = useState<(CellFeedback | null)[]>(
    Array(18).fill(null)
  );

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [bugsSquashed, setBugsSquashed] = useState(0);
  const [bugsMissed, setBugsMissed] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [totalBugsSpawned, setTotalBugsSpawned] = useState(0);

  const [bossDamageTaken, setBossDamageTaken] = useState(0);
  const [ufoHitFlash, setUfoHitFlash] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [abductedCells, setAbductedCells] = useState<Set<number>>(new Set());
  const [laserActive, setLaserActive] = useState(false);
  const [coopStats, setCoopStats] =
    useState<Record<CoopPlayerId, CoopPlayerSnapshot>>(
      createDefaultCoopSnapshot
    );

  const [robotReaction, setRobotReaction] = useState<RobotReaction>("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [screenEffect, setScreenEffect] = useState("");

  const damageIdRef = useRef(0);
  const tickerIdRef = useRef(0);
  const abductionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gameTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellsRef = useRef(cells);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const timeRef = useRef(timeLeft);
  const phaseRef = useRef(phase);
  const totalBugsRef = useRef(0);
  const bossDmgRef = useRef(0);
  const coopStatsRef =
    useRef<Record<CoopPlayerId, CoopPlayerSnapshot>>(
      createDefaultCoopSnapshot()
    );
  const usedSnippetIds = useRef(new Set<number>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    timeRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    bossDmgRef.current = bossDamageTaken;
  }, [bossDamageTaken]);

  useEffect(() => {
    coopStatsRef.current = coopStats;
  }, [coopStats]);

  const updateCoopStats = useCallback(
    (
      playerId: CoopPlayerId,
      updater: (snapshot: CoopPlayerSnapshot) => CoopPlayerSnapshot
    ) => {
      setCoopStats((prev) => ({
        ...prev,
        [playerId]: updater(prev[playerId]),
      }));
    },
    []
  );

  const resolveCoopInput = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key in NUMPAD_KEY_MAP) {
        const baseIdx = NUMPAD_KEY_MAP[key];
        const finalIdx = isBossMode ? baseIdx + 9 : baseIdx;

        return {
          playerId: "P2" as CoopPlayerId,
          cellIdx: finalIdx,
        };
      }

      if (key in LETTER_KEY_MAP && !isBossMode) {
        return {
          playerId: "P1" as CoopPlayerId,
          cellIdx: LETTER_KEY_MAP[key],
        };
      }

      return null;
    },
    [isBossMode]
  );

  const playSound = useCallback(
    (
      type:
        | "squash"
        | "wrong"
        | "miss"
        | "complete"
        | "countdown"
        | "go"
        | "laser"
        | "abduct"
    ) => {
      const cues = {
        squash: "bugSquash",
        wrong: "feedbackIncorrect",
        miss: "feedbackIncorrect",
        complete: "missionComplete",
        countdown: "timerTick",
        go: "feedbackCorrect",
        laser: "bossRaidHit",
        abduct: "bossWarning",
      } as const;

      return playSfx(cues[type], {
        volume: type === "miss" ? 0.45 : type === "laser" ? 0.8 : 1,
      });
    },
    [playSfx]
  );

  const getSnippet = useCallback((shouldBeBug: boolean) => {
    const pool = shouldBeBug ? bugSnippets : cleanSnippets;
    const available = pool.filter(
      (snippet) => !usedSnippetIds.current.has(snippet.id)
    );
    const pick = available.length > 0 ? pickRandom(available) : pickRandom(pool);

    usedSnippetIds.current.add(pick.id);

    if (usedSnippetIds.current.size > 12) {
      const arr = Array.from(usedSnippetIds.current);

      for (let i = 0; i < 4; i += 1) {
        usedSnippetIds.current.delete(arr[i]);
      }
    }

    return pick;
  }, []);

  const getDifficulty = useCallback(() => {
    const elapsed = GAME_DURATION - timeRef.current;

    if (isBossMode) {
      if (elapsed < 15) {
        return {
          spawnInterval: 900,
          lifetime: 3200,
          maxActive: 6,
        };
      }

      if (elapsed < 30) {
        return {
          spawnInterval: 700,
          lifetime: 2800,
          maxActive: 8,
        };
      }

      if (elapsed < 45) {
        return {
          spawnInterval: 550,
          lifetime: 2200,
          maxActive: 10,
        };
      }

      return {
        spawnInterval: 400,
        lifetime: 1800,
        maxActive: 12,
      };
    }

    if (elapsed < 15) {
      return {
        spawnInterval: 2200,
        lifetime: 3500,
        maxActive: 2,
      };
    }

    if (elapsed < 30) {
      return {
        spawnInterval: 1800,
        lifetime: 3000,
        maxActive: 3,
      };
    }

    if (elapsed < 45) {
      return {
        spawnInterval: 1400,
        lifetime: 2500,
        maxActive: 4,
      };
    }

    return {
      spawnInterval: 1000,
      lifetime: 2000,
      maxActive: 5,
    };
  }, [isBossMode]);

  const spawnSnippet = useCallback(function scheduleSnippet() {
    if (phaseRef.current !== "playing") return;

    const diff = getDifficulty();
    const currentCells = cellsRef.current;
    const activeCount = currentCells.filter((cell) => cell !== null).length;

    if (activeCount >= diff.maxActive) {
      spawnTimerRef.current = window.setTimeout(scheduleSnippet, 500);
      return;
    }

    const emptyCells: number[] = [];
    const maxIdx = isBossMode ? 18 : 9;

    for (let i = 0; i < maxIdx; i += 1) {
      if (currentCells[i] === null) {
        emptyCells.push(i);
      }
    }

    if (emptyCells.length === 0) {
      spawnTimerRef.current = window.setTimeout(scheduleSnippet, 500);
      return;
    }

    const cellIdx = pickRandom(emptyCells);
    const ratio = isBossMode ? BOSS_BUG_RATIO : BUG_RATIO;
    const isBug = Math.random() < ratio;
    const snippet = getSnippet(isBug);

    if (isBug) {
      totalBugsRef.current += 1;
      setTotalBugsSpawned(totalBugsRef.current);
    }

    const newCells = [...currentCells];

    newCells[cellIdx] = {
      snippet,
      spawnTime: Date.now(),
      lifetime: diff.lifetime,
      animState: "entering",
    };

    setCells(newCells);

    window.setTimeout(() => {
      setCells((prev) => {
        const updated = [...prev];

        if (updated[cellIdx] && updated[cellIdx]?.animState === "entering") {
          updated[cellIdx] = {
            ...updated[cellIdx]!,
            animState: "active",
          };
        }

        return updated;
      });
    }, 300);

    window.setTimeout(() => {
      setCells((prev) => {
        const updated = [...prev];
        const cell = updated[cellIdx];

        if (cell && cell.snippet.id === snippet.id) {
          updated[cellIdx] = {
            ...cell,
            animState: "exiting",
          };

          if (cell.snippet.isBug) {
            setBugsMissed((prevMissed) => prevMissed + 1);
            setCombo(0);

            setFeedbacks((prevFeedbacks) => {
              const nextFeedbacks = [...prevFeedbacks];
              nextFeedbacks[cellIdx] = {
                type: "miss",
                time: Date.now(),
              };
              return nextFeedbacks;
            });
          }

          window.setTimeout(() => {
            setCells((prevCells) => {
              const nextCells = [...prevCells];

              if (
                nextCells[cellIdx] &&
                nextCells[cellIdx]?.snippet.id === snippet.id
              ) {
                nextCells[cellIdx] = null;
              }

              return nextCells;
            });

            setFeedbacks((prevFeedbacks) => {
              const nextFeedbacks = [...prevFeedbacks];

              if (nextFeedbacks[cellIdx]?.type === "miss") {
                nextFeedbacks[cellIdx] = null;
              }

              return nextFeedbacks;
            });

            setAbductedCells((prevAbducted) => {
              const nextAbducted = new Set(prevAbducted);
              nextAbducted.delete(cellIdx);
              return nextAbducted;
            });
          }, 400);
        }

        return updated;
      });
    }, diff.lifetime);

    const jitter = (Math.random() - 0.5) * 400;

    spawnTimerRef.current = window.setTimeout(
      scheduleSnippet,
      diff.spawnInterval + jitter
    );
  }, [getDifficulty, getSnippet, isBossMode]);

  const triggerAbduction = useCallback(function scheduleAbduction() {
    if (phaseRef.current !== "playing" || !isBossMode) return;

    const currentCells = cellsRef.current;
    const cleanCellIdxs: number[] = [];

    currentCells.forEach((cell, index) => {
      if (
        cell &&
        !cell.snippet.isBug &&
        cell.animState !== "exiting" &&
        !cell.abducted
      ) {
        cleanCellIdxs.push(index);
      }
    });

    if (cleanCellIdxs.length > 0) {
      const targetIdx = pickRandom(cleanCellIdxs);

      setCells((prev) => {
        const updated = [...prev];

        if (updated[targetIdx]) {
          updated[targetIdx] = {
            ...updated[targetIdx]!,
            abducted: true,
          };
        }

        return updated;
      });

      setAbductedCells((prev) => new Set(prev).add(targetIdx));

      window.setTimeout(() => {
        setCells((prev) => {
          const updated = [...prev];

          if (updated[targetIdx]) {
            updated[targetIdx] = {
              ...updated[targetIdx]!,
              abducted: false,
            };
          }

          return updated;
        });

        setAbductedCells((prev) => {
          const next = new Set(prev);
          next.delete(targetIdx);
          return next;
        });
      }, 3000);
    }

    const nextDelay = 4000 + Math.random() * 4000;
    abductionTimerRef.current = window.setTimeout(scheduleAbduction, nextDelay);
  }, [isBossMode]);

  const spawnTickerMessage = useCallback(() => {
    if (!isBossMode) return;

    const playerId = pickRandom(COOP_PLAYER_ORDER);
    const profile = coopProfiles[playerId];
    const snapshot = coopStatsRef.current[playerId];

    tickerIdRef.current += 1;

    const message: TickerMessage = {
      id: tickerIdRef.current,
      text:
        snapshot.hits > 0
          ? `${profile.id} ${snapshot.hits} hits · ${snapshot.damage} DMG`
          : `${profile.id} ready: ${profile.inputHint}`,
      time: Date.now(),
    };

    setTickerMessages((prev) => [...prev.slice(-4), message]);
  }, [isBossMode, coopProfiles]);

  const addDamageNumber = useCallback((value: number) => {
    damageIdRef.current += 1;

    const damageNumber: DamageNumber = {
      id: damageIdRef.current,
      value,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 30,
      time: Date.now(),
    };

    setDamageNumbers((prev) => [...prev.slice(-6), damageNumber]);

    window.setTimeout(() => {
      setDamageNumbers((prev) =>
        prev.filter((item) => item.id !== damageNumber.id)
      );
    }, 1200);
  }, []);

  const pushTickerMessage = useCallback((text: string) => {
    tickerIdRef.current += 1;

    const message: TickerMessage = {
      id: tickerIdRef.current,
      text,
      time: Date.now(),
    };

    setTickerMessages((prev) => [...prev.slice(-4), message]);
  }, []);

  const handleCellAction = useCallback(
    (cellIdx: number, playerId: CoopPlayerId = "P1") => {
      if (phaseRef.current !== "playing") return;

      const cell = cellsRef.current[cellIdx];

      if (!cell || cell.animState === "exiting") return;

      const snippet = cell.snippet;
      const isAbducted = cell.abducted;
      const playerProfile = coopProfiles[playerId];

      setCells((prev) => {
        const updated = [...prev];
        updated[cellIdx] = null;
        return updated;
      });

      setAbductedCells((prev) => {
        const next = new Set(prev);
        next.delete(cellIdx);
        return next;
      });

      if (snippet.isBug) {
        const newCombo = comboRef.current + 1;
        const comboMultiplier = Math.min(1 + (newCombo - 1) * 0.25, 3);
        const points = Math.round(100 * comboMultiplier);

        setScore((prev) => prev + points);
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));
        setBugsSquashed((prev) => prev + 1);

        playSound("squash");

        updateCoopStats(playerId, (snapshot) => ({
          ...snapshot,
          hits: snapshot.hits + 1,
          score: snapshot.score + points,
          lastAction: `+${points} score`,
        }));

        if (isBossMode) {
          const damage = Math.round(BOSS_DAMAGE_PER_BUG * comboMultiplier);

          setBossDamageTaken((prev) => prev + damage);
          bossDmgRef.current += damage;

          setUfoHitFlash(true);
          window.setTimeout(
            () => setUfoHitFlash(false),
            getMotionMs("bossRaidHit")
          );

          setLaserActive(true);
          window.setTimeout(
            () => setLaserActive(false),
            getMotionMs("bossRaidHit")
          );

          addDamageNumber(damage);
          dealBossDamage(damage, playerProfile.title);

          updateCoopStats(playerId, (snapshot) => ({
            ...snapshot,
            damage: snapshot.damage + damage,
            lastAction: `+${damage} DMG`,
          }));

          pushTickerMessage(`${playerProfile.id} smashed a bug for ${damage} DMG`);
          playSound("laser");
        }

        setFeedbacks((prev) => {
          const feedback = [...prev];
          feedback[cellIdx] = {
            type: "squash",
            time: Date.now(),
          };
          return feedback;
        });

        window.setTimeout(() => {
          setFeedbacks((prev) => {
            const feedback = [...prev];

            if (feedback[cellIdx]?.type === "squash") {
              feedback[cellIdx] = null;
            }

            return feedback;
          });
        }, 600);

        if (newCombo >= 3) {
          setRobotReaction("celebrating");
          setSpeechMessage(
            newCombo >= 5
              ? `${newCombo}x COMBO! UNSTOPPABLE! 🔥`
              : `${newCombo}x Combo! 🎯`
          );
        } else {
          setRobotReaction("correct");
          setSpeechMessage(getRandomMessage(robotMessages.correct));
        }

        setScreenEffect("screen-flash-green");

        window.setTimeout(() => {
          setScreenEffect("");
          setRobotReaction("idle");
        }, 1200);

        return;
      }

      if (isAbducted && isBossMode) {
        setScore((prev) => Math.max(0, prev - ABDUCTION_PENALTY));
        setCombo(0);
        setWrongClicks((prev) => prev + 1);

        updateCoopStats(playerId, (snapshot) => ({
          ...snapshot,
          misses: snapshot.misses + 1,
          lastAction: language === "en" ? "Hit an abduction trap" : "Terjebak sinar penculik",
        }));

        pushTickerMessage(
          language === "en"
            ? `${playerProfile.id} hit an abduction trap!`
            : `${playerProfile.id} terkena sinar penculik!`
        );
        playSound("abduct");

        setFeedbacks((prev) => {
          const feedback = [...prev];
          feedback[cellIdx] = {
            type: "abducted",
            time: Date.now(),
          };
          return feedback;
        });

        window.setTimeout(() => {
          setFeedbacks((prev) => {
            const feedback = [...prev];

            if (feedback[cellIdx]?.type === "abducted") {
              feedback[cellIdx] = null;
            }

            return feedback;
          });
        }, 800);

        setRobotReaction("incorrect");
        setSpeechMessage(
          language === "en"
            ? "ABDUCTION TRAP! The UFO tricked you! −300 pts! 🛸"
            : "JEBAKAN PENCULIK! UFO memperdayamu! −300 poin! 🛸"
        );
        setScreenEffect("screen-shake");

        window.setTimeout(() => {
          setScreenEffect("");
          setRobotReaction("idle");
        }, 1500);

        return;
      }

      setScore((prev) => Math.max(0, prev - 50));
      setCombo(0);
      setWrongClicks((prev) => prev + 1);

      updateCoopStats(playerId, (snapshot) => ({
        ...snapshot,
        misses: snapshot.misses + 1,
        lastAction: language === "en" ? "Missed a clean tile" : "Mengetuk kode bersih",
      }));

      pushTickerMessage(
        language === "en"
          ? `${playerProfile.id} tapped clean code!`
          : `${playerProfile.id} mengetuk kode bersih!`
      );
      playSound("wrong");

      setFeedbacks((prev) => {
        const feedback = [...prev];
        feedback[cellIdx] = {
          type: "wrong",
          time: Date.now(),
        };
        return feedback;
      });

      window.setTimeout(() => {
        setFeedbacks((prev) => {
          const feedback = [...prev];

          if (feedback[cellIdx]?.type === "wrong") {
            feedback[cellIdx] = null;
          }

          return feedback;
        });
      }, 600);

      setRobotReaction("incorrect");
      setSpeechMessage(
        language === "en"
          ? "That code was correct! Only click bugs! 🐛"
          : "Kode itu sudah benar! Hanya ketuk kode bug! 🐛"
      );
      setScreenEffect("screen-shake");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, 1200);
    },
    [
      playSound,
      isBossMode,
      addDamageNumber,
      dealBossDamage,
      pushTickerMessage,
      updateCoopStats,
      coopProfiles,
      getMotionMs,
      language,
    ]
  );

  const handleRobotClick = () => {
    const messages = getRobotMessages(language);
    if (phase === "playing") {
      setSpeechMessage(
        isBossMode
          ? (language === "en" ? "Attack the UFO! Squash those bugs! 🛸" : "Serang UFO! Basmi bug-bug itu! 🛸")
          : (language === "en" ? "Focus on the code! Squash those bugs! 🐛" : "Fokus pada kode! Basmi bug-bug itu! 🐛")
      );
    } else {
      setSpeechMessage(getRandomMessage(messages.idle));
    }

    setRobotReaction("waving");

    window.setTimeout(() => {
      setRobotReaction("idle");
    }, 2000);
  };

  const startCountdown = () => {
    setPhase("countdown");
    setCountdown(3);
    playSound("countdown");
  };

  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown <= 0) {
      playSound("go");
      setPhase("playing");
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);

      if (countdown > 1) {
        playSound("countdown");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [phase, countdown, playSound]);

  useEffect(() => {
    if (phase !== "playing") return;

    spawnTimerRef.current = window.setTimeout(spawnSnippet, 800);

    gameTickRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase("results");
          return 0;
        }

        if (prev <= 11) playSfx("timerLowTime");

        return prev - 1;
      });
    }, 1000);

    if (isBossMode) {
      abductionTimerRef.current = window.setTimeout(triggerAbduction, 5000);
      tickerTimerRef.current = window.setInterval(
        spawnTickerMessage,
        3000 + Math.random() * 4000
      );
    }

    return () => {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (abductionTimerRef.current) clearTimeout(abductionTimerRef.current);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [
    phase,
    spawnSnippet,
    isBossMode,
    playSfx,
    triggerAbduction,
    spawnTickerMessage,
  ]);

  useEffect(() => {
    if (phase !== "results") return;

    if (gameTickRef.current) clearInterval(gameTickRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (abductionTimerRef.current) clearTimeout(abductionTimerRef.current);
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);

    setCells(Array(18).fill(null));
    setAbductedCells(new Set());

    const accuracyValue =
      totalBugsRef.current > 0 ? bugsSquashed / totalBugsRef.current : 0;

    let bonus = 0;

    if (accuracyValue >= 0.9) {
      bonus += 300;
    } else if (accuracyValue >= 0.8) {
      bonus += 200;
    } else if (accuracyValue >= 0.7) {
      bonus += 100;
    }

    bonus += maxCombo * 30;

    const finalScore = scoreRef.current + bonus;

    setScore(finalScore);
    setRobotReaction("celebrating");
    setSpeechMessage(
      isBossMode
        ? `Raid complete, ${
            playerData.name?.trim() || "cadet"
          }! You dealt ${bossDmgRef.current} DMG to the UFO! 🎉`
        : "Mission complete! Great debugging, cadet! 🎉"
    );
    playSound("complete");
  }, [
    phase,
    bugsSquashed,
    maxCombo,
    playSound,
    isBossMode,
    playerData.name,
  ]);

  const handleComplete = useCallback(() => {
    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);

    const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);

    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 6, score, elapsed, {
      errorsCaught: bugsSquashed,
      attemptsCount: 1 + wrongClicks,
    });
    refreshSpecializationProfile();

    if (isBossMode && bossDmgRef.current > 0) {
      submitBossDamage(bossDmgRef.current);
    }

    const allVisitedAfterThisStage = visitedPlanets.size >= 5;

    if (allVisitedAfterThisStage && playerData.name?.trim()) {
      addLeaderboardEntry({
        playerName: playerData.name.trim(),
        totalScore: useGameStore.getState().getTotalScore(),
        timestamp: Date.now(),
        major: playerData.major,
      });
    }

    setPhase("completion");
    setRobotReaction("celebrating");
    setScreenEffect("screen-flash-green");

    window.setTimeout(() => {
      setScreenEffect("");
    }, 500);

    timeoutRef.current = window.setTimeout(() => {
      const allVisited = visitedPlanets.size >= 5;
      navigate(allVisited ? "/leaderboard" : "/mainhub");
    }, 4000);
  }, [
    planetId,
    score,
    markPlanetVisited,
    addPlanetScore,
    refreshSpecializationProfile,
    bugsSquashed,
    wrongClicks,
    addLeaderboardEntry,
    navigate,
    visitedPlanets,
    playerData.name,
    playerData.major,
    isBossMode,
    submitBossDamage,
  ]);

  const handleReplay = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setPhase("intro");
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setBugsSquashed(0);
    setBugsMissed(0);
    setWrongClicks(0);
    setTotalBugsSpawned(0);
    totalBugsRef.current = 0;
    bossDmgRef.current = 0;
    setBossDamageTaken(0);
    setDamageNumbers([]);
    setTickerMessages([]);
    setAbductedCells(new Set());
    setCoopStats(createDefaultCoopSnapshot());
    usedSnippetIds.current.clear();
    setCells(Array(18).fill(null));
    setFeedbacks(Array(18).fill(null));
    setRobotReaction("idle");
    setSpeechMessage("");
    setScreenEffect("");
    stageStartRef.current = Date.now();
  };

  useEffect(() => {
    return () => {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abductionTimerRef.current) clearTimeout(abductionTimerRef.current);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isBossMode || phase !== "playing") return;
    if (bossGlobalHP > 0) return;

    setPhase("results");
  }, [isBossMode, phase, bossGlobalHP]);

  useEffect(() => {
    if (phase !== "playing") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;

      if (
        target &&
        ["input", "textarea", "select"].includes(target.tagName.toLowerCase())
      ) {
        return;
      }

      if (target?.isContentEditable) return;

      const resolved = resolveCoopInput(event);

      if (!resolved) return;

      event.preventDefault();
      handleCellAction(resolved.cellIdx, resolved.playerId);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase, resolveCoopInput, handleCellAction]);

  const accuracy =
    totalBugsSpawned > 0
      ? Math.round((bugsSquashed / totalBugsSpawned) * 100)
      : 0;

  const timerPercent = (timeLeft / GAME_DURATION) * 100;
  const timerUrgent = timeLeft <= 10;
  const bossHPPercent =
    bossMaxHP > 0 ? Math.max(0, (bossGlobalHP / bossMaxHP) * 100) : 0;

  const getStars = () => {
    if (score >= 1500) return 3;
    if (score >= 800) return 2;
    if (score >= 300) return 1;
    return 0;
  };

  if (phase === "completion") {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <div className="completion-badge">
            {score >= 800 ? (language === "en" ? "🏆 MISSION COMPLETE" : "🏆 MISI SELESAI") : (language === "en" ? "⚠️ STAGE COMPLETE" : "⚠️ STAGE SELESAI")}
          </div>
          <h1>{isBossMode ? t.stages.stage6.raidReport : t.stages.stage6.missionReport}</h1>

          <div className="score-info">
            <p>
              {language === "en" ? "Bugs Squashed:" : "Bug Dibasmi:"} {bugsSquashed}/{totalBugsSpawned}
            </p>
            <p>{language === "en" ? "Accuracy:" : "Akurasi:"} {accuracy}%</p>
            <p>{language === "en" ? "Max Combo:" : "Combo Maksimal:"} {maxCombo}x</p>
            {isBossMode && <p>{language === "en" ? "Boss Damage:" : "Damage Bos:"} {bossDamageTaken} DMG</p>}
            <p>{language === "en" ? "Final Score:" : "Skor Akhir:"} {score} {language === "en" ? "points" : "poin"}</p>

            <div className="star-display">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= getStars() ? "earned" : ""}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <p className="returning-message">
            {visitedPlanets.size >= 5
              ? (language === "en" ? "Heading to leaderboard..." : "Menuju papan peringkat...")
              : t.stages.stage6.returningHub}
          </p>

          <div className="completion-buttons">
            <button
              className="stage-dossier-btn"
              onClick={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                refreshSpecializationProfile();
                setShowDossier(true);
              }}
            >
              🎓 {t.leaderboard.specializationDossierBtn.replace("🎓 ", "")}
            </button>

            <button className="replay-btn" onClick={handleReplay}>
              {language === "en" ? "Replay Stage" : "Main Ulang"}
            </button>

            <button className="return-btn" onClick={() => navigate("/mainhub")}>
              {t.leaderboard.backToHubBtn}
            </button>
          </div>

          <div className="robot-celebration">
            <AdaptiveCanvas
              camera={{ position: [0, 1.2, 6], fov: 44 }}
              dpr={[1, 1.1]}
              quality="low"
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.9} />
              <directionalLight
                position={[2, 4, 6]}
                intensity={1.8}
                color="#ffffff"
              />
              <pointLight
                position={[5, 5, 5]}
                intensity={80}
                color="#ffcc00"
              />
              <InteractiveRobot
                reaction="celebrating"
                scale={4.2}
                position={[0, -1.55, 0]}
              />
              <Stars
                radius={100}
                depth={20}
                count={220}
                factor={5}
                saturation={0}
                fade
                speed={1}
              />
            </AdaptiveCanvas>
          </div>
        </div>

        {showDossier && specializationResult && (
          <CadetDossierModal
            result={specializationResult}
            cadet={{
              name: playerData.name,
              school: playerData.school,
              major: playerData.major,
            }}
            onClose={() => setShowDossier(false)}
          />
        )}
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div
        className={`stage-bug-hunt intro-phase ${isBossMode ? "boss-mode" : ""} ${screenEffect}`}
      >
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas
            camera={{ position: [0, 1.2, 6], fov: 44 }}
            dpr={[1, 1.1]}
            quality="low"
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight
              position={[2, 4, 6]}
              intensity={1.5}
              color="#ffffff"
            />
            <pointLight
              position={[5, 5, 5]}
              intensity={80}
              color="#ffcc00"
            />
            <InteractiveRobot
              reaction={robotReaction}
              scale={5.2}
              position={[0, -1.55, 0]}
              onClick={handleRobotClick}
            />
            <Stars
              radius={100}
              depth={20}
              count={140}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />
          </AdaptiveCanvas>

          {speechMessage && (
            <SpeechBubble
              message={speechMessage}
              type="robot"
              duration={3000}
              onDone={() => setSpeechMessage("")}
            />
          )}
        </div>

        <FloatingParticles />

        <div className="bughunt-intro-overlay">
          <div
            className={`bughunt-intro-layout ${
              isBossMode ? "boss-mode" : "normal-mode"
            }`}
          >
            {!isBossMode && (
              <div className="normal-tutorial-section">
                <div className="tutorial-header-line">
                  <span className="tutorial-header-dash" />
                  <span className="boss-coop-label">{t.stages.stage6.soloInputMatrix}</span>
                  <span className="tutorial-header-dash" />
                </div>

                <p className="tutorial-section-lede">
                  {t.stages.stage6.chooseControlMap}
                </p>

                <div className="tutorial-cards-grid">
                  <div className="tutorial-card">
                    <div className="tutorial-card-header">
                      <span className="tutorial-card-badge">M1</span>
                      <div>
                        <div className="tutorial-card-title">{t.stages.stage6.mouseTitle}</div>
                        <div className="tutorial-card-subtitle">
                          {t.stages.stage6.mouseSubtitle}
                        </div>
                      </div>
                    </div>

                    <div className="tutorial-card-hint">{t.stages.stage6.mouseHint}</div>

                    <div className="tutorial-card-keys">
                      <div className="tutorial-key-row">
                        <kbd>LMB</kbd>
                      </div>
                    </div>

                    <p className="tutorial-card-desc">
                      {t.stages.stage6.mouseDesc}
                    </p>
                  </div>

                  <div className="tutorial-card">
                    <div className="tutorial-card-header">
                      <span className="tutorial-card-badge">N9</span>
                      <div>
                        <div className="tutorial-card-title">
                          {t.stages.stage6.numpadTitle}
                        </div>
                        <div className="tutorial-card-subtitle">
                          {t.stages.stage6.numpadSubtitle}
                        </div>
                      </div>
                    </div>

                    <div className="tutorial-card-hint">{t.stages.stage6.numpadHint}</div>

                    <div className="tutorial-card-keys">
                      <div className="tutorial-key-row">
                        <kbd>7</kbd>
                        <kbd>8</kbd>
                        <kbd>9</kbd>
                      </div>
                      <div className="tutorial-key-row">
                        <kbd>4</kbd>
                        <kbd>5</kbd>
                        <kbd>6</kbd>
                      </div>
                      <div className="tutorial-key-row">
                        <kbd>1</kbd>
                        <kbd>2</kbd>
                        <kbd>3</kbd>
                      </div>
                    </div>

                    <p className="tutorial-card-desc">
                      {t.stages.stage6.numpadDesc}
                    </p>
                  </div>

                  <div className="tutorial-card">
                    <div className="tutorial-card-header">
                      <span className="tutorial-card-badge">KB</span>
                      <div>
                        <div className="tutorial-card-title">
                          {t.stages.stage6.keyboardTitle}
                        </div>
                        <div className="tutorial-card-subtitle">
                          Q W E | A S D | Z X C
                        </div>
                      </div>
                    </div>

                    <div className="tutorial-card-hint">{t.stages.stage6.keyboardHint}</div>

                    <div className="tutorial-card-keys">
                      <div className="tutorial-key-row">
                        <kbd>Q</kbd>
                        <kbd>W</kbd>
                        <kbd>E</kbd>
                      </div>
                      <div className="tutorial-key-row">
                        <kbd>A</kbd>
                        <kbd>S</kbd>
                        <kbd>D</kbd>
                      </div>
                      <div className="tutorial-key-row">
                        <kbd>Z</kbd>
                        <kbd>X</kbd>
                        <kbd>C</kbd>
                      </div>
                    </div>

                    <p className="tutorial-card-desc">
                      {t.stages.stage6.keyboardDesc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={`bughunt-intro-card ${
                isBossMode ? "boss-intro" : ""
              }`}
            >
              <div className="intro-scanline-overlay" />
              <div className="intro-orbit-ring intro-orbit-ring--1" />
              <div className="intro-orbit-ring intro-orbit-ring--2" />

              <div className="bughunt-mode-strip">
                <div className="bughunt-mode-identity">
                  <span className="bughunt-mode-beacon" />
                  <span>{t.stages.stage6.missionMode}</span>
                  <strong>{isBossMode ? t.stages.stage6.bossCoop : t.stages.stage6.normalOps}</strong>
                </div>
                <div className="bughunt-mode-capacity">
                  <span>{isBossMode ? t.stages.stage6.localRaidLink : t.stages.stage6.soloSession}</span>
                  <strong>{isBossMode ? t.stages.stage6.twoPilots : t.stages.stage6.onePilot}</strong>
                </div>
              </div>

              <div className="bughunt-briefing-heading">
                <div className="intro-icon-wrapper">
                  <div className="intro-icon-pulse" />
                  <div className="bughunt-intro-icon">
                    {isBossMode ? "RAID" : "06"}
                  </div>
                </div>

                <div className="bughunt-briefing-copy">
                  <h1
                    className="bughunt-title"
                    data-text={isBossMode ? t.stages.stage6.bossRaidTitle : t.stages.stage6.bugHuntTitle}
                  >
                    {isBossMode ? t.stages.stage6.bossRaidTitle : t.stages.stage6.bugHuntTitle}
                  </h1>

                  <h2 className="bughunt-subtitle">
                    <span className="subtitle-line" />
                    {isBossMode
                      ? t.stages.stage6.bossSubtitle
                      : t.stages.stage6.normalSubtitle}
                    <span className="subtitle-line" />
                  </h2>
                </div>
              </div>

              {isBossMode && (
                <div className="boss-hp-preview">
                  <div className="boss-hp-label">{t.stages.stage6.ufoGlobalHp}</div>

                  <div className="boss-hp-bar-track">
                    <div
                      className="boss-hp-bar-fill"
                      style={{ width: `${bossHPPercent}%` }}
                    />
                  </div>

                  <div className="boss-hp-text">
                    {bossGlobalHP.toLocaleString()} /{" "}
                    {bossMaxHP.toLocaleString()}
                  </div>
                </div>
              )}

              <div className="bughunt-rules">
                <div className="rule-item rule-good">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">01</span>
                  <div>
                    <strong>
                      {isBossMode
                        ? t.stages.stage6.bossRule1Title
                        : t.stages.stage6.huntBugsTitle}
                    </strong>
                    <p>
                      {isBossMode
                        ? t.stages.stage6.bossRule1Desc
                        : t.stages.stage6.huntBugsDesc}
                    </p>
                  </div>
                </div>

                <div className="rule-item rule-bad">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">02</span>
                  <div>
                    <strong>
                      {isBossMode
                        ? t.stages.stage6.bossRule2Title
                        : t.stages.stage6.avoidCleanTitle}
                    </strong>
                    <p>
                      {isBossMode
                        ? t.stages.stage6.bossRule2Desc
                        : t.stages.stage6.avoidCleanDesc}
                    </p>
                  </div>
                </div>

                <div className="rule-item rule-combo">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">03</span>
                  <div>
                    <strong>
                      {isBossMode ? t.stages.stage6.bossRule3Title : t.stages.stage6.buildCombosTitle}
                    </strong>
                    <p>
                      {isBossMode
                        ? t.stages.stage6.bossRule3Desc
                        : t.stages.stage6.buildCombosDesc}
                    </p>
                  </div>
                </div>
              </div>

              {isBossMode && (
                <div className="boss-raid-note">
                  <span className="boss-raid-note-icon">P2</span> {t.stages.stage6.bossRaidNote}
                </div>
              )}

              <div className="intro-timer-preview">
                <div className="timer-ring">
                  <svg viewBox="0 0 40 40" className="timer-ring-svg">
                    <circle cx="20" cy="20" r="17" className="timer-ring-bg" />
                    <circle cx="20" cy="20" r="17" className="timer-ring-fill" />
                  </svg>
                  <span className="timer-ring-label">T</span>
                </div>

                <div className="timer-text-block">
                  <span className="timer-big">{GAME_DURATION}s</span>
                  <span className="timer-sub">{t.stages.stage6.missionTimeLimit}</span>
                </div>
              </div>

              <button
                className={`bughunt-start-btn ${
                  isBossMode ? "boss-start" : ""
                }`}
                onClick={startCountdown}
              >
                <span className="btn-inner-text">
                  {isBossMode ? t.stages.stage6.engageBoss : t.stages.stage6.launchMission}
                </span>
                <span className="btn-glow" />
                <span className="btn-shimmer" />
              </button>
            </div>

            {isBossMode && (
              <div className="boss-coop-section">
                <div className="boss-coop-label">{t.stages.stage6.bossCoopSectionTitle}</div>
                <p className="tutorial-section-lede">
                  {t.stages.stage6.bossCoopSectionLede}
                </p>
                <CoopLegend profiles={coopProfiles} />
                <div className="boss-coop-note">
                  {t.stages.stage6.bossCoopSectionNote}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className={`stage-bug-hunt ${isBossMode ? "boss-mode" : ""}`}>
        <FloatingParticles />

        <div className="bughunt-countdown-overlay">
          <div className={`countdown-number ${countdown === 0 ? "go" : ""}`}>
            {countdown > 0 ? countdown : isBossMode ? t.stages.stage6.countdownRaid : t.stages.stage6.countdownGo}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div
        className={`stage-bug-hunt ${isBossMode ? "boss-mode" : ""} ${screenEffect}`}
      >
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas
            camera={{ position: [0, 1.2, 6], fov: 44 }}
            dpr={[1, 1.1]}
            quality="low"
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight
              position={[2, 4, 6]}
              intensity={1.5}
              color="#ffffff"
            />
            <pointLight
              position={[5, 5, 5]}
              intensity={80}
              color="#ffcc00"
            />
            <InteractiveRobot
              reaction="celebrating"
              scale={5.2}
              position={[0, -1.55, 0]}
            />
            <Stars
              radius={100}
              depth={20}
              count={140}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />
          </AdaptiveCanvas>
        </div>

        <FloatingParticles />

        <div className="bughunt-results-overlay">
          <div
            className={`bughunt-results-card ${
              isBossMode ? "boss-results" : ""
            }`}
          >
            <h1 className="results-title">
              {isBossMode ? t.stages.stage6.raidReport : t.stages.stage6.missionReport}
            </h1>

            <div className="results-stars">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={`result-star ${
                    star <= getStars() ? "earned" : ""
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="results-grid">
              <div className="result-stat">
                <span className="stat-value">{bugsSquashed}</span>
                <span className="stat-label">{t.stages.stage6.bugsSquashed}</span>
              </div>

              <div className="result-stat">
                <span className="stat-value">{bugsMissed}</span>
                <span className="stat-label">{t.stages.stage6.bugsMissed}</span>
              </div>

              <div className="result-stat">
                <span className="stat-value">{wrongClicks}</span>
                <span className="stat-label">{t.stages.stage6.wrongClicks}</span>
              </div>

              <div className="result-stat">
                <span className="stat-value">{accuracy}%</span>
                <span className="stat-label">{t.stages.stage6.accuracy}</span>
              </div>

              {isBossMode ? (
                <div className="result-stat highlight boss-dmg-stat">
                  <span className="stat-value">{bossDamageTaken}</span>
                  <span className="stat-label">{t.stages.stage6.bossDmgDealt}</span>
                </div>
              ) : (
                <div className="result-stat highlight">
                  <span className="stat-value">{maxCombo}x</span>
                  <span className="stat-label">{t.stages.stage6.maxCombo}</span>
                </div>
              )}

              <div className="result-stat highlight">
                <span className="stat-value">{score}</span>
                <span className="stat-label">{t.stages.stage6.finalScore}</span>
              </div>
            </div>

            {isBossMode && (
              <div className="boss-hp-result">
                <div className="boss-hp-label">{t.stages.stage6.ufoRemainingHp}</div>

                <div className="boss-hp-bar-track">
                  <div
                    className="boss-hp-bar-fill"
                    style={{ width: `${bossHPPercent}%` }}
                  />
                </div>

                <div className="boss-hp-text">
                  {bossGlobalHP.toLocaleString()} /{" "}
                  {bossMaxHP.toLocaleString()}
                </div>
              </div>
            )}

            <div className="results-actions">
              <button className="bughunt-complete-btn" onClick={handleComplete}>
                {t.stages.stage6.completeMissionBtn}
              </button>

              <button className="bughunt-retry-btn" onClick={handleReplay}>
                {t.stages.stage6.tryAgainBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderGameGrid = (panelPlayerId?: CoopPlayerId) => {
    const offset = isBossMode && panelPlayerId === "P2" ? 9 : 0;
    const gridCells = cells.slice(offset, offset + 9);

    return (
      <div className="bughunt-grid">
        {gridCells.map((cell, localIdx) => {
          const idx = offset + localIdx;
          const feedback = feedbacks[idx];
          const isAbducted = abductedCells.has(idx);

          return (
            <div
              key={idx}
              className={`bughunt-cell ${
                cell ? "has-snippet" : "empty"
              } ${cell?.animState === "entering" ? "cell-enter" : ""} ${
                cell?.animState === "exiting" ? "cell-exit" : ""
              } ${feedback?.type === "squash" ? "cell-squash" : ""} ${
                feedback?.type === "wrong" ? "cell-wrong" : ""
              } ${feedback?.type === "miss" ? "cell-miss" : ""} ${
                feedback?.type === "abducted" ? "cell-abducted-hit" : ""
              } ${isAbducted ? "cell-abduction-beam" : ""}`}
              onClick={() => handleCellAction(idx, panelPlayerId || "P1")}
              onPointerEnter={() => {
                if (cell?.snippet.isBug) playSfx("bugTarget");
              }}
            >
              {isAbducted && (
                <div className="abduction-beam-overlay">
                  <div className="abduction-beam-ray" />
                </div>
              )}

              <div className="cell-terminal-header">
                <span className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </span>

                {cell && (
                  <span className="cell-category">
                    {cell.snippet.category}
                  </span>
                )}
              </div>

              <div className="cell-code-area">
                {cell && (
                  <code className={`cell-code ${isAbducted ? "code-blurred" : ""}`}>
                    {cell.snippet.code}
                  </code>
                )}

                {!cell && feedback?.type === "squash" && (
                  <div className="squash-effect">{t.stages.stage6.effectSquashed}</div>
                )}

                {!cell && feedback?.type === "wrong" && (
                  <div className="wrong-effect">{t.stages.stage6.effectClean}</div>
                )}

                {!cell && feedback?.type === "abducted" && (
                  <div className="abducted-effect">
                    {t.stages.stage6.effectAbducted} −{ABDUCTION_PENALTY}
                  </div>
                )}

                {feedback?.type === "miss" && (
                  <div className="miss-effect">{t.stages.stage6.effectEscaped}</div>
                )}
              </div>

              {cell && (
                <div className="cell-lifetime-bar">
                  <div
                    className="lifetime-fill"
                    style={{ animationDuration: `${cell.lifetime}ms` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`stage-bug-hunt ${isBossMode ? "boss-mode" : ""} ${screenEffect}`}
    >
      {!isBossMode && (
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas
            camera={{ position: [0, 1, 5], fov: 50 }}
            dpr={[1, 1.1]}
            quality="low"
          >
            <ambientLight intensity={0.6} />
            <pointLight
              position={[5, 5, 5]}
              intensity={100}
              color="#ffcc00"
            />
            <InteractiveRobot
              reaction={robotReaction}
              scale={3.2}
              position={[0, -1.5, 0]}
              onClick={handleRobotClick}
            />
            <Stars
              radius={100}
              depth={20}
              count={120}
              factor={3}
              saturation={0}
              fade
              speed={1}
            />
          </AdaptiveCanvas>

          {speechMessage && (
            <SpeechBubble
              message={speechMessage}
              type="robot"
              duration={2500}
              onDone={() => setSpeechMessage("")}
            />
          )}
        </div>
      )}

      <FloatingParticles />

      <div className="bughunt-hud">
        <div className="hud-left">
          <span className="hud-label">
            {isBossMode ? `🛸 ${t.stages.stage6.bossRaidTitle}` : `🐛 ${t.stages.stage6.bugHuntTitle}`}
          </span>

          <div className="hud-timer-bar">
            <div
              className={`hud-timer-fill ${timerUrgent ? "urgent" : ""}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>

          <span className={`hud-time ${timerUrgent ? "urgent" : ""}`}>
            {timeLeft}s
          </span>
        </div>

        <div className="hud-right">
          {combo > 1 && <span className="hud-combo">{combo}x COMBO</span>}
          <span className="hud-score">{score}</span>
          {isBossMode && <span className="hud-dmg">DMG {bossDamageTaken}</span>}
        </div>
      </div>

      {isBossMode && (
        <div className="boss-hp-hud">
          <span className="boss-hp-icon">UFO</span>

          <div className="boss-hp-bar-track">
            <div
              className="boss-hp-bar-fill"
              style={{ width: `${bossHPPercent}%` }}
            />
          </div>

          <span className="boss-hp-value">
            {bossGlobalHP.toLocaleString()}
          </span>
        </div>
      )}

      {isBossMode && tickerMessages.length > 0 && (
        <div className="boss-ticker">
          {tickerMessages.slice(-3).map((message) => (
            <div key={message.id} className="ticker-msg">
              {message.text}
            </div>
          ))}
        </div>
      )}

      {isBossMode ? (
        <div className="boss-split-screen">
          <div className="split-panel split-panel-p1">
            <div
              className="split-panel-header"
              style={{ borderColor: coopProfiles.P1.accent }}
            >
              <div
                className="split-player-badge"
                style={{
                  background: coopProfiles.P1.accent,
                  color: "#000",
                }}
              >
                P1
              </div>

              <div className="split-player-info">
                <span
                  className="split-player-title"
                  style={{ color: coopProfiles.P1.accent }}
                >
                  {coopProfiles.P1.title}
                </span>
                <span className="split-player-hint">
                  {coopProfiles.P1.inputHint}
                </span>
              </div>

              <div className="split-player-stats">
                <span className="split-stat">
                  {coopStats.P1.hits} <small>HIT</small>
                </span>
                <span className="split-stat">
                  {coopStats.P1.damage} <small>DMG</small>
                </span>
              </div>
            </div>

            <div className="split-grid-container">{renderGameGrid("P1")}</div>
          </div>

          <div className="split-center-ufo">
            <div className="boss-ufo-scene-split">
              <AdaptiveCanvas
                camera={{ position: [0, 3.7, 14], fov: 34 }}
                dpr={[1, 1.2]}
                quality="low"
                gl={{ alpha: true, antialias: true }}
              >
                <ambientLight intensity={0.9} />
                <directionalLight
                  position={[3, 6, 8]}
                  intensity={1.8}
                  color="#ffffff"
                />
                <pointLight
                  position={[0, 10, 5]}
                  intensity={35}
                  color="#00ffcc"
                />
                <BossUFO
                  hp={bossGlobalHP}
                  maxHP={bossMaxHP}
                  hitFlash={ufoHitFlash}
                  position={[0, 0.85, 0]}
                  scale={1.05}
                />
                <Stars
                  radius={100}
                  depth={20}
                  count={90}
                  factor={3}
                  saturation={0}
                  fade
                  speed={1}
                />
              </AdaptiveCanvas>

              {damageNumbers.map((damageNumber) => (
                <div
                  key={damageNumber.id}
                  className="damage-number"
                  style={{
                    left: `${damageNumber.x}%`,
                    top: `${damageNumber.y}%`,
                  }}
                >
                  −{damageNumber.value}
                </div>
              ))}

              {laserActive && <div className="laser-beam" />}
            </div>

            <div className="boss-split-robot">
              <AdaptiveCanvas
                camera={{ position: [0, 1, 5], fov: 50 }}
                dpr={[1, 1.1]}
                quality="low"
              >
                <ambientLight intensity={0.6} />
                <pointLight
                  position={[5, 5, 5]}
                  intensity={100}
                  color="#ffcc00"
                />
                <InteractiveRobot
                  reaction={robotReaction}
                  scale={3.5}
                  position={[0, -1.5, 0]}
                  onClick={handleRobotClick}
                />
              </AdaptiveCanvas>
            </div>
          </div>

          <div className="split-panel split-panel-p2">
            <div
              className="split-panel-header"
              style={{ borderColor: coopProfiles.P2.accent }}
            >
              <div
                className="split-player-badge"
                style={{
                  background: coopProfiles.P2.accent,
                  color: "#000",
                }}
              >
                P2
              </div>

              <div className="split-player-info">
                <span
                  className="split-player-title"
                  style={{ color: coopProfiles.P2.accent }}
                >
                  {coopProfiles.P2.title}
                </span>
                <span className="split-player-hint">
                  {coopProfiles.P2.inputHint}
                </span>
              </div>

              <div className="split-player-stats">
                <span className="split-stat">
                  {coopStats.P2.hits} <small>HIT</small>
                </span>
                <span className="split-stat">
                  {coopStats.P2.damage} <small>DMG</small>
                </span>
              </div>
            </div>

            <div className="split-grid-container">{renderGameGrid("P2")}</div>
          </div>
        </div>
      ) : (
        <div className="bughunt-grid-wrapper">{renderGameGrid()}</div>
      )}

      <div className="bughunt-stats">
        <span>🐛 {bugsSquashed}</span>
        <span>❌ {wrongClicks}</span>
        <span>🎯 {accuracy}%</span>
        {isBossMode && <span>⚔ {bossDamageTaken} DMG</span>}
      </div>
    </div>
  );
};

export default Stage6BugHunt;
