import React from 'react';
import './SystemInitUI.css';

interface SystemInitUIProps {
  visible: boolean;
  statusText: string;
  onStartMission: () => void;
}

export const SystemInitUI: React.FC<SystemInitUIProps> = ({
  visible,
  statusText,
  onStartMission,
}) => {
  if (!visible) return null;

  return (
    <div className="ui-layer">
      <div className="terminal-box">
        <h2 style={{ color: '#00ffff', letterSpacing: '2px' }}>
          [ SYSTEM INITIALIZATION ]
        </h2>
        <p id="status-text" style={{ marginBottom: '30px', color: '#00ffff' }}>
          {statusText}
        </p>
        <button
          id="btn-start-mission"
          className="mission-button"
          onClick={onStartMission}
        >
          [ INIT SEQUENCE : START ]
        </button>
      </div>
    </div>
  );
};

export default SystemInitUI;
