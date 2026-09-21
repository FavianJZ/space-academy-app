import React from "react";
import type { RemoteCoPilot } from "../../../types/game.types";
import "./CoPilotTelemetryHUD.css";

interface CoPilotTelemetryHUDProps {
  coPilot: RemoteCoPilot;
  lastLaserTime?: number;
}

export const CoPilotTelemetryHUD: React.FC<CoPilotTelemetryHUDProps> = ({
  coPilot,
  lastLaserTime,
}) => {
  const isRecentAttack = lastLaserTime && Date.now() - lastLaserTime < 800;

  return (
    <div className={`copilot-hud-card ${isRecentAttack ? "is-firing" : ""}`}>
      <div className="copilot-hud-top">
        <div className="copilot-hud-avatar">
          {coPilot.character === "pink" ? "🌸" : "🤖"}
        </div>
        <div className="copilot-hud-info">
          <div className="copilot-label">
            <span className="live-dot" /> CO-PILOT LINK
          </div>
          <div className="copilot-name">{coPilot.name.toUpperCase()}</div>
        </div>
      </div>

      <div className="copilot-hud-stats">
        <div className="copilot-stat">
          <span className="stat-label">DMG</span>
          <span className="stat-val dmg-val">{coPilot.damage.toLocaleString()}</span>
        </div>
        <div className="copilot-stat">
          <span className="stat-label">COMBO</span>
          <span className="stat-val combo-val">{coPilot.combo}x</span>
        </div>
      </div>
    </div>
  );
};

export default CoPilotTelemetryHUD;
