import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import './StageStyle.css';

interface Stage1IntroductionProps {
  planetId: number;
}

const Stage1Introduction: React.FC<Stage1IntroductionProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showContinue, setShowContinue] = useState(false);
  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);
  const playerData = useGameStore((state) => state.playerData);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const timeoutRef = useRef<any>(null);
  const stageStartRef = useRef(Date.now());
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Interactive companion state
  const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
  const [speechMessage, setSpeechMessage] = useState('');
  const [screenEffect, setScreenEffect] = useState('');

  const introSteps = [
    {
      title: 'Welcome to Software Engineering',
      content:
        'Software Engineering is the discipline of designing, building, and maintaining software systems. It combines computer science, engineering principles, and project management.',
      speaker: 'AI Computer',
    },
    {
      title: 'The Software Development Lifecycle (SDLC)',
      content:
        'The SDLC is a process used for planning, creating, testing, and deploying information systems. It includes phases like Planning, Analysis, Design, Implementation, Testing, and Maintenance.',
      speaker: 'AI Computer',
    },
    {
      title: 'Core Principles',
      content:
        'Key principles include: Modularity (breaking systems into manageable parts), Abstraction (hiding complexity), Reusability (using existing components), and Documentation (recording decisions).',
      speaker: 'AI Computer',
    },
    {
      title: 'Your Journey',
      content:
        `Excellent, ${playerData.name}! You've learned the fundamentals. In the next stages, you'll tackle reasoning problems, logic puzzles, and flowchart scenarios. Are you ready to continue?`,
      speaker: 'AI Computer',
    },
  ];

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setShowContinue(false);
    setRobotReaction('thinking');
    let i = 0;
    const text = introSteps[currentStep].content;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        setRobotReaction('idle');
        clearInterval(interval);
        setTimeout(() => setShowContinue(true), 500);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [currentStep]);

  const handleContinue = () => {
    // Robot waves on each continue
    setRobotReaction('waving');
    setTimeout(() => setRobotReaction('idle'), 1500);

    if (currentStep < introSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowContinue(false);
    } else {
      // Mark planet as visited and add score (always 500 for completing intro)
      markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
      const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
      addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 1, 500, elapsed);
      showCompletionScreen();
    }
  };

  const [showCompletion, setShowCompletion] = useState(false);

  const handleRobotClick = () => {
    const msg = getRandomMessage(robotMessages.idle);
    setSpeechMessage(msg);
    setRobotReaction('waving');
    setTimeout(() => setRobotReaction('idle'), 2000);
  };

  const showCompletionScreen = () => {
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
    setShowCompletion(false);
    setCurrentStep(0);
    setShowContinue(false);
    setRobotReaction('idle');
    stageStartRef.current = Date.now();
  };

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <h1>STAGE 1 COMPLETE!</h1>
          <div className="score-info">
            <p>Score: +500 points</p>
            <p>Status: Mission Success</p>
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

  const currentIntro = introSteps[currentStep];

  return (
    <div className={`stage-introduction ${screenEffect}`}>
      <div className="intro-canvas-container">
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

        {/* Speech Bubble Overlay */}
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

      <div className="stage-content">
        <div className="intro-card">
          <div className="step-indicators">
            {introSteps.map((_, idx) => (
              <div key={idx} className={`step-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`} />
            ))}
          </div>

          <div className="intro-header">
            <h1>{currentIntro.title}</h1>
            <div className="speaker-badge">🤖 {currentIntro.speaker}</div>
          </div>

          <div className="intro-body">
            <p>{displayedText}<span className="typewriter-cursor" style={{ opacity: isTyping ? 1 : 0 }}>|</span></p>
          </div>

          <div className="intro-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentStep + 1) / introSteps.length) * 100}%`,
                }}
              ></div>
            </div>
            <span className="progress-text">
              {currentStep + 1} / {introSteps.length}
            </span>
          </div>

          {showContinue && (
            <button className="continue-btn" onClick={handleContinue}>
              {currentStep === introSteps.length - 1 ? 'COMPLETE' : 'CONTINUE'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stage1Introduction;
