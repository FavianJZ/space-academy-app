import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import './StageStyle.css';

interface Stage5LogicFlowProps {
  planetId: number;
}

interface LogicLevel {
  id: number;
  scenario: string;
  factValue: number | string;
  conditionText: string;
  correctPath: 'true' | 'false';
  explanation: string;
}

interface Wire {
  from: string;
  to: string;
}

const levels: LogicLevel[] = [
  {
    id: 1,
    scenario: "System Check: Battery Level",
    factValue: "Battery: 80%",
    conditionText: "Is Battery >= 75%?",
    correctPath: 'true',
    explanation: "80% is greater than 75%, so the condition is TRUE. Power flows to the system.",
  },
  {
    id: 2,
    scenario: "Temperature Control",
    factValue: "Temp: 120°C",
    conditionText: "Is Temp > 150°C?",
    correctPath: 'false',
    explanation: "120 is NOT greater than 150. The condition is FALSE.",
  },
  {
    id: 3,
    scenario: "Access Control",
    factValue: "User: 'Guest'",
    conditionText: "Is User == 'Admin'?",
    correctPath: 'false',
    explanation: "The user is 'Guest', not 'Admin'. Access denied (FALSE path).",
  },
];

const Stage5LogicFlow: React.FC<Stage5LogicFlowProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [wires, setWires] = useState<Wire[]>([]);
  const [dragStart, setDragStart] = useState<{ portId: string; x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [status, setStatus] = useState<'playing' | 'success' | 'failure'>('playing');
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const timeoutRef = useRef<any>(null);

  // Timer state
  const STAGE_TIME_LIMIT = 60;
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
  const levelStartTimeRef = useRef(Date.now());
  const stageStartRef = useRef(Date.now());
  const timerRef = useRef<any>(null);
  const completedRef = useRef(false);
  const [timerKey, setTimerKey] = useState(0);

  // Interactive companion state
  const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
  const [speechMessage, setSpeechMessage] = useState('');
  const [screenEffect, setScreenEffect] = useState('');

  const handleRobotClick = () => {
    setSpeechMessage(getRandomMessage(robotMessages.idle));
    setRobotReaction('waving');
    setTimeout(() => setRobotReaction('idle'), 2000);
  };

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerKey]);

  // Auto-complete when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !completedRef.current) {
      completedRef.current = true;
      handleComplete();
    }
  }, [timeLeft]);

  // Speed-based scoring: 3 seconds = 100 pts baseline, faster = more, min 20, max 300
  const calculateSpeedScore = (): number => {
    const answerTime = (Date.now() - levelStartTimeRef.current) / 1000;
    return Math.min(300, Math.max(20, Math.round(100 * (3 / Math.max(answerTime, 0.5)))));
  };

  const currentLevel = levels[currentLevelIdx];

  const playSound = (type: 'connect' | 'success' | 'failure' | 'complete') => {
    const sounds = {
      connect: '/sounds/connect.mp3',
      success: '/sounds/success.mp3',
      failure: '/sounds/error.mp3',
      complete: '/sounds/stage_complete.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
  };

  // Helper to get coordinates of a port relative to the container
  const getPortPosition = (portId: string) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const portEl = containerRef.current.querySelector(`[data-port="${portId}"]`);
    if (portEl) {
      const rect = portEl.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  const handleMouseDown = (_event: React.MouseEvent, portId: string) => {
    if (status !== 'playing') return;
    // Prevent starting from an input port (simplified logic: only start from outputs)
    if (portId === 'diamond-in' || portId === 'bulb-in') return;

    // Remove existing wires starting from this port
    setWires((prev) => prev.filter((w) => w.from !== portId));

    const pos = getPortPosition(portId);
    setDragStart({ portId, x: pos.x, y: pos.y });
    setDragCurrent({ x: pos.x, y: pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStart && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setDragCurrent({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If dropped on a valid port
    const target = e.target as HTMLElement;
    const targetPort = target.getAttribute('data-port');
    completeConnection(targetPort);
  };

  const completeConnection = (targetPort: string | null) => {
    if (dragStart && targetPort) {
      let isValid = false;
      if (dragStart.portId === 'start-out' && targetPort === 'diamond-in') isValid = true;
      if ((dragStart.portId === 'diamond-true' || dragStart.portId === 'diamond-false') && targetPort === 'bulb-in') isValid = true;

      if (isValid) {
        playSound('connect');
        setWires((prev) => [...prev, { from: dragStart.portId, to: targetPort }]);
        checkWinCondition([...wires, { from: dragStart.portId, to: targetPort }]);
      }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent, portId: string) => {
    if (status !== 'playing') return;
    if (portId === 'diamond-in' || portId === 'bulb-in') return;
    setWires((prev) => prev.filter((w) => w.from !== portId));
    const touch = e.touches[0];
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = { x: touch.clientX - containerRect.left, y: touch.clientY - containerRect.top };
    setDragStart({ portId, x: pos.x, y: pos.y });
    setDragCurrent(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart || !containerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    setDragCurrent({ x: touch.clientX - containerRect.left, y: touch.clientY - containerRect.top });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart || !containerRef.current) return;
    const touch = e.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    const targetPort = el?.getAttribute('data-port');
    completeConnection(targetPort);
  };

  const checkWinCondition = (currentWires: Wire[]) => {
    const hasStartToDiamond = currentWires.some(w => w.from === 'start-out' && w.to === 'diamond-in');
    const hasDiamondToBulb = currentWires.find(w => w.to === 'bulb-in');

    if (hasStartToDiamond && hasDiamondToBulb) {
      if (hasDiamondToBulb.from === `diamond-${currentLevel.correctPath}`) {
        setStatus('success');
        playSound('success');
        const speedScore = calculateSpeedScore();
        setScore((prev) => prev + speedScore);
        setRobotReaction('correct');
        setSpeechMessage(getRandomMessage(robotMessages.correct));
        setScreenEffect('screen-flash-green');
        setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
      } else {
        setStatus('failure');
        playSound('failure');
        setRobotReaction('incorrect');
        setSpeechMessage(getRandomMessage(robotMessages.incorrect));
        setScreenEffect('screen-shake');
        setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
      }
    }
  };

  const handleNext = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
      setWires([]);
      setStatus('playing');
      levelStartTimeRef.current = Date.now();
    } else {
      handleComplete();
    }
  };

  const handleRetryLevel = () => {
    setWires([]);
    setStatus('playing');
  };

  const handleComplete = () => {
    if (completedRef.current && showCompletion) return;
    completedRef.current = true;
    clearInterval(timerRef.current);
    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
    const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 5, score, elapsed);
    setShowCompletion(true);
    setRobotReaction('celebrating');
    setScreenEffect('screen-flash-green');
    setTimeout(() => setScreenEffect(''), 500);
    playSound('complete');
    timeoutRef.current = setTimeout(() => {
      navigate('/mainhub');
    }, 4000);
  };

  const handleReplay = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    clearInterval(timerRef.current);
    setShowCompletion(false);
    setCurrentLevelIdx(0);
    setWires([]);
    setScore(0);
    setStatus('playing');
    setRobotReaction('idle');
    setTimeLeft(STAGE_TIME_LIMIT);
    levelStartTimeRef.current = Date.now();
    stageStartRef.current = Date.now();
    completedRef.current = false;
    setTimerKey(prev => prev + 1);
  };

  // Re-calculate wire positions on resize or render
  const [renderedWires, setRenderedWires] = React.useState<{x1:number, y1:number, x2:number, y2:number, color: string}[]>([]);
  
  React.useEffect(() => {
    const newRenderedWires = wires.map(w => {
      const start = getPortPosition(w.from);
      const end = getPortPosition(w.to);
      let color = '#00ffff'; // Default blue
      if (status === 'success') color = '#00ff88'; // Green
      if (status === 'failure') color = '#ff3333'; // Red
      return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, color };
    });
    setRenderedWires(newRenderedWires);
  }, [wires, status, currentLevelIdx]);

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <h1>STAGE 5 COMPLETE!</h1>
          <div className="score-info">
            <p>Logic Circuits Fixed: {Math.floor(score / 100)}/{levels.length}</p>
            <p>Score: {score} points</p>
          </div>
          <p className="returning-message">Returning to main hub...</p>
          <div className="completion-buttons">
            <button className="replay-btn" onClick={handleReplay}>Replay Stage</button>
            <button className="return-btn" onClick={() => navigate('/mainhub')}>Return to Hub</button>
          </div>
          <div className="robot-celebration">
            <AdaptiveCanvas camera={{ position: [0, 1, 5], fov: 50 }} dpr={[1, 1.1]} quality="low">
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={100} color="#00ffff" />
              <InteractiveRobot reaction="celebrating" scale={4} position={[0, -1.5, 0]} />
              <Stars radius={100} depth={20} count={220} factor={5} saturation={0} fade speed={1} />
            </AdaptiveCanvas>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stage-logic-flow blueprint-theme ${screenEffect}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchMove={handleTouchMove as any} onTouchEnd={handleTouchEnd as any}>
      <div className="canvas-container">
        <AdaptiveCanvas camera={{ position: [0, 1, 5], fov: 50 }} dpr={[1, 1.1]} quality="low">
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={100} color="#00ff88" />
          <InteractiveRobot
            reaction={robotReaction}
            scale={5}
            position={[0, -1.5, 0]}
            onClick={handleRobotClick}
          />
          <Stars radius={100} depth={20} count={220} factor={5} saturation={0} fade speed={1} />
        </AdaptiveCanvas>
      </div>

      {/* Speech bubble positioned at stage level so it's not clipped by the robot circle */}
      {speechMessage && (
        <div className="logic-speech-wrapper">
          <SpeechBubble
            message={speechMessage}
            type="robot"
            duration={3000}
            onDone={() => setSpeechMessage('')}
          />
        </div>
      )}

      <FloatingParticles />

      <div className="logic-header-overlay">
        <h2>Pipeline Challenge {currentLevelIdx + 1}/{levels.length}</h2>
        <p>{currentLevel.scenario}</p>
        <div style={{
          display: 'inline-block', marginTop: '8px',
          background: timeLeft <= 10 ? 'rgba(255,50,50,0.9)' : 'rgba(0,200,255,0.2)',
          border: timeLeft <= 10 ? '2px solid #ff3232' : '2px solid rgba(0,200,255,0.5)',
          borderRadius: '12px', padding: '6px 14px',
          color: timeLeft <= 10 ? '#fff' : '#00c8ff',
          fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 700,
          animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
        }}>⏱ {timeLeft}s</div>
      </div>

      <div className="circuit-board" ref={containerRef}>
        {/* SVG Layer for Wires */}
        <svg className="wire-layer">
          {renderedWires.map((w, i) => (
            <line 
              key={i} 
              x1={w.x1} y1={w.y1} 
              x2={w.x2} y2={w.y2} 
              stroke={w.color} 
              strokeWidth="4" 
              strokeLinecap="round"
              className={status === 'success' ? 'wire-pulse' : ''}
            />
          ))}
          {dragStart && dragCurrent && (
            <line 
              x1={dragStart.x} y1={dragStart.y} 
              x2={dragCurrent.x} y2={dragCurrent.y} 
              stroke="#ffff00" 
              strokeWidth="4" 
              strokeDasharray="10,5"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* START BLOCK */}
        <div className="circuit-component start-component">
          <div className="component-label">POWER SOURCE</div>
          <div className="component-value">{currentLevel.factValue}</div>
          <div 
            className="port output-port" 
            data-port="start-out"
            onMouseDown={(e) => handleMouseDown(e, 'start-out')}
            onTouchStart={(e) => handleTouchStart(e, 'start-out')}
          />
        </div>

        {/* DIAMOND BLOCK */}
        <div className="circuit-component diamond-component">
          <div 
            className="port input-port" 
            data-port="diamond-in"
          />
          <div className="diamond-shape">
            <div className="diamond-content">
              <span className="condition-text">{currentLevel.conditionText}</span>
            </div>
          </div>
          <div className="diamond-outputs">
            <div className="output-wrapper">
              <span>TRUE</span>
              <div 
                className="port output-port" 
                data-port="diamond-true"
                onMouseDown={(e) => handleMouseDown(e, 'diamond-true')}
                onTouchStart={(e) => handleTouchStart(e, 'diamond-true')}
              />
            </div>
            <div className="output-wrapper">
              <span>FALSE</span>
              <div 
                className="port output-port" 
                data-port="diamond-false"
                onMouseDown={(e) => handleMouseDown(e, 'diamond-false')}
                onTouchStart={(e) => handleTouchStart(e, 'diamond-false')}
              />
            </div>
          </div>
        </div>

        {/* END BLOCK (BULB) */}
        <div className={`circuit-component bulb-component ${status === 'success' ? 'bulb-on' : 'bulb-off'}`}>
          <div 
            className="port input-port" 
            data-port="bulb-in"
          />
          <div className="bulb-glass">
            <div className="bulb-filament"></div>
          </div>
          <div className="component-label">INDICATOR</div>
        </div>
      </div>

      {/* Feedback Overlay */}
      {status !== 'playing' && (
        <div className={`feedback-modal ${status}`}>
          <h3>{status === 'success' ? 'CIRCUIT COMPLETE!' : 'SHORT CIRCUIT!'}</h3>
          <p>{currentLevel.explanation}</p>
          {status === 'success' ? (
            <button className="next-btn" onClick={handleNext}>
              {currentLevelIdx === levels.length - 1 ? 'FINISH MISSION' : 'NEXT LEVEL'}
            </button>
          ) : (
            <button className="retry-btn" onClick={handleRetryLevel}>TRY AGAIN</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Stage5LogicFlow;
