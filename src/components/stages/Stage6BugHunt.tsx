import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import { BossUFO } from './BossUFO';
import './StageStyle.css';

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
  { id: 1, code: 'if (x = 5) {', isBug: true, category: 'Condition' },
  { id: 2, code: 'console.log("hello)', isBug: true, category: 'String' },
  { id: 3, code: 'for(i=0; i<10; i--)', isBug: true, category: 'Loop' },
  { id: 4, code: 'let 1name = "test"', isBug: true, category: 'Variable' },
  { id: 5, code: 'array.lenght', isBug: true, category: 'Property' },
  { id: 6, code: 'fucntion start() {}', isBug: true, category: 'Function' },
  { id: 7, code: 'retrun true;', isBug: true, category: 'Return' },
  { id: 8, code: 'Class App extends {}', isBug: true, category: 'Class' },
  { id: 9, code: 'var x = = 5;', isBug: true, category: 'Assign' },
  { id: 10, code: 'getElementByld("id")', isBug: true, category: 'DOM' },
  { id: 11, code: 'cosnt data = [];', isBug: true, category: 'Declare' },
  { id: 12, code: 'whlie (true) { }', isBug: true, category: 'Loop' },
  { id: 13, code: 'new Erorr("fail")', isBug: true, category: 'Error' },
  { id: 14, code: 'async awiat fetch()', isBug: true, category: 'Async' },
  { id: 15, code: 'import Rect from', isBug: true, category: 'Import' },
  { id: 16, code: 'str.toupperCase()', isBug: true, category: 'Method' },
  { id: 17, code: 'Math.PI = 3.14;', isBug: true, category: 'Const' },
  { id: 18, code: 'parselnt("10", 10)', isBug: true, category: 'Parse' },
  { id: 19, code: 'documnet.title', isBug: true, category: 'DOM' },
  { id: 20, code: 'arry.push(item)', isBug: true, category: 'Typo' },
];

const cleanSnippets: CodeSnippet[] = [
  { id: 101, code: 'if (x === 5) {', isBug: false, category: 'Condition' },
  { id: 102, code: 'console.log("hello")', isBug: false, category: 'String' },
  { id: 103, code: 'for(let i=0; i<10; i++)', isBug: false, category: 'Loop' },
  { id: 104, code: 'let name = "test"', isBug: false, category: 'Variable' },
  { id: 105, code: 'array.length', isBug: false, category: 'Property' },
  { id: 106, code: 'function start() {}', isBug: false, category: 'Function' },
  { id: 107, code: 'return true;', isBug: false, category: 'Return' },
  { id: 108, code: 'class App extends {}', isBug: false, category: 'Class' },
  { id: 109, code: 'let x = 5;', isBug: false, category: 'Assign' },
  { id: 110, code: 'getElementById("id")', isBug: false, category: 'DOM' },
  { id: 111, code: 'const data = [];', isBug: false, category: 'Declare' },
  { id: 112, code: 'while (true) { }', isBug: false, category: 'Loop' },
  { id: 113, code: 'new Error("fail")', isBug: false, category: 'Error' },
  { id: 114, code: 'await fetch(url)', isBug: false, category: 'Async' },
  { id: 115, code: 'import React from', isBug: false, category: 'Import' },
  { id: 116, code: 'str.toUpperCase()', isBug: false, category: 'Method' },
  { id: 117, code: 'const PI = Math.PI;', isBug: false, category: 'Const' },
  { id: 118, code: 'parseInt("10", 10)', isBug: false, category: 'Parse' },
  { id: 119, code: 'document.title', isBug: false, category: 'DOM' },
  { id: 120, code: 'array.push(item)', isBug: false, category: 'Typo' },
];

interface ActiveCell {
  snippet: CodeSnippet;
  spawnTime: number;
  lifetime: number;
  animState: 'entering' | 'active' | 'exiting';
  abducted?: boolean;
}

interface CellFeedback {
  type: 'squash' | 'wrong' | 'miss' | 'abducted';
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

type CoopPlayerId = 'P1' | 'P2';

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

const COOP_PLAYER_ORDER: CoopPlayerId[] = ['P1', 'P2'];

const getCoopProfiles = (p1Name?: string, p2Name?: string): Record<CoopPlayerId, CoopPlayerProfile> => ({
  P1: {
    id: 'P1',
    title: (p1Name?.toUpperCase() || 'MOUSE PILOT'),
    subtitle: 'Click to blast bugs instantly',
    inputHint: 'Mouse click',
    description: 'Click any active bug tile. This is the primary raid control for the lead player.',
    keyRows: [['LMB'], ['Click active bugs directly']],
    accent: '#00ffff',
  },
  P2: {
    id: 'P2',
    title: (p2Name?.toUpperCase() || 'NUMPAD RUNNER'),
    subtitle: 'Numpad 1-9 keys',
    inputHint: 'Numpad 1-9',
    description: 'Use numpad digits in grid order, from top-left to bottom-right.',
    keyRows: [
      ['7', '8', '9'],
      ['4', '5', '6'],
      ['1', '2', '3'],
    ],
    accent: '#ffb703',
  },
});

const COOP_PLAYER_PROFILES = getCoopProfiles();

const NUMPAD_KEY_MAP: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
  '5': 4,
  '6': 5,
  '7': 6,
  '8': 7,
  '9': 8,
};

const createDefaultCoopSnapshot = (): Record<CoopPlayerId, CoopPlayerSnapshot> => ({
  P1: { hits: 0, misses: 0, damage: 0, score: 0, lastAction: 'Ready' },
  P2: { hits: 0, misses: 0, damage: 0, score: 0, lastAction: 'Ready' },
});

const CoopLegend: React.FC<{
  compact?: boolean;
  stats?: Record<CoopPlayerId, CoopPlayerSnapshot>;
  profiles?: Record<CoopPlayerId, CoopPlayerProfile>;
}> = ({ compact = false, stats, profiles }) => {
  const activeProfiles = profiles || COOP_PLAYER_PROFILES;
  return (
    <div className={`coop-legend ${compact ? 'compact' : 'full'}`}>
      {COOP_PLAYER_ORDER.map((playerId) => {
        const profile = activeProfiles[playerId];
        const snapshot = stats?.[playerId];

        return (
          <div
            key={playerId}
            className={`coop-card ${compact ? 'compact' : 'full'}`}
            style={{ borderColor: profile.accent, boxShadow: `0 0 0 1px ${profile.accent}22 inset, 0 0 26px ${profile.accent}14` }}
          >
            <div className="coop-card-header">
              <span className="coop-card-id" style={{ color: profile.accent }}>{profile.id}</span>
              <div>
                <div className="coop-card-title" style={{ color: profile.accent }}>{profile.title}</div>
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
  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const playerData = useGameStore((state) => state.playerData);
  const stageStartRef = useRef(Date.now());

  const isBossMode = useGameStore((state) => state.bossMode);
  const bossGlobalHP = useGameStore((state) => state.bossGlobalHP);
  const bossMaxHP = useGameStore((state) => state.bossMaxHP);
  const dealBossDamage = useGameStore((state) => state.dealBossDamage);
  const p2NameFromStore = useGameStore((state) => state.p2Name);

  const coopProfiles = React.useMemo(
    () => getCoopProfiles(playerData.name || undefined, p2NameFromStore || undefined),
    [playerData.name, p2NameFromStore]
  );

    const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing' | 'results' | 'completion'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

    const [cells, setCells] = useState<(ActiveCell | null)[]>(Array(18).fill(null));
  const [feedbacks, setFeedbacks] = useState<(CellFeedback | null)[]>(Array(18).fill(null));

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
  const [coopStats, setCoopStats] = useState<Record<CoopPlayerId, CoopPlayerSnapshot>>(createDefaultCoopSnapshot);
  const damageIdRef = useRef(0);
  const tickerIdRef = useRef(0);
  const abductionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
  const [speechMessage, setSpeechMessage] = useState('');
  const [screenEffect, setScreenEffect] = useState('');

  /* ─── Refs for game loop ─── */
  const gameTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellsRef = useRef(cells);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const timeRef = useRef(timeLeft);
  const phaseRef = useRef(phase);
  const totalBugsRef = useRef(0);
  const bossDmgRef = useRef(0);
  const coopStatsRef = useRef<Record<CoopPlayerId, CoopPlayerSnapshot>>(createDefaultCoopSnapshot());
  const usedSnippetIds = useRef(new Set<number>());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { cellsRef.current = cells; }, [cells]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { timeRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { bossDmgRef.current = bossDamageTaken; }, [bossDamageTaken]);
  useEffect(() => { coopStatsRef.current = coopStats; }, [coopStats]);

  const updateCoopStats = useCallback(
    (playerId: CoopPlayerId, updater: (snapshot: CoopPlayerSnapshot) => CoopPlayerSnapshot) => {
      setCoopStats((prev) => ({
        ...prev,
        [playerId]: updater(prev[playerId]),
      }));
    },
    []
  );

  const resolveCoopInput = useCallback((event: KeyboardEvent) => {
    const key = event.key;
    // Check numpad keys OR normal number row keys
    if (key >= '1' && key <= '9') {
      const baseIdx = NUMPAD_KEY_MAP[key];
      if (baseIdx !== undefined) {
        const finalIdx = isBossMode ? baseIdx + 9 : baseIdx;
        return { playerId: 'P2' as CoopPlayerId, cellIdx: finalIdx };
      }
    }

    return null;
  }, [isBossMode]);

    const playSound = useCallback((type: 'squash' | 'wrong' | 'miss' | 'complete' | 'countdown' | 'go' | 'laser' | 'abduct') => {
    const sounds: Record<string, string> = {
      squash: '/sounds/success.mp3',
      wrong: '/sounds/error.mp3',
      miss: '/sounds/error.mp3',
      complete: '/sounds/stage_complete.mp3',
      countdown: '/sounds/connect.mp3',
      go: '/sounds/success.mp3',
      laser: '/sounds/connect.mp3',
      abduct: '/sounds/error.mp3',
    };
    try {
      const audio = new Audio(sounds[type]);
      audio.volume = sfxVolume * (type === 'miss' ? 0.3 : type === 'laser' ? 0.5 : 1);
      audio.play().catch(() => { });
    } catch {  }
  }, [sfxVolume]);

    const getSnippet = useCallback((shouldBeBug: boolean) => {
    const pool = shouldBeBug ? bugSnippets : cleanSnippets;
    const available = pool.filter(s => !usedSnippetIds.current.has(s.id));
    const pick = available.length > 0 ? pickRandom(available) : pickRandom(pool);
    usedSnippetIds.current.add(pick.id);
    if (usedSnippetIds.current.size > 12) {
      const arr = Array.from(usedSnippetIds.current);
      for (let i = 0; i < 4; i++) usedSnippetIds.current.delete(arr[i]);
    }
    return pick;
  }, []);

    const getDifficulty = useCallback(() => {
    const elapsed = GAME_DURATION - timeRef.current;
    if (isBossMode) {
      if (elapsed < 15) return { spawnInterval: 900, lifetime: 3200, maxActive: 6 };
      if (elapsed < 30) return { spawnInterval: 700, lifetime: 2800, maxActive: 8 };
      if (elapsed < 45) return { spawnInterval: 550, lifetime: 2200, maxActive: 10 };
      return { spawnInterval: 400, lifetime: 1800, maxActive: 12 };
    }
    if (elapsed < 15) return { spawnInterval: 2200, lifetime: 3500, maxActive: 2 };
    if (elapsed < 30) return { spawnInterval: 1800, lifetime: 3000, maxActive: 3 };
    if (elapsed < 45) return { spawnInterval: 1400, lifetime: 2500, maxActive: 4 };
    return { spawnInterval: 1000, lifetime: 2000, maxActive: 5 };
  }, [isBossMode]);

    const spawnSnippet = useCallback(() => {
    if (phaseRef.current !== 'playing') return;

    const diff = getDifficulty();
    const currentCells = cellsRef.current;
    const activeCount = currentCells.filter(c => c !== null).length;

    if (activeCount >= diff.maxActive) {
      spawnTimerRef.current = setTimeout(spawnSnippet, 500);
      return;
    }

    const emptyCells: number[] = [];
    const maxIdx = isBossMode ? 18 : 9;
    for (let i = 0; i < maxIdx; i++) {
      if (currentCells[i] === null) emptyCells.push(i);
    }
    if (emptyCells.length === 0) {
      spawnTimerRef.current = setTimeout(spawnSnippet, 500);
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
      animState: 'entering',
    };
    setCells(newCells);

    setTimeout(() => {
      setCells(prev => {
        const updated = [...prev];
        if (updated[cellIdx] && updated[cellIdx]!.animState === 'entering') {
          updated[cellIdx] = { ...updated[cellIdx]!, animState: 'active' };
        }
        return updated;
      });
    }, 300);

    setTimeout(() => {
      setCells(prev => {
        const updated = [...prev];
        const cell = updated[cellIdx];
        if (cell && cell.snippet.id === snippet.id) {
          updated[cellIdx] = { ...cell, animState: 'exiting' };
          if (cell.snippet.isBug) {
            setBugsMissed(m => m + 1);
            setCombo(0);
            setFeedbacks(prev2 => {
              const f = [...prev2];
              f[cellIdx] = { type: 'miss', time: Date.now() };
              return f;
            });
          }
          setTimeout(() => {
            setCells(prev2 => {
              const u = [...prev2];
              if (u[cellIdx] && u[cellIdx]!.snippet.id === snippet.id) u[cellIdx] = null;
              return u;
            });
            setFeedbacks(prev2 => {
              const f = [...prev2];
              if (f[cellIdx]?.type === 'miss') f[cellIdx] = null;
              return f;
            });
            setAbductedCells(prev2 => {
              const s = new Set(prev2);
              s.delete(cellIdx);
              return s;
            });
          }, 400);
        }
        return updated;
      });
    }, diff.lifetime);

    const jitter = (Math.random() - 0.5) * 400;
    spawnTimerRef.current = setTimeout(spawnSnippet, diff.spawnInterval + jitter);
  }, [getDifficulty, getSnippet, isBossMode]);

    const triggerAbduction = useCallback(() => {
    if (phaseRef.current !== 'playing' || !isBossMode) return;

    const currentCells = cellsRef.current;
    const cleanCellIdxs: number[] = [];
    currentCells.forEach((c, i) => {
      if (c && !c.snippet.isBug && c.animState !== 'exiting' && !c.abducted) {
        cleanCellIdxs.push(i);
      }
    });

    if (cleanCellIdxs.length > 0) {
      const targetIdx = pickRandom(cleanCellIdxs);

      setCells(prev => {
        const updated = [...prev];
        if (updated[targetIdx]) {
          updated[targetIdx] = { ...updated[targetIdx]!, abducted: true };
        }
        return updated;
      });
      setAbductedCells(prev => new Set(prev).add(targetIdx));

      setTimeout(() => {
        setCells(prev => {
          const updated = [...prev];
          if (updated[targetIdx]) {
            updated[targetIdx] = { ...updated[targetIdx]!, abducted: false };
          }
          return updated;
        });
        setAbductedCells(prev => {
          const s = new Set(prev);
          s.delete(targetIdx);
          return s;
        });
      }, 3000);
    }

    const nextDelay = 4000 + Math.random() * 4000;
    abductionTimerRef.current = setTimeout(triggerAbduction, nextDelay);
  }, [isBossMode]);

    const spawnTickerMessage = useCallback(() => {
    if (!isBossMode) return;
    const playerId = pickRandom(COOP_PLAYER_ORDER);
    const profile = coopProfiles[playerId];
    const snapshot = coopStatsRef.current[playerId];
    tickerIdRef.current += 1;
    const msg: TickerMessage = {
      id: tickerIdRef.current,
      text: snapshot.hits > 0
        ? `${profile.id} ${snapshot.hits} hits · ${snapshot.damage} DMG`
        : `${profile.id} ready: ${profile.inputHint}`,
      time: Date.now(),
    };
    setTickerMessages(prev => [...prev.slice(-4), msg]);
  }, [isBossMode, coopProfiles]);

    const addDamageNumber = useCallback((value: number) => {
    damageIdRef.current += 1;
    const dn: DamageNumber = {
      id: damageIdRef.current,
      value,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 30,
      time: Date.now(),
    };
    setDamageNumbers(prev => [...prev.slice(-6), dn]);
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== dn.id));
    }, 1200);
  }, []);

    const pushTickerMessage = useCallback((text: string) => {
    tickerIdRef.current += 1;
    const msg: TickerMessage = {
      id: tickerIdRef.current,
      text,
      time: Date.now(),
    };
    setTickerMessages(prev => [...prev.slice(-4), msg]);
  }, []);

    const handleCellAction = useCallback((cellIdx: number, playerId: CoopPlayerId = 'P1') => {
    if (phaseRef.current !== 'playing') return;
    const cell = cellsRef.current[cellIdx];
    if (!cell || cell.animState === 'exiting') return;

    const snippet = cell.snippet;
    const isAbducted = cell.abducted;
    const playerProfile = coopProfiles[playerId];

    setCells(prev => {
      const updated = [...prev];
      updated[cellIdx] = null;
      return updated;
    });
    setAbductedCells(prev => {
      const s = new Set(prev);
      s.delete(cellIdx);
      return s;
    });

    if (snippet.isBug) {
      
      const newCombo = comboRef.current + 1;
      const comboMultiplier = Math.min(1 + (newCombo - 1) * 0.25, 3);
      const points = Math.round(100 * comboMultiplier);
      setScore(s => s + points);
      setCombo(newCombo);
      setMaxCombo(mc => Math.max(mc, newCombo));
      setBugsSquashed(b => b + 1);
      playSound('squash');
      updateCoopStats(playerId, (snapshot) => ({
        ...snapshot,
        hits: snapshot.hits + 1,
        score: snapshot.score + points,
        lastAction: `+${points} score`,
      }));

      if (isBossMode) {
        const dmg = Math.round(BOSS_DAMAGE_PER_BUG * comboMultiplier);
        setBossDamageTaken(d => d + dmg);
        bossDmgRef.current += dmg;
        setUfoHitFlash(true);
        setTimeout(() => setUfoHitFlash(false), 200);
        setLaserActive(true);
        setTimeout(() => setLaserActive(false), 300);
        addDamageNumber(dmg);
        dealBossDamage(dmg, playerProfile.title);
        updateCoopStats(playerId, (snapshot) => ({
          ...snapshot,
          damage: snapshot.damage + dmg,
          lastAction: `+${dmg} DMG`,
        }));
        pushTickerMessage(`${playerProfile.id} smashed a bug for ${dmg} DMG`);
        playSound('laser');
      }

      setFeedbacks(prev => {
        const f = [...prev];
        f[cellIdx] = { type: 'squash', time: Date.now() };
        return f;
      });
      setTimeout(() => {
        setFeedbacks(prev => {
          const f = [...prev];
          if (f[cellIdx]?.type === 'squash') f[cellIdx] = null;
          return f;
        });
      }, 600);

      if (newCombo >= 3) {
        setRobotReaction('celebrating');
        setSpeechMessage(newCombo >= 5 ? `${newCombo}x COMBO! UNSTOPPABLE! 🔥` : `${newCombo}x Combo! 🎯`);
      } else {
        setRobotReaction('correct');
        setSpeechMessage(getRandomMessage(robotMessages.correct));
      }
      setScreenEffect('screen-flash-green');
      setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 1200);

    } else if (isAbducted && isBossMode) {
      
      setScore(s => Math.max(0, s - ABDUCTION_PENALTY));
      setCombo(0);
      setWrongClicks(w => w + 1);
      updateCoopStats(playerId, (snapshot) => ({
        ...snapshot,
        misses: snapshot.misses + 1,
        lastAction: 'Hit an abduction trap',
      }));
      pushTickerMessage(`${playerProfile.id} hit an abduction trap!`);
      playSound('abduct');

      setFeedbacks(prev => {
        const f = [...prev];
        f[cellIdx] = { type: 'abducted', time: Date.now() };
        return f;
      });
      setTimeout(() => {
        setFeedbacks(prev => {
          const f = [...prev];
          if (f[cellIdx]?.type === 'abducted') f[cellIdx] = null;
          return f;
        });
      }, 800);

      setRobotReaction('incorrect');
      setSpeechMessage("ABDUCTION TRAP! The UFO tricked you! −300 pts! 🛸");
      setScreenEffect('screen-shake');
      setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 1500);

    } else {
      
      setScore(s => Math.max(0, s - 50));
      setCombo(0);
      setWrongClicks(w => w + 1);
      updateCoopStats(playerId, (snapshot) => ({
        ...snapshot,
        misses: snapshot.misses + 1,
        lastAction: 'Missed a clean tile',
      }));
      pushTickerMessage(`${playerProfile.id} missed a clean tile`);
      playSound('wrong');

      setFeedbacks(prev => {
        const f = [...prev];
        f[cellIdx] = { type: 'wrong', time: Date.now() };
        return f;
      });
      setTimeout(() => {
        setFeedbacks(prev => {
          const f = [...prev];
          if (f[cellIdx]?.type === 'wrong') f[cellIdx] = null;
          return f;
        });
      }, 600);

      setRobotReaction('incorrect');
      setSpeechMessage("That code was correct! Only click bugs! 🐛");
      setScreenEffect('screen-shake');
      setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 1200);
    }
  }, [playSound, isBossMode, addDamageNumber, dealBossDamage, pushTickerMessage, updateCoopStats, coopProfiles]);

    const handleRobotClick = () => {
    if (phase === 'playing') {
      setSpeechMessage(isBossMode ? "Attack the UFO! Squash those bugs! 🛸" : "Focus on the code! Squash those bugs! 🐛");
    } else {
      setSpeechMessage(getRandomMessage(robotMessages.idle));
    }
    setRobotReaction('waving');
    setTimeout(() => setRobotReaction('idle'), 2000);
  };

    const startCountdown = () => {
    setPhase('countdown');
    setCountdown(3);
    playSound('countdown');
  };

    useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      playSound('go');
      setPhase('playing');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
      if (countdown > 1) playSound('countdown');
    }, 800);
    return () => clearTimeout(timer);
  }, [phase, countdown, playSound]);

    useEffect(() => {
    if (phase !== 'playing') return;

    spawnTimerRef.current = setTimeout(spawnSnippet, 800);

    gameTickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    if (isBossMode) {
      abductionTimerRef.current = setTimeout(triggerAbduction, 5000);
      tickerTimerRef.current = setInterval(spawnTickerMessage, 3000 + Math.random() * 4000);
    }

    return () => {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (abductionTimerRef.current) clearTimeout(abductionTimerRef.current);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [phase, spawnSnippet, isBossMode, triggerAbduction, spawnTickerMessage]);

    useEffect(() => {
    if (phase === 'results') {
      if (gameTickRef.current) clearInterval(gameTickRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (abductionTimerRef.current) clearTimeout(abductionTimerRef.current);
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
      setCells(Array(18).fill(null));
      setAbductedCells(new Set());

      const accuracy = totalBugsRef.current > 0 ? bugsSquashed / totalBugsRef.current : 0;
      let bonus = 0;
      if (accuracy >= 0.9) bonus += 300;
      else if (accuracy >= 0.8) bonus += 200;
      else if (accuracy >= 0.7) bonus += 100;
      bonus += maxCombo * 30;

      const finalScore = scoreRef.current + bonus;
      setScore(finalScore);

      setRobotReaction('celebrating');
      setSpeechMessage(isBossMode
        ? `Raid complete, ${playerData.name?.trim() || 'cadet'}! You dealt ${bossDmgRef.current} DMG to the UFO! 🎉`
        : "Mission complete! Great debugging, cadet! 🎉"
      );
      playSound('complete');
    }
  }, [phase, bugsSquashed, maxCombo, playSound, isBossMode, playerData.name]);

    const handleComplete = useCallback(() => {
    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
    const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 6, score, elapsed);

    const allVisitedAfterThisStage = visitedPlanets.size >= 5;
    if (allVisitedAfterThisStage && playerData.name?.trim()) {
      addLeaderboardEntry({
        playerName: playerData.name.trim(),
        totalScore: useGameStore.getState().getTotalScore(),
        timestamp: Date.now(),
        major: playerData.major,
      });
    }

    setPhase('completion');
    setRobotReaction('celebrating');
    setScreenEffect('screen-flash-green');
    setTimeout(() => setScreenEffect(''), 500);

    timeoutRef.current = setTimeout(() => {
      const allVisited = visitedPlanets.size >= 5;
      navigate(allVisited ? '/leaderboard' : '/mainhub');
    }, 4000);
  }, [planetId, score, markPlanetVisited, addPlanetScore, addLeaderboardEntry, navigate, visitedPlanets, playerData.name, playerData.major]);

    const handleReplay = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase('intro');
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
    setRobotReaction('idle');
    setSpeechMessage('');
    setScreenEffect('');
    stageStartRef.current = Date.now();
  };

  /* ─── Cleanup on unmount ─── */
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
    if (!isBossMode || phase !== 'playing') return;
    if (bossGlobalHP > 0) return;
    setPhase('results');
  }, [isBossMode, phase, bossGlobalHP]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) return;
      if (target?.isContentEditable) return;

      const resolved = resolveCoopInput(event);
      if (!resolved) return;

      event.preventDefault();
      handleCellAction(resolved.cellIdx, resolved.playerId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, resolveCoopInput, handleCellAction]);

    const accuracy = totalBugsSpawned > 0 ? Math.round((bugsSquashed / totalBugsSpawned) * 100) : 0;
  const timerPercent = (timeLeft / GAME_DURATION) * 100;
  const timerUrgent = timeLeft <= 10;
  const bossHPPercent = (bossGlobalHP / bossMaxHP) * 100;

  const getStars = () => {
    if (score >= 1500) return 3;
    if (score >= 800) return 2;
    if (score >= 300) return 1;
    return 0;
  };

    if (phase === 'completion') {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <h1>STAGE 6 COMPLETE!</h1>
          <div className="score-info">
            <p>Bugs Squashed: {bugsSquashed}/{totalBugsSpawned}</p>
            <p>Accuracy: {accuracy}%</p>
            <p>Max Combo: {maxCombo}x</p>
            {isBossMode && <p>Boss Damage: {bossDamageTaken} DMG</p>}
            <p>Final Score: {score} points</p>
            <div className="star-display">
              {[1, 2, 3].map(s => (
                <span key={s} className={`star ${s <= getStars() ? 'earned' : ''}`}>★</span>
              ))}
            </div>
          </div>
          <p className="returning-message">
            {visitedPlanets.size >= 5 ? 'Heading to leaderboard...' : 'Returning to main hub...'}
          </p>
          <div className="completion-buttons">
            <button className="replay-btn" onClick={handleReplay}>Replay Stage</button>
            <button className="return-btn" onClick={() => navigate('/mainhub')}>Return to Hub</button>
          </div>
          <div className="robot-celebration">
            <AdaptiveCanvas camera={{ position: [0, 1.2, 6], fov: 44 }} dpr={[1, 1.1]} quality="low" gl={{ alpha: true, antialias: true }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[2, 4, 6]} intensity={1.8} color="#ffffff" />
              <pointLight position={[5, 5, 5]} intensity={80} color="#ffcc00" />
              <InteractiveRobot reaction="celebrating" scale={4.2} position={[0, -1.55, 0]} />
              <Stars radius={100} depth={20} count={220} factor={5} saturation={0} fade speed={1} />
            </AdaptiveCanvas>
          </div>
        </div>
      </div>
    );
  }

    if (phase === 'intro') {
    return (
      <div className={`stage-bug-hunt ${isBossMode ? 'boss-mode' : ''} ${screenEffect}`}>
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas camera={{ position: [0, 1.2, 6], fov: 44 }} dpr={[1, 1.1]} quality="low" gl={{ alpha: true, antialias: true }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[2, 4, 6]} intensity={1.5} color="#ffffff" />
            <pointLight position={[5, 5, 5]} intensity={80} color="#ffcc00" />
            <InteractiveRobot reaction={robotReaction} scale={5.2} position={[0, -1.55, 0]} onClick={handleRobotClick} />
            <Stars radius={100} depth={20} count={140} factor={4} saturation={0} fade speed={1} />
          </AdaptiveCanvas>
          {speechMessage && (
            <SpeechBubble message={speechMessage} type="robot" duration={3000} onDone={() => setSpeechMessage('')} />
          )}
        </div>

        <FloatingParticles />

        <div className="bughunt-intro-overlay">
          <div className={`bughunt-intro-layout ${isBossMode ? 'boss-mode' : ''}`}>
            <div className={`bughunt-intro-card ${isBossMode ? 'boss-intro' : ''}`}>
              {/* Scan line overlay */}
              <div className="intro-scanline-overlay" />

              {/* Decorative orbit rings */}
              <div className="intro-orbit-ring intro-orbit-ring--1" />
              <div className="intro-orbit-ring intro-orbit-ring--2" />

              {/* Icon with pulse ring */}
              <div className="intro-icon-wrapper">
                <div className="intro-icon-pulse" />
                <div className="bughunt-intro-icon">{isBossMode ? '🛸' : '🐛'}</div>
              </div>

              {/* Glitch-style title */}
              <h1 className="bughunt-title" data-text={isBossMode ? 'BOSS RAID' : 'BUG HUNT'}>
                {isBossMode ? 'BOSS RAID' : 'BUG HUNT'}
              </h1>
              <h2 className="bughunt-subtitle">
                <span className="subtitle-line" />
                {isBossMode ? 'UFO Invasion — Code Debug Raid' : 'Code Debug Challenge'}
                <span className="subtitle-line" />
              </h2>

              {isBossMode && (
                <div className="boss-hp-preview">
                  <div className="boss-hp-label">UFO GLOBAL HP</div>
                  <div className="boss-hp-bar-track">
                    <div className="boss-hp-bar-fill" style={{ width: `${bossHPPercent}%` }} />
                  </div>
                  <div className="boss-hp-text">{bossGlobalHP.toLocaleString()} / {bossMaxHP.toLocaleString()}</div>
                </div>
              )}

              {}
              <div className="bughunt-rules">
                <div className="rule-item rule-good">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">🎯</span>
                  <div>
                    <strong>{isBossMode ? 'Squash bugs to damage UFO' : 'Tap buggy code'}</strong>
                    <p>{isBossMode ? 'Each bug squashed fires a laser at the boss! +100 DMG' : 'Spot syntax errors and squash them! +100 pts'}</p>
                  </div>
                </div>
                <div className="rule-item rule-bad">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">⚠️</span>
                  <div>
                    <strong>{isBossMode ? 'Watch for Abduction Beams!' : 'Avoid correct code'}</strong>
                    <p>{isBossMode ? 'The UFO targets clean code with green beams — clicking them costs −300 pts!' : "Don't tap clean code or you lose points! −50 pts"}</p>
                  </div>
                </div>
                <div className="rule-item rule-combo">
                  <div className="rule-item-glow" />
                  <span className="rule-icon">🔥</span>
                  <div>
                    <strong>{isBossMode ? 'Combo = More damage' : 'Build combos'}</strong>
                    <p>{isBossMode ? 'Consecutive hits deal up to 3x damage!' : 'Consecutive squashes multiply your score!'}</p>
                  </div>
                </div>
              </div>

              {isBossMode && (
                <div className="boss-raid-note">
                  <span className="boss-raid-note-icon">👥</span> All players share the boss HP. Your damage counts!
                </div>
              )}

              {}
              <div className="intro-timer-preview">
                <div className="timer-ring">
                  <svg viewBox="0 0 40 40" className="timer-ring-svg">
                    <circle cx="20" cy="20" r="17" className="timer-ring-bg" />
                    <circle cx="20" cy="20" r="17" className="timer-ring-fill" />
                  </svg>
                  <span className="timer-ring-label">⏱</span>
                </div>
                <div className="timer-text-block">
                  <span className="timer-big">{GAME_DURATION}s</span>
                  <span className="timer-sub">mission time limit</span>
                </div>
              </div>

              {!isBossMode && (
                <div className="normal-tutorial-section">
                  <div className="tutorial-header-line">
                    <span className="tutorial-header-dash" />
                    <span className="boss-coop-label">CONTROLLER TUTORIAL</span>
                    <span className="tutorial-header-dash" />
                  </div>
                  <div className="tutorial-methods-grid">
                    <div className="tutorial-method">
                      <div className="method-icon">🖱️</div>
                      <div className="method-details">
                        <strong>Mouse</strong>
                        <p>Click on bugs directly</p>
                      </div>
                    </div>
                    <div className="tutorial-method">
                      <div className="method-icon">🔢</div>
                      <div className="method-details">
                        <strong>Numbers / Numpad</strong>
                        <p>Keys 1-9 to map grid</p>
                      </div>
                    </div>
                    <div className="tutorial-method">
                      <div className="method-icon">⌨️</div>
                      <div className="method-details">
                        <strong>Keyboard Letters</strong>
                        <p>Q W E | A S D | Z X C</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button className={`bughunt-start-btn ${isBossMode ? 'boss-start' : ''}`} onClick={startCountdown}>
                <span className="btn-inner-text">{isBossMode ? 'ENGAGE BOSS' : 'LAUNCH MISSION'}</span>
                <span className="btn-glow" />
                <span className="btn-shimmer" />
              </button>
            </div>

            {isBossMode && (
              <div className="boss-coop-section">
                <div className="boss-coop-label">2-PLAYER CO-OP CONTROLS</div>
                <CoopLegend profiles={coopProfiles} />
                <div className="boss-coop-note">
                  Shared raid session. P1 uses the mouse, P2 uses the numpad.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

    if (phase === 'countdown') {
    return (
      <div className={`stage-bug-hunt ${isBossMode ? 'boss-mode' : ''}`}>
        <FloatingParticles />
        <div className="bughunt-countdown-overlay">
          <div className={`countdown-number ${countdown === 0 ? 'go' : ''}`}>
            {countdown > 0 ? countdown : (isBossMode ? 'RAID!' : 'GO!')}
          </div>
        </div>
      </div>
    );
  }

    if (phase === 'results') {
    return (
      <div className={`stage-bug-hunt ${isBossMode ? 'boss-mode' : ''} ${screenEffect}`}>
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas camera={{ position: [0, 1.2, 6], fov: 44 }} dpr={[1, 1.1]} quality="low" gl={{ alpha: true, antialias: true }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[2, 4, 6]} intensity={1.5} color="#ffffff" />
            <pointLight position={[5, 5, 5]} intensity={80} color="#ffcc00" />
            <InteractiveRobot reaction="celebrating" scale={5.2} position={[0, -1.55, 0]} />
            <Stars radius={100} depth={20} count={140} factor={4} saturation={0} fade speed={1} />
          </AdaptiveCanvas>
        </div>

        <FloatingParticles />

        <div className="bughunt-results-overlay">
          <div className={`bughunt-results-card ${isBossMode ? 'boss-results' : ''}`}>
            <h1 className="results-title">{isBossMode ? 'RAID REPORT' : 'MISSION REPORT'}</h1>
            <div className="results-stars">
              {[1, 2, 3].map(s => (
                <span key={s} className={`result-star ${s <= getStars() ? 'earned' : ''}`}>★</span>
              ))}
            </div>

            <div className="results-grid">
              <div className="result-stat">
                <span className="stat-value">{bugsSquashed}</span>
                <span className="stat-label">Bugs Squashed</span>
              </div>
              <div className="result-stat">
                <span className="stat-value">{bugsMissed}</span>
                <span className="stat-label">Bugs Missed</span>
              </div>
              <div className="result-stat">
                <span className="stat-value">{wrongClicks}</span>
                <span className="stat-label">Wrong Clicks</span>
              </div>
              <div className="result-stat">
                <span className="stat-value">{accuracy}%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              {isBossMode ? (
                <div className="result-stat highlight boss-dmg-stat">
                  <span className="stat-value">{bossDamageTaken}</span>
                  <span className="stat-label">Boss DMG Dealt</span>
                </div>
              ) : (
                <div className="result-stat highlight">
                  <span className="stat-value">{maxCombo}x</span>
                  <span className="stat-label">Max Combo</span>
                </div>
              )}
              <div className="result-stat highlight">
                <span className="stat-value">{score}</span>
                <span className="stat-label">Final Score</span>
              </div>
            </div>

            {isBossMode && (
              <div className="boss-hp-result">
                <div className="boss-hp-label">UFO REMAINING HP</div>
                <div className="boss-hp-bar-track">
                  <div className="boss-hp-bar-fill" style={{ width: `${bossHPPercent}%` }} />
                </div>
                <div className="boss-hp-text">{bossGlobalHP.toLocaleString()} / {bossMaxHP.toLocaleString()}</div>
              </div>
            )}

            <div className="results-actions">
              <button className="bughunt-complete-btn" onClick={handleComplete}>
                COMPLETE MISSION
              </button>
              <button className="bughunt-retry-btn" onClick={handleReplay}>
                TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

    const renderGameGrid = (panelPlayerId?: CoopPlayerId) => {
    const offset = (isBossMode && panelPlayerId === 'P2') ? 9 : 0;
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
            className={`bughunt-cell ${cell ? 'has-snippet' : 'empty'} ${cell?.animState === 'entering' ? 'cell-enter' : ''} ${cell?.animState === 'exiting' ? 'cell-exit' : ''} ${feedback?.type === 'squash' ? 'cell-squash' : ''} ${feedback?.type === 'wrong' ? 'cell-wrong' : ''} ${feedback?.type === 'miss' ? 'cell-miss' : ''} ${feedback?.type === 'abducted' ? 'cell-abducted-hit' : ''} ${isAbducted ? 'cell-abduction-beam' : ''}`}
            onClick={() => handleCellAction(idx, panelPlayerId || 'P1')}
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
              {cell && <span className="cell-category">{cell.snippet.category}</span>}
            </div>
            <div className="cell-code-area">
              {cell && (
                <code className={`cell-code ${isAbducted ? 'code-blurred' : ''}`}>{cell.snippet.code}</code>
              )}
              {!cell && feedback?.type === 'squash' && (
                <div className="squash-effect">✓ SQUASHED!</div>
              )}
              {!cell && feedback?.type === 'wrong' && (
                <div className="wrong-effect">✗ CLEAN CODE!</div>
              )}
              {!cell && feedback?.type === 'abducted' && (
                <div className="abducted-effect">🛸 ABDUCTED! −{ABDUCTION_PENALTY}</div>
              )}
              {feedback?.type === 'miss' && (
                <div className="miss-effect">ESCAPED!</div>
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
    <div className={`stage-bug-hunt ${isBossMode ? 'boss-mode' : ''} ${screenEffect}`}>
      {}
      {!isBossMode && (
        <div className="bughunt-canvas-corner">
          <AdaptiveCanvas camera={{ position: [0, 1, 5], fov: 50 }} dpr={[1, 1.1]} quality="low">
            <ambientLight intensity={0.6} />
            <pointLight position={[5, 5, 5]} intensity={100} color="#ffcc00" />
            <InteractiveRobot reaction={robotReaction} scale={3.2} position={[0, -1.5, 0]} onClick={handleRobotClick} />
            <Stars radius={100} depth={20} count={120} factor={3} saturation={0} fade speed={1} />
          </AdaptiveCanvas>
          {speechMessage && (
            <SpeechBubble message={speechMessage} type="robot" duration={2500} onDone={() => setSpeechMessage('')} />
          )}
        </div>
      )}

      <FloatingParticles />

      {/* HUD */}
      <div className="bughunt-hud">
        <div className="hud-left">
          <span className="hud-label">{isBossMode ? '🛸 BOSS RAID' : '🐛 BUG HUNT'}</span>
          <div className="hud-timer-bar">
            <div
              className={`hud-timer-fill ${timerUrgent ? 'urgent' : ''}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
          <span className={`hud-time ${timerUrgent ? 'urgent' : ''}`}>{timeLeft}s</span>
        </div>
        <div className="hud-right">
          {combo > 1 && <span className="hud-combo">{combo}x 🔥</span>}
          <span className="hud-score">{score}</span>
          {isBossMode && <span className="hud-dmg">⚔{bossDamageTaken}</span>}
        </div>
      </div>

      {}
      {isBossMode && (
        <div className="boss-hp-hud">
          <span className="boss-hp-icon">🛸</span>
          <div className="boss-hp-bar-track">
            <div className="boss-hp-bar-fill" style={{ width: `${bossHPPercent}%` }} />
          </div>
          <span className="boss-hp-value">{bossGlobalHP.toLocaleString()}</span>
        </div>
      )}

      {}
      {isBossMode && tickerMessages.length > 0 && (
        <div className="boss-ticker">
          {tickerMessages.slice(-3).map(msg => (
            <div key={msg.id} className="ticker-msg">{msg.text}</div>
          ))}
        </div>
      )}

      {}
      {isBossMode ? (
        <div className="boss-split-screen">
          {}
          <div className="split-panel split-panel-p1">
            <div className="split-panel-header" style={{ borderColor: coopProfiles.P1.accent }}>
              <div className="split-player-badge" style={{ background: coopProfiles.P1.accent, color: '#000' }}>P1</div>
              <div className="split-player-info">
                <span className="split-player-title" style={{ color: coopProfiles.P1.accent }}>{coopProfiles.P1.title}</span>
                <span className="split-player-hint">{coopProfiles.P1.inputHint}</span>
              </div>
              <div className="split-player-stats">
                <span className="split-stat">{coopStats.P1.hits} <small>HIT</small></span>
                <span className="split-stat">{coopStats.P1.damage} <small>DMG</small></span>
              </div>
            </div>
            <div className="split-grid-container">
              {renderGameGrid('P1')}
            </div>
          </div>

          {}
          <div className="split-center-ufo">
            <div className="boss-ufo-scene-split">
              <AdaptiveCanvas camera={{ position: [0, 3.7, 14], fov: 34 }} dpr={[1, 1.2]} quality="low" gl={{ alpha: true, antialias: true }}>
                <ambientLight intensity={0.9} />
                <directionalLight position={[3, 6, 8]} intensity={1.8} color="#ffffff" />
                <pointLight position={[0, 10, 5]} intensity={35} color="#00ffcc" />
                <BossUFO
                  hp={bossGlobalHP}
                  maxHP={bossMaxHP}
                  hitFlash={ufoHitFlash}
                  position={[0, 0.85, 0]}
                  scale={1.05}
                />
                <Stars radius={100} depth={20} count={90} factor={3} saturation={0} fade speed={1} />
              </AdaptiveCanvas>
              {damageNumbers.map(dn => (
                <div
                  key={dn.id}
                  className="damage-number"
                  style={{ left: `${dn.x}%`, top: `${dn.y}%` }}
                >
                  −{dn.value}
                </div>
              ))}
              {laserActive && <div className="laser-beam" />}
            </div>

            {}
            <div className="boss-split-robot">
              <AdaptiveCanvas camera={{ position: [0, 1, 5], fov: 50 }} dpr={[1, 1.1]} quality="low">
                <ambientLight intensity={0.6} />
                <pointLight position={[5, 5, 5]} intensity={100} color="#ffcc00" />
                <InteractiveRobot reaction={robotReaction} scale={3.5} position={[0, -1.5, 0]} onClick={handleRobotClick} />
              </AdaptiveCanvas>
            </div>
          </div>

          {}
          <div className="split-panel split-panel-p2">
            <div className="split-panel-header" style={{ borderColor: coopProfiles.P2.accent }}>
              <div className="split-player-badge" style={{ background: coopProfiles.P2.accent, color: '#000' }}>P2</div>
              <div className="split-player-info">
                <span className="split-player-title" style={{ color: coopProfiles.P2.accent }}>{coopProfiles.P2.title}</span>
                <span className="split-player-hint">{coopProfiles.P2.inputHint}</span>
              </div>
              <div className="split-player-stats">
                <span className="split-stat">{coopStats.P2.hits} <small>HIT</small></span>
                <span className="split-stat">{coopStats.P2.damage} <small>DMG</small></span>
              </div>
            </div>
            <div className="split-grid-container">
              {renderGameGrid('P2')}
            </div>
          </div>
        </div>
      ) : (
                <div className="bughunt-grid-wrapper">
          {renderGameGrid()}
        </div>
      )}

      {}
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
