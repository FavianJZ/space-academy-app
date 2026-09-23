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
  getLogicLevels,
  type LogicLevel,
} from "../../../i18n/gameplayContent";
import { getTranslation } from "../../../i18n/translations";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

interface Stage5LogicFlowProps {
  planetId: number;
}

interface Wire {
  from: string;
  to: string;
}

interface RenderedWire {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

function shuffleLevels<T>(arr: T[]): T[] {
  const shuffled = [...arr];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

const LEVEL_COUNT = 3;
const STAGE_TIME_LIMIT = 60;

const Stage5LogicFlow: React.FC<Stage5LogicFlowProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const { playSfx } = useGameAudio();
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);

  const [levels, setLevels] = useState<LogicLevel[]>(() =>
    shuffleLevels(getLogicLevels(language)).slice(0, LEVEL_COUNT)
  );

  useEffect(() => {
    setLevels(shuffleLevels(getLogicLevels(language)).slice(0, LEVEL_COUNT));
  }, [language]);

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    portId: string;
    x: number;
    y: number;
  } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [status, setStatus] = useState<"playing" | "success" | "failure">(
    "playing"
  );
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [timeLeft, setTimeLeft] = useState(STAGE_TIME_LIMIT);
  const [timerKey, setTimerKey] = useState(0);
  const [renderedWires, setRenderedWires] = useState<RenderedWire[]>([]);

  const [robotReaction, setRobotReaction] = useState<RobotReaction>("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [screenEffect, setScreenEffect] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelStartTimeRef = useRef(0);
  const stageStartRef = useRef(0);
  const completedRef = useRef(false);

  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

  const currentLevel = levels[currentLevelIdx];

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

  const getPortPosition = useCallback((portId: string) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    const portEl = containerRef.current.querySelector(
      `[data-port="${portId}"]`
    );

    if (!portEl) return { x: 0, y: 0 };

    const rect = portEl.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  }, []);

  const calculateSpeedScore = (): number => {
    const answerTime =
      (getStageTimestamp() - levelStartTimeRef.current) / 1000;

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

    addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 5, score, elapsed);

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
    levelStartTimeRef.current = startedAt;
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

  const updateWires = useCallback(() => {
    if (!containerRef.current) return;
    const newRenderedWires = wires.map((wire) => {
      const start = getPortPosition(wire.from);
      const end = getPortPosition(wire.to);

      let color = "#00ffff";

      if (status === "success") color = "#00ff88";
      if (status === "failure") color = "#ff3333";

      return {
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        color,
      };
    });

    setRenderedWires(newRenderedWires);
  }, [wires, status, getPortPosition]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateWires);
    const timer = window.setTimeout(updateWires, 100);
    const timer2 = window.setTimeout(updateWires, 350);

    const onResize = () => {
      window.requestAnimationFrame(updateWires);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        window.requestAnimationFrame(updateWires);
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timer);
      window.clearTimeout(timer2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (ro) ro.disconnect();
    };
  }, [updateWires, currentLevelIdx]);

  const handleRobotClick = () => {
    const messages = getRobotMessages(language);
    setSpeechMessage(getRandomMessage(messages.idle));
    setRobotReaction("waving");

    window.setTimeout(() => {
      setRobotReaction("idle");
    }, 2000);
  };

  const checkWinCondition = useCallback((currentWires: Wire[]) => {
    const hasStartToDiamond = currentWires.some(
      (wire) => wire.from === "start-out" && wire.to === "diamond-in"
    );

    const hasDiamondToBulb = currentWires.find(
      (wire) => wire.to === "bulb-in"
    );

    if (!hasStartToDiamond || !hasDiamondToBulb) return;

    const messages = getRobotMessages(language);
    if (hasDiamondToBulb.from === `diamond-${currentLevel.correctPath}`) {
      setStatus("success");
      const reaction = playSfx("feedbackCorrect");

      const speedScore = calculateSpeedScore();

      setScore((prev) => prev + speedScore);
      setRobotReaction("correct");
      setSpeechMessage(getRandomMessage(messages.correct));
      setScreenEffect("screen-flash-green");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    } else {
      setStatus("failure");
      const reaction = playSfx("feedbackIncorrect");
      setRobotReaction("incorrect");
      setSpeechMessage(getRandomMessage(messages.incorrect));
      setScreenEffect("screen-shake");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    }
  }, [currentLevel, language, playSfx]);

  const tryConnectPorts = useCallback((portA: string, portB: string): boolean => {
    let fromPort = "";
    let toPort = "";

    if (
      (portA === "start-out" && portB === "diamond-in") ||
      (portB === "start-out" && portA === "diamond-in")
    ) {
      fromPort = "start-out";
      toPort = "diamond-in";
    }

    if (
      (portA === "diamond-true" || portA === "diamond-false") &&
      portB === "bulb-in"
    ) {
      fromPort = portA;
      toPort = "bulb-in";
    } else if (
      (portB === "diamond-true" || portB === "diamond-false") &&
      portA === "bulb-in"
    ) {
      fromPort = portB;
      toPort = "bulb-in";
    }

    if (fromPort && toPort) {
      const filtered = wires.filter(
        (w) => w.from !== fromPort && w.to !== toPort
      );
      const newWires = [...filtered, { from: fromPort, to: toPort }];
      playSfx("circuitConnect");
      setWires(newWires);
      setSelectedPort(null);
      checkWinCondition(newWires);
      return true;
    }

    return false;
  }, [wires, playSfx, checkWinCondition]);

  const handlePortTap = (portId: string) => {
    if (status !== "playing") return;

    if (!selectedPort) {
      setSelectedPort(portId);
      playSfx("nodeDragStart");
      return;
    }

    if (selectedPort === portId) {
      setSelectedPort(null);
      playSfx("uiSelect");
      return;
    }

    const connected = tryConnectPorts(selectedPort, portId);
    if (!connected) {
      setSelectedPort(portId);
      playSfx("nodeDragStart");
    }
  };

  const handleMouseDown = (
    _event: React.MouseEvent<HTMLDivElement>,
    portId: string
  ) => {
    if (status !== "playing") return;

    playSfx("nodeDragStart");
    setWires((prev) => prev.filter((wire) => wire.from !== portId && wire.to !== portId));

    const pos = getPortPosition(portId);

    setDragStart({
      portId,
      x: pos.x,
      y: pos.y,
    });

    setDragCurrent({
      x: pos.x,
      y: pos.y,
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStart || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    setDragCurrent({
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top,
    });
  };

  const completeConnection = (
    targetPort: string | null,
    clientX?: number,
    clientY?: number
  ) => {
    if (dragStart) {
      let resolvedTarget = targetPort;

      if (!resolvedTarget && clientX !== undefined && clientY !== undefined && containerRef.current) {
        const ports = ["start-out", "diamond-in", "diamond-true", "diamond-false", "bulb-in"];
        const containerRect = containerRef.current.getBoundingClientRect();
        const touchRelX = clientX - containerRect.left;
        const touchRelY = clientY - containerRect.top;

        let closestPort: string | null = null;
        let minDistance = 55;

        for (const p of ports) {
          if (p === dragStart.portId) continue;
          const pPos = getPortPosition(p);
          const dist = Math.hypot(pPos.x - touchRelX, pPos.y - touchRelY);
          if (dist < minDistance) {
            minDistance = dist;
            closestPort = p;
          }
        }
        resolvedTarget = closestPort;
      }

      if (resolvedTarget) {
        const connected = tryConnectPorts(dragStart.portId, resolvedTarget);
        if (!connected) {
          playSfx("nodeDrop");
        }
      } else {
        playSfx("nodeDrop");
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const targetPort = target.closest("[data-port]")?.getAttribute("data-port") ?? null;

    completeConnection(targetPort, event.clientX, event.clientY);
  };

  const handleTouchStart = (
    _event: React.TouchEvent<HTMLDivElement>,
    portId: string
  ) => {
    if (status !== "playing") return;
    if (!containerRef.current) return;

    playSfx("nodeDragStart");
    setWires((prev) => prev.filter((wire) => wire.from !== portId && wire.to !== portId));

    const pos = getPortPosition(portId);

    setDragStart({
      portId,
      x: pos.x,
      y: pos.y,
    });

    setDragCurrent({
      x: pos.x,
      y: pos.y,
    });
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStart || !containerRef.current) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();

    setDragCurrent({
      x: touch.clientX - containerRect.left,
      y: touch.clientY - containerRect.top,
    });
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStart || !containerRef.current) return;

    const touch = event.changedTouches[0];
    const element = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    ) as HTMLElement | null;

    const targetPort = element?.closest("[data-port]")?.getAttribute("data-port") ?? null;

    completeConnection(targetPort, touch.clientX, touch.clientY);
  };

  const handleNext = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
      setWires([]);
      setSelectedPort(null);
      setStatus("playing");
      levelStartTimeRef.current = getStageTimestamp();
    } else {
      handleComplete();
    }
  };

  const handleRetryLevel = () => {
    setWires([]);
    setSelectedPort(null);
    setStatus("playing");
    levelStartTimeRef.current = getStageTimestamp();
  };

  const handleReplay = () => {
    clearReturnTimeout();
    clearTimer();

    setShowCompletion(false);
    setCurrentLevelIdx(0);
    setWires([]);
    setSelectedPort(null);
    setScore(0);
    setStatus("playing");
    setRobotReaction("idle");
    setTimeLeft(STAGE_TIME_LIMIT);

    levelStartTimeRef.current = getStageTimestamp();
    stageStartRef.current = getStageTimestamp();
    completedRef.current = false;

    setTimerKey((prev) => prev + 1);
  };

  const handleTiltMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragStart || window.innerWidth <= 768) {
      if (tilt.x !== 0 || tilt.y !== 0) setTilt({ x: 0, y: 0 });
      return;
    }

    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();

    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;

    setTilt({
      x: y * 2,
      y: -x * 2,
    });
  };

  const handleTiltMouseLeave = () => {
    setTilt({
      x: 0,
      y: 0,
    });
  };

  if (showCompletion) {
    return (
      <div className="stage-completion">
        <div className="completion-card">
          <div className="completion-badge">
            {score >= 200 ? t.stages.stage5.stageComplete : (language === "en" ? "⚠️ LOGIC CIRCUITS INCOMPLETE" : "⚠️ RANGKAIAN LOGIKA BELUM LENGKAP")}
          </div>
          <h1>{t.stages.stage5.passedTitle}</h1>

          <div className="score-info">
            <p>
              {language === "en" ? "Logic Circuits Fixed:" : "Sirkuit Logika Selesai:"} {Math.floor(score / 100)}/{levels.length}
            </p>
            <p>{language === "en" ? "Score:" : "Skor:"} {score} {language === "en" ? "points" : "poin"}</p>
          </div>

          <p className="returning-message">{t.stages.stage5.returningHub}</p>

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
    <div
      className={`stage-logic-flow blueprint-theme ${screenEffect}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
            color="#00ff88"
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
      </div>

      {speechMessage && (
        <div className="logic-speech-wrapper">
          <SpeechBubble
            message={speechMessage}
            type="robot"
            duration={3000}
            onDone={() => setSpeechMessage("")}
          />
        </div>
      )}

      <FloatingParticles />

      <div className="logic-content hud-content-layer">
        <div className="logic-card hud-3d-card">
          <div className="card-scanline" />

          <div className="quiz-top-bar logic-top-bar">
            <div
              className={`quiz-timer-badge ${
                timeLeft <= 10 ? "danger" : timeLeft <= 20 ? "warning" : ""
              }`}
            >
              <span className="timer-icon">T</span>
              <span className="timer-value">{timeLeft}s</span>
            </div>

            <div className="logic-interactive-hint">
              {selectedPort
                ? (language === "en"
                    ? `⚡ Port "${selectedPort}" selected. Tap target port!`
                    : `⚡ Port "${selectedPort}" dipilih. Ketuk port tujuan!`)
                : (language === "en"
                    ? "💡 Tap or drag ports to link data circuits"
                    : "💡 Ketuk atau tarik port untuk menyambungkan")}
            </div>

            <div className="quiz-score-badge">
              <span className="score-icon">PTS</span>
              <span className="score-value">{score}</span>
            </div>
          </div>

          <div className="step-indicators">
            {levels.map((_, idx) => (
              <div
                key={idx}
                className={`step-dot ${idx === currentLevelIdx ? "active" : ""} ${
                  idx < currentLevelIdx ? "completed" : ""
                }`}
              />
            ))}
          </div>

          <div className="logic-header">
            <span className="stage-category-tag">
              {language === "en" ? "LOGIC CIRCUIT" : "SIRKUIT LOGIKA"} • {language === "en" ? "LEVEL" : "LEVEL"} {currentLevelIdx + 1}/{levels.length}
            </span>
            <h1>
              {language === "en" ? "Pipeline Challenge" : "Tantangan Pipeline"} {currentLevelIdx + 1}/{levels.length}
            </h1>
            <p className="logic-scenario-text">{currentLevel.scenario}</p>
          </div>

          <div
            className="circuit-board circuit-board--extended"
            ref={containerRef}
            onMouseMove={handleTiltMouseMove}
            onMouseLeave={handleTiltMouseLeave}
            style={{
              transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition:
                tilt.x === 0 && tilt.y === 0
                  ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                  : "transform 0.1s linear",
            }}
          >
            <svg className="wire-layer">
              {renderedWires.map((wire, index) => (
                <line
                  key={`${wire.x1}-${wire.y1}-${wire.x2}-${wire.y2}-${index}`}
                  x1={wire.x1}
                  y1={wire.y1}
                  x2={wire.x2}
                  y2={wire.y2}
                  stroke={wire.color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={status === "success" ? "wire-pulse" : ""}
                />
              ))}

              {dragStart && dragCurrent && (
                <line
                  x1={dragStart.x}
                  y1={dragStart.y}
                  x2={dragCurrent.x}
                  y2={dragCurrent.y}
                  stroke="#ffff00"
                  strokeWidth="4"
                  strokeDasharray="10,5"
                  strokeLinecap="round"
                />
              )}
            </svg>

            <div className="circuit-component start-component">
              <div className="component-label">{language === "en" ? "POWER SOURCE" : "SUMBER DAYA"}</div>
              <div className="component-value">{currentLevel.factValue}</div>

              <div
                className={`port output-port ${selectedPort === "start-out" ? "selected-port" : ""}`}
                data-port="start-out"
                onClick={() => handlePortTap("start-out")}
                onMouseDown={(event) => handleMouseDown(event, "start-out")}
                onTouchStart={(event) => handleTouchStart(event, "start-out")}
                title="Start Output"
              />
            </div>

            <div className="circuit-component diamond-component">
              <div
                className={`port input-port ${selectedPort === "diamond-in" ? "selected-port" : ""}`}
                data-port="diamond-in"
                onClick={() => handlePortTap("diamond-in")}
                onMouseDown={(event) => handleMouseDown(event, "diamond-in")}
                onTouchStart={(event) => handleTouchStart(event, "diamond-in")}
                title="Condition Input"
              />

              <div className="diamond-shape">
                <div className="diamond-content">
                  <span className="condition-text">
                    {currentLevel.conditionText}
                  </span>
                </div>
              </div>

              <div className="diamond-outputs">
                <div className="output-wrapper">
                  <span>TRUE</span>
                  <div
                    className={`port output-port ${selectedPort === "diamond-true" ? "selected-port" : ""}`}
                    data-port="diamond-true"
                    onClick={() => handlePortTap("diamond-true")}
                    onMouseDown={(event) =>
                      handleMouseDown(event, "diamond-true")
                    }
                    onTouchStart={(event) =>
                      handleTouchStart(event, "diamond-true")
                    }
                    title="Condition True"
                  />
                </div>

                <div className="output-wrapper">
                  <span>FALSE</span>
                  <div
                    className={`port output-port ${selectedPort === "diamond-false" ? "selected-port" : ""}`}
                    data-port="diamond-false"
                    onClick={() => handlePortTap("diamond-false")}
                    onMouseDown={(event) =>
                      handleMouseDown(event, "diamond-false")
                    }
                    onTouchStart={(event) =>
                      handleTouchStart(event, "diamond-false")
                    }
                    title="Condition False"
                  />
                </div>
              </div>
            </div>

            <div
              className={`circuit-component bulb-component ${
                status === "success" ? "bulb-on" : "bulb-off"
              }`}
            >
              <div
                className={`port input-port ${selectedPort === "bulb-in" ? "selected-port" : ""}`}
                data-port="bulb-in"
                onClick={() => handlePortTap("bulb-in")}
                onMouseDown={(event) => handleMouseDown(event, "bulb-in")}
                onTouchStart={(event) => handleTouchStart(event, "bulb-in")}
                title="Bulb Input"
              />

              <div className="bulb-glass">
                <div className="bulb-filament" />
              </div>

              <div className="component-label">{language === "en" ? "INDICATOR" : "INDIKATOR"}</div>
            </div>
          </div>

          <div className="quiz-footer">
            <div className="intro-progress quiz-progress-inline">
              <div className="progress-bar hud-progress-bar">
                <div
                  className="progress-fill hud-progress-fill"
                  style={{
                    width: `${((currentLevelIdx + 1) / levels.length) * 100}%`,
                  }}
                />
              </div>
              <span className="progress-text">
                {currentLevelIdx + 1} / {levels.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {status !== "playing" && (
        <div className={`feedback-modal ${status}`}>
          <h3>
            {status === "success"
              ? (language === "en" ? "CIRCUIT COMPLETE!" : "SIRKUIT LENGKAP!")
              : (language === "en" ? "SHORT CIRCUIT!" : "KONSLETING!")}
          </h3>
          <p>{currentLevel.explanation}</p>

          <div className="hud-sweep-btn-wrapper" style={{ marginTop: 10 }}>
            {status === "success" ? (
              <button className="next-btn hud-sweep-btn" onClick={handleNext}>
                {currentLevelIdx === levels.length - 1
                  ? (language === "en" ? "FINISH MISSION" : "SELESAIKAN MISI")
                  : (language === "en" ? "NEXT LEVEL" : "LEVEL BERIKUTNYA")}
              </button>
            ) : (
              <button
                className="retry-btn hud-sweep-btn"
                onClick={handleRetryLevel}
              >
                {language === "en" ? "TRY AGAIN" : "COBA LAGI"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stage5LogicFlow;
