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

  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

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
      const remainingTime = timeLeftRef.current;
      const calcScore = solved
        ? Math.round(200 + (remainingTime / INITIAL_TIME) * 300)
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
    [addPlanetScore, markPlanetVisited, navigate, planetId, playSfx]
  );

  const goToNextChallenge = useCallback(() => {
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    if (challengeIdx < pipelineChallenges.length - 1) {
      setChallengeIdx((prev) => {
        const nextIdx = prev + 1;
        setCurrentSteps(shuffleSteps(pipelineChallenges[nextIdx].steps));
        return nextIdx;
      });
      setIsChallengeComplete(false);
      setSelectedIdx(null);
      setRobotReaction("thinking");
    } else {
      handleComplete(true);
    }
  }, [challengeIdx, handleComplete]);

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
          goToNextChallenge();
        }, 2500);
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
          <div style={{ display: "flex", gap: "20px", justifyContent: "center", margin: "16px 0" }}>
            <div className="completion-stat-chip">
              <span className="stat-label">TOTAL MOVES</span>
              <span className="stat-value">{moves}</span>
            </div>
            <div className="completion-stat-chip">
              <span className="stat-label">TIME LEFT</span>
              <span className="stat-value">{timeLeft}s</span>
            </div>
            <div className="completion-stat-chip">
              <span className="stat-label">LEVELS</span>
              <span className="stat-value">{pipelineChallenges.length}/3</span>
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

          {/* Pipeline Blocks — Responsive Grid with CSS classes */}
          <div className="pipeline-grid">
            {/* Animated Laser Data Flow Line */}
            <div
              className={`pipeline-laser-line ${
                isChallengeComplete
                  ? "pipeline-laser-line--verified"
                  : "pipeline-laser-line--idle"
              }`}
            />

            {currentSteps.map((step, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectPosition = step.correctStep === idx + 1;

              const cardClass = [
                "pipeline-step-card",
                isSelected && "pipeline-step-card--selected",
                isChallengeComplete && "pipeline-step-card--verified",
                !isSelected &&
                  !isChallengeComplete &&
                  isCorrectPosition &&
                  "pipeline-step-card--correct",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={step.id}
                  className={cardClass}
                  onClick={() => handleStepClick(idx)}
                  role="button"
                  tabIndex={isChallengeComplete ? -1 : 0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStepClick(idx);
                    }
                  }}
                  aria-label={`${step.title} - Slot ${idx + 1}`}
                >
                  {/* Slot + Tag row */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span className="pipeline-slot-label">
                      SLOT {idx + 1}
                    </span>
                    <span
                      className="pipeline-tag-badge"
                      style={{
                        color: isCorrectPosition ? "#00ffcc" : "#8ea8c4",
                      }}
                    >
                      {step.tag}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="pipeline-step-icon">{step.icon}</div>

                  {/* Title */}
                  <div className="pipeline-step-title">{step.title}</div>

                  {/* Subtitle */}
                  <div className="pipeline-step-subtitle">
                    {step.subtitle}
                  </div>

                  {/* Order indicator */}
                  <div
                    className={`pipeline-order-indicator ${
                      isSelected
                        ? "pipeline-order-indicator--selected"
                        : isCorrectPosition
                        ? "pipeline-order-indicator--correct"
                        : "pipeline-order-indicator--idle"
                    }`}
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

          {/* Verified Notification Banner with Interactive Next Button */}
          {isChallengeComplete && (
            <div
              className="pipeline-verified-banner"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                padding: "14px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>⚡</span>
                <span>
                  PIPELINE VERIFIED! DATA FLOW SYNCHRONIZED
                </span>
              </div>
              <button
                onClick={goToNextChallenge}
                className="hud-sweep-btn"
                style={{
                  background: "linear-gradient(135deg, #00ffcc 0%, #00b894 100%)",
                  color: "#030f1e",
                  border: "none",
                  fontWeight: "bold",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  boxShadow: "0 0 15px rgba(0, 255, 204, 0.5)",
                  letterSpacing: "1px",
                  transition: "all 0.2s ease",
                  marginLeft: "auto",
                }}
              >
                {challengeIdx < pipelineChallenges.length - 1
                  ? `LANJUT LEVEL ${challengeIdx + 2} ➔`
                  : "SELESAIKAN MISI ➔"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stage3PuzzleGame;
