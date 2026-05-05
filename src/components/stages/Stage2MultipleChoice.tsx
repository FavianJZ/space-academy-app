import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';
import { Stars } from '@react-three/drei';
import AdaptiveCanvas from '../AdaptiveCanvas';
import { InteractiveRobot, type RobotReaction } from './InteractiveRobot';
import { FloatingParticles } from './FloatingParticles';
import { SpeechBubble, robotMessages, getRandomMessage } from './SpeechBubble';
import './StageStyle.css';

interface Stage2MultipleChoiceProps {
  planetId: number;
}

interface Question {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

const quizQuestions: Question[] = [
  {
    id: 1,
    question: 'What does API stand for?',
    options: [
      { label: 'a', text: 'Application Programming Interface' },
      { label: 'b', text: 'Application Process Integration' },
      { label: 'c', text: 'Advanced Programming Information' },
      { label: 'd', text: 'Algorithm Processing Interface' },
    ],
    correctAnswer: 'a',
    explanation: 'API stands for Application Programming Interface. It is a set of tools and protocols for building software applications.',
  },
  {
    id: 2,
    question: 'Which of the following is NOT a programming paradigm?',
    options: [
      { label: 'a', text: 'Object-Oriented' },
      { label: 'b', text: 'Functional' },
      { label: 'c', text: 'Declarative' },
      { label: 'd', text: 'Horizontal' },
    ],
    correctAnswer: 'd',
    explanation: '"Horizontal" is not a programming paradigm. The main paradigms include Object-Oriented, Functional, Imperative, and Declarative.',
  },
  {
    id: 3,
    question: 'What is the main purpose of version control systems like Git?',
    options: [
      { label: 'a', text: 'To compile code' },
      { label: 'b', text: 'To track changes and manage code history' },
      { label: 'c', text: 'To execute programs' },
      { label: 'd', text: 'To design user interfaces' },
    ],
    correctAnswer: 'b',
    explanation: 'Version control systems track changes in code, allow collaboration, and maintain a complete history of the project.',
  },
  {
    id: 4,
    question: 'Which principle states that a module should have only one reason to change?',
    options: [
      { label: 'a', text: 'Open/Closed Principle' },
      { label: 'b', text: 'Single Responsibility Principle' },
      { label: 'c', text: 'Dependency Inversion Principle' },
      { label: 'd', text: 'Interface Segregation Principle' },
    ],
    correctAnswer: 'b',
    explanation: 'The Single Responsibility Principle (SRP) states that a module should have only one reason to change, promoting code organization.',
  },
  {
    id: 5,
    question: 'What is refactoring in software development?',
    options: [
      { label: 'a', text: 'Fixing bugs in production' },
      { label: 'b', text: 'Improving code structure without changing functionality' },
      { label: 'c', text: 'Adding new features to the application' },
      { label: 'd', text: 'Testing the entire codebase' },
    ],
    correctAnswer: 'b',
    explanation: 'Refactoring is the process of restructuring code to improve its quality and maintainability without altering its functionality.',
  },
];

const STAGE_TIME_LIMIT = 60; // 60 seconds total

const Stage2MultipleChoice: React.FC<Stage2MultipleChoiceProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'success' | 'failure' | null>(null);
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
  const questionStartTimeRef = useRef(Date.now());
  const stageStartRef = useRef(Date.now());
  const timerRef = useRef<any>(null);
  const completedRef = useRef(false);

  // Interactive companion state
  const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
  const [speechMessage, setSpeechMessage] = useState('');
  const [screenEffect, setScreenEffect] = useState('');

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
  }, []);

  // Auto-complete when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !completedRef.current) {
      completedRef.current = true;
      handleComplete();
    }
  }, [timeLeft]);

  const currentQuestion = quizQuestions[currentQuestionIdx];
  const userAnswer = selectedAnswers.get(currentQuestion.id);
  const isCorrect = userAnswer === currentQuestion.correctAnswer;

  // Speed-based scoring: 3 seconds = 100 pts (baseline), faster = more, slower = less, min 20
  const calculateSpeedScore = (): number => {
    const answerTime = (Date.now() - questionStartTimeRef.current) / 1000;
    const speedScore = Math.max(20, Math.round(100 * (3 / Math.max(answerTime, 0.5))));
    return Math.min(speedScore, 300); // cap at 300
  };

  const handleAnswerSelect = (label: string) => {
    if (!userAnswer && !showExplanation) {
      const newAnswers = new Map(selectedAnswers);
      newAnswers.set(currentQuestion.id, label);
      setSelectedAnswers(newAnswers);
      setShowExplanation(true);

      // Calculate score and trigger robot reaction
      if (label === currentQuestion.correctAnswer) {
        const speedScore = calculateSpeedScore();
        setScore(prev => prev + speedScore);
        setRobotReaction('correct');
        setSpeechMessage(getRandomMessage(robotMessages.correct));
        setScreenEffect('screen-flash-green');
        setFeedbackStatus('success');
        setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
      } else {
        setRobotReaction('incorrect');
        setSpeechMessage(getRandomMessage(robotMessages.incorrect));
        setScreenEffect('screen-shake');
        setFeedbackStatus('failure');
        setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, 2000);
      }
    }
  };

  const handleRobotClick = () => {
    setSpeechMessage(getRandomMessage(robotMessages.idle));
    setRobotReaction('waving');
    setTimeout(() => setRobotReaction('idle'), 2000);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setFeedbackStatus(null);
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      questionStartTimeRef.current = Date.now(); // Reset timer for next question
    } else {
      handleComplete();
    }
  };

  const handleRetryQuestion = () => {
    const newAnswers = new Map(selectedAnswers);
    newAnswers.delete(currentQuestion.id);
    setSelectedAnswers(newAnswers);
    setShowExplanation(false);
    setFeedbackStatus(null);
    setRobotReaction('idle');
    questionStartTimeRef.current = Date.now();
  };

  const handleComplete = () => {
    if (completedRef.current && showCompletion) return; // Prevent double-complete
    completedRef.current = true;
    clearInterval(timerRef.current);
    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
    const elapsed = Math.round((Date.now() - stageStartRef.current) / 1000);
    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 2, score, elapsed);
    setShowCompletion(true);
    setRobotReaction('celebrating');
    setScreenEffect('screen-flash-green');
    setTimeout(() => setScreenEffect(''), 500);
    setTimeout(() => {
      navigate('/mainhub');
    }, 4000);
  };

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <h1>STAGE 2 COMPLETE!</h1>
          <div className="score-info">
            <p>Correct Answers: {Array.from(selectedAnswers.entries()).filter(([id]) => {
              const q = quizQuestions.find(question => question.id === id);
              return selectedAnswers.get(id) === q?.correctAnswer;
            }).length}/5</p>
            <p>Score: {score} points</p>
          </div>
          <p className="returning-message">Returning to main hub...</p>
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
    <div className={`stage-multiple-choice ${screenEffect}`}>
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

      <div className="quiz-content">
        <div className="quiz-card">
          <div className="quiz-top-bar">
            <div className={`quiz-timer-badge ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : ''}`}>
              <span className="timer-icon">⏱</span>
              <span className="timer-value">{timeLeft}s</span>
            </div>
            <div className="quiz-score-badge">
              <span className="score-icon">⭐</span>
              <span className="score-value">{score}</span>
            </div>
          </div>

          <div className="step-indicators">
            {quizQuestions.map((_, idx) => (
              <div key={idx} className={`step-dot ${idx === currentQuestionIdx ? 'active' : ''} ${idx < currentQuestionIdx ? 'completed' : ''}`} />
            ))}
          </div>

          <div className="quiz-header">
            <h1>Question {currentQuestionIdx + 1}/{quizQuestions.length}</h1>
          </div>

          <div className="quiz-body">
            <p>{currentQuestion.question}</p>
          </div>

          <div className="quiz-options">
            {currentQuestion.options.map((option) => (
              <button
                key={option.label}
                className={`quiz-option ${userAnswer === option.label ? 'selected' : ''} ${
                  showExplanation && option.label === currentQuestion.correctAnswer ? 'correct' : ''
                } ${showExplanation && userAnswer === option.label && !isCorrect ? 'incorrect' : ''}`}
                onClick={() => handleAnswerSelect(option.label)}
                disabled={userAnswer !== undefined}
              >
                <span className="option-letter">{option.label.toUpperCase()}</span>
                <span className="option-text">{option.text}</span>
              </button>
            ))}
          </div>

        </div>

        <div className="quiz-footer">
          <div className="intro-progress quiz-progress-inline">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%`,
                }}
              ></div>
            </div>
            <span className="progress-text">
              {currentQuestionIdx + 1} / {quizQuestions.length}
            </span>
          </div>
        </div>

        {showExplanation && feedbackStatus && (
          <div className={`feedback-modal ${feedbackStatus}`}>
            <h3>{feedbackStatus === 'success' ? 'CORRECT!' : 'TRY AGAIN'}</h3>
            <p>{currentQuestion.explanation}</p>
            {feedbackStatus === 'success' ? (
              <button className="next-btn" onClick={handleNext}>
                {currentQuestionIdx === quizQuestions.length - 1 ? 'FINISH QUIZ' : 'NEXT QUESTION'}
              </button>
            ) : (
              <button className="retry-btn" onClick={handleRetryQuestion}>TRY AGAIN</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stage2MultipleChoice;
