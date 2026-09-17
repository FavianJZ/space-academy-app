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
  robotMessages,
  getRandomMessage,
} from "../shared/speechBubbleContent";
import {
  getElapsedStageSeconds,
  getStageTimestamp,
} from "../shared/stageTiming";

import "../shared/StageStyle.css";
import "../shared/AdvancedHUD.css";

interface Stage5LogicFlowProps {
  planetId: number;
}

interface LogicLevel {
  id: number;
  scenario: string;
  factValue: number | string;
  conditionText: string;
  correctPath: "true" | "false";
  explanation: string;
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

const levelPool: LogicLevel[] = [
  {
    id: 1,
    scenario: "System Check: Battery Level",
    factValue: "Battery: 80%",
    conditionText: "Is Battery >= 75%?",
    correctPath: "true",
    explanation:
      "80% is greater than 75%, so the condition is TRUE. Power flows to the system.",
  },
  {
    id: 2,
    scenario: "Temperature Control",
    factValue: "Temp: 120°C",
    conditionText: "Is Temp > 150°C?",
    correctPath: "false",
    explanation: "120 is NOT greater than 150. The condition is FALSE.",
  },
  {
    id: 3,
    scenario: "Access Control",
    factValue: "User: 'Guest'",
    conditionText: "Is User == 'Admin'?",
    correctPath: "false",
    explanation:
      "The user is 'Guest', not 'Admin'. Access denied (FALSE path).",
  },
  {
    id: 4,
    scenario: "Inventory Check",
    factValue: "Stock: 25 units",
    conditionText: "Is Stock < 10?",
    correctPath: "false",
    explanation:
      "25 is NOT less than 10. The condition is FALSE — no reorder needed.",
  },
  {
    id: 5,
    scenario: "Speed Limit Monitor",
    factValue: "Speed: 95 km/h",
    conditionText: "Is Speed > 80?",
    correctPath: "true",
    explanation: "95 is greater than 80. The condition is TRUE — over the limit.",
  },
  {
    id: 6,
    scenario: "Login Attempt Lockout",
    factValue: "Attempts: 5",
    conditionText: "Is Attempts >= 5?",
    correctPath: "true",
    explanation: "5 is equal to 5. TRUE — account should be locked.",
  },
  {
    id: 7,
    scenario: "Disk Space Alert",
    factValue: "Free: 15 GB",
    conditionText: "Is Free < 20 GB?",
    correctPath: "true",
    explanation: "15 is less than 20. TRUE — disk space warning triggered.",
  },
  {
    id: 8,
    scenario: "Student Grade Check",
    factValue: "Grade: 'B'",
    conditionText: "Is Grade == 'A'?",
    correctPath: "false",
    explanation: "The grade is 'B', not 'A'. FALSE — honors condition not met.",
  },
];

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

  const [levels] = useState<LogicLevel[]>(() =>
    shuffleLevels(levelPool).slice(0, LEVEL_COUNT)
  );

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [wires, setWires] = useState<Wire[]>([]);
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

  const getPortPosition = (portId: string) => {
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
  };

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

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
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
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [wires, status, currentLevelIdx]);

  const handleRobotClick = () => {
    setSpeechMessage(getRandomMessage(robotMessages.idle));
    setRobotReaction("waving");

    window.setTimeout(() => {
      setRobotReaction("idle");
    }, 2000);
  };

  const handleMouseDown = (
    _event: React.MouseEvent<HTMLDivElement>,
    portId: string
  ) => {
    if (status !== "playing") return;
    if (portId === "diamond-in" || portId === "bulb-in") return;

    playSfx("nodeDragStart");
    setWires((prev) => prev.filter((wire) => wire.from !== portId));

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

  const completeConnection = (targetPort: string | null) => {
    if (dragStart && targetPort) {
      let isValid = false;

      if (dragStart.portId === "start-out" && targetPort === "diamond-in") {
        isValid = true;
      }

      if (
        (dragStart.portId === "diamond-true" ||
          dragStart.portId === "diamond-false") &&
        targetPort === "bulb-in"
      ) {
        isValid = true;
      }

      if (isValid) {
        const newWires = [...wires, { from: dragStart.portId, to: targetPort }];

        playSfx("circuitConnect");
        setWires(newWires);
        checkWinCondition(newWires);
      } else {
        playSfx("nodeDrop");
      }
    } else if (dragStart) {
      playSfx("nodeDrop");
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const targetPort = target.getAttribute("data-port");

    completeConnection(targetPort);
  };

  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
    portId: string
  ) => {
    if (status !== "playing") return;
    if (portId === "diamond-in" || portId === "bulb-in") return;
    if (!containerRef.current) return;

    playSfx("nodeDragStart");
    setWires((prev) => prev.filter((wire) => wire.from !== portId));

    const touch = event.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();

    const pos = {
      x: touch.clientX - containerRect.left,
      y: touch.clientY - containerRect.top,
    };

    setDragStart({
      portId,
      x: pos.x,
      y: pos.y,
    });

    setDragCurrent(pos);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!dragStart || !containerRef.current) return;

    event.preventDefault();

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

    const targetPort = element?.getAttribute("data-port") ?? null;

    completeConnection(targetPort);
  };

  const checkWinCondition = (currentWires: Wire[]) => {
    const hasStartToDiamond = currentWires.some(
      (wire) => wire.from === "start-out" && wire.to === "diamond-in"
    );

    const hasDiamondToBulb = currentWires.find(
      (wire) => wire.to === "bulb-in"
    );

    if (!hasStartToDiamond || !hasDiamondToBulb) return;

    if (hasDiamondToBulb.from === `diamond-${currentLevel.correctPath}`) {
      setStatus("success");
      const reaction = playSfx("feedbackCorrect");

      const speedScore = calculateSpeedScore();

      setScore((prev) => prev + speedScore);
      setRobotReaction("correct");
      setSpeechMessage(getRandomMessage(robotMessages.correct));
      setScreenEffect("screen-flash-green");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    } else {
      setStatus("failure");
      const reaction = playSfx("feedbackIncorrect");
      setRobotReaction("incorrect");
      setSpeechMessage(getRandomMessage(robotMessages.incorrect));
      setScreenEffect("screen-shake");

      window.setTimeout(() => {
        setScreenEffect("");
        setRobotReaction("idle");
      }, reaction.motionMs);
    }
  };

  const handleNext = () => {
    if (currentLevelIdx < levels.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
      setWires([]);
      setStatus("playing");
      levelStartTimeRef.current = getStageTimestamp();
    } else {
      handleComplete();
    }
  };

  const handleRetryLevel = () => {
    setWires([]);
    setStatus("playing");
    levelStartTimeRef.current = getStageTimestamp();
  };

  const handleReplay = () => {
    clearReturnTimeout();
    clearTimer();

    setShowCompletion(false);
    setCurrentLevelIdx(0);
    setWires([]);
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
          <h1>STAGE 5 COMPLETE!</h1>

          <div className="score-info">
            <p>
              Logic Circuits Fixed: {Math.floor(score / 100)}/{levels.length}
            </p>
            <p>Score: {score} points</p>
          </div>

          <p className="returning-message">Returning to main hub...</p>

          <div className="completion-buttons">
            <button className="replay-btn" onClick={handleReplay}>
              Replay Stage
            </button>

            <button
              className="return-btn"
              onClick={() => {
                clearReturnTimeout();
                navigate("/mainhub");
              }}
            >
              Return to Hub
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

      <div className="logic-header-overlay">
        <h2>
          Pipeline Challenge {currentLevelIdx + 1}/{levels.length}
        </h2>
        <p>{currentLevel.scenario}</p>

        <div
          style={{
            display: "inline-block",
            marginTop: "8px",
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

      <div
        className="circuit-board circuit-board--extended hud-3d-card"
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
        <div className="card-scanline" />

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
          <div className="component-label">POWER SOURCE</div>
          <div className="component-value">{currentLevel.factValue}</div>

          <div
            className="port output-port"
            data-port="start-out"
            onMouseDown={(event) => handleMouseDown(event, "start-out")}
            onTouchStart={(event) => handleTouchStart(event, "start-out")}
          />
        </div>

        <div className="circuit-component diamond-component">
          <div className="port input-port" data-port="diamond-in" />

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
                className="port output-port"
                data-port="diamond-true"
                onMouseDown={(event) =>
                  handleMouseDown(event, "diamond-true")
                }
                onTouchStart={(event) =>
                  handleTouchStart(event, "diamond-true")
                }
              />
            </div>

            <div className="output-wrapper">
              <span>FALSE</span>
              <div
                className="port output-port"
                data-port="diamond-false"
                onMouseDown={(event) =>
                  handleMouseDown(event, "diamond-false")
                }
                onTouchStart={(event) =>
                  handleTouchStart(event, "diamond-false")
                }
              />
            </div>
          </div>
        </div>

        <div
          className={`circuit-component bulb-component ${
            status === "success" ? "bulb-on" : "bulb-off"
          }`}
        >
          <div className="port input-port" data-port="bulb-in" />

          <div className="bulb-glass">
            <div className="bulb-filament" />
          </div>

          <div className="component-label">INDICATOR</div>
        </div>
      </div>

      {status !== "playing" && (
        <div className={`feedback-modal ${status}`}>
          <h3>
            {status === "success" ? "CIRCUIT COMPLETE!" : "SHORT CIRCUIT!"}
          </h3>
          <p>{currentLevel.explanation}</p>

          <div className="hud-sweep-btn-wrapper" style={{ marginTop: 10 }}>
            {status === "success" ? (
              <button className="next-btn hud-sweep-btn" onClick={handleNext}>
                {currentLevelIdx === levels.length - 1
                  ? "FINISH MISSION"
                  : "NEXT LEVEL"}
              </button>
            ) : (
              <button
                className="retry-btn hud-sweep-btn"
                onClick={handleRetryLevel}
              >
                TRY AGAIN
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Stage5LogicFlow;
