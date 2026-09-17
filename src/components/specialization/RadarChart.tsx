import React from "react";
import type { RadarScores } from "../../types/specialization.types";

interface RadarChartProps {
  scores: RadarScores;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores }) => {
  const vbWidth = 420;
  const vbHeight = 280;
  const center = { x: vbWidth / 2, y: vbHeight / 2 };
  const radius = 80;

  const axes = [
    { label: "SYSTEM ARCHITECT", key: "system", angle: -Math.PI / 2, color: "#ff8fc9" },
    { label: "AI & LOGIC", key: "aiLogic", angle: 0, color: "#aa66ff" },
    { label: "QUALITY & CYBER", key: "debugging", angle: Math.PI / 2, color: "#00ffcc" },
    { label: "INTERACTIVE TECH", key: "creative", angle: Math.PI, color: "#00ccff" },
  ] as const;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = axes
    .map((axis) => {
      const value = scores[axis.key] || 40;
      const normalized = Math.max(0.15, Math.min(1.0, value / 100));
      const r = radius * normalized;
      const x = center.x + r * Math.cos(axis.angle);
      const y = center.y + r * Math.sin(axis.angle);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="radar-chart-container">
      <svg
        className="radar-chart-svg"
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        style={{ width: "100%", maxWidth: `${vbWidth}px`, height: "auto", display: "block" }}
      >
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0, 255, 204, 0.25)" />
            <stop offset="70%" stopColor="rgba(170, 102, 255, 0.12)" />
            <stop offset="100%" stopColor="rgba(0, 204, 255, 0)" />
          </radialGradient>
          <linearGradient id="poly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8fc9" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#aa66ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#00ffcc" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Lingkaran Background Glow */}
        <circle cx={center.x} cy={center.y} r={radius} fill="url(#radar-glow)" />

        {/* Poligon Grid Web (25%, 50%, 75%, 100%) */}
        {gridLevels.map((lvl) => {
          const r = radius * lvl;
          const points = axes
            .map((axis) => {
              const x = center.x + r * Math.cos(axis.angle);
              const y = center.y + r * Math.sin(axis.angle);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              key={lvl}
              points={points}
              fill="none"
              stroke="rgba(126, 249, 255, 0.18)"
              strokeDasharray={lvl === 1.0 ? "none" : "3,3"}
              strokeWidth={lvl === 1.0 ? "1.5" : "1"}
            />
          );
        })}

        {/* Garis Sumbu (Spokes) */}
        {axes.map((axis) => {
          const x = center.x + radius * Math.cos(axis.angle);
          const y = center.y + radius * Math.sin(axis.angle);
          return (
            <line
              key={axis.label}
              x1={center.x}
              y1={center.y}
              x2={x}
              y2={y}
              stroke="rgba(126, 249, 255, 0.25)"
              strokeWidth="1"
            />
          );
        })}

        {/* Poligon Nilai Pemain */}
        <polygon
          points={polygonPoints}
          fill="url(#poly-gradient)"
          stroke="#00ffcc"
          strokeWidth="2.5"
          style={{
            filter: "drop-shadow(0 0 10px rgba(0, 255, 204, 0.7))",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Titik Vertex (Simpul Sumbu) */}
        {axes.map((axis) => {
          const value = scores[axis.key] || 40;
          const normalized = Math.max(0.15, Math.min(1.0, value / 100));
          const r = radius * normalized;
          const x = center.x + r * Math.cos(axis.angle);
          const y = center.y + r * Math.sin(axis.angle);
          return (
            <g key={axis.key}>
              <circle cx={x} cy={y} r="5" fill={axis.color} stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="9" fill="none" stroke={axis.color} strokeWidth="1" opacity="0.6" />
            </g>
          );
        })}

        {/* Label TOP: SYSTEM ARCHITECT */}
        <text
          x={center.x}
          y={center.y - radius - 24}
          textAnchor="middle"
          fill={axes[0].color}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
          fontFamily="inherit"
        >
          {axes[0].label}
        </text>
        <text
          x={center.x}
          y={center.y - radius - 8}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="900"
          fontFamily="inherit"
        >
          {scores.system}%
        </text>

        {/* Label RIGHT: AI & LOGIC */}
        <text
          x={center.x + radius + 14}
          y={center.y - 4}
          textAnchor="start"
          fill={axes[1].color}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
          fontFamily="inherit"
        >
          {axes[1].label}
        </text>
        <text
          x={center.x + radius + 14}
          y={center.y + 14}
          textAnchor="start"
          fill="#ffffff"
          fontSize="13"
          fontWeight="900"
          fontFamily="inherit"
        >
          {scores.aiLogic}%
        </text>

        {/* Label BOTTOM: QUALITY & CYBER */}
        <text
          x={center.x}
          y={center.y + radius + 22}
          textAnchor="middle"
          fill={axes[2].color}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
          fontFamily="inherit"
        >
          {axes[2].label}
        </text>
        <text
          x={center.x}
          y={center.y + radius + 38}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="900"
          fontFamily="inherit"
        >
          {scores.debugging}%
        </text>

        {/* Label LEFT: INTERACTIVE TECH */}
        <text
          x={center.x - radius - 14}
          y={center.y - 4}
          textAnchor="end"
          fill={axes[3].color}
          fontSize="10"
          fontWeight="700"
          letterSpacing="1"
          fontFamily="inherit"
        >
          {axes[3].label}
        </text>
        <text
          x={center.x - radius - 14}
          y={center.y + 14}
          textAnchor="end"
          fill="#ffffff"
          fontSize="13"
          fontWeight="900"
          fontFamily="inherit"
        >
          {scores.creative}%
        </text>
      </svg>

      {/* Sleek Bottom Legend Bar */}
      <div className="radar-legend-bar">
        {axes.map((axis) => (
          <div key={axis.key} className="radar-legend-item">
            <span
              className="radar-legend-dot"
              style={{ backgroundColor: axis.color, boxShadow: `0 0 8px ${axis.color}` }}
            />
            <span className="radar-legend-name">{axis.label}</span>
            <strong className="radar-legend-score" style={{ color: axis.color }}>
              {scores[axis.key]}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};
