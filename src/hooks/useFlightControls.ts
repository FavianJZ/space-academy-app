import { useEffect, useRef } from "react";

import {
  FLIGHT_BINDINGS,
  type FlightAction,
} from "../scenes/intro/navFlightConfig";

export type FlightActionState = Record<FlightAction, boolean>;

export interface FlightAnalogState {
  active: boolean;
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (up is negative, down is positive)
  throttle: boolean;
}

export const flightAnalogState: FlightAnalogState = {
  active: false,
  x: 0,
  y: 0,
  throttle: false,
};

export const setFlightAnalogState = (update: Partial<FlightAnalogState>): void => {
  Object.assign(flightAnalogState, update);
};

export const resetFlightAnalogState = (): void => {
  flightAnalogState.active = false;
  flightAnalogState.x = 0;
  flightAnalogState.y = 0;
  flightAnalogState.throttle = false;
};

const createActionState = (): FlightActionState => ({
  pitchDown: false,
  pitchUp: false,
  rollLeft: false,
  rollRight: false,
  yawLeft: false,
  yawRight: false,
  throttle: false,
});

export const useFlightControls = (enabled: boolean) => {
  const actionsRef = useRef<FlightActionState>(createActionState());
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
        
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (setAction(event.code, false)) event.preventDefault();
    };

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
