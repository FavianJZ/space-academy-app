import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  setFlightAnalogState,
  resetFlightAnalogState,
} from "../../hooks/useFlightControls";
import { useGameStore } from "../../stores/useGameStore";
import "./FloatingFlightJoystick.css";

interface FloatingFlightJoystickProps {
  visible: boolean;
}

const MAX_RADIUS = 54; // Pixels from base center to knob limit

export const FloatingFlightJoystick: React.FC<FloatingFlightJoystickProps> = ({
  visible,
}) => {
  const language = useGameStore((state) => state.language);
  const isEn = language === "en";

  const [active, setActive] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTwoFingerBoost, setIsTwoFingerBoost] = useState(false);

  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const primaryTouchIdRef = useRef<number | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Cleanup on unmount or when visibility is toggled off
  useEffect(() => {
    if (!visible) {
      setActive(false);
      setIsTwoFingerBoost(false);
      primaryTouchIdRef.current = null;
      resetFlightAnalogState();
    }
  }, [visible]);

  // --- MOBILE TOUCH EVENTS (Multi-Touch: 1 finger joystick, 2 fingers turbo boost) ---
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!visible) return;

      // Allow clicks on interactive UI elements (audio settings, skip button, etc.)
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, select, .intro-ops-header, .intro-audio-btn, .audio-settings-modal, .intro-skip-control"
        )
      ) {
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      const touches = e.touches;
      setHasInteracted(true);

      // 1st Finger: becomes the primary steering joystick if not already assigned
      if (primaryTouchIdRef.current === null && touches.length > 0) {
        const primary = e.changedTouches[0] || touches[0];
        primaryTouchIdRef.current = primary.identifier;
        startPosRef.current = { x: primary.clientX, y: primary.clientY };
        setActive(true);

        if (baseRef.current) {
          baseRef.current.style.left = `${primary.clientX}px`;
          baseRef.current.style.top = `${primary.clientY}px`;
        }
        if (knobRef.current) {
          knobRef.current.style.transform = "translate3d(0, 0, 0)";
        }
        if (lineRef.current) {
          lineRef.current.style.width = "0px";
          lineRef.current.style.opacity = "0";
        }
      }

      // 2nd Finger (or more): activates TURBO BOOST!
      const hasTwoFingers = touches.length >= 2;
      setIsTwoFingerBoost(hasTwoFingers);

      setFlightAnalogState({
        active: true,
        throttle: hasTwoFingers,
      });
    },
    [visible]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!visible) return;
      if (e.cancelable) {
        e.preventDefault();
      }

      const touches = e.touches;
      const hasTwoFingers = touches.length >= 2;
      setIsTwoFingerBoost(hasTwoFingers);

      if (primaryTouchIdRef.current !== null) {
        let primaryTouch: React.Touch | null = null;
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].identifier === primaryTouchIdRef.current) {
            primaryTouch = touches[i];
            break;
          }
        }

        if (primaryTouch) {
          const dx = primaryTouch.clientX - startPosRef.current.x;
          const dy = primaryTouch.clientY - startPosRef.current.y;
          const dist = Math.hypot(dx, dy);

          let knobX = dx;
          let knobY = dy;
          if (dist > MAX_RADIUS) {
            knobX = (dx / dist) * MAX_RADIUS;
            knobY = (dy / dist) * MAX_RADIUS;
          }

          const nx = knobX / MAX_RADIUS;
          const ny = knobY / MAX_RADIUS;
          const magnitude = Math.min(dist / MAX_RADIUS, 1.0);

          if (knobRef.current) {
            knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;
          }

          if (lineRef.current) {
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
            const lineLen = Math.min(dist, MAX_RADIUS);
            lineRef.current.style.width = `${lineLen}px`;
            lineRef.current.style.transform = `rotate(${angleDeg}deg)`;
            lineRef.current.style.opacity = magnitude > 0.08 ? "0.9" : "0";
          }

          setFlightAnalogState({
            active: true,
            x: nx,
            y: ny,
            throttle: hasTwoFingers,
          });
        }
      }
    },
    [visible]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touches = e.touches;
      const hasTwoFingers = touches.length >= 2;
      setIsTwoFingerBoost(hasTwoFingers);

      // Check if primary joystick finger is still on screen
      let primaryStillPresent = false;
      if (primaryTouchIdRef.current !== null) {
        for (let i = 0; i < touches.length; i++) {
          if (touches[i].identifier === primaryTouchIdRef.current) {
            primaryStillPresent = true;
            break;
          }
        }
      }

      if (!primaryStillPresent) {
        if (touches.length > 0) {
          // Transfer joystick to remaining finger
          const next = touches[0];
          primaryTouchIdRef.current = next.identifier;
          startPosRef.current = { x: next.clientX, y: next.clientY };
          if (baseRef.current) {
            baseRef.current.style.left = `${next.clientX}px`;
            baseRef.current.style.top = `${next.clientY}px`;
          }
          if (knobRef.current) {
            knobRef.current.style.transform = "translate3d(0, 0, 0)";
          }
          if (lineRef.current) {
            lineRef.current.style.width = "0px";
            lineRef.current.style.opacity = "0";
          }
          setFlightAnalogState({
            active: true,
            x: 0,
            y: 0,
            throttle: hasTwoFingers,
          });
        } else {
          // All fingers lifted
          primaryTouchIdRef.current = null;
          setActive(false);
          setIsTwoFingerBoost(false);
          if (knobRef.current) {
            knobRef.current.style.transform = "translate3d(0, 0, 0)";
          }
          if (lineRef.current) {
            lineRef.current.style.width = "0px";
            lineRef.current.style.opacity = "0";
          }
          setFlightAnalogState({
            active: false,
            x: 0,
            y: 0,
            throttle: false,
          });
        }
      } else {
        // Primary still present, 2nd finger lifted
        setFlightAnalogState({
          throttle: hasTwoFingers,
        });
      }
    },
    []
  );

  // --- DESKTOP MOUSE FALLBACK ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!visible || e.pointerType === "touch" || e.button !== 0) return;

      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, select, .intro-ops-header, .intro-audio-btn, .audio-settings-modal, .intro-skip-control"
        )
      ) {
        return;
      }

      primaryTouchIdRef.current = e.pointerId;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      setActive(true);
      setHasInteracted(true);

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (baseRef.current) {
        baseRef.current.style.left = `${e.clientX}px`;
        baseRef.current.style.top = `${e.clientY}px`;
      }
      if (knobRef.current) {
        knobRef.current.style.transform = "translate3d(0, 0, 0)";
      }
      if (lineRef.current) {
        lineRef.current.style.width = "0px";
        lineRef.current.style.opacity = "0";
      }

      setFlightAnalogState({
        active: true,
        x: 0,
        y: 0,
      });
    },
    [visible]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!visible || e.pointerType === "touch" || !active || primaryTouchIdRef.current !== e.pointerId) return;

      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      let knobX = dx;
      let knobY = dy;
      if (dist > MAX_RADIUS) {
        knobX = (dx / dist) * MAX_RADIUS;
        knobY = (dy / dist) * MAX_RADIUS;
      }

      const nx = knobX / MAX_RADIUS;
      const ny = knobY / MAX_RADIUS;
      const magnitude = Math.min(dist / MAX_RADIUS, 1.0);

      if (knobRef.current) {
        knobRef.current.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;
      }

      if (lineRef.current) {
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        const lineLen = Math.min(dist, MAX_RADIUS);
        lineRef.current.style.width = `${lineLen}px`;
        lineRef.current.style.transform = `rotate(${angleDeg}deg)`;
        lineRef.current.style.opacity = magnitude > 0.08 ? "0.9" : "0";
      }

      setFlightAnalogState({
        active: true,
        x: nx,
        y: ny,
      });
    },
    [visible, active]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "touch") return;
      if (primaryTouchIdRef.current !== e.pointerId) return;

      primaryTouchIdRef.current = null;
      setActive(false);

      if (knobRef.current) {
        knobRef.current.style.transform = "translate3d(0, 0, 0)";
      }
      if (lineRef.current) {
        lineRef.current.style.width = "0px";
        lineRef.current.style.opacity = "0";
      }

      setFlightAnalogState({
        active: false,
        x: 0,
        y: 0,
        throttle: false,
      });
    },
    []
  );

  if (!visible) return null;

  return (
    <div
      className="floating-joystick-touch-zone"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Floating Dynamic Analog Stick (Archero-style: spawns where touched, disappears on release) */}
      <div
        ref={baseRef}
        className={`floating-joystick-base ${active ? "is-active" : ""} ${
          isTwoFingerBoost ? "is-boosted" : ""
        }`}
        aria-hidden="true"
      >
        <div className="joystick-base-ring">
          <span className="joystick-tick tick-n" />
          <span className="joystick-tick tick-s" />
          <span className="joystick-tick tick-e" />
          <span className="joystick-tick tick-w" />
          <div className="joystick-ring-dashed" />
        </div>

        <div ref={lineRef} className="joystick-laser-line" />

        <div ref={knobRef} className="joystick-thumb-knob">
          <div className="joystick-knob-core" />
          <div className="joystick-knob-pulse" />
        </div>
      </div>

      {/* High-tech Sci-Fi 2-Finger Turbo Boost HUD Badge */}
      {isTwoFingerBoost && (
        <div className="mobile-two-finger-boost-hud" aria-live="polite">
          <span className="boost-hud-flame">🔥</span>
          <span className="boost-hud-label">
            {isEn ? "TURBO BOOST // 2 FINGERS" : "TURBO BOOST AKTIF // 2 JARI"}
          </span>
          <span className="boost-hud-icon">🚀</span>
        </div>
      )}

      {/* Subtle Mobile Pilot Guide Banner (fades out after first touch) */}
      {!hasInteracted && (
        <div className="nav-mobile-pilot-hint" aria-hidden="true">
          <span className="hint-icon">🕹️</span>
          <span>
            {isEn
              ? "1 finger: Steer · 2 fingers: TURBO BOOST 🚀"
              : "1 jari: Kendali · 2 jari: TURBO BOOST 🚀"}
          </span>
        </div>
      )}
    </div>
  );
};

export default FloatingFlightJoystick;

