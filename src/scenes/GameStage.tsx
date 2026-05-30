import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/useGameStore';
import Stage1Introduction from '../components/stages/Stage1Introduction';
import Stage2MultipleChoice from '../components/stages/Stage2MultipleChoice';
import Stage3PuzzleGame from '../components/stages/Stage3PuzzleGame';
import Stage4FlowchartFixer from '../components/stages/Stage4FlowchartFixer';
import Stage5LogicFlow from '../components/stages/Stage5LogicFlow';
import Stage6BugHunt from '../components/stages/Stage6BugHunt';
import './GameStage.css';

const GameStage: React.FC = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const playerData = useGameStore((state) => state.playerData);
  const planetId = parseInt(stageId || '1') as 1 | 2 | 3 | 4 | 5 | 6;

  if (!playerData.name) {
    return (
      <div className="game-stage-error">
        <h1>Error: Player data not found</h1>
        <button onClick={() => navigate('/')}>Go Back</button>
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
        return <Stage1Introduction planetId={planetId} />;
    }
  };

  return (
    <div className="game-stage-container">
      <Suspense fallback={<div className="loading">Loading stage...</div>}>{renderStage()}</Suspense>
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

  React.useEffect(() => {
    
    addLeaderboardEntry({
      playerName: playerData.name,
      totalScore,
      timestamp: Date.now(),
      major: playerData.major as 'IPA' | 'IPS' | '',
    });
  }, []);

  const handleNextAction = () => {
    // If all planets visited, go to leaderboard, otherwise go back to main hub
    if (visitedPlanets.size >= 6) {
      navigate('/leaderboard');
    } else {
      navigate('/mainhub');
    }
  };

  return (
    <div className="completion-screen">
      <div className="completion-content">
        <h1>🎉 CONGRATULATIONS! 🎉</h1>
        <p className="completion-message">
          {visitedPlanets.size >= 6
            ? `You have completed SPACE ACADEMY CODE THE GALAXY!\n\nAll planets visited! Final Score: ${totalScore}`
            : 'Stage Complete!'}
        </p>

        <div className="score-board">
          <h2>SCORE</h2>
          <div className="score-display">{totalScore}</div>
          {visitedPlanets.size >= 6 && <p className="completion-rank">🏆 Join the Leaderboard</p>}
        </div>

        {visitedPlanets.size >= 6 && (
          <div className="leaderboard-preview">
            <h3>TOP 5 PLAYERS</h3>
            <div className="mini-leaderboard">
              {leaderboard.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="leaderboard-mini-row">
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{entry.playerName}</span>
                  <span className="score">{entry.totalScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="menu-button" onClick={handleNextAction}>
          {visitedPlanets.size >= 6 ? 'VIEW FULL LEADERBOARD' : 'BACK TO MAIN HUB'}
        </button>
      </div>
    </div>
  );
};

export default GameStage;
