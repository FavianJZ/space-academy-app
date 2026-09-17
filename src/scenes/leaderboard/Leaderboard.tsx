import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import { fetchGlobalLeaderboard } from "../../services/leaderboardService";
import { supabase, isSupabaseEnabled } from "../../lib/supabase";
import type { LeaderboardEntry } from "../../types/game.types";
import { CadetDossierModal } from "../../components/specialization/CadetDossierModal";
import "./Leaderboard.css";

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const leaderboardEntries = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const playerData = useGameStore((state) => state.playerData);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const totalScore = useGameStore((state) => state.getTotalScore());
  const specializationResult = useGameStore((state) => state.specializationResult);
  const refreshSpecializationProfile = useGameStore((state) => state.refreshSpecializationProfile);
  const [showDossier, setShowDossier] = useState(false);

  const leaderboard = useMemo(() => {
    const merged = new Map<string, LeaderboardEntry>();

    for (const entry of remoteEntries) {
      const existing = merged.get(entry.playerName);
      if (!existing || entry.totalScore > existing.totalScore) {
        merged.set(entry.playerName, entry);
      }
    }

    for (const entry of leaderboardEntries) {
      const existing = merged.get(entry.playerName);
      if (!existing || entry.totalScore > existing.totalScore) {
        merged.set(entry.playerName, entry);
      }
    }

    return [...merged.values()].sort((a, b) => b.totalScore - a.totalScore);
  }, [leaderboardEntries, remoteEntries]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const rows = await fetchGlobalLeaderboard();
      const mapped: LeaderboardEntry[] = rows.map((r) => ({
        playerName: r.player_name,
        totalScore: r.total_score,
        timestamp: new Date(r.updated_at).getTime(),
        major: (r.major || "") as LeaderboardEntry["major"],
      }));
      setRemoteEntries(mapped);
    } catch (err) {
      console.warn("Failed to fetch global leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();

    // Polling fallback every 6 seconds
    const interval = setInterval(loadLeaderboard, 6000);

    // Supabase Realtime Channel
    let channel: any = null;
    if (isSupabaseEnabled() && supabase) {
      channel = supabase
        .channel("realtime-global-leaderboard")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "leaderboard",
          },
          () => {
            loadLeaderboard();
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadLeaderboard]);

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
          <p>
            Global Rankings - Top 50 Players
            {isLoading ? (
              <span style={{ marginLeft: 8, fontSize: "0.8em", opacity: 0.7 }}>
                ⏳ Syncing...
              </span>
            ) : isSupabaseEnabled() ? (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.8em",
                  color: "#00ffcc",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#00ffcc",
                    boxShadow: "0 0 8px #00ffcc",
                    display: "inline-block",
                  }}
                />
                LIVE Realtime
              </span>
            ) : (
              <span style={{ marginLeft: 8, fontSize: "0.8em", opacity: 0.5 }}>
                📱 Offline
              </span>
            )}
          </p>
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
          {specializationResult && (
            <button
              className="lb-dossier-btn"
              onClick={() => {
                refreshSpecializationProfile();
                setShowDossier(true);
              }}
            >
              🎓 SPECIALIZATION DOSSIER
            </button>
          )}
          <button className="back-button" onClick={() => navigate("/mainhub")}>
            BACK TO HUB
          </button>
        </div>
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

export default Leaderboard;
