import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import './StageStyle.css';
import './AdvancedHUD.css';

interface Stage3PuzzleGameProps {
    planetId: number;
}

const GRID_SIZE = 3;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const INITIAL_TIME = 120;

// Map tile value (1-8) to the corresponding cut image piece
const getTileImage = (tile: number): string => {
    if (tile === 0) return '';
    const row = Math.ceil(tile / GRID_SIZE);
    const col = ((tile - 1) % GRID_SIZE) + 1;
    return `/assets/row-${row}-column-${col}.jpg`;
};

const Stage3PuzzleGame: React.FC<Stage3PuzzleGameProps> = ({ planetId }) => {
    const navigate = useNavigate();
    const [tiles, setTiles] = useState<number[]>([]);
    const [emptyIndex, setEmptyIndex] = useState(TOTAL_TILES - 1);
    const [moves, setMoves] = useState(0);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [showReference, setShowReference] = useState(false);
    const [restartKey, setRestartKey] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<any>(null);
    const addPlanetScore = useGameStore((state) => state.addPlanetScore);
    const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
    const sfxVolume = useGameStore((state) => state.sfxVolume);
    const stageStartRef = useRef(Date.now());

    // Interactive companion state
    const [robotReaction, setRobotReaction] = useState<RobotReaction>('thinking');
    const [speechMessage, setSpeechMessage] = useState('');
    const [screenEffect, setScreenEffect] = useState('');

    // 3D Tilt State
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleRobotClick = () => {
        setSpeechMessage(getRandomMessage(robotMessages.idle));
        setRobotReaction('waving');
        setTimeout(() => setRobotReaction('thinking'), 2000);
    };

    const getNeighbors = useCallback((index: number): number[] => {
        const neighbors: number[] = [];
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        if (row > 0) neighbors.push(index - GRID_SIZE);
        if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE);
        if (col > 0) neighbors.push(index - 1);
        if (col < GRID_SIZE - 1) neighbors.push(index + 1);
        return neighbors;
    }, []);

    const initializePuzzle = useCallback(() => {
        const solved = Array.from({ length: TOTAL_TILES }, (_, i) => i + 1);
        solved[TOTAL_TILES - 1] = 0;
        const shuffled = [...solved];
        let emptyIdx = TOTAL_TILES - 1;
        for (let i = 0; i < 300; i++) {
            const neighbors = getNeighbors(emptyIdx);
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            [shuffled[emptyIdx], shuffled[randomNeighbor]] = [shuffled[randomNeighbor], shuffled[emptyIdx]];
            emptyIdx = randomNeighbor;
        }
        setTiles(shuffled);
        setEmptyIndex(shuffled.indexOf(0));
        setMoves(0);
        setTimeLeft(INITIAL_TIME);
        setIsPuzzleSolved(false);
    }, [getNeighbors]);

    useEffect(() => { initializePuzzle(); }, []);

    // Timer
    useEffect(() => {
        if (isPuzzleSolved || showCompletion) return;
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPuzzleSolved, showCompletion, tiles.length, restartKey]);

    // Handle time up
    useEffect(() => {
        if (timeLeft === 0 && !isPuzzleSolved && !showCompletion && tiles.length > 0) {
            setRobotReaction('incorrect');
            setSpeechMessage("Time's up! Don't worry, try again! ⏰");
            setScreenEffect('screen-shake');
            setTimeout(() => setScreenEffect(''), 500);
            handleComplete(false);
        }
    }, [timeLeft]);

    const handleTileClick = (index: number) => {
        if (isPuzzleSolved || timeLeft === 0) return;
        const neighbors = getNeighbors(emptyIndex);
        if (neighbors.includes(index)) {
            const newTiles = [...tiles];
            [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
            setTiles(newTiles);
            setEmptyIndex(index);
            setMoves(moves + 1);
            try { const a = new Audio('/sounds/connect.mp3'); a.volume = sfxVolume * 0.3; a.play().catch(() => { }); } catch { }
            if (checkSolved(newTiles)) {
                setIsPuzzleSolved(true);
                setRobotReaction('celebrating');
                setSpeechMessage('You solved it! Amazing! 🧩✨');
                setScreenEffect('screen-flash-green');
                setTimeout(() => setScreenEffect(''), 500);
                if (timerRef.current) clearInterval(timerRef.current);
                handleComplete(true);
            }
        }
    };

    const checkSolved = (tileArray: number[]): boolean => {
        for (let i = 0; i < TOTAL_TILES - 1; i++) {
            if (tileArray[i] !== i + 1) return false;
        }
        return tileArray[TOTAL_TILES - 1] === 0;
    };

    const handleComplete = (solved: boolean) => {
        markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
        const calcScore = solved ? Math.round(100 + (timeLeft / INITIAL_TIME) * 400) : 0;
        setFinalScore(calcScore);
        const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
        addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 3, calcScore, elapsed);
        setShowCompletion(true);
        try { const a = new Audio('/sounds/stage_complete.mp3'); a.volume = sfxVolume; a.play().catch(() => { }); } catch { }
        timeoutRef.current = setTimeout(() => { navigate('/mainhub'); }, 6000);
    };

    const handleRestart = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        initializePuzzle();
        stageStartRef.current = Date.now();
        setRestartKey((prev) => prev + 1);
    };

    if (showCompletion) {
        return (
            <div className="stage-completion">
                <div className="completion-card puzzle-completion">
                    <h1>{isPuzzleSolved ? '🧩 PUZZLE SOLVED!' : "⏰ TIME'S UP!"}</h1>
                    <div className="score-info">
                        <p>{isPuzzleSolved ? `Completed in ${moves} moves!` : 'Better luck next time!'}</p>
                        <p>Score: {finalScore} points</p>
                    </div>
                    {isPuzzleSolved && (
                        <div className="puzzle-complete-image">
                            <img src="/assets/gambar_binus_puzzel_game.jpeg" alt="Completed puzzle" />
                        </div>
                    )}
                    <p className="returning-message">Returning to main hub...</p>
                    <div className="completion-buttons">
                        <button className="replay-btn" onClick={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setShowCompletion(false); initializePuzzle(); setRestartKey((prev) => prev + 1); }}>
                            Replay Puzzle
                        </button>
                        <button className="return-btn" onClick={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); navigate('/mainhub'); }}>
                            Return to Hub
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const timerPercent = (timeLeft / INITIAL_TIME) * 100;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        setTilt({ x: y * 15, y: -x * 15 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    return (
        <div className={`stage-puzzle ${screenEffect}`}>
            {/* Top Left Floating Button */}
            <div className="top-left-floating-btn hud-sweep-btn-wrapper" style={{ position: 'absolute', top: '20px', left: '30px', zIndex: 50, margin: 0 }}>
                <button className="solve-btn hud-sweep-btn" onClick={handleRestart} style={{ padding: '10px 24px', fontSize: '0.9rem', width: 'auto', minWidth: '160px' }}>
                    🔄 RESTART PUZZLE
                </button>
            </div>

            <div className="canvas-container">
                <AdaptiveCanvas camera={{ position: [0, 1, 5], fov: 50 }} dpr={[1, 1.1]} quality="low">
                    <ambientLight intensity={0.6} />
                    <pointLight position={[5, 5, 5]} intensity={100} color="#00ffff" />
                    <InteractiveRobot
                        reaction={robotReaction}
                        scale={5}
                        position={[0, -1.5, 0]}
                        onClick={handleRobotClick}
                    />
                    <Stars radius={100} depth={20} count={220} factor={5} saturation={0} fade speed={1} />
                </AdaptiveCanvas>

                {speechMessage && (
                    <SpeechBubble
                        message={speechMessage}
                        type="robot"
                        duration={3000}
                        onDone={() => setSpeechMessage('')}
                    />
                )}
            </div>

            <FloatingParticles />

            <div className="puzzle-content hud-content-layer">
                <div 
                  className="puzzle-card hud-3d-card"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ 
                      transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                      transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.1s linear',
                  }}
                >
                    <div className="card-scanline" />
                    <div className="puzzle-header">
                        <h1>🧩 IMAGE PUZZLE</h1>
                        <p className="puzzle-subtitle">Arrange the pieces to reveal the hidden image!</p>
                    </div>

                    <div className="puzzle-stats-bar">
                        <div className={`puzzle-timer-circle ${timeLeft <= 20 ? (timeLeft <= 10 ? 'danger' : 'warning') : ''}`}>
                            <svg className="timer-ring" viewBox="0 0 44 44">
                                <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(0,255,255,0.12)" strokeWidth="3" />
                                <circle cx="22" cy="22" r="19" fill="none"
                                    stroke={timeLeft <= 10 ? '#ff4444' : timeLeft <= 20 ? '#ffaa00' : '#00ffff'}
                                    strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray={`${timerPercent * 1.194} 119.4`}
                                    style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dasharray 1s linear' }} />
                            </svg>
                            <span className="timer-text">{timeLeft}s</span>
                        </div>
                        <div className="puzzle-moves-badge">
                            <span className="moves-label">MOVES</span>
                            <span className="moves-count">{moves}</span>
                        </div>
                        <button className={`reference-btn ${showReference ? 'active' : ''}`} onClick={() => setShowReference(!showReference)}>
                            🖼️ {showReference ? 'Hide' : 'Hint'}
                        </button>
                    </div>

                    <div className="puzzle-grid puzzle-grid-3x3">
                        {tiles.map((tile, index) => (
                            <div
                                key={`tile-${index}`}
                                className={`puzzle-tile ${tile === 0 ? 'empty' : 'has-image'}`}
                                onClick={() => handleTileClick(index)}
                                style={tile !== 0 ? {
                                    backgroundImage: `url(${getTileImage(tile)})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                } : undefined}
                            >
                                {tile !== 0 && <span className="tile-number">{tile}</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {showReference && (
                    <div className="reference-preview puzzle-reference-preview">
                        <img src="/assets/gambar_binus_puzzel_game.jpeg" alt="Reference" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stage3PuzzleGame;
