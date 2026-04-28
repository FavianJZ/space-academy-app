import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls as DreiOrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useIntroAudio } from '../hooks/useIntroAudio';
import { useIntroGameState } from '../hooks/useIntroGameState';
import { useIntroStory } from '../hooks/useIntroStory';
import { SceneEffects } from './SceneEffects';
import { CockpitModel } from './CockpitModel';
import { AsteroidObject } from './AsteroidObject';
import AICompanion from './stages/AICompanion';
import SystemInitUI from './stages/SystemInitUI';
import NavigationUI from './stages/NavigationUI';
import DistanceOdometer from './stages/DistanceOdometer';
import type { NavigationRoute } from '../types/threejs-intro.types';
import AdaptiveCanvas from './AdaptiveCanvas';
import './NewIntroScene.css';

/**
 * Main 3D Scene Component
 */
const IntroScene3D: React.FC<{
  gameState: any;
  isShaking: boolean;
  interiorLightColor: number;
  interiorLightIntensity: number;
  asteroidVisible: boolean;
  asteroidAnimating: boolean;
  onNavigationSelect: (route: NavigationRoute) => void;
  onComplete: () => void;
}> = ({ 
  isShaking, 
  gameState, 
  interiorLightColor, 
  interiorLightIntensity,
  asteroidVisible,
  asteroidAnimating
}) => {
  const { camera } = useThree();
  const controlsRef = React.useRef<any>(null);
  const posisiAsliX = React.useRef(0);
  const posisiAsliY = React.useRef(0);
  const interiorLightRef = React.useRef<THREE.PointLight>(null);

  const isShakingActive = useRef(false);

  useFrame(() => {
    if (controlsRef.current) {
      // Update is called automatically in r3f, but we update target for damping
      controlsRef.current.update();
    }

    // Update interior light color and intensity dynamically
    if (interiorLightRef.current) {
      interiorLightRef.current.color.setHex(interiorLightColor);
      interiorLightRef.current.intensity = interiorLightIntensity;
      
      // Blinking effect when alarm is active
      if (gameState.isAlarmActive) {
        const kedip = Math.abs(Math.sin(Date.now() * 0.005));
        interiorLightRef.current.intensity = 5 + kedip * 20;
      }
    }

    // Camera shaking when taking damage
    if (isShaking && camera) {
      if (!isShakingActive.current) {
        posisiAsliX.current = camera.position.x;
        posisiAsliY.current = camera.position.y;
        isShakingActive.current = true;
      }
      const intensity = 0.2;
      camera.position.x = posisiAsliX.current + (Math.random() - 0.5) * intensity;
      camera.position.y = posisiAsliY.current + (Math.random() - 0.5) * intensity;
    } else if (camera && isShakingActive.current) {
      // Restore camera when shaking stops
      camera.position.x = posisiAsliX.current;
      camera.position.y = posisiAsliY.current;
      isShakingActive.current = false;
    }
  });

  return (
    <>
      {/* POV Camera positioned inside cockpit looking outward */}
      <PerspectiveCamera makeDefault position={[0, 16, 0]} fov={75} />
      
      {/* Lighting Setup - Exact match from original */}
      <ambientLight intensity={0.1} color={0xffffff} />
      <directionalLight intensity={0.2} position={[5, 5, 5]} color={0xffffff} />
      
      {/* Interior cockpit light - Dynamic color and intensity */}
      <pointLight 
        ref={interiorLightRef}
        position={[0, 13, 0]} 
        color={interiorLightColor}
        intensity={interiorLightIntensity}
      />

      <SceneEffects />
      <CockpitModel onLoaded={() => console.log('Cockpit loaded')} />

      {/* OrbitControls - POV from cockpit center, stationary */}
      <DreiOrbitControls
        ref={controlsRef}
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

      {/* Asteroid that approaches during crash sequence */}
      <AsteroidObject 
        visible={asteroidVisible}
        isAnimating={asteroidAnimating}
      />
    </>
  );
};

/**
 * Main Intro Scene Component with UI
 */
export const NewIntroScene: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  const { audio, audioLoaded, playSound, stopSound } = useIntroAudio();
  const { state: gameState, setPhase, setWarpSpeed, setShaking, setAlarmActive } =
    useIntroGameState();

  const [currentDialogue, setCurrentDialogue] = useState('');
  const [dialogueVisible, setDialogueVisible] = useState(false);
  const [initUIVisible, setInitUIVisible] = useState(true);
  const [navUIVisible, setNavUIVisible] = useState(false);
  const [statusText, setStatusText] = useState('AWAITING COMMANDER\'S AUTHORIZATION...');
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [interiorLightColor, setInteriorLightColor] = useState(0x00ffff);
  const [interiorLightIntensity, setInteriorLightIntensity] = useState(0);
  const [asteroidVisible, setAsteroidVisible] = useState(false);
  const [asteroidAnimating, setAsteroidAnimating] = useState(false);

  const handleDialogue = useCallback(
    (message: string, duration = 5000, useVoice = true) => {
      setCurrentDialogue(message);
      setDialogueVisible(true);

      if (useVoice && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'id-ID';
        utterance.pitch = 1.3;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
      }

      if (duration > 0) {
        setTimeout(() => {
          setDialogueVisible(false);
        }, duration);
      }
    },
    []
  );

  const handlePhaseChange = useCallback((phase: string) => {
    setPhase(phase as any);
  }, [setPhase]);

  const handleShake = useCallback((shake: boolean) => {
    setShaking(shake);
  }, [setShaking]);

  const handleWarpSpeed = useCallback((speed: number) => {
    setWarpSpeed(speed);
  }, [setWarpSpeed]);

  const handleAlarm = useCallback((active: boolean) => {
    setAlarmActive(active);
    if (active && audio.sfxAlarm) {
      playSound('sfxAlarm');
    } else if (!active && audio.sfxAlarm) {
      stopSound('sfxAlarm');
    }
  }, [audio.sfxAlarm, playSound, stopSound]);

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

  const handleComplete = useCallback(() => {
    stopSound('sfxAlarm');
    setFlashOpacity(1);
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);
  }, [onComplete, stopSound]);

  const storyMethods = useIntroStory({
    onDialogue: handleDialogue,
    onPhaseChange: handlePhaseChange,
    onShake: handleShake,
    onWarpSpeed: handleWarpSpeed,
    onAlarm: handleAlarm,
    onNavigationShow: handleNavigationShow,
    onLightingChange: handleLightingChange,
    onAsteroidShow: handleAsteroidShow,
    onComplete: handleComplete,
  });

  const handleStartMission = useCallback(() => {
    setInitUIVisible(false);
    setTimeout(() => {
      if (audio.bgm) playSound('bgm');
      if (audio.sfxEngine) playSound('sfxEngine');

      setStatusText('> MENGAKTIFKAN PROTOKOL PENERBANGAN... OK');

      setTimeout(() => {
        storyMethods.startIntroSinematic();
      }, 1500);
    }, 1000);
  }, [audio, playSound, storyMethods]);

  const handleRouteSelect = useCallback(
    (route: NavigationRoute) => {
      storyMethods.handleRouteSelection(route);
    },
    [storyMethods]
  );

  useEffect(() => {
    if (audioLoaded) {
      console.log('Audio assets loaded');
    }
  }, [audioLoaded]);

  return (
    <div className="new-intro-scene-container">
      <AdaptiveCanvas
        className="intro-canvas"
        dpr={[1, 1.25]}
        quality="auto"
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
          onNavigationSelect={handleRouteSelect}
          onComplete={handleComplete}
        />
      </AdaptiveCanvas>

      {/* UI Overlays */}
      <SystemInitUI
        visible={initUIVisible}
        statusText={statusText}
        onStartMission={handleStartMission}
      />

      <NavigationUI visible={navUIVisible} onSelectRoute={handleRouteSelect} />

      <AICompanion
        visible={dialogueVisible}
        message={currentDialogue}
        onComplete={() => setDialogueVisible(false)}
      />

      <DistanceOdometer
        warpSpeed={gameState.kecepatanWarp}
        isActive={gameState.phase !== 'idle'}
      />

      {/* Flash overlay for transitions */}
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
