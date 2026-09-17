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
import { SpeechBubble } from "../shared/SpeechBubble";
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

interface Stage3PuzzleGameProps {
  planetId: number;
}

interface PipelineStep {
  id: number;
  correctStep: number; // 1, 2, 3, 4
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
}

interface PipelineChallenge {
  id: number;
  title: string;
  category: string;
  description: string;
  steps: PipelineStep[];
}

const pipelineChallenges: PipelineChallenge[] = [
  {
    id: 1,
    title: "SDLC Lifecycle Sequence",
    category: "SOFTWARE DEVELOPMENT LIFECYCLE",
    description:
      "Susun tahapan SDLC berstandar industri berikut dalam urutan proses yang benar (Tahap 1 s.d. 4):",
    steps: [
      {
        id: 101,
        correctStep: 1,
        title: "Requirement Analysis",
        subtitle: "Analisis kebutuhan user, scope proyek & spesifikasi sistem",
        icon: "📋",
        tag: "PHASE 01",
      },
      {
        id: 102,
        correctStep: 2,
        title: "System Architecture",
        subtitle: "Rancang diagram UML, skema database ERD & modularitas",
        icon: "🏛️",
        tag: "PHASE 02",
      },
      {
        id: 103,
        correctStep: 3,
        title: "Implementation (Coding)",
        subtitle: "Menulis kode bersih, type-safe, dan terstruktur modular",
        icon: "💻",
        tag: "PHASE 03",
      },
      {
        id: 104,
        correctStep: 4,
        title: "Testing & QA Audit",
        subtitle: "Uji unit test, integrasi, dan validasi bebas bug (Zero Defect)",
        icon: "🛡️",
        tag: "PHASE 04",
      },
    ],
  },
  {
    id: 2,
    title: "Client-Server Request Architecture",
    category: "ENTERPRISE WEB DATA FLOW",
    description:
      "Susun alur transmisi data dari interaksi pengguna hingga penyimpanan permanen di server:",
    steps: [
      {
        id: 201,
        correctStep: 1,
        title: "UI Event Trigger",
        subtitle: "Pengguna mengklik tombol aksi pada aplikasi antarmuka",
        icon: "👆",
        tag: "STEP 01",
      },
      {
        id: 202,
        correctStep: 2,
        title: "API Gateway Dispatch",
        subtitle: "Mengirim payload JSON terenkripsi melalui protokol HTTPS",
        icon: "🌐",
        tag: "STEP 02",
      },
      {
        id: 203,
        correctStep: 3,
        title: "Backend Business Logic",
        subtitle: "Server memvalidasi auth token, otorisasi & logika komputasi",
        icon: "⚙️",
        tag: "STEP 03",
      },
      {
        id: 204,
        correctStep: 4,
        title: "Database Commit",
        subtitle: "Mengeksekusi query SQL & menyimpan record persisten",
        icon: "💾",
        tag: "STEP 04",
      },
    ],
  },
  {
    id: 3,
    title: "Modern DevOps & CI/CD Pipeline",
    category: "CLOUD AUTOMATION & DEPLOYMENT",
    description:
      "Susun alur rilis kode otomatis dari laptop software engineer ke server cloud produksi:",
    steps: [
      {
        id: 301,
        correctStep: 1,
        title: "Feature Code Commit",
        subtitle: "Engineer menulis fitur baru dan commit ke Git branch",
        icon: "🌿",
        tag: "STAGE 01",
      },
      {
        id: 302,
        correctStep: 2,
        title: "Pull Request & Review",
        subtitle: "Peer code review dan persetujuan standardisasi tim",
        icon: "👀",
        tag: "STAGE 02",
      },
      {
        id: 303,
        correctStep: 3,
        title: "Automated Build & Test",
        subtitle: "Server CI menjalankan linter, build bundle & security checks",
        icon: "🤖",
        tag: "STAGE 03",
      },
      {
        id: 304,
        correctStep: 4,
        title: "Production Deployment",
        subtitle: "Rilis kontainer Docker otomatis ke cluster server cloud",
        icon: "🚀",
        tag: "STAGE 04",
      },
    ],
  },
];

// Shuffle helper ensuring the result is NOT accidentally solved initially
function shuffleSteps(steps: PipelineStep[]): PipelineStep[] {
  let result = [...steps];
  let isSorted = true;
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    isSorted = result.every((step, idx) => step.correctStep === idx + 1);
    if (!isSorted) break;
  }
  // Guarantee not sorted
  if (isSorted && result.length >= 2) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

const INITIAL_TIME = 90;

const Stage3PuzzleGame: React.FC<Stage3PuzzleGameProps> = ({ planetId }) => {
  const navigate = useNavigate();
  const { playSfx } = useGameAudio();

  const [challengeIdx, setChallengeIdx] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<PipelineStep[]>(() =>
    shuffleSteps(pipelineChallenges[0].steps)
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isChallengeComplete, setIsChallengeComplete] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [showCompletion, setShowCompletion] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageStartRef = useRef(0);
  const completedRef = useRef(false);

  const addPlanetScore = useGameStore((state) => state.addPlanetScore);
  const markPlanetVisited = useGameStore((state) => state.markPlanetVisited);

  const [robotReaction, setRobotReaction] = useState<RobotReaction>("thinking");
  const [speechMessage, setSpeechMessage] = useState("");
  const [screenEffect, setScreenEffect] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentChallenge = pipelineChallenges[challengeIdx];

  const handleRobotClick = () => {
    setSpeechMessage(getRandomMessage(robotMessages.idle));
    setRobotReaction("waving");
    setTimeout(() => setRobotReaction("thinking"), 2000);
  };

  const handleComplete = useCallback(
    (solved: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (transitionRef.current) clearTimeout(transitionRef.current);

      markPlanetVisited(planetId as 1 | 2 | 3 | 4 | 5 | 6);
      const calcScore = solved
        ? Math.round(200 + (timeLeft / INITIAL_TIME) * 300)
        : 80;
      setFinalScore(calcScore);
      const elapsed = getElapsedStageSeconds(stageStartRef.current);
      addPlanetScore(planetId as 1 | 2 | 3 | 4 | 5 | 6, 3, calcScore, elapsed);

      setShowCompletion(true);
      setRobotReaction(solved ? "celebrating" : "idle");
      setScreenEffect(solved ? "screen-flash-green" : "");
      playSfx(solved ? "missionComplete" : "feedbackIncorrect");
      setTimeout(() => setScreenEffect(""), 600);

      setTimeout(() => {
        navigate("/mainhub");
      }, 4500);
    },
    [addPlanetScore, markPlanetVisited, navigate, planetId, playSfx, timeLeft]
  );

  // Timer logic
  useEffect(() => {
    stageStartRef.current = getStageTimestamp();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleComplete(false);
          return 0;
        }
        if (prev <= 11) playSfx("timerLowTime");
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, [handleComplete, playSfx]);

  // Handle tile tap & swap
  const handleStepClick = (clickedIdx: number) => {
    if (isChallengeComplete) return;

    if (selectedIdx === null) {
      // First select
      setSelectedIdx(clickedIdx);
      playSfx("puzzlePickup");
    } else if (selectedIdx === clickedIdx) {
      // Deselect
      setSelectedIdx(null);
      playSfx("uiSelect");
    } else {
      // Swap elements
      playSfx("puzzlePlace");
      setMoves((m) => m + 1);

      const updated = [...currentSteps];
      [updated[selectedIdx], updated[clickedIdx]] = [
        updated[clickedIdx],
        updated[selectedIdx],
      ];
      setCurrentSteps(updated);
      setSelectedIdx(null);

      // Verify if sorted correctly (1, 2, 3, 4)
      const isSorted = updated.every(
        (step, idx) => step.correctStep === idx + 1
      );

      if (isSorted) {
        setIsChallengeComplete(true);
        playSfx("circuitConnect");
        setRobotReaction("celebrating");
        setSpeechMessage("Pipeline Verified! Alur data tersinkronisasi.");
        setScreenEffect("screen-flash-green");
        setTimeout(() => setScreenEffect(""), 500);

        transitionRef.current = setTimeout(() => {
          if (challengeIdx < pipelineChallenges.length - 1) {
            const nextIdx = challengeIdx + 1;
            setChallengeIdx(nextIdx);
            setCurrentSteps(shuffleSteps(pipelineChallenges[nextIdx].steps));
            setIsChallengeComplete(false);
            setRobotReaction("thinking");
          } else {
            handleComplete(true);
          }
        }, 1200);
      }
    }
  };

  const handleRestart = () => {
    if (transitionRef.current) clearTimeout(transitionRef.current);
    setSelectedIdx(null);
    setIsChallengeComplete(false);
    setCurrentSteps(shuffleSteps(currentChallenge.steps));
    playSfx("uiSelect");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setTilt({ x: y * 3, y: -x * 3 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const timerPercent = (timeLeft / INITIAL_TIME) * 100;

  if (showCompletion) {
    return (
      <div className="stage-puzzle completion-screen">
        <div className="completion-card hud-3d-card">
          <div className="completion-badge">
            {finalScore >= 300 ? "🏆 MISSION COMPLETE" : "⚠️ PIPELINE STANDBY"}
          </div>
          <h2>System Architecture Verified!</h2>
          <p className="completion-subtitle">
            Seluruh pipeline SDLC dan arsitektur data berhasil dirangkai secara
            presisi.
          </p>
          <div className="score-display">
            <span className="score-label">FINAL SCORE</span>
            <span className="score-value">{finalScore} PTS</span>
          </div>
          <div className="stats-row" style={{ display: "flex", gap: "24px", justifyContent: "center", margin: "16px 0" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#8ea8c4", display: "block" }}>TOTAL MOVES</span>
              <strong style={{ fontSize: "18px", color: "#00ffcc" }}>{moves}</strong>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#8ea8c4", display: "block" }}>TIME REMAINING</span>
              <strong style={{ fontSize: "18px", color: "#7ef9ff" }}>{timeLeft}s</strong>
            </div>
          </div>
          <p className="returning-message">Returning to main hub...</p>
          <div className="completion-buttons">
            <button
              className="return-btn"
              onClick={() => navigate("/mainhub")}
            >
              Return to Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stage-puzzle ${screenEffect}`}>
      {/* Top Left Reset Button */}
      <div
        className="top-left-floating-btn hud-sweep-btn-wrapper"
        style={{
          position: "absolute",
          top: "20px",
          left: "30px",
          zIndex: 50,
          margin: 0,
        }}
      >
        <button
          className="solve-btn hud-sweep-btn"
          onClick={handleRestart}
          style={{
            padding: "10px 24px",
            fontSize: "0.85rem",
            width: "auto",
            minWidth: "160px",
          }}
        >
          🔄 RESET CURRENT PIPELINE
        </button>
      </div>

      {/* 3D Scene Background */}
      <div className="canvas-container">
        <AdaptiveCanvas
          camera={{ position: [0, 1, 5], fov: 50 }}
          dpr={[1, 1.1]}
          quality="low"
        >
          <ambientLight intensity={0.6} />
          <pointLight position={[5, 5, 5]} intensity={100} color="#00ffff" />
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

      {/* Main Interactive Card */}
      <div className="puzzle-content hud-content-layer">
        <div
          className="puzzle-card hud-3d-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition:
              tilt.x === 0 && tilt.y === 0
                ? "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)"
                : "transform 0.1s linear",
            maxWidth: "920px",
            width: "92%",
          }}
        >
          <div className="card-scanline" />

          {/* Header */}
          <div className="puzzle-header" style={{ marginBottom: "14px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: "20px",
                background: "rgba(0, 255, 204, 0.12)",
                border: "1px solid rgba(0, 255, 204, 0.4)",
                color: "#00ffcc",
                fontSize: "10.5px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                marginBottom: "6px",
              }}
            >
              {currentChallenge.category} • LEVEL {challengeIdx + 1}/3
            </div>
            <h1 style={{ fontSize: "1.6rem", margin: "4px 0" }}>
              {currentChallenge.title}
            </h1>
            <p
              className="puzzle-subtitle"
              style={{ fontSize: "0.95rem", color: "#b8d5ed", margin: 0 }}
            >
              {currentChallenge.description}
            </p>
          </div>

          {/* Stats Bar */}
          <div
            className="puzzle-stats-bar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px",
              background: "rgba(6, 18, 42, 0.65)",
              borderRadius: "10px",
              marginBottom: "18px",
            }}
          >
            <div
              className={`puzzle-timer-circle ${
                timeLeft <= 20 ? (timeLeft <= 10 ? "danger" : "warning") : ""
              }`}
            >
              <svg className="timer-ring" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="rgba(0,255,255,0.12)"
                  strokeWidth="3"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke={
                    timeLeft <= 10
                      ? "#ff4444"
                      : timeLeft <= 20
                      ? "#ffaa00"
                      : "#00ffff"
                  }
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${timerPercent * 1.194} 119.4`}
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    transition: "stroke-dasharray 1s linear",
                  }}
                />
              </svg>
              <span className="timer-text">{timeLeft}s</span>
            </div>

            <div
              style={{
                fontSize: "12px",
                color: selectedIdx !== null ? "#ffcc00" : "#7ef9ff",
                fontWeight: 600,
              }}
            >
              {selectedIdx !== null
                ? "👉 Click another card to SWAP position"
                : "💡 Tap any card to select, then tap another to SWAP"}
            </div>

            <div className="puzzle-moves-badge">
              <span className="moves-label">MOVES</span>
              <span className="moves-count">{moves}</span>
            </div>
          </div>

          {/* Pipeline Blocks Horizontal Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
              position: "relative",
              padding: "10px 0",
            }}
          >
            {/* Visual Laser Line behind the cards */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "4%",
                right: "4%",
                height: "3px",
                background: isChallengeComplete
                  ? "linear-gradient(90deg, #00ff88, #00ffff)"
                  : "linear-gradient(90deg, rgba(0, 255, 204, 0.3), rgba(0, 204, 255, 0.2))",
                boxShadow: isChallengeComplete
                  ? "0 0 12px #00ff88, 0 0 20px #00ffff"
                  : "none",
                zIndex: 0,
                transform: "translateY(-50%)",
                transition: "all 0.4s ease",
              }}
            />

            {currentSteps.map((step, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectPosition = step.correctStep === idx + 1;

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(idx)}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    background: isSelected
                      ? "rgba(255, 204, 0, 0.18)"
                      : isChallengeComplete
                      ? "rgba(0, 255, 136, 0.16)"
                      : "rgba(8, 22, 50, 0.88)",
                    border: isSelected
                      ? "2px solid #ffd700"
                      : isChallengeComplete
                      ? "2px solid #00ff88"
                      : isCorrectPosition
                      ? "1.5px solid rgba(0, 255, 204, 0.6)"
                      : "1.5px solid rgba(126, 249, 255, 0.25)",
                    borderRadius: "14px",
                    padding: "16px 12px",
                    cursor: isChallengeComplete ? "default" : "pointer",
                    transform: isSelected
                      ? "scale(1.05) translateY(-4px)"
                      : "scale(1)",
                    boxShadow: isSelected
                      ? "0 8px 24px rgba(255, 215, 0, 0.35)"
                      : isChallengeComplete
                      ? "0 6px 20px rgba(0, 255, 136, 0.3)"
                      : "0 4px 12px rgba(0, 0, 0, 0.4)",
                    transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    minHeight: "190px",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Slot Number Badge */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9.5px",
                        fontFamily: "Consolas, monospace",
                        color: "#7ef9ff",
                        fontWeight: "bold",
                        letterSpacing: "1px",
                      }}
                    >
                      SLOT {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(0,0,0,0.4)",
                        color: isCorrectPosition ? "#00ffcc" : "#8ea8c4",
                        fontWeight: "bold",
                      }}
                    >
                      {step.tag}
                    </span>
                  </div>

                  {/* Icon */}
                  <div style={{ fontSize: "2rem", margin: "4px 0" }}>
                    {step.icon}
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: "bold",
                      color: "#ffffff",
                      letterSpacing: "0.3px",
                      lineHeight: "1.25",
                      marginBottom: "6px",
                    }}
                  >
                    {step.title}
                  </div>

                  {/* Subtitle */}
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#a1c2e4",
                      lineHeight: "1.3",
                    }}
                  >
                    {step.subtitle}
                  </div>

                  {/* Order indicator */}
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "10px",
                      color: isSelected
                        ? "#ffd700"
                        : isCorrectPosition
                        ? "#00ff88"
                        : "#607d9b",
                      fontWeight: 700,
                    }}
                  >
                    {isSelected
                      ? "★ SELECTED"
                      : isCorrectPosition
                      ? "✔ IN POSITION"
                      : "TAP TO SWAP"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verified Notification Banner */}
          {isChallengeComplete && (
            <div
              style={{
                marginTop: "16px",
                padding: "10px",
                background: "rgba(0, 255, 136, 0.15)",
                border: "1px solid #00ff88",
                borderRadius: "8px",
                color: "#00ff88",
                fontWeight: "bold",
                fontSize: "13px",
                letterSpacing: "1px",
                textAlign: "center",
                animation: "pulse 1s infinite",
              }}
            >
              ⚡ PIPELINE VERIFIED! DATA FLOW SYNCHRONIZED — ADVANCING...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stage3PuzzleGame;
