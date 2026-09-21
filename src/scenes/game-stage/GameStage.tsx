import React, { Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import {
  Stage1Introduction,
  Stage2MultipleChoice,
  Stage3PuzzleGame,
  Stage4FlowchartFixer,
  Stage5LogicFlow,
  Stage6BugHunt,
} from "../../components/stages";
import { CadetDossierModal } from "../../components/specialization/CadetDossierModal";
import "./GameStage.css";

type StageId = 1 | 2 | 3 | 4 | 5 | 6;

type StageMeta = {
  planet: string;
  module: string;
  accent: string;
};

const STAGE_META: Record<StageId, StageMeta> = {
  1: { planet: "NOVARIS", module: "FOUNDATION LINK", accent: "#72e9ff" },
  2: { planet: "QUIZARA", module: "KNOWLEDGE CHECK", accent: "#76d8ff" },
  3: { planet: "PUZZLON", module: "SYSTEM ASSEMBLY", accent: "#9be8ff" },
  4: { planet: "FLOWRA", module: "FLOW PROTOCOL", accent: "#ff8fc9" },
  5: { planet: "LOGITRON", module: "LOGIC CIRCUIT", accent: "#bda7ff" },
  6: { planet: "ULTIMARA", module: "FINAL DIAGNOSTIC", accent: "#78f0dc" },
};

const isValidStageId = (value: number): value is StageId => value >= 1 && value <= 6;

const GameStage: React.FC = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const playerData = useGameStore((state) => state.playerData);
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);

  const parsedStageId = Number(stageId || "1");
  const planetId: StageId = isValidStageId(parsedStageId) ? parsedStageId : 1;
  const stageMeta = STAGE_META[planetId];

  if (!isValidStageId(parsedStageId)) {
    return (
      <div className="game-stage-error">
        <span>{language === "en" ? "INVALID MISSION VECTOR" : "VEKTOR MISI TIDAK VALID"}</span>
        <h1>{language === "en" ? "Stage not found" : "Tahapan tidak ditemukan"}</h1>
        <button onClick={() => navigate("/mainhub")}>
          {t.stages.common.returnToMainHub}
        </button>
      </div>
    );
  }

  if (!playerData.name) {
    return (
      <div className="game-stage-error">
        <span>{language === "en" ? "IDENTITY LINK REQUIRED" : "TAUTAN IDENTITAS DIBUTUHKAN"}</span>
        <h1>{language === "en" ? "Pilot data not found" : "Data pilot tidak ditemukan"}</h1>
        <button onClick={() => navigate("/")}>
          {language === "en" ? "Return to induction" : "Kembali ke induksi"}
        </button>
      </div>
    );
  }

  const renderStage = () => {
    switch (planetId) {
      case 1:
        return <Stage1Introduction planetId={planetId} />;
      case 2:
        return <Stage2MultipleChoice planetId={planetId} />;
      case 3:
        return <Stage3PuzzleGame planetId={planetId} />;
      case 4:
        return <Stage4FlowchartFixer planetId={planetId} />;
      case 5:
        return <Stage5LogicFlow planetId={planetId} />;
      case 6:
        return <Stage6BugHunt planetId={planetId} />;
      default:
        return <Stage1Introduction planetId={1} />;
    }
  };

  return (
    <main
      className={`game-stage-container game-stage-${planetId}`}
      style={{ "--gs-accent": stageMeta.accent } as React.CSSProperties}
    >
      <div className="gs-cinematic-layer" aria-hidden="true">
        <div className="gs-vignette" />
        <div className="gs-grain" />
        <div className="gs-letterbox gs-letterbox-top" />
        <div className="gs-letterbox gs-letterbox-bottom" />
      </div>

      <header className="gs-mission-header" aria-label="Mission status">
        <div className="gs-mission-brand">
          <span className="gs-mission-beacon" />
          <div>
            <span>ACADEMY SIMULATION // {String(planetId).padStart(2, "0")}</span>
            <strong>SPACE ACADEMY</strong>
          </div>
        </div>

        <div className="gs-stage-identity">
          <span>{t.planets[planetId]?.stageTitle ?? stageMeta.module}</span>
          <strong>{t.planets[planetId]?.name?.toUpperCase() ?? stageMeta.planet}</strong>
          <div className="gs-stage-track" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <i key={step} className={step <= planetId ? "active" : ""} />
            ))}
          </div>
        </div>

        <button
          className="gs-return-control"
          type="button"
          onClick={() => {
            useGameStore.getState().resetMultiplayerSession();
            navigate("/mainhub");
          }}
        >
          <span>{t.stages.common.exitModule}</span>
          <strong>{t.stages.common.returnHub}</strong>
        </button>
      </header>

      <div className="gs-stage-runtime">
        <Suspense
          fallback={
            <div className="gs-stage-loader" role="status">
              <div className="gs-loader-reticle" aria-hidden="true"><i /></div>
              <span>LOADING MODULE {String(planetId).padStart(2, "0")}</span>
              <strong>{stageMeta.module}</strong>
            </div>
          }
        >
          {renderStage()}
        </Suspense>
      </div>
    </main>
  );
};

export const CompletionScreen: React.FC = () => {
  const navigate = useNavigate();
  const playerData = useGameStore((state) => state.playerData);
  const totalScore = useGameStore((state) => state.getTotalScore)();
  const leaderboard = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const specializationResult = useGameStore((state) => state.specializationResult);
  const refreshSpecializationProfile = useGameStore((state) => state.refreshSpecializationProfile);
  const isAllPlanetsVisited = visitedPlanets.size >= 6;
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);

  const [showDossier, setShowDossier] = React.useState(false);

  useEffect(() => {
    if (!playerData.name) return;
    addLeaderboardEntry({
      playerName: playerData.name,
      totalScore,
      timestamp: Date.now(),
      major: playerData.major,
    });
  }, [addLeaderboardEntry, playerData.name, playerData.major, totalScore]);

  useEffect(() => {
    refreshSpecializationProfile();
  }, [refreshSpecializationProfile]);

  useEffect(() => {
    if (isAllPlanetsVisited && specializationResult) {
      const timer = setTimeout(() => setShowDossier(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isAllPlanetsVisited, specializationResult]);

  const handleNextAction = () => {
    navigate(isAllPlanetsVisited ? "/leaderboard" : "/mainhub");
  };

  return (
    <div className="completion-screen">
      <div className="completion-content">
        <span className="completion-kicker">
          {language === "en" ? "ACADEMY MISSION REPORT" : "LAPORAN MISI AKADEMI"}
        </span>
        <h1>{t.stages.common.missionComplete}</h1>
        <p className="completion-message">
          {isAllPlanetsVisited
            ? t.stages.common.allModulesComplete(totalScore)
            : t.stages.common.missionSynced}
        </p>

        <div className="score-board">
          <h2>{t.stages.common.missionScore}</h2>
          <div className="score-display">{totalScore}</div>
          {isAllPlanetsVisited && (
            <p className="completion-rank">{t.stages.common.leaderboardLinkAvailable}</p>
          )}
        </div>

        {isAllPlanetsVisited && (
          <div className="leaderboard-preview">
            <h3>{t.stages.common.top5Pilots}</h3>
            <div className="mini-leaderboard">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div key={`${entry.playerName}-${index}`} className="leaderboard-mini-row">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{entry.playerName}</span>
                  <span className="score">{entry.totalScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {specializationResult && (
          <button
            className="dossier-reveal-btn"
            onClick={() => {
              refreshSpecializationProfile();
              setShowDossier(true);
            }}
          >
            {isAllPlanetsVisited
              ? t.stages.common.viewGraduateDossier
              : t.stages.common.viewSpecializationDossier}
          </button>
        )}

        <button className="menu-button" onClick={handleNextAction}>
          {isAllPlanetsVisited ? t.stages.common.viewFullLeaderboard : t.stages.common.returnToMainHub}
        </button>
      </div>

      {showDossier && specializationResult && (
        <CadetDossierModal
          result={specializationResult}
          cadet={{
            name: playerData.name,
            school: playerData.school,
            major: playerData.major,
          }}
          onClose={() => setShowDossier(false)}
        />
      )}
    </div>
  );
};

export default GameStage;
