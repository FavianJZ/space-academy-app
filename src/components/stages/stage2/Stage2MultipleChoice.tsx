import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stars } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

import AdaptiveCanvas from "../../common/AdaptiveCanvas";
import { useGameAudio } from "../../../hooks/useGameAudio";
import { useGameStore } from "../../../stores/useGameStore";

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
import {
  getElapsedStageSeconds,
  getStageTimestamp,
} from "../shared/stageTiming";
import { getQuizQuestions, type Question } from "../../../i18n/gameplayContent";
import { getTranslation } from "../../../i18n/translations";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

interface Stage2MultipleChoiceProps {
    planetId: number;
}

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

        const correctOption = q.options.find(o => o.label === q.correctAnswer);
        const shuffledOptions = shuffleArray(q.options);

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

const QUIZ_QUESTION_COUNT = 3;

const Stage2MultipleChoice: React.FC<Stage2MultipleChoiceProps> = ({ planetId }) => {
    const navigate = useNavigate();
    const { playSfx } = useGameAudio();
    const language = useGameStore((state) => state.language);
    const t = getTranslation(language);
    const [quizQuestions, setQuizQuestions] = useState<Question[]>(() =>
        randomizeQuestions(getQuizQuestions(language)).slice(0, QUIZ_QUESTION_COUNT)
    );

    useEffect(() => {
        setQuizQuestions(randomizeQuestions(getQuizQuestions(language)).slice(0, QUIZ_QUESTION_COUNT));
    }, [language]);

    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map());
    const [showExplanation, setShowExplanation] = useState(false);
    const [feedbackStatus, setFeedbackStatus] = useState<'success' | 'failure' | null>(null);
    const [score, setScore] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);
    const addPlanetScore = useGameStore((state) => state.addPlanetScore);
    const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

    const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
    const questionStartTimeRef = useRef(0);
    const stageStartRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const completedRef = useRef(false);

    const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
    const [speechMessage, setSpeechMessage] = useState('');
    const [screenEffect, setScreenEffect] = useState('');

    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const startedAt = getStageTimestamp();
        questionStartTimeRef.current = startedAt;
        stageStartRef.current = startedAt;
    }, []);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    return 0;
                }
                if (prev <= 11) playSfx("timerLowTime");
                return prev - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [playSfx]);

    const currentQuestion = quizQuestions[currentQuestionIdx];
    const userAnswer = selectedAnswers.get(currentQuestion.id);
    const isCorrect = userAnswer === currentQuestion.correctAnswer;

    const calculateSpeedScore = (): number => {
        const answerTime = (getStageTimestamp() - questionStartTimeRef.current) / 1000;
        const speedScore = Math.max(20, Math.round(100 * (3 / Math.max(answerTime, 0.5))));
        return Math.min(speedScore, 300);
    };

    const handleAnswerSelect = (label: string) => {
        if (!userAnswer && !showExplanation) {
            const newAnswers = new Map(selectedAnswers);
            newAnswers.set(currentQuestion.id, label);
            setSelectedAnswers(newAnswers);
            setShowExplanation(true);

            if (label === currentQuestion.correctAnswer) {
                const reaction = playSfx("feedbackCorrect");
                const speedScore = calculateSpeedScore();
                setScore(prev => prev + speedScore);
                setRobotReaction('correct');
                setSpeechMessage(getRandomMessage(getRobotMessages(language).correct));
                setScreenEffect('screen-flash-green');
                setFeedbackStatus('success');
                setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, reaction.motionMs);

                if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = setTimeout(() => {
                    handleNext();
                }, 1000);
            } else {
                const reaction = playSfx("feedbackIncorrect");
                setRobotReaction('incorrect');
                setSpeechMessage(getRandomMessage(getRobotMessages(language).incorrect));
                setScreenEffect('screen-shake');
                setFeedbackStatus('failure');
                setTimeout(() => { setScreenEffect(''); setRobotReaction('idle'); }, reaction.motionMs);
            }
        }
    };

    const handleRobotClick = () => {
        setSpeechMessage(getRandomMessage(getRobotMessages(language).idle));
        setRobotReaction('waving');
        setTimeout(() => setRobotReaction('idle'), 2000);
    };

    const handleNext = () => {
        if (autoAdvanceTimerRef.current) {
            clearTimeout(autoAdvanceTimerRef.current);
            autoAdvanceTimerRef.current = null;
        }
        setShowExplanation(false);
        setFeedbackStatus(null);
        if (currentQuestionIdx < quizQuestions.length - 1) {
            setCurrentQuestionIdx(currentQuestionIdx + 1);
            questionStartTimeRef.current = getStageTimestamp();
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
        questionStartTimeRef.current = getStageTimestamp();
    };

    const handleComplete = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        if (timerRef.current) {
        clearInterval(timerRef.current);
        }
        markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
        const elapsed = getElapsedStageSeconds(stageStartRef.current);
        addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 2, score, elapsed);
        setShowCompletion(true);
        setRobotReaction('celebrating');
        setScreenEffect('screen-flash-green');
        playSfx("missionComplete");
        setTimeout(() => setScreenEffect(''), 500);
        setTimeout(() => {
            navigate('/mainhub');
        }, 4000);
    }, [addPlanetScore, markPlanetVisited, navigate, planetId, playSfx, score]);

useEffect(() => {
        if (timeLeft === 0 && !completedRef.current) {
            handleComplete();
        }
    }, [handleComplete, timeLeft]);

    if (showCompletion) {
        const correctCount = Array.from(selectedAnswers.entries()).filter(([id]) => {
            const q = quizQuestions.find(question => question.id === id);
            return selectedAnswers.get(id) === q?.correctAnswer;
        }).length;
        return (
            <div className="stage-completion">
                <div className="completion-card">
                    <div className="completion-badge">
                        {correctCount === quizQuestions.length ? t.stages.stage2.perfectScore : t.stages.stage2.stageComplete}
                    </div>
                    <h1>{t.stages.stage2.passedTitle}</h1>
                    <div style={{ display: "flex", gap: "20px", justifyContent: "center", margin: "16px 0" }}>
                        <div className="completion-stat-chip">
                            <span className="stat-label">{t.stages.stage2.correct}</span>
                            <span className="stat-value">{correctCount}/{quizQuestions.length}</span>
                        </div>
                        <div className="completion-stat-chip">
                            <span className="stat-label">{t.stages.stage2.score}</span>
                            <span className="stat-value">{score}</span>
                        </div>
                    </div>
                    <p className="returning-message">{t.stages.stage2.returningHub}</p>
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
                            <span className="timer-icon">T</span>
                            <span className="timer-value">{timeLeft}s</span>
                        </div>
                        <div className="quiz-score-badge">
                            <span className="score-icon">PTS</span>
                            <span className="score-value">{score}</span>
                        </div>
                    </div>

                    <div className="step-indicators">
                        {quizQuestions.map((_, idx) => (
                            <div key={idx} className={`step-dot ${idx === currentQuestionIdx ? 'active' : ''} ${idx < currentQuestionIdx ? 'completed' : ''}`} />
                        ))}
                    </div>

                    <div className="quiz-header">
                        <h1>{t.stages.stage2.questionLabel} {currentQuestionIdx + 1}/{quizQuestions.length}</h1>
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
                        <h3>{feedbackStatus === 'success' ? t.stages.stage2.correctFeedback : t.stages.stage2.tryAgainFeedback}</h3>
                        <p>{currentQuestion.explanation}</p>
                        <div className="hud-sweep-btn-wrapper" style={{ marginTop: '10px' }}>
                          {feedbackStatus === 'success' ? (
                              <button className="next-btn hud-sweep-btn" onClick={handleNext}>
                                  {currentQuestionIdx === quizQuestions.length - 1 ? t.stages.stage2.finishQuiz : t.stages.stage2.nextQuestion}
                              </button>
                          ) : (
                              <button className="retry-btn hud-sweep-btn" onClick={handleRetryQuestion}>{t.stages.stage2.tryAgainFeedback}</button>
                          )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stage2MultipleChoice;
