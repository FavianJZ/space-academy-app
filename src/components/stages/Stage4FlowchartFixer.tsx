import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import './StageStyle.css';

interface Stage4FlowchartFixerProps {
  planetId: number;
}

interface FlowchartChallenge {
  id: number;
  description: string;
  startBlock: string;
  decisionBlock: string;
  endBlock: string;
  correctPath: 'true' | 'false';
  explanation: string;
}

const challenges: FlowchartChallenge[] = [
  {
    id: 1,
    description: 'Check if the input number is greater than 5',
    startBlock: 'START: Input = 8',
    decisionBlock: 'Is Input > 5?',
    endBlock: 'Output: TRUE',
    correctPath: 'true',
    explanation: 'Since 8 is greater than 5, the TRUE path is correct.',
  },
  {
    id: 2,
    description: 'Determine if a variable is even',
    startBlock: 'START: Number = 7',
    decisionBlock: 'Is Number % 2 == 0?',
    endBlock: 'Output: EVEN/ODD',
    correctPath: 'false',
    explanation: '7 is odd, so 7 % 2 != 0, making the FALSE path correct.',
  },
  {
    id: 3,
    description: 'Check if username is valid',
    startBlock: 'START: Username = "admin123"',
    decisionBlock: 'Length >= 5?',
    endBlock: 'Output: VALID',
    correctPath: 'true',
    explanation: '"admin123" has 8 characters, which is >= 5, so TRUE is correct.',
  },
];

const Stage4FlowchartFixer: React.FC<Stage4FlowchartFixerProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [selectedPath, setSelectedPath] = useState<'true' | 'false' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [tappedConnector, setTappedConnector] = useState<'true' | 'false' | null>(null);
  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const timeoutRef = useRef<any>(null);

  // Timer state
  const STAGE_TIME_LIMIT = 60;
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
  const challengeStartTimeRef = useRef(Date.now());
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
    const answerTime = (Date.now() - challengeStartTimeRef.current) / 1000;
    return Math.min(300, Math.max(20, Math.round(100 * (3 / Math.max(answerTime, 0.5)))));
  };

  const currentChallenge = challenges[currentChallengeIdx];
  const isCorrect = selectedPath === currentChallenge.correctPath;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, path: 'true' | 'false') => {
    if (selectedPath) return;
    e.dataTransfer.setData('text/plain', path);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!selectedPath) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (selectedPath) return;
    const path = e.dataTransfer.getData('text/plain') as 'true' | 'false';
    applyAnswer(path);
  };

  // Touch support: tap connector, then tap drop zone
  const handleConnectorTap = (path: 'true' | 'false') => {
    if (selectedPath) return;
    setTappedConnector(tappedConnector === path ? null : path);
  };

  const handleDropZoneTap = () => {
    if (selectedPath || !tappedConnector) return;
    applyAnswer(tappedConnector);
    setTappedConnector(null);
  };

  const applyAnswer = (path: 'true' | 'false') => {
    const audio = new Audio('/sounds/connect.mp3');
    audio.volume = sfxVolume;
    audio.play().catch(() => {});
    setSelectedPath(path);
    setShowExplanation(true);
    if (path === currentChallenge.correctPath) {
      const speedScore = calculateSpeedScore();
      setScore(prev => prev + speedScore);
      setRobotReaction('correct');
      setSpeechMessage(getRandomMessage(robotMessages.correct));
      setScreenEffect('screen-flash-green');
      setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
    } else {
      setRobotReaction('incorrect');
      setSpeechMessage(getRandomMessage(robotMessages.incorrect));
      setScreenEffect('screen-shake');
      setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
    }
  };

  const handleNext = () => {
    if (currentChallengeIdx < challenges.length - 1) {
      setCurrentChallengeIdx(currentChallengeIdx + 1);
      setSelectedPath(null);
      setShowExplanation(false);
      challengeStartTimeRef.current = Date.now();
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (completedRef.current && showCompletion) return;
    completedRef.current = true;
    clearInterval(timerRef.current);
    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
    const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 4, score, elapsed);
    setShowCompletion(true);
    setRobotReaction('celebrating');
    setScreenEffect('screen-flash-green');
    setTimeout(() => setScreenEffect(''), 500);
    const audio = new Audio('/sounds/stage_complete.mp3');
    audio.volume = sfxVolume;
    audio.play().catch(() => {});

    timeoutRef.current = setTimeout(() => {
      navigate('/mainhub');
    }, 4000);
  };

  const handleReplay = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    clearInterval(timerRef.current);
    setShowCompletion(false);
    setCurrentChallengeIdx(0);
    setSelectedPath(null);
    setShowExplanation(false);
    setScore(0);
    setTappedConnector(null);
    setRobotReaction('idle');
    setTimeLeft(STAGE_TIME_LIMIT);
    challengeStartTimeRef.current = Date.now();
    stageStartRef.current = Date.now();
    completedRef.current = false;
    setTimerKey(prev => prev + 1);
  };

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <h1>STAGE 4 COMPLETE!</h1>
          <div className="score-info">
            <p>Correct Flowcharts: {Math.floor(score / 100)}/{challenges.length}</p>
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
    <div className={`stage-flowchart blueprint-theme ${screenEffect}`}>
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

      <div className="flowchart-content">
        <div className="flowchart-workspace">
          <div className="flowchart-main">
            <div className="flowchart-card blueprint-card">
              <div className="flowchart-header">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h1 style={{margin: 0}}>Challenge {currentChallengeIdx + 1}/{challenges.length}</h1>
                  <div style={{
                    background: timeLeft <= 10 ? 'rgba(255,50,50,0.9)' : 'rgba(0,200,255,0.2)',
                    border: timeLeft <= 10 ? '2px solid #ff3232' : '2px solid rgba(0,200,255,0.5)',
                    borderRadius: '12px', padding: '6px 14px',
                    color: timeLeft <= 10 ? '#fff' : '#00c8ff',
                    fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 700,
                    animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none'
                  }}>⏱ {timeLeft}s</div>
                </div>
                <p className="flowchart-description">{currentChallenge.description}</p>
              </div>

              <div className="flowchart-diagram">
                {/* Start Block */}
                <div className="flowchart-block start-block">
                  <div className="block-label">START</div>
                  <div className="block-value">{currentChallenge.startBlock}</div>
                </div>

                <div className="flow-arrow">↓</div>

                {/* Decision Block */}
                <div className="decision-diamond-wrapper">
                  <div className="decision-diamond">
                    <div className="diamond-inner-text">{currentChallenge.decisionBlock}</div>
                  </div>
                </div>

                {/* Drop Zone */}
                <div className="flow-arrow">↓</div>
                <div
                  className={`connector-drop-zone ${isDraggingOver ? 'over' : ''} ${tappedConnector && !selectedPath ? 'tap-ready' : ''} ${
                    selectedPath ? (isCorrect ? 'correct' : 'incorrect') : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  onClick={handleDropZoneTap}
                >
                  {selectedPath ? `PATH: ${selectedPath.toUpperCase()}` : tappedConnector ? `Tap to place ${tappedConnector.toUpperCase()} Path` : 'Drag or Tap Connector Here'}
                </div>
                <div className="flow-arrow">↓</div>

                {/* End Block */}
                <div className="flowchart-block end-block">
                  <div className="block-label">END</div>
                  <div className="block-value">{currentChallenge.endBlock}</div>
                </div>
              </div>

              {showExplanation && (
                <div className="explanation-box">
                  <p>
                    <strong>{isCorrect ? '✓ Correct!' : '✗ Incorrect!'}</strong> {currentChallenge.explanation}
                  </p>
                </div>
              )}
            </div>

            <div className="flowchart-footer">
              {showExplanation && (
                <button className="submit-btn flowchart-next-btn" onClick={handleNext}>
                  {currentChallengeIdx === challenges.length - 1 ? 'FINISH STAGE' : 'NEXT CHALLENGE'}
                </button>
              )}

              <div className="intro-progress flowchart-progress-inline">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((currentChallengeIdx + 1) / challenges.length) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {currentChallengeIdx + 1} / {challenges.length}
                </span>
              </div>
            </div>
          </div>

          <div className="connector-palette">
            <h3>Connectors</h3>
            <p className="palette-hint">Drag or tap a connector, then place it</p>
            <div
              className={`connector-drag-item ${selectedPath ? 'disabled' : ''} ${tappedConnector === 'true' ? 'tapped' : ''}`}
              draggable={!selectedPath}
              onDragStart={(e) => handleDragStart(e, 'true')}
              onClick={() => handleConnectorTap('true')}
            >
              ✅ TRUE Path
            </div>
            <div
              className={`connector-drag-item ${selectedPath ? 'disabled' : ''} ${tappedConnector === 'false' ? 'tapped' : ''}`}
              draggable={!selectedPath}
              onDragStart={(e) => handleDragStart(e, 'false')}
              onClick={() => handleConnectorTap('false')}
            >
              ❌ FALSE Path
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage4FlowchartFixer;
