import { useEffect, useRef } from "react";

import {
  FLIGHT_BINDINGS,
  type FlightAction,
} from "../scenes/intro/navFlightConfig";

export type FlightActionState = Record<FlightAction, boolean>;

const createActionState = (): FlightActionState => ({
  pitchDown: false,
  pitchUp: false,
  rollLeft: false,
  rollRight: false,
  yawLeft: false,
  yawRight: false,
  throttle: false,
});

/**
 * Keyboard -> named flight actions.
 *
 * Gameplay reads actions (`pitchDown`), never key codes, so rebinding or adding
 * a gamepad later only touches FLIGHT_BINDINGS. All actions here are *held*
 * (level) reads rather than edge reads, which is what continuous flight
 * surfaces and a hold-to-boost throttle need.
 */
export const useFlightControls = (enabled: boolean) => {
  const actionsRef = useRef<FlightActionState>(createActionState());
  /** Set the first time the player actually touches a control. */
  const engagedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      actionsRef.current = createActionState();
      return;
    }

    const setAction = (code: string, pressed: boolean) => {
      const action = FLIGHT_BINDINGS[code];
      if (!action) return false;
      actionsRef.current[action] = pressed;
      if (pressed) engagedRef.current = true;
      return true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      if (setAction(event.code, true)) {
        // Space scrolls the page and arrows move focus; neither is wanted here.
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (setAction(event.code, false)) event.preventDefault();
    };

    // Losing focus mid-hold would otherwise leave the shuttle in a permanent
    // roll, because the keyup never arrives.
    const releaseAll = () => {
      actionsRef.current = createActionState();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseAll);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseAll);
      releaseAll();
    };
  }, [enabled]);

  return { actionsRef, engagedRef };
};

export default useFlightControls;
