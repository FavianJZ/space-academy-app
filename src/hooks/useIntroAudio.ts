import { useEffect, useRef, useState } from 'react';
import type { AudioAssets } from '../types/threejs-intro.types';

export const useIntroAudio = () => {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const audioRef = useRef<AudioAssets>({
    bgm: null,
    suspenseBgm: null,
    sfxEngine: null,
    sfxRingtone: null,
    sfxAlarm: null,
    sfxWarp: null,
    sfxExplosion: null,
    sfxQTEcorrect: null,
    sfxQTEwrong: null,
    sfxLaser: null,
    sfxVehicleDestroyed: null,
    sfxMissionSuccess: null,
    sfxMissionFailure: null,
    sfxGlitch: null,
    sfxTyping: null,
  });

  useEffect(() => {
    const loadAudioAssets = () => {
      const assets = audioRef.current;

      assets.bgm = new Audio('/audio/space_bgm.wav');
      assets.bgm.loop = true;
      assets.bgm.volume = 0.2;

      assets.suspenseBgm = new Audio('/audio/suspense_bgm.mp3');
      assets.suspenseBgm.loop = true;
      assets.suspenseBgm.volume = 0.3;

      assets.sfxEngine = new Audio('/audio/engine_start.wav');
      assets.sfxEngine.volume = 0.5;

      assets.sfxRingtone = new Audio('/audio/phone_ringtone.wav');
      assets.sfxRingtone.loop = true;

      assets.sfxAlarm = new Audio('/audio/danger_alarm.wav');
      assets.sfxAlarm.loop = true;
      assets.sfxAlarm.volume = 0.5;

      assets.sfxWarp = new Audio('/audio/space_warp.wav');
      assets.sfxWarp.volume = 0.2;

      assets.sfxExplosion = new Audio('/audio/explosion_sfx.wav');
      
      assets.sfxQTEcorrect = new Audio('/audio/correct_sfx.wav');
      
      assets.sfxQTEwrong = new Audio('/audio/wrong_sfx.mp3');
      
      assets.sfxLaser = new Audio('/audio/laser_shot.wav');
      assets.sfxLaser.loop = true;

      assets.sfxVehicleDestroyed = new Audio('/audio/vehicle_explosion_sfx.wav');
      assets.sfxVehicleDestroyed.volume = 0.5;

      assets.sfxMissionSuccess = new Audio('/audio/success_sfx.wav');
      
      assets.sfxMissionFailure = new Audio('/audio/gameover_sfx.wav');
      
      assets.sfxGlitch = new Audio('/audio/glitch_sfx.wav');
      
      assets.sfxTyping = new Audio('/audio/typing_sfx.mp3');
      assets.sfxTyping.loop = true;
      assets.sfxTyping.volume = 0.1;

      setAudioLoaded(true);
    };

    loadAudioAssets();

    return () => {
      
      Object.values(audioRef.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  const playSound = (key: keyof AudioAssets) => {
    const asset = audioRef.current[key];
    if (asset) {
      try {
        asset.currentTime = 0;
        asset.play().catch((err) => console.warn('Audio play error:', err));
      } catch (error) {
        console.warn('Audio error:', error);
      }
    }
  };

  const stopSound = (key: keyof AudioAssets) => {
    const asset = audioRef.current[key];
    if (asset) {
      asset.pause();
      asset.currentTime = 0;
    }
  };

  const pauseSound = (key: keyof AudioAssets) => {
    const asset = audioRef.current[key];
    if (asset) {
      asset.pause();
    }
  };

  const resumeSound = (key: keyof AudioAssets) => {
    const asset = audioRef.current[key];
    if (asset && asset.paused) {
      asset.play().catch((err) => console.warn('Audio play error:', err));
    }
  };

  const setVolume = (key: keyof AudioAssets, volume: number) => {
    const asset = audioRef.current[key];
    if (asset) {
      asset.volume = Math.max(0, Math.min(1, volume));
    }
  };

  return {
    audio: audioRef.current,
    audioLoaded,
    playSound,
    stopSound,
    pauseSound,
    resumeSound,
    setVolume,
  };
};
