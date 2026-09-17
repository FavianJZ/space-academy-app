import { useCallback, useEffect, useMemo, useRef } from "react";

import { useGameStore } from "../stores/useGameStore";
import { getTranslation } from "../i18n/translations";
import {
  getNavFlightBriefing,
  getNavGateDialogue,
  LANDING_GATE_INDEX,
  NAV_FLIGHT_GATES,
  type ManualFlightStage,
} from "../scenes/intro/navFlightConfig";
import type {
  GamePhase,
  IntroStoryBeat,
  NavigationRoute,
} from "../types/threejs-intro.types";

const MANUAL_FLIGHT_ROUTE: NavigationRoute = "Navigasi";

const MANUAL_TOUCHDOWN_DELAY_MS = 4600;

interface UseIntroStoryProps {
  onDialogue: (
    message: string,
    minimumVisibleMs?: number,
    useVoice?: boolean
  ) => Promise<void>;
  onPhaseChange: (phase: GamePhase) => void;
  onStoryBeatChange: (beat: IntroStoryBeat) => void;
  onRouteSelected: (route: NavigationRoute) => void;
  onShake: (shake: boolean) => void;
  onWarpSpeed: (speed: number) => void;
  onAlarm: (active: boolean) => void;
  onNavigationShow: (show: boolean) => void;
  onLightingChange: (color: number, intensity: number) => void;
  onAsteroidShow: (visible: boolean, animate?: boolean) => void;
  onStranded: () => void;
  onManualStageChange: (stage: ManualFlightStage) => void;
}

interface RouteNarrative {
  lockColor: number;
  crisisColor: number;
  strandedColor: number;
  lockWarp: number;
  crisisWarp: number;
  lockDialogue: string;
  crisisDialogue: string;
  climaxDialogue: string;
  approachDialogue: string;
  touchdownDialogue: string;
  strandedDialogue: string;
}

const waitFor = (durationMs: number, signal: AbortSignal) =>
  new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    const finish = (completed: boolean) => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
      resolve(completed);
    };
    const handleAbort = () => finish(false);
    const timer = window.setTimeout(() => finish(true), durationMs);

    signal.addEventListener("abort", handleAbort, { once: true });
  });

export const useIntroStory = ({
  onDialogue,
  onPhaseChange,
  onStoryBeatChange,
  onRouteSelected,
  onShake,
  onWarpSpeed,
  onAlarm,
  onNavigationShow,
  onLightingChange,
  onAsteroidShow,
  onStranded,
  onManualStageChange,
}: UseIntroStoryProps) => {
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).intro;

  const routeNarratives = useMemo<Record<NavigationRoute, RouteNarrative>>(() => ({
    Mesin: {
      lockColor: 0xff9b4a,
      crisisColor: 0xff3d24,
      strandedColor: 0xffb86b,
      lockWarp: 0.7,
      crisisWarp: 1.8,
      lockDialogue: t.routes.Mesin.narrative.lock,
      crisisDialogue: t.routes.Mesin.narrative.crisis,
      climaxDialogue: t.routes.Mesin.narrative.climax,
      approachDialogue: t.routes.Mesin.narrative.approach,
      touchdownDialogue: t.routes.Mesin.narrative.touchdown,
      strandedDialogue: t.routes.Mesin.narrative.stranded,
    },
    Navigasi: {
      lockColor: 0x42ddff,
      crisisColor: 0x2776ff,
      strandedColor: 0x72d8ff,
      lockWarp: 1.45,
      crisisWarp: 2.4,
      lockDialogue: t.routes.Navigasi.narrative.lock,
      crisisDialogue: t.routes.Navigasi.narrative.crisis,
      climaxDialogue: t.routes.Navigasi.narrative.climax,
      approachDialogue: t.routes.Navigasi.narrative.approach,
      touchdownDialogue: t.routes.Navigasi.narrative.touchdown,
      strandedDialogue: t.routes.Navigasi.narrative.stranded,
    },
    Bensin: {
      lockColor: 0x7dff9b,
      crisisColor: 0xffbd38,
      strandedColor: 0xffcf72,
      lockWarp: 0.9,
      crisisWarp: 0.28,
      lockDialogue: t.routes.Bensin.narrative.lock,
      crisisDialogue: t.routes.Bensin.narrative.crisis,
      climaxDialogue: t.routes.Bensin.narrative.climax,
      approachDialogue: t.routes.Bensin.narrative.approach,
      touchdownDialogue: t.routes.Bensin.narrative.touchdown,
      strandedDialogue: t.routes.Bensin.narrative.stranded,
    },
    Blackhole: {
      lockColor: 0xb26dff,
      crisisColor: 0x7b2cff,
      strandedColor: 0xb993ff,
      lockWarp: 3.1,
      crisisWarp: 4.2,
      lockDialogue: t.routes.Blackhole.narrative.lock,
      crisisDialogue: t.routes.Blackhole.narrative.crisis,
      climaxDialogue: t.routes.Blackhole.narrative.climax,
      approachDialogue: t.routes.Blackhole.narrative.approach,
      touchdownDialogue: t.routes.Blackhole.narrative.touchdown,
      strandedDialogue: t.routes.Blackhole.narrative.stranded,
    },
  }), [t]);

  const storyControllerRef = useRef<AbortController | null>(null);
  
  const alarmStateRef = useRef(false);

  const cancelStory = useCallback(() => {
    storyControllerRef.current?.abort();
    storyControllerRef.current = null;
  }, []);

  const beginStory = useCallback(() => {
    cancelStory();
    const controller = new AbortController();
    storyControllerRef.current = controller;
    return controller;
  }, [cancelStory]);

  const setAlarm = useCallback(
    (active: boolean) => {
      if (alarmStateRef.current === active) return;
      alarmStateRef.current = active;
      onAlarm(active);
    },
    [onAlarm]
  );

  const holdCinematicBeat = useCallback(
    async (signal: AbortSignal, dialogue: string, minimumShotMs: number) => {
      const [, shotCompleted] = await Promise.all([
        onDialogue(dialogue, 650),
        waitFor(minimumShotMs, signal),
      ]);

      return shotCompleted && !signal.aborted;
    },
    [onDialogue]
  );

  useEffect(() => cancelStory, [cancelStory]);

  const startIntroCinematic = useCallback(() => {
    const controller = beginStory();
    const { signal } = controller;

    void (async () => {
      onPhaseChange("initializing");
      onStoryBeatChange("ignition");
      onWarpSpeed(0.32);
      onShake(false);
      setAlarm(false);
      onNavigationShow(false);
      onAsteroidShow(false);
      onLightingChange(0x6beaff, 3.2);

      await onDialogue(
        t.dialogues.greeting,
        900
      );
      if (signal.aborted) return;

      onPhaseChange("intro");
      onStoryBeatChange("cruise");
      onWarpSpeed(0.82);
      await onDialogue(
        t.dialogues.recoveryFound,
        900
      );
      if (signal.aborted) return;

      onPhaseChange("navigation");
      onStoryBeatChange("route-selection");
      onWarpSpeed(0.46);
      await onDialogue(
        t.dialogues.decisionActive,
        900
      );
      if (signal.aborted) return;

      onNavigationShow(true);
    })();
  }, [
    beginStory,
    onAsteroidShow,
    onDialogue,
    onLightingChange,
    onNavigationShow,
    onPhaseChange,
    onShake,
    onStoryBeatChange,
    onWarpSpeed,
    setAlarm,
    t.dialogues,
  ]);

  const runLandingSequence = useCallback(
    (route: NavigationRoute, playApproachBeat: boolean) => {
      const controller = beginStory();
      const { signal } = controller;
      const narrative = routeNarratives[route];

      void (async () => {
        if (playApproachBeat) {
          onPhaseChange("crash");
          onStoryBeatChange("route-approach");
          onWarpSpeed(0.18);
          setAlarm(false);
          onShake(false);
          onLightingChange(narrative.strandedColor, 3.1);

          if (
            !(await holdCinematicBeat(signal, narrative.approachDialogue, 4000))
          ) {
            return;
          }
        } else if (!(await waitFor(MANUAL_TOUCHDOWN_DELAY_MS, signal))) {
          return;
        }

        onPhaseChange("crash");
        onStoryBeatChange("route-touchdown");
        onWarpSpeed(0.04);
        setAlarm(false);
        onShake(false);
        onLightingChange(narrative.strandedColor, 2.7);

        if (
          !(await holdCinematicBeat(signal, narrative.touchdownDialogue, 3200))
        ) {
          return;
        }

        onPhaseChange("stranded");
        onStoryBeatChange("stranded");
        onWarpSpeed(0);
        setAlarm(false);
        onShake(false);
        onLightingChange(narrative.strandedColor, 2.4);
        await onDialogue(narrative.strandedDialogue, 1100);
        if (signal.aborted) return;

        onStranded();
      })();
    },
    [
      beginStory,
      holdCinematicBeat,
      onDialogue,
      onLightingChange,
      onPhaseChange,
      onShake,
      onStranded,
      onStoryBeatChange,
      onWarpSpeed,
      routeNarratives,
      setAlarm,
    ]
  );

  const handleRouteSelection = useCallback(
    (route: NavigationRoute) => {
      const controller = beginStory();
      const { signal } = controller;
      const narrative = routeNarratives[route];

      onNavigationShow(false);
      onRouteSelected(route);
      onAsteroidShow(false);
      onPhaseChange("navigation");
      onStoryBeatChange("route-locked");
      onWarpSpeed(narrative.lockWarp);
      setAlarm(false);
      onShake(false);
      onLightingChange(narrative.lockColor, 4.2);

      if (route === MANUAL_FLIGHT_ROUTE) {
        onManualStageChange("flying");
        void onDialogue(getNavFlightBriefing(language), 1400);
        return;
      }

      onManualStageChange("off");

      void (async () => {
        if (!(await holdCinematicBeat(signal, narrative.lockDialogue, 4800))) {
          return;
        }

        onPhaseChange("crisis");
        onStoryBeatChange("route-crisis");
        onWarpSpeed(narrative.crisisWarp);
        setAlarm(true);
        onShake(route === "Blackhole");
        onLightingChange(narrative.crisisColor, 5.4);

        if (!(await holdCinematicBeat(signal, narrative.crisisDialogue, 4600))) {
          return;
        }

        onPhaseChange("crash");
        onStoryBeatChange("route-climax");
        onShake(route === "Mesin" || route === "Blackhole");
        onLightingChange(narrative.crisisColor, 6.1);

        if (!(await holdCinematicBeat(signal, narrative.climaxDialogue, 3400))) {
          return;
        }

        runLandingSequence(route, true);
      })();
    },
    [
      beginStory,
      holdCinematicBeat,
      language,
      onAsteroidShow,
      onDialogue,
      onLightingChange,
      onManualStageChange,
      onNavigationShow,
      onPhaseChange,
      onRouteSelected,
      onShake,
      onStoryBeatChange,
      onWarpSpeed,
      routeNarratives,
      runLandingSequence,
      setAlarm,
    ]
  );

  const handleManualGateCleared = useCallback(
    (gateIndex: number) => {
      const gate = NAV_FLIGHT_GATES[gateIndex];
      if (!gate || gateIndex >= LANDING_GATE_INDEX) return;

      const narrative = routeNarratives[MANUAL_FLIGHT_ROUTE];
      onStoryBeatChange(gate.beat);
      onPhaseChange(gate.phase);
      setAlarm(gate.alarm);
      onLightingChange(
        gate.alarm ? narrative.crisisColor : narrative.lockColor,
        gate.alarm ? 5.4 : 4.2
      );

      void onDialogue(getNavGateDialogue(gate.id, gate.dialogue, language), 900);
    },
    [language, onDialogue, onLightingChange, onPhaseChange, onStoryBeatChange, routeNarratives, setAlarm]
  );

  const handleManualLandingGate = useCallback(() => {
    const narrative = routeNarratives[MANUAL_FLIGHT_ROUTE];
    onManualStageChange("landing");
    onPhaseChange("crash");
    onStoryBeatChange("route-approach");
    onWarpSpeed(0.18);
    setAlarm(false);
    onShake(false);
    onLightingChange(narrative.strandedColor, 3.1);
    void onDialogue(narrative.approachDialogue, 4000);
  }, [
    onDialogue,
    onLightingChange,
    onManualStageChange,
    onPhaseChange,
    onShake,
    onStoryBeatChange,
    onWarpSpeed,
    routeNarratives,
    setAlarm,
  ]);

  const handleManualHandoffComplete = useCallback(() => {
    onManualStageChange("done");
    runLandingSequence(MANUAL_FLIGHT_ROUTE, false);
  }, [onManualStageChange, runLandingSequence]);

  return {
    startIntroCinematic,
    handleRouteSelection,
    handleManualGateCleared,
    handleManualLandingGate,
    handleManualHandoffComplete,
    cancelStory,
  };
};

export default useIntroStory;
