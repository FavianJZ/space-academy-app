import { useCallback, useEffect, useRef } from "react";

import {
  LANDING_GATE_INDEX,
  NAV_FLIGHT_BRIEFING,
  NAV_FLIGHT_GATES,
  type ManualFlightStage,
} from "../scenes/intro/navFlightConfig";
import type {
  GamePhase,
  IntroStoryBeat,
  NavigationRoute,
} from "../types/threejs-intro.types";

/** NAV-02 is flown by the player instead of being played back. */
const MANUAL_FLIGHT_ROUTE: NavigationRoute = "Navigasi";

/**
 * Time between the shuttle returning to the scripted landing curve and the
 * touchdown beat. Matches ROUTE_TIMING.touchdown - LANDING_HANDOFF_TIME.
 */
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

const ROUTE_NARRATIVES: Record<NavigationRoute, RouteNarrative> = {
  Mesin: {
    lockColor: 0xff9b4a,
    crisisColor: 0xff3d24,
    strandedColor: 0xffb86b,
    lockWarp: 0.7,
    crisisWarp: 1.8,
    lockDialogue:
      "Rute mesin dipilih. Tiga drone servis memeriksa pendorong dari luar. Kamera buritan aktif; kita mulai dengan dorongan rendah.",
    crisisDialogue:
      "Pendorong kanan terlalu panas. Saluran pendinginnya retak. Aku mengurangi daya dan melepas modul yang rusak sebelum api mencapai badan kapal.",
    climaxDialogue:
      "Modul sudah terlepas dan dua pendorong masih merespons. Orbit tidak dapat dipulihkan, tetapi ada pulau dengan pad darurat di depan.",
    approachDialogue:
      "Pad terkunci. Roda pendaratan turun. Kecepatan kita potong bertahap; tahan hidung kapal tetap sejajar dengan garis tengah.",
    touchdownDialogue:
      "Roda utama menyentuh pad. Menahan rem aerodinamis... roda depan turun... kapal berhenti.",
    strandedDialogue:
      "Pendaratan aman, tetapi panas tadi merusak inti identitas kapal. Autentikasi ulang pilot diperlukan sebelum sistem pemulihan dapat dibuka.",
  },
  Navigasi: {
    lockColor: 0x42ddff,
    crisisColor: 0x2776ff,
    strandedColor: 0x72d8ff,
    lockWarp: 1.45,
    crisisWarp: 2.4,
    lockDialogue:
      "Rute navigasi dipilih. Kendali manual aktif. Tiga gerbang orbital menjadi patokan untuk mengitari planet dan turun ke koridor aman.",
    crisisDialogue:
      "Badai magnetik menggandakan sinyal gerbang. Aku melihat lintasan asli dan bayangannya sekaligus; haluan sudah melenceng delapan belas derajat.",
    climaxDialogue:
      "Gerbang asli ditemukan melalui posisi bintang, tetapi kita terlalu rendah untuk kembali ke orbit. Aku memilih daratan terapung sebagai tujuan.",
    approachDialogue:
      "Suar pendaratan terlihat. Menghapus sinyal palsu, menurunkan roda, lalu masuk dari sisi kanan dengan sudut tiga derajat.",
    touchdownDialogue:
      "Kontak roda utama terkonfirmasi. Koreksi kecil ke kiri... roda depan turun... lintasan stabil.",
    strandedDialogue:
      "Kita mendarat di daratan yang tidak tercatat. Badai magnetik menghapus peta dan profil pilot, jadi autentikasi ulang diperlukan.",
  },
  Bensin: {
    lockColor: 0x7dff9b,
    crisisColor: 0xffbd38,
    strandedColor: 0xffcf72,
    lockWarp: 0.9,
    crisisWarp: 0.28,
    lockDialogue:
      "Rute cadangan bahan bakar dipilih. Tangki sekunder tersambung. Kita memakai dorongan minimum sambil membidik pulau di depan.",
    crisisDialogue:
      "Segel tangki pecah. Tetesan bahan bakar terlihat di belakang sayap kanan. Mematikan pendorong sebelum sisa bahan bakar ikut terbakar.",
    climaxDialogue:
      "Pendorong sudah mati. Kita hanya punya ketinggian dan momentum. Aku mengubah sudut luncur agar energi cukup sampai ke pulau.",
    approachDialogue:
      "Pad masuk jangkauan. Roda turun. Jangan tarik hidung terlalu cepat; kita simpan kecepatan untuk flare terakhir.",
    touchdownDialogue:
      "Flare sekarang... roda utama menyentuh pad. Kecepatan turun, roda depan aman, dan kebocoran telah berhenti.",
    strandedDialogue:
      "Glide berhasil dan tangki kini benar-benar kosong. Sistem darurat terkunci sampai autentikasi pilot dipulihkan.",
  },
  Blackhole: {
    lockColor: 0xb26dff,
    crisisColor: 0x7b2cff,
    strandedColor: 0xb993ff,
    lockWarp: 3.1,
    crisisWarp: 4.2,
    lockDialogue:
      "Rute slingshot dipilih. Kita akan meminjam gravitasi singularitas untuk menambah kecepatan. Kamera distabilkan terhadap bintang, bukan badan kapal.",
    crisisDialogue:
      "Tarikan pasang lebih kuat dari prediksi. Orbit menyempit dan badan kapal mulai miring. Menyalakan pendorong koreksi sebelum melewati batas aman.",
    climaxDialogue:
      "Kita terlempar keluar. Putaran berhasil diredam dan sensor kembali membaca sebuah daratan di vektor kanan depan.",
    approachDialogue:
      "Mengubah kecepatan sisa menjadi lintasan turun. Roda pendaratan aktif; sekarang kapal harus benar-benar rata sebelum menyentuh pad.",
    touchdownDialogue:
      "Kontak. Suspensi menahan benturan pertama... putaran nol... shuttle berhenti di tengah pad.",
    strandedDialogue:
      "Kita selamat dari anomali, tetapi tidak satu pun koordinat cocok dengan peta akademi. Autentikasi ulang diperlukan untuk membuka navigasi lokal.",
  },
};

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
  const storyControllerRef = useRef<AbortController | null>(null);
  /** Alarm SFX restarts on every play, so only forward real changes. */
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
        "Komandan, ini ORBIT. Rekaman OA-01 dimulai. Sistem navigasi utama gagal saat kita meninggalkan orbit akademi.",
        900
      );
      if (signal.aborted) return;

      onPhaseChange("intro");
      onStoryBeatChange("cruise");
      onWarpSpeed(0.82);
      await onDialogue(
        "Aku menemukan empat prosedur pemulihan: perbaikan mesin, koreksi navigasi, cadangan bahan bakar, dan slingshot gravitasi. Setiap pilihan memiliki konsekuensi berbeda.",
        900
      );
      if (signal.aborted) return;

      onPhaseChange("navigation");
      onStoryBeatChange("route-selection");
      onWarpSpeed(0.46);
      await onDialogue(
        "Panel keputusan aktif. Pilih satu vektor; aku akan menjalankan prosedur dan membuka kamera penerbangan yang sesuai.",
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
  ]);

  /**
   * Descent, touchdown and the stranded beat. Shared by the scripted routes and
   * by NAV-02 once the player hands the shuttle back at the landing gate.
   */
  const runLandingSequence = useCallback(
    (route: NavigationRoute, playApproachBeat: boolean) => {
      const controller = beginStory();
      const { signal } = controller;
      const narrative = ROUTE_NARRATIVES[route];

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
          // The approach beat is already on screen from the landing gate.
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
      setAlarm,
    ]
  );

  const handleRouteSelection = useCallback(
    (route: NavigationRoute) => {
      const controller = beginStory();
      const { signal } = controller;
      const narrative = ROUTE_NARRATIVES[route];

      onNavigationShow(false);
      onRouteSelected(route);
      onAsteroidShow(false);
      onPhaseChange("navigation");
      onStoryBeatChange("route-locked");
      onWarpSpeed(narrative.lockWarp);
      setAlarm(false);
      onShake(false);
      onLightingChange(narrative.lockColor, 4.2);

      // NAV-02 is flown by hand: brief the controls, then wait for the player
      // to clear gates instead of running a timed shot list.
      if (route === MANUAL_FLIGHT_ROUTE) {
        onManualStageChange("flying");
        void onDialogue(NAV_FLIGHT_BRIEFING, 1400);
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
      runLandingSequence,
      setAlarm,
    ]
  );

  /** Fired when the player flies through a waypoint gate on NAV-02. */
  const handleManualGateCleared = useCallback(
    (gateIndex: number) => {
      const gate = NAV_FLIGHT_GATES[gateIndex];
      if (!gate || gateIndex >= LANDING_GATE_INDEX) return;

      const narrative = ROUTE_NARRATIVES[MANUAL_FLIGHT_ROUTE];
      onStoryBeatChange(gate.beat);
      onPhaseChange(gate.phase);
      setAlarm(gate.alarm);
      onLightingChange(
        gate.alarm ? narrative.crisisColor : narrative.lockColor,
        gate.alarm ? 5.4 : 4.2
      );

      // Non-blocking: the shuttle keeps flying while ORBIT talks.
      void onDialogue(gate.dialogue, 900);
    },
    [onDialogue, onLightingChange, onPhaseChange, onStoryBeatChange, setAlarm]
  );

  /** The landing gate: controls are surrendered and the descent shot begins. */
  const handleManualLandingGate = useCallback(() => {
    const narrative = ROUTE_NARRATIVES[MANUAL_FLIGHT_ROUTE];
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
    setAlarm,
  ]);

  /** The scripted landing animation now owns the shuttle again. */
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
