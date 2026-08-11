import React from "react";
import type { PlanetId, PlanetMeta, StageDescription } from "../../types/planet.types";
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

const getProgressCopy = (completedCount: number, totalStages: number) => {
  if (completedCount >= totalStages) {
    return "All sectors cleared";
  }

  if (completedCount === 0) {
    return "First mission awaiting launch";
  }

  return `${totalStages - completedCount} sectors remaining`;
};

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
  const progress = totalStages > 0 ? (completedCount / totalStages) * 100 : 0;
  const selectedStage = stages.find((stage) => stage.id === selectedStageId);
  const nextStage = stages.find((stage) => !stage.completed) ?? stages[0];

  return (
    <section className="mh-dashboard-shell" aria-label="Mission dashboard">
      <header className="mh-dashboard-command">
        <div>
          <p className="mh-dashboard-kicker">Space Academy command</p>
          <h1 className="mh-dashboard-title">
            Welcome, {playerName || "Cadet"}
          </h1>
          <p className="mh-dashboard-subtitle">
            {getProgressCopy(completedCount, totalStages)}
          </p>
        </div>

        <div className="mh-dashboard-actions" aria-label="Dashboard actions">
          <button type="button" onClick={onOpenLeaderboard}>
            Leaderboard
          </button>
          <button type="button" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
      </header>

      <div className="mh-dashboard-grid">
        <article className="mh-dashboard-panel mh-dashboard-progress">
          <div className="mh-dashboard-panel-header">
            <span>Mission progress</span>
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
            <span>Total score</span>
            <strong>{totalScore.toLocaleString()}</strong>
          </div>
        </article>

        <article className="mh-dashboard-panel mh-dashboard-focus">
          <div className="mh-dashboard-panel-header">
            <span>Current target</span>
            <strong>{selectedStage ? "Selected" : "Next"}</strong>
          </div>

          <div
            className="mh-dashboard-focus-accent"
            style={
              {
                "--stage-color": selectedStage?.meta.color ?? nextStage?.meta.color,
              } as React.CSSProperties
            }
          />

          <h2>{selectedStage?.meta.name ?? nextStage?.meta.name}</h2>
          <p>
            {selectedStage?.description.description ??
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
            Open mission
          </button>
        </article>
      </div>

      <nav className="mh-dashboard-roadmap" aria-label="Planet mission roadmap">
        {stages.map((stage) => {
          const isSelected = stage.id === selectedStageId;

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
                <strong>{stage.meta.name}</strong>
                <small>{stage.description.displayTitle}</small>
              </span>
              <span className="mh-dashboard-stage-meta">
                {stage.score > 0 ? stage.score.toLocaleString() : "Ready"}
              </span>
            </button>
          );
        })}
      </nav>
    </section>
  );
};

export default MainHubDashboard;
