import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import "./Leaderboard.css";

interface DisplayEntry {
  key: string;
  name: string;
  major: string;
  totalScore: number;
  isCurrentPlayer: boolean;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();

  const playerId = useGameStore((state) => state.playerId);
  const remoteLeaderboard = useGameStore((state) => state.remoteLeaderboard);
  const isLeaderboardLoading = useGameStore(
    (state) => state.isLeaderboardLoading
  );
  const fetchGlobalLeaderboard = useGameStore(
    (state) => state.fetchGlobalLeaderboard
  );

  // Local-only data (this device's own history) - used as a fallback
  // when the backend can't be reached, so the screen still shows
  // something instead of an empty table.
  const localLeaderboardEntries = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const playerData = useGameStore((state) => state.playerData);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const totalScore = useGameStore((state) => state.getTotalScore());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchGlobalLeaderboard();
  }, [fetchGlobalLeaderboard]);

  // Keep the local fallback list updated too, same as before - cheap,
  // and it's the only leaderboard the player sees at all if the
  // backend request above fails.
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

  const displayEntries: DisplayEntry[] = useMemo(() => {
    if (remoteLeaderboard.length > 0) {
      return remoteLeaderboard.map((entry) => ({
        key: entry.id,
        name: entry.name,
        major: entry.major || "-",
        totalScore: entry.totalScore,
        isCurrentPlayer: entry.id === playerId,
      }));
    }

    // Fallback: this device's local-only history.
    return [...localLeaderboardEntries]
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        key: `${entry.playerName}-${entry.totalScore}-${entry.timestamp}-${index}`,
        name: entry.playerName,
        major: entry.major || "-",
        totalScore: entry.totalScore,
        isCurrentPlayer:
          entry.playerName === playerData.name && entry.totalScore === totalScore,
      }));
  }, [remoteLeaderboard, localLeaderboardEntries, playerId, playerData.name, totalScore]);

  const isShowingFallback = remoteLeaderboard.length === 0;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h1>🏆 SPACE ACADEMY LEADERBOARD 🏆</h1>
          <p>
            {isShowingFallback
              ? "Menampilkan data lokal (tidak terhubung ke server)"
              : "Global Rankings - Top 50 Players"}
          </p>
        </div>

        <div className="leaderboard-section">
          {isLeaderboardLoading && displayEntries.length === 0 ? (
            <p style={{ textAlign: "center", color: "#00ffff", padding: 20 }}>
              Memuat papan peringkat...
            </p>
          ) : (
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
                {displayEntries.length > 0 ? (
                  displayEntries.slice(0, 50).map((entry, index) => {
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
                        key={entry.key}
                        className={`${entry.isCurrentPlayer ? "player-row glow" : ""} ${
                          index < 3 ? "top-rank" : ""
                        }`}
                      >
                        <td className="rank-col">
                          <span className="rank-badge">{rankLabel}</span>
                        </td>

                        <td className="name-col">{entry.name}</td>

                        <td className="major-col">{entry.major}</td>

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
          )}
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
