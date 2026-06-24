import React, { Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import {
  Stage1Introduction,
  Stage2MultipleChoice,
  Stage3PuzzleGame,
  Stage4FlowchartFixer,
  Stage5LogicFlow,
  Stage6BugHunt,
} from "../../components/stages";
import "./GameStage.css";

type StageId = 1 | 2 | 3 | 4 | 5 | 6;

const isValidStageId = (value: number): value is StageId => {
  return value >= 1 && value <= 6;
};

const GameStage: React.FC = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  const playerData = useGameStore((state) => state.playerData);

  const parsedStageId = Number(stageId || "1");
  const planetId: StageId = isValidStageId(parsedStageId)
    ? parsedStageId
    : 1;

  if (!isValidStageId(parsedStageId)) {
    return (
      <div className="game-stage-error">
        <h1>Error: Stage not found</h1>
        <button onClick={() => navigate("/mainhub")}>Back to Main Hub</button>
      </div>
    );
  }

  if (!playerData.name) {
    return (
      <div className="game-stage-error">
        <h1>Error: Player data not found</h1>
        <button onClick={() => navigate("/")}>Go Back</button>
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
    <div className="game-stage-container">
      <Suspense fallback={<div className="loading">Loading stage...</div>}>
        {renderStage()}
      </Suspense>
    </div>
  );
};

export const CompletionScreen: React.FC = () => {
  const navigate = useNavigate();

  const playerData = useGameStore((state) => state.playerData);
  const totalScore = useGameStore((state) => state.getTotalScore)();
  const leaderboard = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);

  const isAllPlanetsVisited = visitedPlanets.size >= 6;

  useEffect(() => {
    if (!playerData.name) return;

    addLeaderboardEntry({
      playerName: playerData.name,
      totalScore,
      timestamp: Date.now(),
      major: playerData.major,
    });
  }, [addLeaderboardEntry, playerData.name, playerData.major, totalScore]);

  const handleNextAction = () => {
    if (isAllPlanetsVisited) {
      navigate("/leaderboard");
    } else {
      navigate("/mainhub");
    }
  };

  return (
    <div className="completion-screen">
      <div className="completion-content">
        <h1>🎉 CONGRATULATIONS! 🎉</h1>

        <p className="completion-message">
          {isAllPlanetsVisited
            ? `You have completed SPACE ACADEMY CODE THE GALAXY!\n\nAll planets visited! Final Score: ${totalScore}`
            : "Stage Complete!"}
        </p>

        <div className="score-board">
          <h2>SCORE</h2>
          <div className="score-display">{totalScore}</div>

          {isAllPlanetsVisited && (
            <p className="completion-rank">🏆 Join the Leaderboard</p>
          )}
        </div>

        {isAllPlanetsVisited && (
          <div className="leaderboard-preview">
            <h3>TOP 5 PLAYERS</h3>

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

        <button className="menu-button" onClick={handleNextAction}>
          {isAllPlanetsVisited ? "VIEW FULL LEADERBOARD" : "BACK TO MAIN HUB"}
        </button>
      </div>
    </div>
  );
};

export default GameStage;