import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import type { NavigationRoute } from "../../types/threejs-intro.types";
import "./NavigationUI.css";

interface NavigationUIProps {
  visible: boolean;
  onSelectRoute: (route: NavigationRoute) => void;
}

const ROUTE_CONFIG: readonly {
  route: NavigationRoute;
  code: string;
  risk: "MED" | "HIGH";
}[] = [
  { route: "Mesin", code: "ENG-01", risk: "MED" },
  { route: "Navigasi", code: "NAV-02", risk: "HIGH" },
  { route: "Bensin", code: "FUEL-03", risk: "MED" },
  { route: "Blackhole", code: "GRAV-04", risk: "HIGH" },
];

const NavigationUI = ({ visible, onSelectRoute }: NavigationUIProps) => {
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).intro.navigationUI;

  if (!visible) return null;

  return (
    <section className="intro-route-layer" aria-labelledby="route-title">
      <div className="intro-route-panel">
        <header className="intro-route-header">
          <div>
            <span>{t.decisionWindow}</span>
            <h2 id="route-title">{t.chooseVector}</h2>
          </div>
          <p>{t.description}</p>
        </header>

        <div className="intro-route-grid">
          {ROUTE_CONFIG.map((cfg, index) => {
            const localizedRoute = t.routes[cfg.route];
            const riskLabel = cfg.risk === "HIGH" ? t.riskHigh : t.riskMed;

            return (
              <button
                key={cfg.route}
                type="button"
                className="intro-route-option"
                data-audio-cue="none"
                data-testid={`intro-route-${cfg.route.toLowerCase()}`}
                onClick={() => onSelectRoute(cfg.route)}
              >
                <span className="intro-route-index">0{index + 1}</span>
                <div className="intro-route-copy">
                  <span>{cfg.code}</span>
                  <strong>{localizedRoute.title}</strong>
                  <p>{localizedRoute.desc}</p>
                </div>
                <div className="intro-route-meta">
                  <span>{localizedRoute.telemetry}</span>
                  <strong className={cfg.risk === "HIGH" ? "is-high" : ""}>
                    {riskLabel}
                  </strong>
                </div>
                <i aria-hidden="true">→</i>
              </button>
            );
          })}
        </div>

        <footer className="intro-route-footer">
          <span>{t.selectOne}</span>
          <span>{t.uniqueProtocol}</span>
        </footer>
      </div>
    </section>
  );
};

export default NavigationUI;
