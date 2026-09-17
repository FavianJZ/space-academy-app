import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import "./SystemInitUI.css";

interface SystemInitUIProps {
  visible: boolean;
  statusText: string;
  onStartMission: () => void;
}

const SystemInitUI = ({ visible, statusText, onStartMission }: SystemInitUIProps) => {
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).intro.systemInit;

  if (!visible) return null;

  return (
    <section className="intro-init-layer" aria-labelledby="intro-init-title">
      <div className="intro-init-vignette" aria-hidden="true" />

      <header className="intro-init-header">
        <div className="intro-init-brand">
          <span className="intro-init-beacon" />
          <div>
            <span>{t.missionChannel}</span>
            <strong>{t.spaceAcademy}</strong>
          </div>
        </div>
        <div className="intro-init-signal">
          <span>{t.encryptedSignal}</span>
          <strong>{t.locked}</strong>
        </div>
      </header>

      <div className="intro-init-reticle" aria-hidden="true">
        <i />
        <span>AO-771</span>
      </div>

      <div className="intro-init-panel">
        <span className="intro-init-kicker">{t.cockpitTransmission}</span>
        <h1 id="intro-init-title">
          {t.titlePre}
          <em>{t.titleEm}</em>
        </h1>
        <p>{t.description}</p>

        <div className="intro-init-checks" aria-label="Status sistem">
          <div><span>{t.cockpitFeed}</span><strong>{t.online}</strong></div>
          <div><span>{t.aiCompanion}</span><strong>{t.standby}</strong></div>
          <div><span>{t.routeMemory}</span><strong>{t.unstable}</strong></div>
        </div>

        <div className="intro-init-command">
          <span className="intro-init-status">{statusText}</span>
          <button id="btn-start-mission" type="button" onClick={onStartMission}>
            <span>{t.enterCockpit}</span>
            <strong>{t.beginTransmission}</strong>
          </button>
        </div>
      </div>

      <footer className="intro-init-footer" aria-hidden="true">
        <span>{t.footerRec}</span>
        <span>{t.footerSector}</span>
        <span>{t.footerAudio}</span>
      </footer>
    </section>
  );
};

export default SystemInitUI;
