import type { NavigationRoute } from "../../types/threejs-intro.types";
import "./NavigationUI.css";

interface NavigationUIProps {
  visible: boolean;
  onSelectRoute: (route: NavigationRoute) => void;
}

type RouteProfile = {
  route: NavigationRoute;
  code: string;
  title: string;
  description: string;
  telemetry: string;
  risk: "MED" | "HIGH";
};

const ROUTES: readonly RouteProfile[] = [
  {
    route: "Mesin",
    code: "ENG-01",
    title: "RESTORE ENGINE",
    description: "Alihkan daya ke mesin utama dan stabilkan dorongan.",
    telemetry: "THRUST 42%",
    risk: "MED",
  },
  {
    route: "Navigasi",
    code: "NAV-02",
    title: "MANUAL VECTOR",
    description: "Kalibrasi ulang koordinat dengan kendali manual.",
    telemetry: "DRIFT +18°",
    risk: "HIGH",
  },
  {
    route: "Bensin",
    code: "FUEL-03",
    title: "RESERVE FUEL",
    description: "Buka cadangan energi untuk mempertahankan lintasan.",
    telemetry: "RESERVE 31%",
    risk: "MED",
  },
  {
    route: "Blackhole",
    code: "GRAV-04",
    title: "GRAVITY SLINGSHOT",
    description: "Gunakan anomali gravitasi sebagai jalur pintas berisiko.",
    telemetry: "MASS CRITICAL",
    risk: "HIGH",
  },
];

const NavigationUI = ({ visible, onSelectRoute }: NavigationUIProps) => {
  if (!visible) return null;

  return (
    <section className="intro-route-layer" aria-labelledby="route-title">
      <div className="intro-route-panel">
        <header className="intro-route-header">
          <div>
            <span>DECISION WINDOW // 04 VECTORS</span>
            <h2 id="route-title">Choose a recovery vector.</h2>
          </div>
          <p>
            Navigasi otomatis terputus. Setiap jalur menjalankan prosedur,
            risiko, dan lintasan penerbangan yang berbeda.
          </p>
        </header>

        <div className="intro-route-grid">
          {ROUTES.map((profile, index) => (
            <button
              key={profile.route}
              type="button"
              className="intro-route-option"
              data-audio-cue="none"
              data-testid={`intro-route-${profile.route.toLowerCase()}`}
              onClick={() => onSelectRoute(profile.route)}
            >
              <span className="intro-route-index">0{index + 1}</span>
              <div className="intro-route-copy">
                <span>{profile.code}</span>
                <strong>{profile.title}</strong>
                <p>{profile.description}</p>
              </div>
              <div className="intro-route-meta">
                <span>{profile.telemetry}</span>
                <strong className={profile.risk === "HIGH" ? "is-high" : ""}>
                  {profile.risk} RISK
                </strong>
              </div>
              <i aria-hidden="true">→</i>
            </button>
          ))}
        </div>

        <footer className="intro-route-footer">
          <span>SELECT ONE VECTOR</span>
          <span>EACH VECTOR RUNS A UNIQUE FLIGHT PROTOCOL</span>
        </footer>
      </div>
    </section>
  );
};

export default NavigationUI;
