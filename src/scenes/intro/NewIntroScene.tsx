import React, {
  Suspense,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrbitControls as DreiOrbitControls,
} from "@react-three/drei";
import * as THREE from "three";

import { useIntroAudio } from "../../hooks/useIntroAudio";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useIntroGameState } from "../../hooks/useIntroGameState";
import { useIntroStory } from "../../hooks/useIntroStory";
import {
  cancelSpeechNarration,
  speakNarration,
} from "../../audio/speechNarration";
import { useGameStore } from "../../stores/useGameStore";

import { AsteroidObject, CockpitModel } from "../../components/models";
import AdaptiveCanvas from "../../components/common/AdaptiveCanvas";

import AICompanion from "./AICompanion";
import SystemInitUI from "./SystemInitUI";
import NavigationUI from "./NavigationUI";
import DistanceOdometer from "./DistanceOdometer";
import SceneEffectsPro from "./SceneEffectsPro";
import RouteCinematic, { RouteLoadingBeacon } from "./RouteCinematic";
import NavFlightHUD from "./NavFlightHUD";
import {
  createNavCourseState,
  createNavFlightTelemetry,
  type ManualFlightStage,
  type NavCourseState,
  type NavFlightTelemetry,
} from "./navFlightConfig";

import type {
  GamePhase,
  GameState,
  IntroStoryBeat,
  NavigationRoute,
} from "../../types/threejs-intro.types";

import "./NewIntroScene.css";

type ActiveDialogueRun = {
  id: number;
  controller: AbortController;
  resolveTyping: () => void;
};

const waitForDialogueDelay = (durationMs: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, durationMs);

    signal.addEventListener("abort", finish, { once: true });
  });

const PHASE_INDEX: Record<GamePhase, number> = {
  idle: 0,
  initializing: 0,
  intro: 1,
  navigation: 2,
  crisis: 3,
  crash: 4,
  stranded: 4,
  completed: 4,
};

const PHASE_LABEL: Record<GamePhase, string> = {
  idle: "AWAITING AUTHORIZATION",
  initializing: "SYSTEM HANDSHAKE",
  intro: "AI TRANSMISSION",
  navigation: "ROUTE DECISION",
  crisis: "SYSTEM ANOMALY",
  crash: "EMERGENCY DESCENT",
  stranded: "UNKNOWN PLANET // LANDED",
  completed: "RECORD CLOSED",
};

const ROUTE_PRESENTATION: Record<
  NavigationRoute,
  {
    code: string;
    title: string;
    accent: string;
    locked: string;
    crisis: string;
    climax: string;
    approach: string;
    touchdown: string;
    metric: string;
  }
> = {
  Mesin: {
    code: "ENG-01",
    title: "ENGINE RECOVERY",
    accent: "#ff934d",
    locked: "SERVICE DRONES DEPLOYED",
    crisis: "THERMAL RUNAWAY",
    climax: "DAMAGED MODULE JETTISONED",
    approach: "LANDING PAD ACQUIRED // GEAR DOWN",
    touchdown: "MAIN GEAR CONTACT // BRAKING",
    metric: "CORE TEMP",
  },
  Navigasi: {
    code: "NAV-02",
    title: "MANUAL ORBIT",
    accent: "#58e7ff",
    locked: "WAYPOINT GATES ACQUIRED",
    crisis: "MAGNETIC GHOST SIGNALS",
    climax: "TRUE VECTOR RECOVERED",
    approach: "VISUAL APPROACH // GEAR DOWN",
    touchdown: "RUNWAY ALIGNMENT // CONTACT",
    metric: "VECTOR DRIFT",
  },
  Bensin: {
    code: "FUEL-03",
    title: "RESERVE GLIDE",
    accent: "#83ffa2",
    locked: "RESERVE TANK CONNECTED",
    crisis: "FUEL SEAL RUPTURE",
    climax: "ZERO THRUST // GLIDE PROFILE",
    approach: "UNPOWERED APPROACH // FLARE READY",
    touchdown: "GLIDE COMPLETE // WHEELS SAFE",
    metric: "FUEL RESERVE",
  },
  Blackhole: {
    code: "GRAV-04",
    title: "GRAVITY SLINGSHOT",
    accent: "#c17aff",
    locked: "SINGULARITY APPROACH",
    crisis: "EVENT HORIZON BREACH",
    climax: "GRAVITY EJECTION // ATTITUDE STABLE",
    approach: "EMERGENCY VECTOR // GEAR DOWN",
    touchdown: "SUSPENSION LOAD // MOTION ZERO",
    metric: "TIDAL FORCE",
  },
};

const getRouteBeatIndex = (beat: IntroStoryBeat) => {
  if (beat === "stranded" || beat === "route-touchdown") return 4;
  if (beat === "route-approach") return 3;
  if (beat === "route-climax") return 2;
  if (beat === "route-crisis") return 1;
  return 0;
};

const getRouteBeatLabel = (
  route: NavigationRoute,
  beat: IntroStoryBeat
) => {
  const presentation = ROUTE_PRESENTATION[route];
  if (beat === "route-crisis") return presentation.crisis;
  if (beat === "route-climax") return presentation.climax;
  if (beat === "route-approach") return presentation.approach;
  if (beat === "route-touchdown" || beat === "stranded") {
    return presentation.touchdown;
  }
  return presentation.locked;
};

const CockpitLightingRig: React.FC<{
  gameState: GameState;
  interiorLightColor: number;
  interiorLightIntensity: number;
}> = ({ gameState, interiorLightColor, interiorLightIntensity }) => {
  const dashLightRef = useRef<THREE.PointLight>(null);
  const leftLightRef = useRef<THREE.PointLight>(null);
  const rightLightRef = useRef<THREE.PointLight>(null);
  const rearLightRef = useRef<THREE.PointLight>(null);
  const dashGlowRef = useRef<THREE.Mesh>(null);
  const canopyGlowRef = useRef<THREE.Mesh>(null);
  const sideGlowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const base = Math.max(interiorLightIntensity, 2.0);
    const warpBoost = Math.min(1, (gameState?.kecepatanWarp ?? 0) * 0.25);
    const alarmBoost = gameState?.isAlarmActive ? 1 : 0;
    const breathing = 1 + Math.sin(time * 1.3) * 0.08;
    const flicker = alarmBoost ? 0.7 + Math.abs(Math.sin(time * 20)) * 0.6 : 1;

    const baseColor = new THREE.Color(interiorLightColor);
    const coolColor = baseColor.clone().lerp(new THREE.Color('#7ef9ff'), 0.35);
    const warmColor = baseColor.clone().lerp(new THREE.Color('#ffb36b'), 0.22);
    const alarmColor = new THREE.Color('#ff3344');

    if (dashLightRef.current) {
      dashLightRef.current.color.copy(baseColor);
      dashLightRef.current.intensity = base * 2.2 * breathing * flicker + warpBoost * 0.8;
    }

    if (leftLightRef.current) {
      leftLightRef.current.color.copy(coolColor);
      leftLightRef.current.intensity = 1.8 + base * 0.85 + warpBoost * 0.4;
    }

    if (rightLightRef.current) {
      rightLightRef.current.color.copy(warmColor);
      rightLightRef.current.intensity = 1.6 + base * 0.75 + warpBoost * 0.35;
    }

    if (rearLightRef.current) {
      rearLightRef.current.color.copy(alarmBoost ? alarmColor : coolColor);
      rearLightRef.current.intensity = alarmBoost
        ? 2.0 + Math.abs(Math.sin(time * 24)) * 2.0
        : 0.8 + warpBoost * 0.3;
    }

    if (dashGlowRef.current) {
      const material = dashGlowRef.current.material as THREE.MeshBasicMaterial;
      material.color.copy(baseColor);
      material.opacity = 0.35 + base * 0.12 + warpBoost * 0.08 + alarmBoost * 0.15;
      dashGlowRef.current.scale.setScalar(1 + Math.sin(time * 2.2) * 0.03 + warpBoost * 0.06);
    }

    if (canopyGlowRef.current) {
      const material = canopyGlowRef.current.material as THREE.MeshBasicMaterial;
      material.color.copy(alarmBoost ? alarmColor : coolColor);
      material.opacity = 0.28 + base * 0.1 + alarmBoost * 0.15;
    }

    if (sideGlowRef.current) {
      const material = sideGlowRef.current.material as THREE.MeshBasicMaterial;
      material.color.copy(warmColor);
      material.opacity = 0.22 + base * 0.08 + warpBoost * 0.06;
    }
  });

  return (
    <>
      <pointLight ref={dashLightRef} position={[0, 10.4, 4.1]} distance={24} color={interiorLightColor} intensity={2.5} />
      <pointLight ref={leftLightRef} position={[-4.6, 12.3, 1.8]} distance={18} color="#7ef9ff" intensity={2.2} />
      <pointLight ref={rightLightRef} position={[4.6, 12.3, 1.8]} distance={18} color="#ffb36b" intensity={2.0} />
      <pointLight ref={rearLightRef} position={[0, 15.6, -1.8]} distance={24} color="#bffcff" intensity={1.2} />
      
      {}
      <pointLight position={[0, 8.5, 2.0]} distance={20} color="#5effff" intensity={1.6} />
      <pointLight position={[-3.5, 11, 0]} distance={15} color="#87ceeb" intensity={1.2} />
      <pointLight position={[3.5, 11, 0]} distance={15} color="#ffb380" intensity={1.1} />
      <pointLight position={[0, 9.5, -1.5]} distance={16} color="#00ffff" intensity={0.9} />

      <mesh ref={dashGlowRef} position={[0, 10.7, 4.25]} renderOrder={1}>
        <planeGeometry args={[8.8, 1.5]} />
        <meshBasicMaterial transparent opacity={0.12} color={interiorLightColor} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={canopyGlowRef} position={[0, 15.15, 0.8]} renderOrder={1}>
        <planeGeometry args={[10.8, 0.5]} />
        <meshBasicMaterial transparent opacity={0.08} color="#eafcff" depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={sideGlowRef} position={[0, 12.0, 3.2]} renderOrder={1}>
        <planeGeometry args={[6.8, 0.35]} />
        <meshBasicMaterial transparent opacity={0.05} color="#ffb36b" depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
};

const IntroScene3D: React.FC<{
  gameState: GameState;
  isShaking: boolean;
  interiorLightColor: number;
  interiorLightIntensity: number;
  asteroidVisible: boolean;
  asteroidAnimating: boolean;
  route?: NavigationRoute;
  storyBeat: IntroStoryBeat;
  manualStage: ManualFlightStage;
  courseRef: React.MutableRefObject<NavCourseState>;
  telemetryRef: React.MutableRefObject<NavFlightTelemetry>;
  onManualGateCleared: (index: number) => void;
  onManualLandingGate: () => void;
  onManualHandoffComplete: () => void;
}> = ({
  isShaking,
  gameState,
  interiorLightColor,
  interiorLightIntensity,
  asteroidVisible,
  asteroidAnimating,
  route,
  storyBeat,
  manualStage,
  courseRef,
  telemetryRef,
  onManualGateCleared,
  onManualLandingGate,
  onManualHandoffComplete,
}) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const posisiAsliX = React.useRef(0);
  const posisiAsliY = React.useRef(0);
  const interiorLightRef = React.useRef<THREE.PointLight>(null);

  const isShakingActive = useRef(false);

  useFrame(({ clock }) => {
    if (interiorLightRef.current) {
      interiorLightRef.current.color.setHex(interiorLightColor);
      interiorLightRef.current.intensity = interiorLightIntensity;

      if (gameState.isAlarmActive) {
        const kedip = Math.abs(Math.sin(Date.now() * 0.005));
        interiorLightRef.current.intensity = 5 + kedip * 20;
      }
    }

    const camera = cameraRef.current;
    if (isShaking && !route && camera) {
      if (!isShakingActive.current) {
        posisiAsliX.current = camera.position.x;
        posisiAsliY.current = camera.position.y;
        isShakingActive.current = true;
      }
      const time = clock.elapsedTime;
      const intensity = 0.095;
      camera.position.x = posisiAsliX.current +
        (Math.sin(time * 37) * 0.55 + Math.sin(time * 71) * 0.25) * intensity;
      camera.position.y = posisiAsliY.current +
        (Math.sin(time * 43 + 0.8) * 0.5 + Math.sin(time * 83) * 0.22) * intensity;
    } else if (camera && isShakingActive.current) {
      
      camera.position.x = posisiAsliX.current;
      camera.position.y = posisiAsliY.current;
      isShakingActive.current = false;
    }
  });

  return (
    <>
      {}
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 16, 0]} fov={75} />
      
      {route ? (
        <Suspense fallback={<RouteLoadingBeacon />}>
          <RouteCinematic
            key={route}
            route={route}
            storyBeat={storyBeat}
            manualStage={manualStage}
            courseRef={courseRef}
            telemetryRef={telemetryRef}
            onManualGateCleared={onManualGateCleared}
            onManualLandingGate={onManualLandingGate}
            onManualHandoffComplete={onManualHandoffComplete}
          />
        </Suspense>
      ) : (
        <>
          <ambientLight intensity={0.55} color={0xffffff} />
          <directionalLight
            intensity={0.45}
            position={[5, 5, 5]}
            color={0xffffff}
          />

          <CockpitLightingRig
            gameState={gameState}
            interiorLightColor={interiorLightColor}
            interiorLightIntensity={interiorLightIntensity}
          />

          <pointLight
            ref={interiorLightRef}
            position={[0, 13, 2.2]}
            distance={28}
            color={interiorLightColor}
            intensity={interiorLightIntensity * 1.8}
          />

          <SceneEffectsPro gameState={gameState} />
          <CockpitModel onLoaded={() => console.log("Cockpit loaded")} />

          <DreiOrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping={true}
            dampingFactor={0.05}
            target={[0, 16, 1]}
            minPolarAngle={Math.PI / 2.2}
            maxPolarAngle={Math.PI / 1.8}
            minAzimuthAngle={Math.PI - Math.PI / 4}
            maxAzimuthAngle={Math.PI + Math.PI / 4}
          />

          <AsteroidObject
            visible={asteroidVisible}
            isAnimating={asteroidAnimating}
          />
        </>
      )}
    </>
  );
};

export const NewIntroScene: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  const { playSound, stopSound } = useIntroAudio();
  const { playSfx } = useGameAudio();
  const speechVolume = useGameStore((state) => state.sfxVolume);
  const { state: gameState, setPhase, setWarpSpeed, setShaking, setAlarmActive } =
    useIntroGameState();

  const [currentDialogue, setCurrentDialogue] = useState("");
  const [dialogueVisible, setDialogueVisible] = useState(false);
  const [dialogueSequence, setDialogueSequence] = useState(0);
  const [initUIVisible, setInitUIVisible] = useState(true);
  const [navUIVisible, setNavUIVisible] = useState(false);
  const [statusText, setStatusText] = useState(
    "AWAITING COMMANDER'S AUTHORIZATION..."
  );
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [interiorLightColor, setInteriorLightColor] = useState(0x00ffff);
  const [interiorLightIntensity, setInteriorLightIntensity] = useState(4.0);
  const [asteroidVisible, setAsteroidVisible] = useState(false);
  const [asteroidAnimating, setAsteroidAnimating] = useState(false);
  const [storyBeat, setStoryBeat] = useState<IntroStoryBeat>("briefing");
  const [selectedRoute, setSelectedRoute] = useState<NavigationRoute>();
  const [isStranded, setIsStranded] = useState(false);
  const [manualStage, setManualStage] = useState<ManualFlightStage>("off");

  // Per-frame flight data lives in refs so a 60 fps HUD costs no re-renders.
  const courseRef = useRef<NavCourseState>(createNavCourseState());
  const telemetryRef = useRef<NavFlightTelemetry>(createNavFlightTelemetry());

  const dialogueRunRef = useRef<ActiveDialogueRun | null>(null);
  const dialogueSequenceRef = useRef(0);
  const transitionTimerRef = useRef<number | undefined>(undefined);
  const landingDebrisTimerRef = useRef<number | undefined>(undefined);

  const stopActiveDialogue = useCallback(() => {
    const activeRun = dialogueRunRef.current;
    dialogueRunRef.current = null;

    if (activeRun) {
      activeRun.controller.abort();
      activeRun.resolveTyping();
    }

    cancelSpeechNarration();
    stopSound("sfxTyping");
  }, [stopSound]);

  const handleTypingComplete = useCallback(() => {
    const activeRun = dialogueRunRef.current;
    if (!activeRun) return;

    activeRun.resolveTyping();
    stopSound("sfxTyping");
  }, [stopSound]);

  const handleDialogue = useCallback(
    async (message: string, minimumVisibleMs = 650, useVoice = true) => {
      stopActiveDialogue();

      const id = ++dialogueSequenceRef.current;
      const controller = new AbortController();
      let resolveTyping: () => void = () => undefined;
      const typingFinished = new Promise<void>((resolve) => {
        resolveTyping = () => resolve();
      });

      dialogueRunRef.current = {
        id,
        controller,
        resolveTyping,
      };

      setCurrentDialogue(message);
      setDialogueVisible(true);
      setDialogueSequence(id);

      if (useVoice) playSound("sfxTyping");

      const narrationFinished =
        useVoice && speechVolume > 0
          ? speakNarration(message, {
              lang: "id-ID",
              preferredVoiceLanguage: "id",
              pitch: 1.3,
              rate: 1.1,
              volume: speechVolume,
            }).then(() => undefined)
          : Promise.resolve();

      await Promise.all([
        typingFinished,
        narrationFinished,
        waitForDialogueDelay(
          Math.max(450, minimumVisibleMs),
          controller.signal
        ),
      ]);

      if (
        controller.signal.aborted ||
        dialogueRunRef.current?.id !== id
      ) {
        return;
      }

      stopSound("sfxTyping");
      dialogueRunRef.current = null;
      setDialogueVisible(false);
    },
    [playSound, speechVolume, stopActiveDialogue, stopSound]
  );

  const handlePhaseChange = useCallback((phase: GamePhase) => {
    setPhase(phase);
  }, [setPhase]);

  const handleShake = useCallback((shake: boolean) => {
    setShaking(shake);
  }, [setShaking]);

  const handleWarpSpeed = useCallback((speed: number) => {
    setWarpSpeed(speed);
  }, [setWarpSpeed]);

  const handleAlarm = useCallback((active: boolean) => {
    setAlarmActive(active);
    if (active) {
      playSound("sfxAlarm");
    } else {
      stopSound("sfxAlarm");
    }
  }, [playSound, setAlarmActive, stopSound]);

  const handleNavigationShow = useCallback((show: boolean) => {
    setNavUIVisible(show);
  }, []);

  const handleLightingChange = useCallback((color: number, intensity: number) => {
    setInteriorLightColor(color);
    setInteriorLightIntensity(intensity);
  }, []);

  const handleAsteroidShow = useCallback((show: boolean, animate: boolean = false) => {
    setAsteroidVisible(show);
    setAsteroidAnimating(animate);
  }, []);

  const handleStoryBeatChange = useCallback((beat: IntroStoryBeat) => {
    setStoryBeat(beat);
  }, []);

  const handleRouteSelected = useCallback((route: NavigationRoute) => {
    setSelectedRoute(route);
  }, []);

  const handleStranded = useCallback(() => {
    setIsStranded(true);
    setStatusText("> EMERGENCY LANDING CONFIRMED // IDENTITY CORE OFFLINE");
  }, []);

  const handleManualStageChange = useCallback((stage: ManualFlightStage) => {
    if (stage === "flying") {
      // Fresh course state on every attempt at the route.
      courseRef.current = createNavCourseState();
      telemetryRef.current = createNavFlightTelemetry();
    }
    setManualStage(stage);
  }, []);

  const {
    startIntroCinematic,
    handleRouteSelection,
    handleManualGateCleared,
    handleManualLandingGate,
    handleManualHandoffComplete,
    cancelStory,
  } = useIntroStory({
    onDialogue: handleDialogue,
    onPhaseChange: handlePhaseChange,
    onStoryBeatChange: handleStoryBeatChange,
    onRouteSelected: handleRouteSelected,
    onShake: handleShake,
    onWarpSpeed: handleWarpSpeed,
    onAlarm: handleAlarm,
    onNavigationShow: handleNavigationShow,
    onLightingChange: handleLightingChange,
    onAsteroidShow: handleAsteroidShow,
    onStranded: handleStranded,
    onManualStageChange: handleManualStageChange,
  });

  const handleComplete = useCallback(() => {
    cancelStory();
    stopActiveDialogue();
    setDialogueVisible(false);
    if (transitionTimerRef.current !== undefined) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = undefined;
    }
    stopSound("bgm");
    stopSound("suspenseBgm");
    stopSound("sfxAlarm");
    stopSound("sfxEngine");
    stopSound("sfxTyping");
    if (landingDebrisTimerRef.current !== undefined) {
      window.clearTimeout(landingDebrisTimerRef.current);
      landingDebrisTimerRef.current = undefined;
    }
    setFlashOpacity(1);

    transitionTimerRef.current = window.setTimeout(() => {
      onComplete?.();
    }, 950);
  }, [cancelStory, onComplete, stopActiveDialogue, stopSound]);

  const handleStartMission = useCallback(() => {
    setInitUIVisible(false);
    setStatusText("> MENGAKTIFKAN PROTOKOL PENERBANGAN... OK");
    playSound("bgm");
    playSound("sfxEngine");

    transitionTimerRef.current = window.setTimeout(() => {
      startIntroCinematic();
    }, 900);
  }, [playSound, startIntroCinematic]);

  const handleRouteSelect = useCallback(
    (route: NavigationRoute) => {
      playSfx("planetSelect");
      handleRouteSelection(route);
    },
    [handleRouteSelection, playSfx]
  );

  const handleGateCleared = useCallback(
    (index: number) => {
      playSfx("circuitConnect");
      handleManualGateCleared(index);
    },
    [handleManualGateCleared, playSfx]
  );

  const handleLandingGate = useCallback(() => {
    playSfx("uiConfirm");
    handleManualLandingGate();
  }, [handleManualLandingGate, playSfx]);

  useEffect(() => {
    if (storyBeat === "route-locked") {
      playSound("sfxWarp");
    }

    if (storyBeat === "route-crisis") {
      stopSound("bgm");
      playSound("suspenseBgm");
      if (selectedRoute === "Navigasi") {
        playSound("sfxGlitch");
      }
    }

    if (storyBeat === "route-climax") {
      if (selectedRoute === "Mesin") {
        playSound("sfxVehicleDestroyed");
      } else if (selectedRoute === "Navigasi") {
        playSound("sfxGlitch");
      } else if (selectedRoute === "Bensin") {
        stopSound("sfxEngine");
        playSound("sfxGlitch");
      } else if (selectedRoute === "Blackhole") {
        playSound("sfxWarp");
      }
    }

    if (storyBeat === "route-approach") {
      stopSound("sfxAlarm");
    }

    if (storyBeat === "route-touchdown") {
      stopSound("sfxAlarm");
      stopSound("suspenseBgm");
      playSound("sfxQTEcorrect");
      if (landingDebrisTimerRef.current !== undefined) {
        window.clearTimeout(landingDebrisTimerRef.current);
      }
      landingDebrisTimerRef.current = window.setTimeout(() => {
        playSfx("landingDebris");
        landingDebrisTimerRef.current = undefined;
      }, 1250);
    }

    if (storyBeat === "stranded") {
      stopSound("suspenseBgm");
      stopSound("sfxAlarm");
      playSound("sfxGlitch");
    }
  }, [playSfx, playSound, selectedRoute, stopSound, storyBeat]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== undefined) {
        window.clearTimeout(transitionTimerRef.current);
      }
      if (landingDebrisTimerRef.current !== undefined) {
        window.clearTimeout(landingDebrisTimerRef.current);
      }
      stopActiveDialogue();
    };
  }, [stopActiveDialogue]);

  return (
    <div
      className={`new-intro-scene-container intro-beat-${storyBeat}${
        isStranded ? " is-stranded" : ""
      }`}
    >
      <AdaptiveCanvas
        className="intro-canvas"
        dpr={[1, 1.25]}
        quality="auto"
        shadows
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <IntroScene3D
          gameState={gameState}
          isShaking={gameState.isShaking}
          interiorLightColor={interiorLightColor}
          interiorLightIntensity={interiorLightIntensity}
          asteroidVisible={asteroidVisible}
          asteroidAnimating={asteroidAnimating}
          route={selectedRoute}
          storyBeat={storyBeat}
          manualStage={manualStage}
          courseRef={courseRef}
          telemetryRef={telemetryRef}
          onManualGateCleared={handleGateCleared}
          onManualLandingGate={handleLandingGate}
          onManualHandoffComplete={handleManualHandoffComplete}
        />
      </AdaptiveCanvas>

      <NavFlightHUD
        visible={manualStage === "flying"}
        telemetryRef={telemetryRef}
      />

      <div className="intro-cinematic-layer" aria-hidden="true">
        <div className="intro-vignette" />
        <div className="intro-film-grain" />
        <div className="intro-scan-sweep" />
        <div className="intro-letterbox intro-letterbox-top" />
        <div className="intro-letterbox intro-letterbox-bottom" />
      </div>

      {!initUIVisible && (
        <header className="intro-ops-header" aria-label="Status misi">
          <div className="intro-ops-identity">
            <span className="intro-ops-beacon" />
            <div>
              <span>FLIGHT RECORD // 01</span>
              <strong>ORBITAL ACADEMY</strong>
            </div>
          </div>

          <div className="intro-phase-status">
            <span>
              {selectedRoute
                ? `${ROUTE_PRESENTATION[selectedRoute].code} // ${getRouteBeatLabel(
                    selectedRoute,
                    storyBeat
                  )}`
                : PHASE_LABEL[gameState.phase]}
            </span>
            <div className="intro-phase-track" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((step) => (
                <i key={step} className={PHASE_INDEX[gameState.phase] >= step ? "active" : ""} />
              ))}
            </div>
          </div>
        </header>
      )}

      {}
      <SystemInitUI
        visible={initUIVisible}
        statusText={statusText}
        onStartMission={handleStartMission}
      />

      <NavigationUI visible={navUIVisible} onSelectRoute={handleRouteSelect} />

      <AICompanion
        key={dialogueSequence}
        visible={dialogueVisible}
        message={currentDialogue}
        onComplete={handleTypingComplete}
      />

      <DistanceOdometer
        warpSpeed={gameState.kecepatanWarp}
        isActive={gameState.phase !== "idle" && !isStranded}
      />

      {selectedRoute && (
        <aside
          className={`intro-route-telemetry${
            isStranded ? " is-complete" : ""
          }`}
          style={
            {
              "--route-accent": ROUTE_PRESENTATION[selectedRoute].accent,
            } as React.CSSProperties
          }
          aria-label={`Telemetry rute ${selectedRoute}`}
        >
          <div className="intro-route-telemetry-heading">
            <span>{ROUTE_PRESENTATION[selectedRoute].code}</span>
            <strong>{ROUTE_PRESENTATION[selectedRoute].title}</strong>
          </div>
          <div className="intro-route-telemetry-state">
            <i aria-hidden="true" />
            <span>
              {isStranded
                ? "TOUCHDOWN CONFIRMED"
                : getRouteBeatLabel(selectedRoute, storyBeat)}
            </span>
          </div>
          <div className="intro-route-telemetry-progress" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((step) => (
              <i
                key={step}
                className={
                  getRouteBeatIndex(storyBeat) >= step ? "active" : ""
                }
              />
            ))}
          </div>
          <small>{ROUTE_PRESENTATION[selectedRoute].metric}</small>
        </aside>
      )}

      {!initUIVisible && (
        <button
          className={`intro-skip-control${isStranded ? " is-recovery" : ""}`}
          type="button"
          data-testid={isStranded ? "intro-authentication" : "intro-skip"}
          onClick={handleComplete}
        >
          <span>{isStranded ? "RECOVERY PROTOCOL" : "SKIP RECORD"}</span>
          <strong>
            {isStranded ? "MULAI AUTENTIKASI →" : "BEDROOM →"}
          </strong>
        </button>
      )}

      {}
      <div
        className="flash-overlay"
        style={{
          opacity: flashOpacity,
          transition: 'opacity 1s ease-in',
        }}
      />
    </div>
  );
};

export default NewIntroScene;
