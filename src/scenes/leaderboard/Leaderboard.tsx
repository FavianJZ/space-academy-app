import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../../stores/useGameStore";
import { fetchGlobalLeaderboard } from "../../services/leaderboardService";
import { supabase, isSupabaseEnabled } from "../../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { LeaderboardEntry } from "../../types/game.types";
import { CadetDossierModal } from "../../components/specialization/CadetDossierModal";
import { getTranslation } from "../../i18n/translations";
import "./Leaderboard.css";

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).leaderboard;

  const leaderboardEntries = useGameStore((state) => state.leaderboard);
  const addLeaderboardEntry = useGameStore((state) => state.addLeaderboardEntry);
  const playerData = useGameStore((state) => state.playerData);
  const visitedPlanets = useGameStore((state) => state.visitedPlanets);
  const totalScore = useGameStore((state) => state.getTotalScore());
  const specializationResult = useGameStore((state) => state.specializationResult);
  const refreshSpecializationProfile = useGameStore((state) => state.refreshSpecializationProfile);
  const p2Name = useGameStore((state) => state.p2Name);
  const [showDossier, setShowDossier] = useState(false);

  const currentPlayerName = (playerData.name?.trim() || p2Name?.trim() || "");
  const normalizedCurrentName = currentPlayerName.toLowerCase();

  const leaderboard = useMemo(() => {
    if (isSupabaseEnabled()) {
      const list = [...remoteEntries];
      if (normalizedCurrentName && totalScore > 0) {
        const found = list.some(
          (e) => e.playerName.trim().toLowerCase() === normalizedCurrentName
        );
        if (!found) {
          list.push({
            playerName: currentPlayerName,
            totalScore,
            timestamp: Date.now(),
            major: playerData.major,
          });
        }
      }
      return list.sort((a, b) => b.totalScore - a.totalScore);
    }

    return [...leaderboardEntries].sort((a, b) => b.totalScore - a.totalScore);
  }, [
    leaderboardEntries,
    remoteEntries,
    normalizedCurrentName,
    totalScore,
    currentPlayerName,
    playerData.major,
  ]);

  const userRankIndex = useMemo(() => {
    if (!normalizedCurrentName) return -1;
    return leaderboard.findIndex(
      (entry) => entry.playerName.trim().toLowerCase() === normalizedCurrentName
    );
  }, [leaderboard, normalizedCurrentName]);

  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const userEntry = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;

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
      if (isSupabaseEnabled()) {
        useGameStore.setState({ leaderboard: mapped });
      }
    } catch (err) {
      console.warn("Failed to fetch global leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();


    const interval = setInterval(loadLeaderboard, 6000);


    let channel: RealtimeChannel | null = null;
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
          <h1>{t.title}</h1>
          <p>
            {t.subtitle}
            {isLoading ? (
              <span style={{ marginLeft: 8, fontSize: "0.8em", opacity: 0.7 }}>
                {t.syncing}
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
                {t.live}
              </span>
            ) : (
              <span style={{ marginLeft: 8, fontSize: "0.8em", opacity: 0.5 }}>
                {t.offline}
              </span>
            )}
          </p>
        </div>


        {userRank !== null && userEntry ? (
          <div className="user-rank-banner">
            <div className="user-rank-banner-left">
              <span className="user-rank-pulse" />
              <span className="user-rank-label">{t.yourRank}</span>
              <span className="user-rank-number">#{userRank}</span>
              <span className="user-rank-player">
                {userEntry.playerName} <span className="you-badge">{t.youTag}</span>
              </span>
            </div>
            <div className="user-rank-banner-right">
              <span className="user-rank-score-label">{t.scoreLabel}</span>
              <span className="user-rank-score-val">
                {userEntry.totalScore.toLocaleString()} PTS
              </span>
            </div>
          </div>
        ) : normalizedCurrentName && totalScore > 0 ? (
          <div className="user-rank-banner pending">
            <div className="user-rank-banner-left">
              <span className="user-rank-pulse" />
              <span className="user-rank-label">{t.currentPilot}</span>
              <span className="user-rank-player">
                {currentPlayerName} <span className="you-badge">{t.youTag}</span>
              </span>
            </div>
            <div className="user-rank-banner-right">
              <span className="user-rank-score-label">{t.scoreLabel}</span>
              <span className="user-rank-score-val">
                {totalScore.toLocaleString()} PTS
              </span>
            </div>
          </div>
        ) : null}

        <div className="leaderboard-section">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-col">{t.rankCol}</th>
                <th className="name-col">{t.nameCol}</th>
                <th className="major-col">{t.majorCol}</th>
                <th className="score-col">{t.scoreCol}</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.length > 0 ? (
                <>
                  {leaderboard.slice(0, 50).map((entry, index) => {
                    const isCurrentPlayer =
                      Boolean(normalizedCurrentName) &&
                      entry.playerName.trim().toLowerCase() === normalizedCurrentName;

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

                        <td className="name-col">
                          <span className="player-name-text">{entry.playerName}</span>
                          {isCurrentPlayer && (
                            <span className="you-badge">{t.youTag}</span>
                          )}
                        </td>

                        <td className="major-col">{entry.major || "-"}</td>

                        <td className="score-col">
                          <span className="score-badge">{entry.totalScore}</span>
                        </td>
                      </tr>
                    );
                  })}


                  {userRankIndex >= 50 && userEntry && (
                    <>
                      <tr className="separator-row">
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "center",
                            padding: "8px",
                            color: "#00ffff",
                            opacity: 0.6,
                            letterSpacing: "4px",
                          }}
                        >
                          • • •
                        </td>
                      </tr>
                      <tr className="player-row glow">
                        <td className="rank-col">
                          <span className="rank-badge">#{userRank}</span>
                        </td>
                        <td className="name-col">
                          <span className="player-name-text">{userEntry.playerName}</span>
                          <span className="you-badge">{t.youTag}</span>
                        </td>
                        <td className="major-col">{userEntry.major || "-"}</td>
                        <td className="score-col">
                          <span className="score-badge">{userEntry.totalScore}</span>
                        </td>
                      </tr>
                    </>
                  )}
                </>
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
                    {t.noScoresYet}
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
              {t.specializationDossierBtn}
            </button>
          )}
          <button className="back-button" onClick={() => navigate("/mainhub")}>
            {t.backToHubBtn}
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
