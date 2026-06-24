import React, { useEffect, useRef, useState } from "react";
import { Stars } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

import AdaptiveCanvas from "../../common/AdaptiveCanvas";
import { useGameStore } from "../../../stores/useGameStore";

import {
  InteractiveRobot,
  type RobotReaction,
} from "../shared/InteractiveRobot";
import { FloatingParticles } from "../shared/FloatingParticles";
import {
  SpeechBubble,
  robotMessages,
  getRandomMessage,
} from "../shared/SpeechBubble";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

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

const quizQuestionPool: Question[] = [
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
    {
        id: 6,
        question: 'What does HTML stand for?',
        options: [
            { label: 'a', text: 'Hyper Text Markup Language' },
            { label: 'b', text: 'High Tech Modern Language' },
            { label: 'c', text: 'Hyper Transfer Markup Language' },
            { label: 'd', text: 'Home Tool Markup Language' },
        ],
        correctAnswer: 'a',
        explanation: 'HTML stands for Hyper Text Markup Language. It is the standard markup language for creating web pages.',
    },
    {
        id: 7,
        question: 'Which data structure uses FIFO (First In, First Out)?',
        options: [
            { label: 'a', text: 'Stack' },
            { label: 'b', text: 'Queue' },
            { label: 'c', text: 'Tree' },
            { label: 'd', text: 'Graph' },
        ],
        correctAnswer: 'b',
        explanation: 'A Queue uses FIFO ordering — the first element added is the first one removed. Stacks use LIFO (Last In, First Out).',
    },
    {
        id: 8,
        question: 'What is the time complexity of binary search?',
        options: [
            { label: 'a', text: 'O(n)' },
            { label: 'b', text: 'O(n²)' },
            { label: 'c', text: 'O(log n)' },
            { label: 'd', text: 'O(1)' },
        ],
        correctAnswer: 'c',
        explanation: 'Binary search has O(log n) time complexity because it halves the search space with each comparison.',
    },
    {
        id: 9,
        question: 'What does CSS stand for?',
        options: [
            { label: 'a', text: 'Computer Style Sheets' },
            { label: 'b', text: 'Creative Style System' },
            { label: 'c', text: 'Cascading Style Sheets' },
            { label: 'd', text: 'Colorful Style Sheets' },
        ],
        correctAnswer: 'c',
        explanation: 'CSS stands for Cascading Style Sheets. It describes how HTML elements should be displayed on screen.',
    },
    {
        id: 10,
        question: 'Which of these is NOT a valid JavaScript data type?',
        options: [
            { label: 'a', text: 'Boolean' },
            { label: 'b', text: 'Float' },
            { label: 'c', text: 'Symbol' },
            { label: 'd', text: 'BigInt' },
        ],
        correctAnswer: 'b',
        explanation: '"Float" is not a JavaScript data type. JavaScript uses "Number" for all numeric values. Valid types include Boolean, Symbol, BigInt, String, etc.',
    },
    {
        id: 11,
        question: 'What is an algorithm?',
        options: [
            { label: 'a', text: 'A programming language' },
            { label: 'b', text: 'A step-by-step procedure to solve a problem' },
            { label: 'c', text: 'A type of computer hardware' },
            { label: 'd', text: 'A database management system' },
        ],
        correctAnswer: 'b',
        explanation: 'An algorithm is a finite set of well-defined instructions used to solve a class of problems or perform a computation.',
    },
    {
        id: 12,
        question: 'Which sorting algorithm has the best average-case time complexity?',
        options: [
            { label: 'a', text: 'Bubble Sort — O(n²)' },
            { label: 'b', text: 'Selection Sort — O(n²)' },
            { label: 'c', text: 'Merge Sort — O(n log n)' },
            { label: 'd', text: 'Insertion Sort — O(n²)' },
        ],
        correctAnswer: 'c',
        explanation: 'Merge Sort has O(n log n) average-case complexity, which is better than the O(n²) of Bubble, Selection, and Insertion Sort.',
    },
];

/* ── Randomization utilities ── */
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function randomizeQuestions(questions: Question[]): Question[] {
    const labels = ['a', 'b', 'c', 'd'];
    const shuffled = shuffleArray(questions);
    return shuffled.map((q, idx) => {
        // Find the correct option text before shuffling
        const correctOption = q.options.find(o => o.label === q.correctAnswer);
        const shuffledOptions = shuffleArray(q.options);
        // Relabel options and find new correct answer label
        const newCorrectLabel = labels[shuffledOptions.findIndex(o => o.text === correctOption?.text)];
        return {
            ...q,
            id: idx + 1,
            options: shuffledOptions.map((o, i) => ({ ...o, label: labels[i] })),
            correctAnswer: newCorrectLabel,
        };
    });
}

const STAGE_TIME_LIMIT = 60; 

const QUIZ_QUESTION_COUNT = 5;

const Stage2MultipleChoice: React.FC<Stage2MultipleChoiceProps> = ({ planetId }) => {
    const navigate = useNavigate();
    const [quizQuestions] = useState<Question[]>(() =>
        randomizeQuestions(quizQuestionPool).slice(0, QUIZ_QUESTION_COUNT)
    );
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
    const [showExplanation, setShowExplanation] = useState(false);
    const [feedbackStatus, setFeedbackStatus] = useState<'success' | 'failure' | null>(null);
    const [score, setScore] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const addPlanetScore = useGameStore((state) => state.addPlanetScore);
    const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

    const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
    const questionStartTimeRef = useRef(Date.now());
    const stageStartRef = useRef(Date.now());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completedRef = useRef(false);

    const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
    const [speechMessage, setSpeechMessage] = useState('');
    const [screenEffect, setScreenEffect] = useState('');
    
    // 3D Tilt State
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // Countdown timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
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
            questionStartTimeRef.current = Date.now(); 
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
        if (completedRef.current && showCompletion) return; 
        completedRef.current = true;
        if (timerRef.current) {
        clearInterval(timerRef.current);
        }
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

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        setTilt({ x: y * 4, y: -x * 4 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

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

            <div className="quiz-content hud-content-layer">
                <div 
                  className="quiz-card hud-3d-card"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ 
                      transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                      transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'transform 0.1s linear',
                  }}
                >
                    <div className="card-scanline" />
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

                    <div className="quiz-body hud-terminal-body">
                        <p className="typewriter-text">{currentQuestion.question}</p>
                    </div>

                    <div className="quiz-options">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={option.label}
                                className={`quiz-option ${userAnswer === option.label ? 'selected' : ''} ${showExplanation && option.label === currentQuestion.correctAnswer ? 'correct' : ''
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
                        <div className="progress-bar hud-progress-bar">
                            <div
                                className="progress-fill hud-progress-fill"
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
                        <div className="hud-sweep-btn-wrapper" style={{ marginTop: '10px' }}>
                          {feedbackStatus === 'success' ? (
                              <button className="next-btn hud-sweep-btn" onClick={handleNext}>
                                  {currentQuestionIdx === quizQuestions.length - 1 ? 'FINISH QUIZ' : 'NEXT QUESTION'}
                              </button>
                          ) : (
                              <button className="retry-btn hud-sweep-btn" onClick={handleRetryQuestion}>TRY AGAIN</button>
                          )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stage2MultipleChoice;
