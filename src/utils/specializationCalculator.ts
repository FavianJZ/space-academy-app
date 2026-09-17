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
  let system = 30;
  let aiLogic = 30;
  let debugging = 30;
  let creative = 30;

  if (signals.customizationChangesCount > 3) {
    creative += Math.min(20, signals.customizationChangesCount * 3);
  }

  if (signals.routeSelected) {
    if (
      signals.routeSelected.includes("2") ||
      signals.routeSelected.toLowerCase().includes("manual")
    ) {
      creative += 15;
      system += 10;
    } else if (
      signals.routeSelected.includes("4") ||
      signals.routeSelected.toLowerCase().includes("cadence")
    ) {
      aiLogic += 15;
    } else {
      system += 10;
    }
  }

  const records = signals.stageRecords || {};

  if (records[1]) {
    system += records[1].completed ? 15 : 5;
  }

  if (records[2]) {
    const s2Score = records[2].score || 0;
    aiLogic += s2Score > 300 ? 20 : s2Score > 100 ? 15 : 8;
  }

  if (records[3]) {
    system += records[3].completed ? 20 : 10;
    aiLogic += records[3].completed ? 15 : 8;
  }

  if (records[4]) {
    system += records[4].completed ? 25 : 10;
    if ((records[4].attemptsCount || 1) <= 2) system += 10;
  }

  if (records[5]) {
    aiLogic += records[5].completed ? 25 : 10;
    if ((records[5].timeSpentSeconds || 60) < 60 && records[5].completed) aiLogic += 10;
  }

  if (records[6]) {
    debugging += records[6].completed ? 35 : 15;
    if ((records[6].attemptsCount || 1) > 1 && records[6].completed) {
      debugging += 10;
    }
  }

  const clamp = (val: number) => Math.max(20, Math.min(98, Math.round(val)));
  const radarScores: RadarScores = {
    system: clamp(system),
    aiLogic: clamp(aiLogic),
    debugging: clamp(debugging),
    creative: clamp(creative),
  };

  let confidenceLevel = 25; 
  let milestone = "Onboarding Cadet Profile";

  if (completedStagesCount >= 5) {
    confidenceLevel = 100;
    milestone = "Certified Space Academy Graduate";
  } else if (completedStagesCount >= 3) {
    confidenceLevel = 75;
    milestone = "Advanced Cadet Simulation";
  } else if (completedStagesCount >= 1) {
    confidenceLevel = 50;
    milestone = "Orbital Foundations Phase";
  } else if (signals.routeSelected) {
    confidenceLevel = 35;
    milestone = "Atmospheric Entry Phase";
  }

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

  let analysisText = `${primaryMeta.description} Gaya bermainmu juga didukung oleh aspek ${secondaryMeta.title}, membuktikan potensi multitalenta di era industri modern.`;
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
