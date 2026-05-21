import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import * as THREE from 'three';
import AdaptiveCanvas from '../components/AdaptiveCanvas';
import { BedroomModel } from '../components/BedroomModel';
import { Robot } from '../components/Robot';
import { SpacemanWhite } from '../components/SpacemanWhite';
import { useGameStore } from '../stores/useGameStore';
import './Bedroom.css';
import { SpacemanPink } from '../components/SpacemanPink';

type DialoguePhase = 0 | 1 | 2 | 3 | 5;
type IdentityStep = 'intro' | 'name' | 'phone' | 'school' | 'major' | 'confirm' | 'submitted';
type FieldKey = 'name' | 'phone' | 'school' | 'major';
type StoryTone = 'info' | 'warn' | 'success';
type ActiveSpeaker = 'robot' | 'spaceman' | null;

type StoryLine = {
  speaker: 'AI Robot' | 'Spaceman';
  text: string;
  tone?: StoryTone;
};

type IdentityFormData = {
  name: string;
  phone: string;
  school: string;
  major: 'IPA' | 'IPS' | '';
};

type StepConfig = {
  step: IdentityStep;
  field?: FieldKey;
  label?: string;
  placeholder?: string;
  required?: boolean;
  inputType?: 'text' | 'tel' | 'select';
  options?: Array<{ value: string; label: string }>;
  preDialogue: StoryLine[];
  postSubmit: (value: string, currentData: IdentityFormData) => StoryLine[];
};

const fieldStepOrder: IdentityStep[] = ['name', 'phone', 'school', 'major'];

const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  onComplete?: () => void;
  skip?: boolean;
}> = ({ text, speed = 28, onComplete, skip = false }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    idxRef.current = 0;

    if (text.length === 0) {
      setDone(true);
      return;
    }

    timerRef.current = setInterval(() => {
      idxRef.current++;
      setDisplayed(text.substring(0, idxRef.current));
      if (idxRef.current >= text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  useEffect(() => {
    if (skip && !done) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayed(text);
      setDone(true);
      onCompleteRef.current?.();
    }
  }, [skip, done, text]);

  return (
    <>
      {displayed}
      {!done && <span className="tw-cursor">▌</span>}
    </>
  );
};

// ─── Sound Wave Bars ─────────────────────────────────────────────────────────
const SoundWaveBars: React.FC<{ active: boolean; small?: boolean }> = ({ active, small }) => {
  if (!active) return null;
  return (
    <div className={`sound-wave ${small ? 'sm' : ''}`}>
      <span /><span /><span /><span />
    </div>
  );
};

const LoadingScreen: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 30;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const fillTimer = setTimeout(() => setProgress(100), 0);
      const resetTimer = setTimeout(() => setProgress(0), 500);
      return () => {
        clearTimeout(fillTimer);
        clearTimeout(resetTimer);
      };
    }
    return undefined;
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className={`loading-screen ${isLoading ? 'active' : 'fade-out'}`}>
      <div className="loading-content">
        <h2>LOADING SECTOR...</h2>
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="loading-text">{Math.min(Math.floor(progress), 100)}%</p>
        <div className="loading-dots">
          <span>?</span>
          <span>?</span>
          <span>?</span>
        </div>
      </div>
    </div>
  );
};

const CameraAnimator: React.FC<{
  phase: DialoguePhase;
  activeSpeaker: ActiveSpeaker;
  showInputCard: boolean;
  identityStep: IdentityStep;
}> = ({ phase, activeSpeaker, showInputCard, identityStep }) => {
  const { camera } = useThree();
  const prevSpeakerRef = useRef<ActiveSpeaker>(null);

  // Phase-based camera (intro phases 0-2, submitted phase 5)
  useEffect(() => {
    if (phase === 3) return; // handled by speaker-based logic below

    const targets = {
      0: { pos: [0, -1, 1], target: [3, -1, -2] },
      1: { pos: [2, 0, 1], target: [10, -5, -2] },
      2: { pos: [2, 0, 1], target: [10, -5, -2] },
      5: { pos: [3, -1, 2], target: [3, -1, -2] },
    } as const;

    const target = targets[phase as 0 | 1 | 2 | 5];
    if (!target) return;

    gsap.to(camera.position, {
      x: target.pos[0], y: target.pos[1], z: target.pos[2],
      duration: 1.2, ease: 'power2.inOut',
    });

    const lookAt = new THREE.Vector3(...target.target);
    gsap.to(camera, {
      onUpdate: () => camera.lookAt(lookAt),
      duration: 1.2,
    });
  }, [camera, phase]);

  // Speaker-based camera during phase 3
  useEffect(() => {
    if (phase !== 3) return;

    // If showing input form or confirm step → wide overview shot
    if (showInputCard || identityStep === 'confirm') {
      const overviewPos = { x: 3.5, y: 0.2, z: 3 };
      const overviewTarget = new THREE.Vector3(4, -0.8, -0.5);

      gsap.to(camera.position, {
        ...overviewPos, duration: 1.0, ease: 'power2.inOut',
      });
      gsap.to(camera, {
        onUpdate: () => camera.lookAt(overviewTarget),
        duration: 1.0,
      });
      prevSpeakerRef.current = null;
      return;
    }

    // Skip if same speaker (avoid jitter)
    if (activeSpeaker === prevSpeakerRef.current) return;
    prevSpeakerRef.current = activeSpeaker;

    if (activeSpeaker === 'robot') {
      // Camera faces the robot (robot at ~3.5, -0.8, 0)
      gsap.to(camera.position, {
        x: 2.8, y: 0, z: 1.8,
        duration: 0.9, ease: 'power2.inOut',
      });
      const robotTarget = new THREE.Vector3(3.5, -0.5, 0);
      gsap.to(camera, {
        onUpdate: () => camera.lookAt(robotTarget),
        duration: 0.9,
      });
    } else if (activeSpeaker === 'spaceman') {
      // Camera faces the spaceman (spaceman at ~5, -0.8, 1)
      gsap.to(camera.position, {
        x: 1.7, y: 0, z: 1.5,
        duration: 0.9, ease: 'power2.inOut',
      });
      const spacemanTarget = new THREE.Vector3(5, -0.5, 1);
      gsap.to(camera, {
        onUpdate: () => camera.lookAt(spacemanTarget),
        duration: 0.9,
      });
    }
  }, [camera, phase, activeSpeaker, showInputCard, identityStep]);

  return null;
};

const SpacemanAnimator: React.FC<{
  phase: DialoguePhase;
  charRef: React.RefObject<THREE.Group | null>;
  isSpeaking: boolean;
}> = ({ phase, charRef, isSpeaking }) => {
  const baseY = useRef(-0.8);

  useEffect(() => {
    if (!charRef.current) return;

    if (phase === 0) {
      gsap.to(charRef.current.position, { x: 5, y: -0.8, z: -1.5, duration: 0.5 });
      gsap.to(charRef.current.rotation, { x: -1, y: 0, z: 4.8, duration: 0.5 });
    } else if (phase >= 1) {
      gsap.to(charRef.current.position, { x: 5, y: -0.8, z: 1, duration: 1.2, ease: 'back.out' });
      gsap.to(charRef.current.rotation, { x: 0, y: 5, z: 0, duration: 1.2, ease: 'power2.inOut' });
    }
  }, [phase, charRef]);

  useFrame(() => {
    if (!charRef.current || phase < 1) return;
    const t = Date.now() * 0.001;
    if (isSpeaking && phase >= 3) {
      charRef.current.position.y = baseY.current + Math.sin(t * 3.5) * 0.06;
      charRef.current.rotation.z = Math.sin(t * 2) * 0.03;
    } else if (phase >= 3) {
      charRef.current.position.y = baseY.current + Math.sin(t * 0.8) * 0.015;
      charRef.current.rotation.z *= 0.95;
    }
  });

  return null;
};

const RobotAnimator: React.FC<{
  isActive: boolean;
  phase: DialoguePhase;
  robotRef: React.RefObject<THREE.Group | null>;
  isSpeaking: boolean;
}> = ({ isActive, phase, robotRef, isSpeaking }) => {
  useEffect(() => {
    if (!robotRef.current) return;

    if (phase === 1) {
      gsap.to(robotRef.current.position, {
        x: 3.5, y: -0.8, z: 0,
        duration: 1, ease: 'power2.inOut',
      });
    }
  }, [phase, robotRef]);

  useFrame(() => {
    if (!robotRef.current || !isActive) return;
    const t = Date.now() * 0.001;
    if (isSpeaking) {
      robotRef.current.rotation.y = Math.sin(t * 3) * 0.15;
      robotRef.current.position.y = -0.8 + Math.sin(t * 4) * 0.06;
    } else {
      robotRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      robotRef.current.position.y = -0.8 + Math.sin(t * 0.8) * 0.02;
    }
  });

  return null;
};

// ─── Speaker Spotlight (dynamic light on active speaker) ─────────────────────
const SpeakerSpotlight: React.FC<{ activeSpeaker: ActiveSpeaker }> = ({ activeSpeaker }) => {
  const robotLightRef = useRef<THREE.PointLight>(null);
  const spacemanLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (robotLightRef.current) {
      const t = activeSpeaker === 'robot' ? 3 : 0;
      robotLightRef.current.intensity = THREE.MathUtils.lerp(robotLightRef.current.intensity, t, 0.06);
    }
    if (spacemanLightRef.current) {
      const t = activeSpeaker === 'spaceman' ? 3 : 0;
      spacemanLightRef.current.intensity = THREE.MathUtils.lerp(spacemanLightRef.current.intensity, t, 0.06);
    }
  });

  return (
    <>
      <pointLight ref={robotLightRef} position={[3.5, 0.5, 1]} color="#00ffff" intensity={0} distance={5} />
      <pointLight ref={spacemanLightRef} position={[5, 0.5, 2]} color="#ffaa44" intensity={0} distance={5} />
    </>
  );
};

const Bedroom: React.FC = () => {
  const navigate = useNavigate();
  const setPlayerData = useGameStore((state) => state.setPlayerData);
  const character = useGameStore((state) => state.character);

  const [dialoguePhase, setDialoguePhase] = useState<DialoguePhase>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<IdentityFormData>({
    name: '',
    phone: '',
    school: '',
    major: '',
  });

  const [identityStep, setIdentityStep] = useState<IdentityStep>('intro');
  const [storyQueue, setStoryQueue] = useState<StoryLine[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showInputCard, setShowInputCard] = useState(false);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [stepError, setStepError] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [skipTyping, setSkipTyping] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [skipModeActive, setSkipModeActive] = useState(false);

  const robotRef = useRef<THREE.Group | null>(null);
  const charRef = useRef<THREE.Group | null>(null);
  const navigateTimeoutRef = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current);
      }
      if (autoPlayTimerRef.current !== null) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, []);

  // Reset typing state whenever dialogue content changes
  useEffect(() => {
    setTypingDone(false);
    setSkipTyping(false);
  }, [dialoguePhase, currentStoryIndex, identityStep]);

  const introDialogues = [
    {
      phase: 0,
      speaker: 'AI System',
      text: '? PROTOKOL DARURAT AKTIF ?\n\nCadet... bangun! Tabrakan asteroid membuat sistem utama lumpuh.',
      buttons: [{ text: 'Siapa kamu? Aku di mana?', action: 1 }],
    },
    {
      phase: 1,
      speaker: 'AI Robot',
      text: 'Kita terdampar di planet asing. Untuk menstabilkan kapal dan membuka navigasi, aku harus verifikasi identitasmu.',
      buttons: [
        { text: 'Kondisi kapalnya bagaimana?', action: 2 },
        { text: 'Apa yang harus aku lakukan?', action: 2 },
      ],
    },
    {
      phase: 2,
      speaker: 'AI Robot',
      text: 'Tenang, kabin masih aman. Ikuti verifikasi bertahap. Aku akan pandu satu per satu agar cepat dan jelas.',
      buttons: [{ text: 'Mulai verifikasi sekarang', action: 3 }],
    },
  ];

  const getStepConfig = useCallback((step: IdentityStep): StepConfig | null => {
    switch (step) {
      case 'intro':
        return {
          step,
          preDialogue: [
            {
              speaker: 'AI Robot',
              text: 'Cadet, sebelum sistem navigasi kubuka, aku perlu sinkronisasi identitas bertahap.',
              tone: 'info',
            },
            {
              speaker: 'Spaceman',
              text: 'Baik. Aku siap. Pandu aku pelan-pelan.',
              tone: 'info',
            },
            {
              speaker: 'AI Robot',
              text: 'Kita mulai dari data paling penting dulu.',
              tone: 'success',
            },
          ],
          postSubmit: () => [],
        };
      case 'name':
        return {
          step,
          field: 'name',
          label: 'NAMA PILOT',
          placeholder: 'Masukkan nama identitas pilot',
          required: true,
          inputType: 'text',
          preDialogue: [
            {
              speaker: 'AI Robot',
              text: 'Cadet, aku butuh identitas pilot untuk membuka lapisan keamanan inti.',
              tone: 'info',
            },
          ],
          postSubmit: (value) => [
            {
              speaker: 'AI Robot',
              text: `Sinkronisasi biometrik cocok. Senang melihatmu kembali sadar, ${value.trim()}.`,
              tone: 'success',
            },
            {
              speaker: 'Spaceman',
              text: 'Lanjut. Kita selesaikan verifikasi ini.',
              tone: 'info',
            },
          ],
        };
      case 'phone':
        return {
          step,
          field: 'phone',
          label: 'NOMOR TELEPON',
          placeholder: 'Kontak darurat (opsional)',
          required: false,
          inputType: 'tel',
          preDialogue: [
            {
              speaker: 'AI Robot',
              text: 'Masukkan kanal kontak darurat. Jika tidak ada, kita tetap bisa lanjut.',
              tone: 'info',
            },
          ],
          postSubmit: (value) => {
            const hasValue = value.trim().length > 0;
            return hasValue
              ? [
                  {
                    speaker: 'AI Robot',
                    text: 'Kanal darurat tercatat. Prioritas komunikasi berhasil dipetakan.',
                    tone: 'success',
                  },
                ]
              : [
                  {
                    speaker: 'AI Robot',
                    text: 'Kontak darurat belum tersedia. Tidak masalah, kita lanjut ke data berikutnya.',
                    tone: 'warn',
                  },
                ];
          },
        };
      case 'school':
        return {
          step,
          field: 'school',
          label: 'SEKOLAH / AKADEMI',
          placeholder: 'Asal sekolah atau akademi (opsional)',
          required: false,
          inputType: 'text',
          preDialogue: [
            {
              speaker: 'AI Robot',
              text: 'Afiliasi akademimu membantuku memuat modul pelatihan yang tepat.',
              tone: 'info',
            },
          ],
          postSubmit: (value) => {
            const hasValue = value.trim().length > 0;
            return hasValue
              ? [
                  {
                    speaker: 'AI Robot',
                    text: `Afiliasi ${value.trim()} dikenali. Profil pendidikan berhasil ditautkan.`,
                    tone: 'success',
                  },
                ]
              : [
                  {
                    speaker: 'AI Robot',
                    text: 'Afiliasi belum ditemukan. Kamu bisa memperbaruinya nanti di terminal utama.',
                    tone: 'warn',
                  },
                ];
          },
        };
      case 'major':
        return {
          step,
          field: 'major',
          label: 'JURUSAN SPESIALISASI',
          required: true,
          inputType: 'select',
          options: [
            { value: '', label: 'Pilih jurusan...' },
            { value: 'IPA', label: 'IPA - Sains & Teknologi' },
            { value: 'IPS', label: 'IPS - Ilmu Sosial' },
          ],
          preDialogue: [
            {
              speaker: 'AI Robot',
              text: 'Pilih spesialisasi utama. Ini menentukan paket misi yang akan aktif.',
              tone: 'info',
            },
          ],
          postSubmit: (value, currentData) => [
            {
              speaker: 'AI Robot',
              text: `Profil ${currentData.name || 'cadet'} dikonfigurasi untuk jalur ${value}.`,
              tone: 'success',
            },
            {
              speaker: 'Spaceman',
              text: 'Bagus. Sekarang buka akses sistem intinya.',
              tone: 'info',
            },
          ],
        };
      default:
        return null;
    }
  }, []);

  const stepMetadata = useMemo(
    () => ({
      name: { title: 'Langkah 1/4 - Identitas Utama' },
      phone: { title: 'Langkah 2/4 - Kontak Darurat' },
      school: { title: 'Langkah 3/4 - Afiliasi Akademi' },
      major: { title: 'Langkah 4/4 - Spesialisasi' },
    }),
    []
  );

  const startStep = useCallback(
    (step: IdentityStep, forceSkipMode: boolean = skipModeActive) => {
      const cfg = getStepConfig(step);
      setIdentityStep(step);
      setStepError('');
      setIsSubmittingStep(false);
      setTypingDone(false);
      setSkipTyping(false);
      
      if (forceSkipMode && cfg?.field) {
        setShowInputCard(true);
        setStoryQueue([]);
        setCurrentStoryIndex(0);
      } else {
        setShowInputCard(false);
        if (cfg) {
          setStoryQueue(cfg.preDialogue);
          setCurrentStoryIndex(0);
        } else {
          setStoryQueue([]);
          setCurrentStoryIndex(0);
        }
      }
    },
    [getStepConfig, skipModeActive]
  );

  const goToNextFieldStep = useCallback(
    (step: IdentityStep, forceSkipMode: boolean = skipModeActive) => {
      const idx = fieldStepOrder.indexOf(step);
      if (idx === -1 || idx === fieldStepOrder.length - 1) {
        setIdentityStep('confirm');
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
        return;
      }
      startStep(fieldStepOrder[idx + 1], forceSkipMode);
    },
    [startStep, skipModeActive]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinueStory = useCallback(() => {
    if (!typingDone) return;
    if (isTransitioningRef.current) return;
    if (storyQueue.length === 0) {
      return;
    }

    // Safety: clamp index to valid range
    const safeIndex = Math.min(currentStoryIndex, storyQueue.length - 1);

    if (safeIndex < storyQueue.length - 1) {
      // Reset typing state synchronously to prevent stale closure bypasses
      setTypingDone(false);
      setSkipTyping(false);
      setCurrentStoryIndex(safeIndex + 1);
      return;
    }

    // We're at the end of the story queue — prevent re-entrant transitions
    isTransitioningRef.current = true;
    setTimeout(() => { isTransitioningRef.current = false; }, 300);

    if (isSubmittingStep) {
      setIsSubmittingStep(false);
      setStepError('');
      if (identityStep === 'major') {
        setIdentityStep('confirm');
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
      } else {
        goToNextFieldStep(identityStep);
      }
      return;
    }

    const cfg = getStepConfig(identityStep);
    if (cfg?.field) {
      setShowInputCard(true);
      return;
    }
  }, [storyQueue, currentStoryIndex, isSubmittingStep, identityStep, goToNextFieldStep, getStepConfig, typingDone]);

  const handleSkipDialogue = useCallback(() => {
    if (dialoguePhase >= 5) return;
    
    setSkipModeActive(true);

    if (dialoguePhase < 3 || identityStep === 'intro') {
      setDialoguePhase(3);
      startStep('name', true);
    } else if (identityStep !== 'confirm') {
      if (isSubmittingStep) {
        setIsSubmittingStep(false);
        setStepError('');
        if (identityStep === 'major') {
          setIdentityStep('confirm');
          setStoryQueue([]);
          setCurrentStoryIndex(0);
          setShowInputCard(false);
        } else {
          goToNextFieldStep(identityStep, true);
        }
      } else {
        setShowInputCard(true);
      }
    }
  }, [dialoguePhase, identityStep, isSubmittingStep, startStep, goToNextFieldStep]);

  const handleSendStep = () => {
    const cfg = getStepConfig(identityStep);
    if (!cfg?.field) {
      return;
    }

    const rawValue = formData[cfg.field];
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;

    if (cfg.required && !value) {
      setStepError(cfg.field === 'major' ? 'Jurusan wajib dipilih.' : 'Nama pilot wajib diisi.');
      return;
    }

    setStepError('');
    
    if (skipModeActive) {
      if (identityStep === 'major') {
        setIdentityStep('confirm');
        setStoryQueue([]);
        setCurrentStoryIndex(0);
        setShowInputCard(false);
      } else {
        goToNextFieldStep(identityStep, true);
      }
    } else {
      const postLines = cfg.postSubmit(String(rawValue), formData);
      setStoryQueue(postLines);
      setCurrentStoryIndex(0);
      setShowInputCard(false);
      setIsSubmittingStep(true);
    }
  };

  const handleEditData = () => {
    startStep('name');
  };

  const handleFinalAuthentication = () => {
    if (!formData.name.trim()) {
      setStepError('Nama pilot wajib diisi sebelum autentikasi final.');
      startStep('name');
      return;
    }

    if (!formData.major) {
      setStepError('Jurusan wajib dipilih sebelum autentikasi final.');
      startStep('major');
      return;
    }

    if (navigateTimeoutRef.current !== null) {
      window.clearTimeout(navigateTimeoutRef.current);
    }

    setPlayerData({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      school: formData.school.trim(),
      major: formData.major,
    });

    setIdentityStep('submitted');
    setDialoguePhase(5);

    navigateTimeoutRef.current = window.setTimeout(() => {
      navigate('/mainhub');
    }, 3000);
  };

  const currentDialogue = introDialogues.find((d) => d.phase === dialoguePhase);
  const currentStepConfig = getStepConfig(identityStep);
  const atStoryEnd = storyQueue.length > 0 && currentStoryIndex === storyQueue.length - 1;
  const canContinueStory =
    storyQueue.length > 0 && !(identityStep === 'intro' && atStoryEnd && !isSubmittingStep);

  const inStoryboardStep = ['intro', 'name', 'phone', 'school', 'major'].includes(identityStep);

  const activeSpeaker = useMemo<ActiveSpeaker>(() => {
    if (dialoguePhase === 5) return null;
    if (dialoguePhase < 3 && currentDialogue) {
      return currentDialogue.speaker.includes('Robot') || currentDialogue.speaker.includes('System')
        ? 'robot' : 'spaceman';
    }
    if (dialoguePhase === 3 && storyQueue.length > 0 && currentStoryIndex < storyQueue.length) {
      return storyQueue[currentStoryIndex].speaker === 'AI Robot' ? 'robot' : 'spaceman';
    }
    return null;
  }, [dialoguePhase, currentDialogue, storyQueue, currentStoryIndex]);

  const handleDialogueClick = useCallback(() => {
    if (isTransitioningRef.current) return;
    if (!typingDone) setSkipTyping(true);
  }, [typingDone]);

  // Auto-play: advance dialogue automatically when typing finishes
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    if (!autoPlay || !typingDone) return;
    if (dialoguePhase === 5) return;

    // Phase 0-2: auto-click the first button after delay
    if (dialoguePhase < 3 && currentDialogue) {
      autoPlayTimerRef.current = setTimeout(() => {
        const btn = currentDialogue.buttons[0];
        if (btn.action === 3) {
          setDialoguePhase(3);
          startStep('intro');
        } else {
          setDialoguePhase(btn.action as DialoguePhase);
        }
      }, 2500);
      return;
    }

    // Phase 3: auto-continue story dialogues
    if (dialoguePhase === 3 && inStoryboardStep && !showInputCard && identityStep !== 'confirm') {
      if (identityStep === 'intro' && atStoryEnd && !isSubmittingStep) {
        autoPlayTimerRef.current = setTimeout(() => {
          startStep('name');
        }, 2500);
        return;
      }

      if (canContinueStory) {
        autoPlayTimerRef.current = setTimeout(() => {
          handleContinueStory();
        }, 2500);
        return;
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [autoPlay, typingDone, dialoguePhase, currentStoryIndex, identityStep, showInputCard, isSubmittingStep, atStoryEnd, canContinueStory, inStoryboardStep, currentDialogue, startStep, handleContinueStory]);

  return (
    <div className="bedroom-scene-container">
      <LoadingScreen isLoading={isLoading} />

      {!isLoading && (
        <>
          <AdaptiveCanvas dpr={[1, 1.25]} quality="auto">
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={60} />

              <ambientLight intensity={0.6} />
              <pointLight position={[3, 3, 3]} intensity={1.2} color="#00aaff" />
              <pointLight position={[-3, 2, 2]} intensity={0.8} color="#ffaa00" />

              <Stars radius={50} depth={30} count={220} factor={2} saturation={0.5} fade />

              <BedroomModel scale={1} position={[0, -1.5, 0]} />

              <group
                ref={charRef}
                position={[5, -0.8, -1.5]}
                rotation={[-1, 0, 4.8]}
                scale={dialoguePhase >= 3 ? 0.8 : 1}
              >
                {character === 'pink' ? (
                  <SpacemanPink scale={0.2} />
                ) : (
                  <SpacemanWhite scale={0.2} />
                )}
              </group>

              <group ref={robotRef} position={[2, -0.5, 0]} scale={dialoguePhase >= 1 ? 1 : 0}>
                <Robot scale={0.8} isSpeaking={activeSpeaker === 'robot'} />
              </group>

              <CameraAnimator phase={dialoguePhase} activeSpeaker={activeSpeaker} showInputCard={showInputCard} identityStep={identityStep} />
              <SpacemanAnimator phase={dialoguePhase} charRef={charRef} isSpeaking={activeSpeaker === 'spaceman'} />
              <RobotAnimator isActive={dialoguePhase >= 1 && dialoguePhase <= 3} phase={dialoguePhase} robotRef={robotRef} isSpeaking={activeSpeaker === 'robot'} />
              <SpeakerSpotlight activeSpeaker={activeSpeaker} />
            </Suspense>
          </AdaptiveCanvas>

          <div className="dialogue-overlay">
            {/* Auto-play toggle button */}
            {dialoguePhase < 5 && (
              <>
                <button
                  className={`auto-play-toggle ${autoPlay ? 'active' : ''}`}
                  onClick={() => setAutoPlay((prev) => !prev)}
                  title={autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
                >
                  {autoPlay ? '⏸ AUTO' : '▶ AUTO'}
                </button>
                <button
                  className={`skip-dialog-btn ${skipModeActive ? 'active' : ''}`}
                  onClick={() => {
                    if (skipModeActive) {
                      setSkipModeActive(false);
                    } else {
                      handleSkipDialogue();
                    }
                  }}
                  title="Toggle Fast Mode (skip all dialogues)"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '120px',
                    padding: '8px 16px',
                    backgroundColor: skipModeActive ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 20, 30, 0.7)',
                    color: '#00ffff',
                    border: '1px solid rgba(0, 255, 255, 0.4)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    zIndex: 1000,
                    fontFamily: '"Orbitron", monospace',
                    fontSize: '12px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    boxShadow: skipModeActive ? '0 0 10px rgba(0, 255, 255, 0.5)' : '0 0 10px rgba(0, 255, 255, 0.2)'
                  }}
                >
                  {skipModeActive ? '⏩ FAST MODE ON' : '⏭ FAST MODE'}
                </button>
              </>
            )}

            {}
            {dialoguePhase < 3 && currentDialogue && (
              <div className={`dialogue-bubble ${activeSpeaker === 'spaceman' ? 'pos-right' : 'pos-left'}`} onClick={handleDialogueClick}>
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />
                <div className="dialogue-speaker">
                  <div className={`speaker-avatar ${currentDialogue.speaker === 'AI System' ? 'system' : 'robot'}`}>
                    {currentDialogue.speaker === 'AI System' ? '⚠' : '🤖'}
                  </div>
                  <span className="speaker-name">{currentDialogue.speaker}</span>
                  <SoundWaveBars active={!typingDone} />
                </div>
                <p className="dialogue-text">
                  <TypewriterText
                    text={currentDialogue.text}
                    speed={25}
                    skip={skipTyping}
                    onComplete={() => setTypingDone(true)}
                  />
                </p>
                <div className={`dialogue-actions ${typingDone ? 'visible' : ''}`}>
                  {currentDialogue.buttons.map((btn, idx) => (
                    <button
                      key={idx}
                      className="dialogue-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isTransitioningRef.current) return;
                        isTransitioningRef.current = true;
                        setTimeout(() => { isTransitioningRef.current = false; }, 300);
                        if (btn.action === 3) {
                          setDialoguePhase(3);
                          startStep('intro');
                        } else {
                          setDialoguePhase(btn.action as DialoguePhase);
                        }
                      }}
                    >
                      ▸ {btn.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {}
            {dialoguePhase === 3 && inStoryboardStep && !showInputCard && identityStep !== 'confirm' && (
              <div
                className={`dialogue-bubble ${activeSpeaker === 'spaceman' ? 'pos-right' : 'pos-left'}`}
                onClick={handleDialogueClick}
              >
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />

                <div className="story-chat-log">
                  {storyQueue.slice(0, currentStoryIndex + 1).map((line, idx) => {
                    const isLatest = idx === currentStoryIndex;
                    const isRobot = line.speaker === 'AI Robot';
                    return (
                      <div
                        key={`line-${identityStep}-${idx}`}
                        className={`story-line ${isRobot ? 'ai' : 'spaceman'} ${line.tone ?? 'info'} ${isLatest ? 'latest' : ''}`}
                      >
                        <div className="story-line-header">
                          <div className={`speaker-avatar-sm ${isRobot ? 'robot' : 'spaceman'}`}>
                            {isRobot ? '🤖' : '👨‍🚀'}
                          </div>
                          <span className="line-speaker">{line.speaker}</span>
                          <SoundWaveBars active={isLatest && !typingDone} small />
                        </div>
                        <span className="line-text">
                          {isLatest ? (
                            <TypewriterText
                              text={line.text}
                              speed={22}
                              skip={skipTyping}
                              onComplete={() => setTypingDone(true)}
                            />
                          ) : (
                            line.text
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {identityStep === 'intro' && atStoryEnd && !isSubmittingStep && (
                  <div className={`dialogue-actions ${typingDone ? 'visible' : ''}`}>
                    <button className="dialogue-btn blue-btn" onClick={(e) => { e.stopPropagation(); if (isTransitioningRef.current) return; isTransitioningRef.current = true; setTimeout(() => { isTransitioningRef.current = false; }, 300); startStep('name'); }}>
                      ▸ Mulai Verifikasi
                    </button>
                  </div>
                )}

                {canContinueStory && (
                  <div className={`dialogue-actions ${typingDone ? 'visible' : ''}`}>
                    <button className="dialogue-btn" onClick={(e) => { e.stopPropagation(); if (isTransitioningRef.current) return; handleContinueStory(); }}>
                      ▸ Lanjut Dialog
                    </button>
                  </div>
                )}
              </div>
            )}

            {}
            {dialoguePhase === 3 && showInputCard && currentStepConfig?.field && (
              <div className="dialogue-bubble pos-center">
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />
                <div className="step-card" onClick={(e) => e.stopPropagation()}>
                  <p className="step-progress">{stepMetadata[currentStepConfig.step as 'name' | 'phone' | 'school' | 'major'].title}</p>

                  <div className="form-section">
                    <label className="form-label">{currentStepConfig.label}</label>

                    {currentStepConfig.inputType === 'select' ? (
                      <select
                        name={currentStepConfig.field}
                        value={formData[currentStepConfig.field]}
                        onChange={handleInputChange}
                        className="form-input"
                      >
                        {currentStepConfig.options?.map((option) => (
                          <option key={option.value || 'empty'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={currentStepConfig.inputType}
                        name={currentStepConfig.field}
                        value={formData[currentStepConfig.field]}
                        onChange={handleInputChange}
                        placeholder={currentStepConfig.placeholder}
                        className="form-input"
                      />
                    )}
                  </div>

                  {stepError && <p className="inline-error">{stepError}</p>}

                  <button className="send-btn" onClick={handleSendStep}>
                    ▸ KIRIM DATA
                  </button>
                </div>
              </div>
            )}

            {}
            {dialoguePhase === 3 && identityStep === 'confirm' && (
              <div className="dialogue-bubble pos-center">
                <div className="dialogue-holo-border" />
                <div className="dialogue-scanline" />
                <div className="step-card" onClick={(e) => e.stopPropagation()}>
                  <p className="step-progress">Ringkasan Verifikasi</p>

                  <div className="confirm-summary">
                    <div className="summary-row">
                      <span>Nama Pilot</span>
                      <strong>{formData.name || '-'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Nomor Telepon</span>
                      <strong>{formData.phone || '-'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Sekolah / Akademi</span>
                      <strong>{formData.school || '-'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Jurusan</span>
                      <strong>{formData.major || '-'}</strong>
                    </div>
                  </div>

                  {stepError && <p className="inline-error">{stepError}</p>}

                  <p className="form-hint">
                    AI Robot: "Data sudah lengkap. Satu autentikasi lagi, lalu sistem navigasi kubuka penuh."
                  </p>

                  <div className="dialogue-actions visible">
                    <button className="form-submit" onClick={handleFinalAuthentication}>
                      ⚡ AUTHENTIKASI FINAL
                    </button>
                    <button className="dialogue-btn blue-btn" onClick={handleEditData}>
                      ✎ Edit Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {dialoguePhase === 5 && identityStep === 'submitted' && (
              <div className="completion-message">
                <div className="completion-glow" />
                <div className="message-content">
                  <h3>✓ AUTENTIKASI BERHASIL</h3>
                  <p>
                    <TypewriterText
                      text={`Selamat datang, Pilot ${formData.name}. Akses sistem telah kubuka penuh. Kita bisa pulang sekarang.`}
                      speed={30}
                    />
                  </p>
                  <div className="hyperspace-bar">
                    <div className="hyperspace-fill" />
                  </div>
                  <p className="message-hint">Menyiapkan rute ke Main Hub...</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Bedroom;
