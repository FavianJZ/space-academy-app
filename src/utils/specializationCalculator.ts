import type {
  RadarScores,
  SpecializationArchetypeKey,
  SpecializationArchetypeMeta,
  SpecializationResult,
  TelemetrySignals,
} from "../types/specialization.types";

export const ARCHETYPE_METAS: Record<SpecializationArchetypeKey, SpecializationArchetypeMeta> = {
  SYSTEM_ARCHITECT: {
    key: "SYSTEM_ARCHITECT",
    title: "System & Cloud Architect",
    tagline: "Master of Workflows, Cloud Pipeline & Complex Systems",
    badge: "⚡ ARCHITECT",
    color: "#ff8fc9",
    socsTrack: "Software Engineering & Enterprise Systems",
    careerPaths: [
      "Full-Stack Software Engineer",
      "Cloud Solutions Architect",
      "Backend Systems Specialist",
      "DevOps & Infrastructure Engineer",
    ],
    description:
      "Kamu memiliki insting alami dalam merancang alur sistem yang terstruktur, rapi, dan efisien. Seperti astronot yang mengatur sistem pendukung stasiun luar angkasa, kamu melihat teknologi sebagai satu kesatuan arsitektur yang harmonis.",
  },
  AI_LOGIC_PIONEER: {
    key: "AI_LOGIC_PIONEER",
    title: "AI & Algorithmic Pioneer",
    tagline: "Analytical Problem Solver & Data-Driven Thinker",
    badge: "🧠 LOGIC PIONEER",
    color: "#aa66ff",
    socsTrack: "Artificial Intelligence & Computational Science",
    careerPaths: [
      "AI / Machine Learning Engineer",
      "Algorithm Specialist",
      "Data Scientist",
      "Intelligent Systems Developer",
    ],
    description:
      "Pola pikirmu analitis, kalkulatif, dan menyukai teka-teki logika yang menantang. Kamu tidak mudah menyerah saat menghadapi masalah kompleks, melainkan memecahnya menjadi langkah komputasi yang cerdas dan elegan.",
  },
  CYBER_DEBUGGER: {
    key: "CYBER_DEBUGGER",
    title: "Cyber Inspector & QA Specialist",
    tagline: "The Sharp-Eyed Bug Hunter & Code Defender",
    badge: "🛡️ CYBER DEFENDER",
    color: "#00ffcc",
    socsTrack: "Software Quality Assurance & Cybersecurity",
    careerPaths: [
      "Software QA & Automation Engineer",
      "Cybersecurity Analyst",
      "Application Security Engineer",
      "Reliability & Testing Specialist",
    ],
    description:
      "Ketelitian dan daya analisismu sangat tinggi. Kamu mampu melihat anomali dan kelemahan sistem yang sering terlewat oleh orang lain. Dunia software membutuhkan sosok seperti kamu agar sistem terlindungi dan bebas dari cacat (zero bugs).",
  },
  CREATIVE_TECH_DEV: {
    key: "CREATIVE_TECH_DEV",
    title: "Interactive Tech & Product Dev",
    tagline: "Visionary of Frontend, Game Tech & Digital Experience",
    badge: "🚀 CREATIVE DEV",
    color: "#00ccff",
    socsTrack: "Interactive Applications & Game Technology",
    careerPaths: [
      "Frontend & 3D Web Specialist",
      "Game Gameplay Programmer",
      "Creative Technologist",
      "UI/UX Interactive Designer",
    ],
    description:
      "Kamu memiliki jiwa eksploratif tinggi dan peka terhadap pengalaman interaktif serta estetika visual. Kamu tidak hanya peduli sistem itu berjalan, tetapi juga bagaimana interaksi terasa responsif, seru, dan memukau bagi pengguna.",
  },
};

export const INITIAL_TELEMETRY_SIGNALS: TelemetrySignals = {
  customizationChangesCount: 0,
  routeSelected: "",
  dialogSkipRate: 0,
  stageRecords: {},
  totalTimePlayedSeconds: 0,
};

export function calculateSpecializationProfile(
  signals: TelemetrySignals,
  completedStagesCount: number
): SpecializationResult {
  const records = signals.stageRecords || {};

  // Baseline exploratory score for inactive/unexplored competencies
  let system = 25;
  let aiLogic = 25;
  let debugging = 25;
  let creative = 25;

  // 1. SYSTEM ARCHITECT (Puzzlon SDLC + Flowra Process Pipeline)
  // Stage 3 (Puzzlon) Par: 420, Stage 4 (Flowra) Par: 450
  const hasStage3 = !!records[3]?.completed;
  const hasStage4 = !!records[4]?.completed;
  if (hasStage3 || hasStage4) {
    let r3 = 0.8;
    if (hasStage3) {
      const sc3 = records[3].score || 250;
      r3 = Math.max(0.35, Math.min(1.45, sc3 / 420));
    }
    let r4 = 0.8;
    if (hasStage4) {
      const sc4 = records[4].score || 250;
      r4 = Math.max(0.35, Math.min(1.45, sc4 / 450));
    }

    const attemptsBonus = (records[3]?.attemptsCount || 1) <= 1 ? 4 : 0;
    const routeBonus = signals.routeSelected && !signals.routeSelected.includes("2") ? 4 : 0;

    if (hasStage3 && hasStage4) {
      // Both completed: blend 55% Stage 3 and 45% Stage 4
      const blendedRatio = 0.55 * r3 + 0.45 * r4;
      system = 25 + 50 * blendedRatio + attemptsBonus + routeBonus;
    } else if (hasStage3) {
      system = 25 + 46 * r3 + attemptsBonus;
    } else {
      system = 25 + 42 * r4 + routeBonus;
    }
  } else if (signals.routeSelected) {
    system += 6;
  }

  // 2. AI & LOGIC PIONEER (Quizara Theory + Logitron Boolean Logic)
  // Stage 2 (Quizara) Par: 450, Stage 5 (Logitron) Par: 220
  const hasStage2 = !!records[2]?.completed;
  const hasStage5 = !!records[5]?.completed;
  if (hasStage2 || hasStage5) {
    let r2 = 0.8;
    if (hasStage2) {
      const sc2 = records[2].score || 250;
      r2 = Math.max(0.35, Math.min(1.5, sc2 / 450));
    }
    let r5 = 0.8;
    let timeBonus5 = 0;
    if (hasStage5) {
      const sc5 = records[5].score || 180;
      r5 = Math.max(0.35, Math.min(1.4, sc5 / 220));
      const t5 = records[5].timeSpentSeconds || 50;
      if (t5 < 40) timeBonus5 = 5;
    }

    if (hasStage2 && hasStage5) {
      const blendedRatio = 0.60 * r2 + 0.40 * r5;
      aiLogic = 25 + 50 * blendedRatio + timeBonus5;
    } else if (hasStage2) {
      aiLogic = 25 + 48 * r2;
    } else {
      aiLogic = 25 + 44 * r5 + timeBonus5;
    }
  } else if (signals.routeSelected?.includes("4")) {
    aiLogic += 8;
  }

  // 3. CYBER INSPECTOR & QA (Ultimara Bug Quarantine + Zero-Defect Accuracy)
  // Stage 6 (Ultimara) Par: 2200
  const hasStage6 = !!records[6]?.completed;
  if (hasStage6) {
    const sc6 = records[6].score || 1500;
    const r6 = Math.max(0.35, Math.min(1.45, sc6 / 2300));
    const cleanBonus =
      (records[3]?.completed && (records[3].attemptsCount || 1) <= 1 ? 3 : 0) +
      (records[2]?.completed && (records[2].score || 0) >= 400 ? 3 : 0);
    debugging = 25 + 52 * r6 + cleanBonus;
  } else {
    // Stage 6 not played yet: slight signal from precision in stage 2 and 3
    if (records[2]?.completed && (records[2].score || 0) >= 400) debugging += 6;
    if (records[3]?.completed && (records[3].attemptsCount || 1) <= 1) debugging += 5;
  }

  // 4. CREATIVE TECH & INTERACTIVE 3D (Novaris Flight + Flowra Visual + Customization)
  // Stage 1 (Novaris) Par Time: 55s
  const hasStage1 = !!records[1]?.completed;
  let r1 = 0.8;
  if (hasStage1) {
    const t1 = records[1].timeSpentSeconds || 60;
    r1 = Math.max(0.5, Math.min(1.4, 55 / Math.max(25, t1)));
  }
  const customBonus = Math.min(12, (signals.customizationChangesCount || 0) * 3);
  const routeBonusCreative = signals.routeSelected?.includes("2") ? 5 : 0;

  if (hasStage1 || hasStage4) {
    const r4 = hasStage4 ? Math.max(0.35, Math.min(1.4, (records[4]?.score || 250) / 450)) : 0.8;
    if (hasStage1 && hasStage4) {
      creative = 25 + 26 * r1 + 24 * r4 + customBonus + routeBonusCreative;
    } else if (hasStage1) {
      creative = 25 + 38 * r1 + customBonus + routeBonusCreative;
    } else {
      creative = 25 + 36 * r4 + customBonus + routeBonusCreative;
    }
  } else {
    creative = 25 + customBonus + routeBonusCreative;
  }

  const clamp = (val: number) => Math.max(20, Math.min(98, Math.round(val)));
  const radarScores: RadarScores = {
    system: clamp(system),
    aiLogic: clamp(aiLogic),
    debugging: clamp(debugging),
    creative: clamp(creative),
  };

  // Dynamic confidence level & milestones
  let confidenceLevel = 20;
  let milestone = "Onboarding Cadet Profile";

  if (completedStagesCount >= 6) {
    confidenceLevel = 100;
    milestone = "Certified Space Academy Graduate";
  } else if (completedStagesCount >= 4) {
    confidenceLevel = 75;
    milestone = "Advanced Cadet Flight Phase";
  } else if (completedStagesCount >= 2) {
    confidenceLevel = 50;
    milestone = "Intermediate Simulation Phase";
  } else if (completedStagesCount >= 1) {
    confidenceLevel = 35;
    milestone = "Orbital Foundations Phase";
  } else if (signals.routeSelected) {
    confidenceLevel = 25;
    milestone = "Atmospheric Entry Phase";
  }

  // Sort score entries to find true primary and secondary archetypes
  const scoreEntries: Array<{ key: SpecializationArchetypeKey; score: number }> = [
    { key: "SYSTEM_ARCHITECT", score: radarScores.system },
    { key: "AI_LOGIC_PIONEER", score: radarScores.aiLogic },
    { key: "CYBER_DEBUGGER", score: radarScores.debugging },
    { key: "CREATIVE_TECH_DEV", score: radarScores.creative },
  ];

  scoreEntries.sort((a, b) => b.score - a.score);

  const primaryArchetype = scoreEntries[0].key;
  const secondaryArchetype = scoreEntries[1].key;
  const primaryMeta = ARCHETYPE_METAS[primaryArchetype];
  const secondaryMeta = ARCHETYPE_METAS[secondaryArchetype];

  let analysisText = `${primaryMeta.description} Karakter bermainmu juga diperkuat oleh pilar ${secondaryMeta.title}, membuktikan potensi multitalenta di era industri modern.`;
  let recommendationNote = `Berdasarkan evaluasi simulasi penerbangan, kamu sangat direkomendasikan mendalami peminatan "${primaryMeta.socsTrack}" di School of Computer Science (SOCS) BINUS University Bekasi.`;

  if (completedStagesCount === 0 && !signals.routeSelected) {
    analysisText = "Profil kadet baru diinisialisasi pada tingkat kesiapan dasar. Mulailah menjalankan misi simulasi penerbangan dan tantangan stage di setiap planet untuk melihat pemetaan bakat komputasi dan peminatan teknologimu secara akurat.";
    recommendationNote = "Rekomendasi peminatan di School of Computer Science (SOCS) BINUS University Bekasi akan terkalibrasi secara dinamis seiring dengan tantangan yang berhasil kamu selesaikan.";
  }

  return {
    primaryArchetype,
    secondaryArchetype,
    confidenceLevel,
    radarScores,
    analysisText,
    recommendationNote,
    lastUpdated: new Date().toISOString(),
    milestoneReached: milestone,
  };
}
