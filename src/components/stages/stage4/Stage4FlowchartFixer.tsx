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
import {
  getFlowchartChallenges,
  type FlowchartChallenge,
} from "../../../i18n/gameplayContent";
import { getTranslation } from "../../../i18n/translations";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

interface Stage4FlowchartFixerProps {
  planetId: number;
}

function shuffleChallenges<T>(arr: T[]): T[] {
  const shuffled = [...arr];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

const CHALLENGE_COUNT = 3;
const STAGE_TIME_LIMIT = 60;

const Stage4FlowchartFixer: React.FC<Stage4FlowchartFixerProps> = ({
  planetId,
}) => {
  const navigate = useNavigate();
  const { playSfx } = useGameAudio();
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);

  const [challenges, setChallenges] = useState<FlowchartChallenge[]>(() =>
    shuffleChallenges(getFlowchartChallenges(language)).slice(0, CHALLENGE_COUNT)
  );

  useEffect(() => {
    setChallenges(shuffleChallenges(getFlowchartChallenges(language)).slice(0, CHALLENGE_COUNT));
  }, [language]);

  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [selectedPath, setSelectedPath] = useState<"true" | "false" | null>(
    null
  );
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "success" | "failure" | null
  >(null);
  const [score, setScore] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [tappedConnector, setTappedConnector] = useState<
    "true" | "false" | null
  >(null);

  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengeStartTimeRef = useRef(0);
  const stageStartRef = useRef(0);
  const completedRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
  const [timerKey, setTimerKey] = useState(0);

  const [robotReaction, setRobotReaction] =
    useState<RobotReaction>("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [screenEffect, setScreenEffect] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentChallenge = challenges[currentChallengeIdx];
  const isCorrect = selectedPath === currentChallenge.correctPath;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearReturnTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const calculateSpeedScore = (): number => {
    const answerTime =
      (getStageTimestamp() - challengeStartTimeRef.current) / 1000;

    return Math.min(
      300,
      Math.max(20, Math.round(100 * (3 / Math.max(answerTime, 0.5))))
    );
  };

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;

    completedRef.current = true;
    clearTimer();

    markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);

    const elapsed = getElapsedStageSeconds(stageStartRef.current);

    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 4, score, elapsed);

    setShowCompletion(true);
    setRobotReaction("celebrating");
    setScreenEffect("screen-flash-green");

    window.setTimeout(() => {
      setScreenEffect("");
    }, 500);

    playSfx("missionComplete");

    timeoutRef.current = window.setTimeout(() => {
      navigate("/mainhub");
    }, 4000);
  }, [
    addPlanetScore,
    clearTimer,
    markPlanetVisited,
    navigate,
    planetId,
    playSfx,
    score,
  ]);

  useEffect(() => {
    const startedAt = getStageTimestamp();
    challengeStartTimeRef.current = startedAt;
    stageStartRef.current = startedAt;
  }, []);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }

        if (prev <= 11) playSfx("timerLowTime");

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [clearTimer, playSfx, timerKey]);

  useEffect(() => {
    if (timeLeft === 0 && !completedRef.current) {
      const completionTimer = window.setTimeout(handleComplete, 0);
      return () => window.clearTimeout(completionTimer);
    }
  }, [handleComplete, timeLeft]);

  const handleRobotClick = () => {
    const messages = getRobotMessages(language);
    setSpeechMessage(getRandomMessage(messages.idle));
    setRobotReaction("waving");

    window.setTimeout(() => {
      setRobotReaction("idle");
    }, 2000);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    path: "true" | "false"
  ) => {
    if (selectedPath) return;

    playSfx("nodeDragStart");
    e.dataTransfer.setData("text/plain", path);
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

    const path = e.dataTransfer.getData("text/plain") as "true" | "false";
    applyAnswer(path);
  };

  const handleConnectorTap = (path: "true" | "false") => {
    if (selectedPath) return;

    playSfx(tappedConnector === path ? "nodeDrop" : "nodeDragStart");
    setTappedConnector(tappedConnector === path ? null : path);
  };

  const handleDropZoneTap = () => {
    if (selectedPath || !tappedConnector) return;

    applyAnswer(tappedConnector);
    setTappedConnector(null);
  };

  const applyAnswer = (path: "true" | "false") => {
    playSfx("circuitConnect");

    setSelectedPath(path);
    setShowExplanation(true);

    const messages = getRobotMessages(language);
    if (path === currentChallenge.correctPath) {
      const reaction = playSfx("feedbackCorrect");
      const speedScore = calculateSpeedScore();

      setScore((prev) => prev + speedScore);
      setRobotReaction("correct");
      setSpeechMessage(getRandomMessage(messages.correct));
      setScreenEffect("screen-flash-green");
      setFeedbackStatus("success");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    } else {
      const reaction = playSfx("feedbackIncorrect");
      setRobotReaction("incorrect");
      setSpeechMessage(getRandomMessage(messages.incorrect));
      setScreenEffect("screen-shake");
      setFeedbackStatus("failure");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    }
  };

  const handleNext = () => {
    if (currentChallengeIdx < challenges.length - 1) {
      setCurrentChallengeIdx((prev) => prev + 1);
      setSelectedPath(null);
      setShowExplanation(false);
      setFeedbackStatus(null);
      challengeStartTimeRef.current = getStageTimestamp();
    } else {
      handleComplete();
    }
  };

  const handleRetryChallenge = () => {
    setSelectedPath(null);
    setShowExplanation(false);
    setFeedbackStatus(null);
    setRobotReaction("idle");
    challengeStartTimeRef.current = getStageTimestamp();
  };

  const handleReplay = () => {
    clearReturnTimeout();
    clearTimer();

    setShowCompletion(false);
    setCurrentChallengeIdx(0);
    setSelectedPath(null);
    setShowExplanation(false);
    setFeedbackStatus(null);
    setScore(0);
    setTappedConnector(null);
    setRobotReaction("idle");
    setTimeLeft(STAGE_TIME_LIMIT);

    challengeStartTimeRef.current = getStageTimestamp();
    stageStartRef.current = getStageTimestamp();
    completedRef.current = false;

    setTimerKey((prev) => prev + 1);
  };

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

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <div className="completion-badge">
            {score >= 200 ? t.stages.stage4.perfectScore : t.stages.stage4.stageComplete}
          </div>
          <h1>{t.stages.stage4.passedTitle}</h1>

          <div className="score-info">
            <p>
              {language === "en" ? "Correct Flowcharts:" : "Flowchart Benar:"} {Math.floor(score / 100)}/
              {challenges.length}
            </p>
            <p>{language === "en" ? "Score:" : "Skor:"} {score} {language === "en" ? "points" : "poin"}</p>
          </div>

          <p className="returning-message">{t.stages.stage4.returningHub}</p>

          <div className="completion-buttons">
            <button className="replay-btn" onClick={handleReplay}>
              {language === "en" ? "Replay Stage" : "Main Ulang"}
            </button>

            <button
              className="return-btn"
              onClick={() => {
                clearReturnTimeout();
                navigate("/mainhub");
              }}
            >
              {language === "en" ? "Return to Hub" : "Kembali ke Hub"}
            </button>
          </div>

          <div className="robot-celebration">
            <AdaptiveCanvas
              camera={{ position: [0, 1, 5], fov: 50 }}
              dpr={[1, 1.1]}
              quality="low"
            >
              <ambientLight intensity={0.8} />
              <pointLight
                position={[5, 5, 5]}
                intensity={100}
                color="#00ffff"
              />
              <InteractiveRobot
                reaction="celebrating"
                scale={4}
                position={[0, -1.5, 0]}
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
      </div>
    );
  }

  return (
    <div className={`stage-flowchart blueprint-theme ${screenEffect}`}>
      <div className="canvas-container">
        <AdaptiveCanvas
          camera={{ position: [0, 1, 5], fov: 50 }}
          dpr={[1, 1.1]}
          quality="low"
        >
          <ambientLight intensity={0.6} />
          <pointLight
            position={[5, 5, 5]}
            intensity={100}
            color="#00ffff"
          />
          <InteractiveRobot
            reaction={robotReaction}
            scale={5}
            position={[0, -1.5, 0]}
            onClick={handleRobotClick}
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

      <div className="flowchart-content hud-content-layer">
        <div className="flowchart-workspace">
          <div className="flowchart-main">
            <div
              className="flowchart-card blueprint-card hud-3d-card"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition:
                  tilt.x === 0 && tilt.y === 0
                    ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                    : "transform 0.1s linear",
              }}
            >
              <div className="card-scanline" />

              <div className="flowchart-header">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h1 style={{ margin: 0 }}>
                    {language === "en" ? "Challenge" : "Tantangan"} {currentChallengeIdx + 1}/{challenges.length}
                  </h1>

                  <div
                    style={{
                      background:
                        timeLeft <= 10
                          ? "rgba(255,50,50,0.9)"
                          : "rgba(0,200,255,0.2)",
                      border:
                        timeLeft <= 10
                          ? "2px solid #ff3232"
                          : "2px solid rgba(0,200,255,0.5)",
                      borderRadius: "12px",
                      padding: "6px 14px",
                      color: timeLeft <= 10 ? "#fff" : "#00c8ff",
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: "1rem",
                      fontWeight: 700,
                      animation: timeLeft <= 10 ? "pulse 1s infinite" : "none",
                    }}
                  >
                    T {timeLeft}s
                  </div>
                </div>

                <p className="flowchart-description">
                  {currentChallenge.description}
                </p>
              </div>

              <div className="flowchart-diagram">
                <div className="flowchart-block start-block">
                  <div className="block-label">START</div>
                  <div className="block-value">
                    {currentChallenge.startBlock}
                  </div>
                </div>

                <div className="flow-arrow">↓</div>

                <div className="decision-diamond-wrapper">
                  <div className="decision-diamond">
                    <div className="diamond-inner-text">
                      {currentChallenge.decisionBlock}
                    </div>
                  </div>
                </div>

                <div className="flow-arrow">↓</div>

                <div
                  className={`connector-drop-zone ${
                    isDraggingOver ? "over" : ""
                  } ${tappedConnector && !selectedPath ? "tap-ready" : ""} ${
                    selectedPath ? (isCorrect ? "correct" : "incorrect") : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                  onClick={handleDropZoneTap}
                >
                  {selectedPath
                    ? `${language === "en" ? "PATH" : "JALUR"}: ${selectedPath.toUpperCase()}`
                    : tappedConnector
                      ? language === "en"
                        ? `Tap to place ${tappedConnector.toUpperCase()} Path`
                        : `Ketuk untuk menaruh Jalur ${tappedConnector.toUpperCase()}`
                      : language === "en"
                        ? "Drag or Tap Connector Here"
                        : "Tarik atau Ketuk Konektor Di Sini"}
                </div>

                <div className="flow-arrow">↓</div>

                <div className="flowchart-block end-block">
                  <div className="block-label">END</div>
                  <div className="block-value">
                    {currentChallenge.endBlock}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="connector-palette">
            <h3>{language === "en" ? "Connectors" : "Konektor"}</h3>
            <p className="palette-hint">
              {language === "en" ? "Drag or tap a connector, then place it" : "Tarik atau ketuk konektor, lalu pasang"}
            </p>

            <div
              className={`connector-drag-item ${
                selectedPath ? "disabled" : ""
              } ${tappedConnector === "true" ? "tapped" : ""}`}
              draggable={!selectedPath}
              onDragStart={(e) => handleDragStart(e, "true")}
              onClick={() => handleConnectorTap("true")}
            >
              {language === "en" ? "[T] TRUE Path" : "[T] Jalur TRUE (Benar)"}
            </div>

            <div
              className={`connector-drag-item ${
                selectedPath ? "disabled" : ""
              } ${tappedConnector === "false" ? "tapped" : ""}`}
              draggable={!selectedPath}
              onDragStart={(e) => handleDragStart(e, "false")}
              onClick={() => handleConnectorTap("false")}
            >
              {language === "en" ? "[F] FALSE Path" : "[F] Jalur FALSE (Salah)"}
            </div>

            <div
              className="intro-progress flowchart-progress-inline"
              style={{
                marginTop: "auto",
                paddingTop: "16px",
                width: "100%",
              }}
            >
              <div className="progress-bar hud-progress-bar">
                <div
                  className="progress-fill hud-progress-fill"
                  style={{
                    width: `${
                      ((currentChallengeIdx + 1) / challenges.length) * 100
                    }%`,
                  }}
                />
              </div>

              <span className="progress-text">
                {currentChallengeIdx + 1} / {challenges.length}
              </span>
            </div>
          </div>
        </div>

        {showExplanation && feedbackStatus && (
          <div className={`feedback-modal ${feedbackStatus}`}>
            <h3>{feedbackStatus === "success" ? (language === "en" ? "CORRECT!" : "BENAR!") : (language === "en" ? "TRY AGAIN" : "COBA LAGI")}</h3>
            <p>{currentChallenge.explanation}</p>

            <div className="hud-sweep-btn-wrapper" style={{ marginTop: 10 }}>
              {feedbackStatus === "success" ? (
                <button className="next-btn hud-sweep-btn" onClick={handleNext}>
                  {currentChallengeIdx === challenges.length - 1
                    ? (language === "en" ? "FINISH STAGE" : "SELESAIKAN STAGE")
                    : (language === "en" ? "NEXT CHALLENGE" : "TANTANGAN BERIKUTNYA")}
                </button>
              ) : (
                <button
                  className="retry-btn hud-sweep-btn"
                  onClick={handleRetryChallenge}
                >
                  {language === "en" ? "TRY AGAIN" : "COBA LAGI"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stage4FlowchartFixer;
