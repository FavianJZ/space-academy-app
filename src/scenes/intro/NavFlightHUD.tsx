import React, { useEffect, useRef, useState } from "react";

import {
  FLIGHT_TUNING,
  LANDING_GATE_INDEX,
  NAV_FLIGHT_GATES,
  type NavFlightTelemetry,
} from "./navFlightConfig";

import "./NavFlightHUD.css";

interface NavFlightHUDProps {
  visible: boolean;
  telemetryRef: React.MutableRefObject<NavFlightTelemetry>;
}

/** Discrete slice of telemetry — the only part allowed to re-render React. */
interface DiscreteState {
  gateIndex: number;
  isLandingGate: boolean;
  onScreen: boolean;
  boundaryWarning: boolean;
  idleHint: boolean;
}

/**
 * Continuous values (position, distance, throttle) are written straight to the
 * DOM from a rAF loop. Only the handful of discrete values below are allowed to
 * trigger a React render, so a 60 fps HUD costs no reconciliation.
 */
export const NavFlightHUD: React.FC<NavFlightHUDProps> = ({
  visible,
  telemetryRef,
}) => {
  const reticleRef = useRef<HTMLDivElement>(null);
  const reticleLabelRef = useRef<HTMLSpanElement>(null);
  const edgeRef = useRef<HTMLDivElement>(null);
  const edgeLabelRef = useRef<HTMLDivElement>(null);
  const distanceRef = useRef<HTMLElement>(null);
  const throttleBarRef = useRef<HTMLSpanElement>(null);
  const throttleValueRef = useRef<HTMLElement>(null);
  const speedBarRef = useRef<HTMLSpanElement>(null);
  const speedValueRef = useRef<HTMLElement>(null);
  const attitudeRef = useRef<HTMLDivElement>(null);

  const [discrete, setDiscrete] = useState<DiscreteState>({
    gateIndex: 0,
    isLandingGate: false,
    onScreen: true,
    boundaryWarning: false,
    idleHint: false,
  });
  const discreteRef = useRef(discrete);

  useEffect(() => {
    if (!visible) return;
    let frame = 0;

    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      const telemetry = telemetryRef.current;

      /* ---- continuous values: straight to the DOM --------------------- */
      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate(${
          telemetry.screenX * 100
        }vw, ${telemetry.screenY * 100}vh)`;
      }

      if (edgeRef.current) {
        // Park the arrow on an ellipse just inside the viewport edge, rotated
        // to point at the gate.
        edgeRef.current.style.transform = `rotate(${telemetry.bearingDeg}deg) translateY(-38vh)`;
      }

      const distanceText = `${telemetry.distance.toFixed(0)} KM`;
      if (distanceRef.current) distanceRef.current.textContent = distanceText;
      if (edgeLabelRef.current) {
        edgeLabelRef.current.textContent = distanceText;
        // The wrapper is rotated to aim the arrow, so the text is counter
        // rotated to stay upright and readable.
        edgeLabelRef.current.style.transform = `rotate(${-telemetry.bearingDeg}deg)`;
      }
      if (reticleLabelRef.current) {
        reticleLabelRef.current.textContent = `${telemetry.gateCode} · ${distanceText}`;
      }

      if (throttleBarRef.current) {
        throttleBarRef.current.style.width = `${telemetry.throttle * 100}%`;
      }
      if (throttleValueRef.current) {
        throttleValueRef.current.textContent = `${Math.round(
          telemetry.throttle * 100
        )}%`;
      }
      if (speedBarRef.current) {
        speedBarRef.current.style.width = `${telemetry.speedRatio * 100}%`;
      }
      if (speedValueRef.current) {
        speedValueRef.current.textContent = `${(
          telemetry.speed * 42
        ).toFixed(0)} M/S`;
      }
      if (attitudeRef.current) {
        attitudeRef.current.textContent = `PITCH ${telemetry.pitchDeg
          .toFixed(0)
          .padStart(3, " ")}°   ROLL ${telemetry.rollDeg
          .toFixed(0)
          .padStart(4, " ")}°`;
      }

      /* ---- discrete values: only re-render when they actually change --- */
      const next: DiscreteState = {
        gateIndex: telemetry.gateIndex,
        isLandingGate: telemetry.isLandingGate,
        onScreen: telemetry.onScreen,
        boundaryWarning: telemetry.boundary > 0.12,
        idleHint: telemetry.idleHint,
      };
      const previous = discreteRef.current;
      if (
        next.gateIndex !== previous.gateIndex ||
        next.isLandingGate !== previous.isLandingGate ||
        next.onScreen !== previous.onScreen ||
        next.boundaryWarning !== previous.boundaryWarning ||
        next.idleHint !== previous.idleHint
      ) {
        discreteRef.current = next;
        setDiscrete(next);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [telemetryRef, visible]);

  const landingClass = discrete.isLandingGate ? " is-landing" : "";

  return (
    <div
      className={`nav-flight-hud${visible ? " is-visible" : ""}`}
      aria-hidden="true"
    >
      {/* On-screen target bracket */}
      {discrete.onScreen && (
        <div ref={reticleRef} className={`nav-flight-reticle${landingClass}`}>
          <span ref={reticleLabelRef} />
        </div>
      )}

      {/* Off-screen direction arrow */}
      {!discrete.onScreen && (
        <div ref={edgeRef} className={`nav-flight-edge${landingClass}`}>
          <div className="nav-flight-edge-inner">
            <div className="nav-flight-edge-arrow" />
            <div ref={edgeLabelRef} className="nav-flight-edge-label" />
          </div>
        </div>
      )}

      <div className={`nav-flight-target${landingClass}`}>
        <b>
          {discrete.isLandingGate
            ? "LANDING GATE"
            : NAV_FLIGHT_GATES[discrete.gateIndex]?.code ?? "--"}
        </b>
        <i>
          {discrete.isLandingGate
            ? "ORBIT AMBIL ALIH"
            : `GERBANG ${discrete.gateIndex + 1} / ${LANDING_GATE_INDEX}`}
        </i>
        <div className="nav-flight-progress">
          {NAV_FLIGHT_GATES.map((gate, index) => (
            <i
              key={gate.id}
              className={
                index < discrete.gateIndex
                  ? "done"
                  : index === discrete.gateIndex
                    ? "active"
                    : ""
              }
            />
          ))}
        </div>
        <em ref={distanceRef}>0 KM</em>
      </div>

      <div className="nav-flight-throttle">
        <div className="nav-flight-throttle-row">
          <span>THROTTLE</span>
          <strong ref={throttleValueRef}>0%</strong>
        </div>
        <div className="nav-flight-bar">
          <span ref={throttleBarRef} />
        </div>
        <div className="nav-flight-throttle-row">
          <span>VELOCITY</span>
          <strong ref={speedValueRef}>
            {(FLIGHT_TUNING.minSpeed * 42).toFixed(0)} M/S
          </strong>
        </div>
        <div className="nav-flight-bar is-speed">
          <span ref={speedBarRef} />
        </div>
        <div ref={attitudeRef} className="nav-flight-attitude">
          PITCH 0° ROLL 0°
        </div>
      </div>

      <div
        className={`nav-flight-controls${
          discrete.gateIndex > 1 ? " is-dim" : ""
        }`}
      >
        <span>FLIGHT CONTROL</span>
        <dl>
          <dt>
            <kbd>W</kbd>
            <kbd>S</kbd>
          </dt>
          <dd>PITCH — turunkan / angkat hidung</dd>
          <dt>
            <kbd>A</kbd>
            <kbd>D</kbd>
          </dt>
          <dd>ROLL — miringkan sayap kiri / kanan</dd>
          <dt>
            <kbd>Q</kbd>
            <kbd>E</kbd>
          </dt>
          <dd>YAW — putar ekor kiri / kanan</dd>
          <dt>
            <kbd className="wide">SPACE</kbd>
          </dt>
          <dd>TAHAN — tambah dorongan</dd>
        </dl>
      </div>

      <div
        className={`nav-flight-hint${discrete.idleHint ? " is-visible" : ""}`}
      >
        IKUTI PANAH BIRU MENUJU GERBANG BERIKUTNYA
      </div>

      <div
        className={`nav-flight-warning${
          discrete.boundaryWarning ? " is-visible" : ""
        }`}
      >
        BATAS SEKTOR // AUTOPILOT MENGOREKSI HALUAN
      </div>
    </div>
  );
};

export default NavFlightHUD;
