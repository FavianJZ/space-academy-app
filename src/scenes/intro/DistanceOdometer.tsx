import React, { useEffect, useState } from "react";
import "./DistanceOdometer.css";

interface DistanceOdometerProps {
  warpSpeed: number;
  isActive: boolean;
}

const DistanceOdometer: React.FC<DistanceOdometerProps> = ({
  warpSpeed,
  isActive,
}) => {
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    if (!isActive) {
      const resetFrame = window.requestAnimationFrame(() => setTotalDistance(0));
      return () => window.cancelAnimationFrame(resetFrame);
    }

    const interval = window.setInterval(() => {
      setTotalDistance((prevDistance) => {
        const increment = warpSpeed * 0.1;
        return prevDistance + increment;
      });
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [warpSpeed, isActive]);

  const distance = Math.floor(totalDistance).toString().padStart(5, "0");

  return (
    <aside className={`intro-telemetry ${isActive ? "is-active" : ""}`} aria-label="Telemetry penerbangan">
      <div className="intro-telemetry-row">
        <span>VECTOR DISTANCE</span>
        <div><strong>{distance}</strong><small>LY</small></div>
      </div>
      <div className="intro-telemetry-row">
        <span>WARP FACTOR</span>
        <div><strong>{warpSpeed.toFixed(1)}</strong><small>WF</small></div>
      </div>
      <div className="intro-telemetry-bars" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <i key={bar} className={warpSpeed >= (bar + 1) * 0.55 ? "active" : ""} />
        ))}
      </div>
    </aside>
  );
};

export default DistanceOdometer;
