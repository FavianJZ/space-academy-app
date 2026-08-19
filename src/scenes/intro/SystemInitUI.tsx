import "./SystemInitUI.css";

interface SystemInitUIProps {
  visible: boolean;
  statusText: string;
  onStartMission: () => void;
}

const SystemInitUI = ({ visible, statusText, onStartMission }: SystemInitUIProps) => {
  if (!visible) return null;

  return (
    <section className="intro-init-layer" aria-labelledby="intro-init-title">
      <div className="intro-init-vignette" aria-hidden="true" />

      <header className="intro-init-header">
        <div className="intro-init-brand">
          <span className="intro-init-beacon" />
          <div>
            <span>MISSION CHANNEL // 01</span>
            <strong>SPACE ACADEMY</strong>
          </div>
        </div>
        <div className="intro-init-signal">
          <span>ENCRYPTED SIGNAL</span>
          <strong>LOCKED</strong>
        </div>
      </header>

      <div className="intro-init-reticle" aria-hidden="true">
        <i />
        <span>AO-771</span>
      </div>

      <div className="intro-init-panel">
        <span className="intro-init-kicker">COCKPIT TRANSMISSION</span>
        <h1 id="intro-init-title">
          Signal found.
          <em>Mission unknown.</em>
        </h1>
        <p>
          Tautan kokpit aktif. Masuk ke rekaman penerbangan terakhir dan ambil
          alih keputusan sebelum jalur navigasi terputus.
        </p>

        <div className="intro-init-checks" aria-label="Status sistem">
          <div><span>COCKPIT FEED</span><strong>ONLINE</strong></div>
          <div><span>AI COMPANION</span><strong>STANDBY</strong></div>
          <div><span>ROUTE MEMORY</span><strong>UNSTABLE</strong></div>
        </div>

        <div className="intro-init-command">
          <span className="intro-init-status">{statusText}</span>
          <button id="btn-start-mission" type="button" onClick={onStartMission}>
            <span>ENTER COCKPIT</span>
            <strong>BEGIN TRANSMISSION →</strong>
          </button>
        </div>
      </div>

      <footer className="intro-init-footer" aria-hidden="true">
        <span>REC // 18:42:09</span>
        <span>SECTOR 07 · OUTER RIM</span>
        <span>AUDIO LINK READY</span>
      </footer>
    </section>
  );
};

export default SystemInitUI;
