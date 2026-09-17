import React from "react";
import type { PlanetId, PlanetMeta, StageDescription } from "../../types/planet.types";
import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import "./MainHubDashboard.css";

export interface DashboardStageItem {
  id: PlanetId;
  completed: boolean;
  meta: PlanetMeta;
  description: StageDescription;
  score: number;
  activePlayers: number;
}

export interface MainHubDashboardProps {
  playerName: string;
  totalScore: number;
  completedCount: number;
  totalStages: number;
  selectedStageId: PlanetId | null;
  stages: DashboardStageItem[];
  onSelectStage: (stageId: PlanetId) => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

const MainHubDashboard: React.FC<MainHubDashboardProps> = ({
  playerName,
  totalScore,
  completedCount,
  totalStages,
  selectedStageId,
  stages,
  onSelectStage,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language);

  const getProgressCopy = (completed: number, total: number) => {
    if (completed >= total) {
      return t.mainhub.allSectorsCleared;
    }

    if (completed === 0) {
      return t.mainhub.firstMissionAwaiting;
    }

    return t.mainhub.sectorsRemaining(total - completed);
  };

  const progress = totalStages > 0 ? (completedCount / totalStages) * 100 : 0;
  const selectedStage = stages.find((stage) => stage.id === selectedStageId);
  const nextStage = stages.find((stage) => !stage.completed) ?? stages[0];
  const activeStageId = selectedStage?.id ?? nextStage?.id;
  const activePlanetTranslation = activeStageId ? t.planets[activeStageId] : null;

  return (
    <section className="mh-dashboard-shell" aria-label="Mission dashboard">
      <header className="mh-dashboard-command">
        <div>
          <p className="mh-dashboard-kicker">{t.mainhub.spaceNav}</p>
          <h1 className="mh-dashboard-title">
            {t.mainhub.welcome} {playerName || t.mainhub.cadet}
          </h1>
          <p className="mh-dashboard-subtitle">
            {getProgressCopy(completedCount, totalStages)}
          </p>
        </div>

        <div className="mh-dashboard-actions" aria-label="Dashboard actions">
          <button type="button" onClick={onOpenLeaderboard}>
            {t.mainhub.viewLeaderboard}
          </button>
          <button type="button" onClick={onOpenSettings}>
            {t.mainhub.settings}
          </button>
        </div>
      </header>

      <div className="mh-dashboard-grid">
        <article className="mh-dashboard-panel mh-dashboard-progress">
          <div className="mh-dashboard-panel-header">
            <span>{t.mainhub.missionProgress}</span>
            <strong>
              {completedCount}/{totalStages}
            </strong>
          </div>

          <div
            className="mh-dashboard-progress-ring"
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
            aria-label={`${Math.round(progress)} percent complete`}
          >
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="mh-dashboard-score-row">
            <span>{t.mainhub.totalScore}</span>
            <strong>{totalScore.toLocaleString()}</strong>
          </div>
        </article>

        <article className="mh-dashboard-panel mh-dashboard-focus">
          <div className="mh-dashboard-panel-header">
            <span>{t.mainhub.currentTarget}</span>
            <strong>{selectedStage ? t.mainhub.selected : t.mainhub.next}</strong>
          </div>

          <div
            className="mh-dashboard-focus-accent"
            style={
              {
                "--stage-color": selectedStage?.meta.color ?? nextStage?.meta.color,
              } as React.CSSProperties
            }
          />

          <h2>{activePlanetTranslation?.name ?? selectedStage?.meta.name ?? nextStage?.meta.name}</h2>
          <p>
            {activePlanetTranslation?.description ??
              selectedStage?.description.description ??
              nextStage?.description.description}
          </p>

          <button
            type="button"
            className="mh-dashboard-primary"
            onClick={() => {
              const target = selectedStage?.id ?? nextStage?.id;
              if (target) {
                onSelectStage(target);
              }
            }}
          >
            {t.mainhub.openMission}
          </button>
        </article>
      </div>

      <nav className="mh-dashboard-roadmap" aria-label="Planet mission roadmap">
        {stages.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          const planetT = t.planets[stage.id];

          return (
            <button
              key={stage.id}
              type="button"
              className={`mh-dashboard-stage ${stage.completed ? "is-complete" : ""} ${
                isSelected ? "is-selected" : ""
              }`}
              style={{ "--stage-color": stage.meta.color } as React.CSSProperties}
              onClick={() => onSelectStage(stage.id)}
              aria-pressed={isSelected}
            >
              <span className="mh-dashboard-stage-orbit">{stage.id}</span>
              <span className="mh-dashboard-stage-copy">
                <strong>{planetT?.name ?? stage.meta.name}</strong>
                <small>{planetT?.displayTitle ?? stage.description.displayTitle}</small>
              </span>
              <span className="mh-dashboard-stage-meta">
                {stage.score > 0 ? stage.score.toLocaleString() : t.mainhub.ready}
              </span>
            </button>
          );
        })}
      </nav>
    </section>
  );
};

export default MainHubDashboard;
