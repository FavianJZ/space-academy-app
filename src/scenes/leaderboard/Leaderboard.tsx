import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import "./Leaderboard.css";

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();

  const leaderboardEntries = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const playerData = useGameStore((state) => state.playerData);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const totalScore = useGameStore((state) => state.getTotalScore());
  const leaderboard = useMemo(
    () => [...leaderboardEntries].sort((a, b) => b.totalScore - a.totalScore),
    [leaderboardEntries]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (visitedPlanets.size < 6) return;

    const playerName = playerData.name?.trim();
    if (!playerName) return;

    addLeaderboardEntry({
      playerName,
      totalScore,
      timestamp: Date.now(),
      major: playerData.major,
    });
  }, [
    visitedPlanets.size,
    playerData.name,
    playerData.major,
    totalScore,
    addLeaderboardEntry,
  ]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h1>🏆 SPACE ACADEMY LEADERBOARD 🏆</h1>
          <p>Global Rankings - Top 50 Players</p>
        </div>

        <div className="leaderboard-section">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">Rank</th>
                <th className="name-col">Player Name</th>
                <th className="major-col">Major</th>
                <th className="score-col">Score</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 50).map((entry, index) => {
                  const isCurrentPlayer =
                    entry.playerName === playerData.name &&
                    entry.totalScore === totalScore;

                  const rankLabel =
                    index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `#${index + 1}`;

                  return (
                    <tr
                      key={`${entry.playerName}-${entry.totalScore}-${entry.timestamp}-${index}`}
                      className={`${isCurrentPlayer ? "player-row glow" : ""} ${
                        index < 3 ? "top-rank" : ""
                      }`}
                    >
                      <td className="rank-col">
                        <span className="rank-badge">{rankLabel}</span>
                      </td>

                      <td className="name-col">{entry.playerName}</td>

                      <td className="major-col">{entry.major || "-"}</td>

                      <td className="score-col">
                        <span className="score-badge">{entry.totalScore}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#00ffff",
                    }}
                  >
                    No scores yet. Complete the game to appear on the
                    leaderboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="leaderboard-footer">
          <button className="back-button" onClick={() => navigate("/mainhub")}>
            BACK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
