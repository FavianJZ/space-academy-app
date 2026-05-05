import { useCallback } from 'react';
import type { NavigationRoute } from '../types/threejs-intro.types';

interface UseIntroStoryProps {
  onDialogue: (message: string, duration?: number, useVoice?: boolean) => void;
  onPhaseChange: (phase: string) => void;
  onShake: (shake: boolean) => void;
  onWarpSpeed: (speed: number) => void;
  onAlarm: (active: boolean) => void;
  onNavigationShow: (show: boolean) => void;
  onLightingChange?: (color: number, intensity: number) => void;
  onAsteroidShow?: (visible: boolean, animate?: boolean) => void;
  onComplete?: () => void;
}

/**
 * Hook to manage story sequences and narratives
 */
export const useIntroStory = (props: UseIntroStoryProps) => {
  const {
    onDialogue,
    onPhaseChange,
    onShake,
    onWarpSpeed,
    onAlarm,
    onNavigationShow,
    onLightingChange,
    onAsteroidShow,
    onComplete,
  } = props;

  const startIntroSinematic = useCallback(() => {
    onPhaseChange('intro');
    onWarpSpeed(0.5);
    onShake(false);

    // Initial AI dialogue
    onDialogue(
      'Selamat datang kembali, Komandan. Sistem navigasi utama mengalami anomali. Kita tidak bisa menggunakan rute otomatis menuju Hub World.',
      8000
    );

    // Second dialogue and show navigation
    setTimeout(() => {
      onDialogue(
        'Memindai rute manual... Ditemukan 4 jalur potensial. Silakan pilih rute pendekatan Anda melalui panel sistem di layar.',
        8000
      );

      setTimeout(() => {
        onNavigationShow(true);
      }, 8000);
    }, 8000);
  }, [onDialogue, onPhaseChange, onShake, onWarpSpeed, onNavigationShow, onAlarm]);

  const handleEngineCrisis = useCallback(() => {
    onPhaseChange('crisis');
    onWarpSpeed(0.5);
    
    // Set interior light to orange
    if (onLightingChange) {
      onLightingChange(0xffaa00, 3);
    }

    onDialogue(
      'Mengalihkan daya ke perbaikan mesin utama. Kecepatan diturunkan. Tunggu sebentar, Komandan, radar mendeteksi sesuatu yang mendekat...',
      5000
    );

    setTimeout(() => {
      triggerCrash();
    }, 5000);
  }, [onDialogue, onPhaseChange, onWarpSpeed, onLightingChange]);

  const handleNavigationCrisis = useCallback(() => {
    onPhaseChange('crisis');
    onWarpSpeed(2);

    // Set interior light to cyan
    if (onLightingChange) {
      onLightingChange(0x00ffff, 3);
    }

    onDialogue(
      'Program navigasi mengalami gangguan elektromagnetik. Kecepatan meningkat secara otomatis! Sistem tidak responsif!',
      5000
    );

    setTimeout(() => {
      triggerCrash();
    }, 5000);
  }, [onDialogue, onPhaseChange, onWarpSpeed, onLightingChange]);

  const handleFuelCrisis = useCallback(() => {
    onPhaseChange('crisis');
    onWarpSpeed(1);

    // Set interior light to dark gray
    if (onLightingChange) {
      onLightingChange(0x555555, 3);
    }

    onDialogue(
      'Kebocoran bahan bakar terdeteksi! Cadangan energi turun drastis. Semua sistem sekunder dimatikan untuk menghemat daya!',
      5000
    );

    setTimeout(() => {
      triggerCrash();
    }, 5000);
  }, [onDialogue, onPhaseChange, onWarpSpeed, onLightingChange]);

  const handleBlackholeCrisis = useCallback(() => {
    onPhaseChange('crisis');
    onWarpSpeed(3);
    onShake(true);

    // Set interior light to purple
    if (onLightingChange) {
      onLightingChange(0x8800ff, 3);
    }

    onDialogue(
      'ALERT! Anomali gravitasi terdeteksi. Ini bukan asteroid... Komandan, ini adalah singularitas! Tarikan gravitasi tak terhindarkan!',
      6000
    );

    setTimeout(() => {
      triggerCrash();
    }, 6000);
  }, [onDialogue, onPhaseChange, onWarpSpeed, onShake, onLightingChange]);

  const triggerCrash = useCallback(() => {
    onPhaseChange('crash');
    onAlarm(true);
    onShake(true);

    // Set interior light to red for danger
    if (onLightingChange) {
      onLightingChange(0xff0000, 4);
    }

    // Show asteroid approaching after initial warning
    setTimeout(() => {
      if (onAsteroidShow) {
        onAsteroidShow(true, true); // Show asteroid and start animation
      }
    }, 3000); // Asteroid appears 3 seconds into the warning

    onDialogue(
      'PERINGATAN KRITIS! Objek masif terdeteksi mendekat dengan kecepatan tinggi! Benturan tak terhindarkan dalam 3... 2... 1...',
      6000
    );

    setTimeout(() => {
      // Trigger white flash and completion
      if (onComplete) {
        onComplete();
      }
    }, 6000);
  }, [onDialogue, onPhaseChange, onAlarm, onShake, onLightingChange, onAsteroidShow, onComplete]);

  const handleRouteSelection = useCallback(
    (route: NavigationRoute) => {
      onNavigationShow(false);

      switch (route) {
        case 'Mesin':
          handleEngineCrisis();
          break;
        case 'Navigasi':
          handleNavigationCrisis();
          break;
        case 'Bensin':
          handleFuelCrisis();
          break;
        case 'Blackhole':
          handleBlackholeCrisis();
          break;
        default:
          break;
      }
    },
    [
      handleEngineCrisis,
      handleNavigationCrisis,
      handleFuelCrisis,
      handleBlackholeCrisis,
      onNavigationShow,
    ]
  );

  return {
    startIntroSinematic,
    handleRouteSelection,
    handleEngineCrisis,
    handleNavigationCrisis,
    handleFuelCrisis,
    handleBlackholeCrisis,
    triggerCrash,
  };
};

export default useIntroStory;
