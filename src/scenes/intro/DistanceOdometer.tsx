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
      setTotalDistance(0);
      return;
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
    <div className="distance-odometer">
      <div className="odometer-display">
        <span className="odometer-label">DISTANCE:</span>
        <span className="odometer-value">{distance}</span>
        <span className="odometer-unit">LY</span>
      </div>
    </div>
  );
};

export default DistanceOdometer;