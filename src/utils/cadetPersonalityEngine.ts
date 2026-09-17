import type {
  RadarScores,
  SpecializationResult,
  StageTelemetryRecord,
  TelemetrySignals,
} from "../types/specialization.types";
export interface CadetIdentity {
  name: string;
  callsign?: string;
  school: string;
  major: string;
}
import { ARCHETYPE_METAS } from "./specializationCalculator";

export interface StagePerformanceDetail {
  stageId: number;
  stageName: string;
  planetName: string;
  competencyArea: string;
  score: number;
  completed: boolean;
  grade: "S" | "A+" | "A" | "B" | "IN TRAINING";
  evaluationText: string;
  highlightMetric: string;
}

export interface PillarDiagnostic {
  key: keyof RadarScores;
  name: string;
  score: number;
  level: "Master" | "Advanced" | "Proficient" | "Developing";
  descriptor: string;
  actionableFeedback: string;
}

export interface CadetPersonalityProfile {
  signatureTitle: string;
  signatureTagline: string;
  cognitiveProfileSummary: string;
  behavioralStyle: string;
  decisionMakingTrait: string;
  efficiencyRating: string;
  pillarDiagnostics: PillarDiagnostic[];
  stageEvaluations: StagePerformanceDetail[];
  socsAcademicAlignment: {
    recommendedProgram: string;
    curriculumFocus: string;
    keySkillsMatched: string[];
    industryOutlook: string;
  };
}

const STAGE_CONFIGS: Record<
  number,
  { stageName: string; planetName: string; competencyArea: string }
> = {
  1: {
    stageName: "Orbital Briefing",
    planetName: "Novaris",
    competencyArea: "System Orientation & Flight Adaptability",
  },
  2: {
    stageName: "Knowledge Matrix",
    planetName: "Quizara",
    competencyArea: "Algorithmic & Computational Retention",
  },
  3: {
    stageName: "Pipeline Sequencer",
    planetName: "Puzzlon",
    competencyArea: "System Architecture & SDLC Pipeline Flow",
  },
  4: {
    stageName: "Pipeline Orchestration",
    planetName: "Flowra",
    competencyArea: "Flowchart & Process Decomposition",
  },
  5: {
    stageName: "Cloud Logic Array",
    planetName: "Logitron",
    competencyArea: "Backend Pipeline Logic & Cloud Infrastructure",
  },
  6: {
    stageName: "Cyber Bug Quarantine",
    planetName: "Ultimara",
    competencyArea: "Defensive Code Audit & QA Debugging",
  },
};

/**
 * Generates an individualized forensic personality & diagnostic evaluation
 * based on the cadet's actual gameplay telemetry across all 6 stages.
 */
export function generateCadetPersonalityProfile(
  cadet: CadetIdentity,
  result: SpecializationResult,
  signals?: TelemetrySignals
): CadetPersonalityProfile {
  const radar = result.radarScores;
  const records: Record<number, StageTelemetryRecord> =
    signals?.stageRecords || {};
  const totalPlayTime = signals?.totalTimePlayedSeconds || 0;
  const route = signals?.routeSelected || "";

  // 1. Determine Dynamic Compound Signature Title
  let signatureTitle = "Tactical Computing Specialist";
  let signatureTagline = "Adaptive Problem Solver & Systems Explorer";

  const isHighSystem = radar.system >= 70;
  const isHighAi = radar.aiLogic >= 70;
  const isHighDebug = radar.debugging >= 70;
  const isHighCreative = radar.creative >= 70;

  if (isHighSystem && isHighAi) {
    signatureTitle = "Enterprise AI & Scalable Systems Architect";
    signatureTagline =
      "Synthesizes high-level cloud architectures with rigorous algorithmic reasoning.";
  } else if (isHighAi && isHighDebug) {
    signatureTitle = "Algorithmic Forensic & Deep Logic Investigator";
    signatureTagline =
      "Methodical investigator excelling in computational precision and defect isolation.";
  } else if (isHighSystem && isHighCreative) {
    signatureTitle = "Visionary Interactive Systems Engineer";
    signatureTagline =
      "Bridges the gap between robust architectural backbones and immersive digital experiences.";
  } else if (isHighDebug && isHighCreative) {
    signatureTitle = "Interactive QA & Product Reliability Engineer";
    signatureTagline =
      "Combines sharp perceptual observation with deep passion for seamless user interactions.";
  } else if (isHighSystem) {
    signatureTitle = "Cloud Infrastructure & Enterprise Systems Lead";
    signatureTagline =
      "Instinctive mastery of structured information pipelines, modularity, and enterprise flows.";
  } else if (isHighAi) {
    signatureTitle = "Computational Logic & Data Systems Specialist";
    signatureTagline =
      "Excels at rapid conceptual reasoning, mathematical deduction, and predictive thinking.";
  } else if (isHighDebug) {
    signatureTitle = "Cyber Resilience & Software Quality Specialist";
    signatureTagline =
      "Sharp-eyed defender dedicated to system integrity, vulnerability mitigation, and zero-defect code.";
  } else if (isHighCreative) {
    signatureTitle = "Immersive Technology & Digital Product Developer";
    signatureTagline =
      "Pioneering digital craftsman driven by aesthetics, responsiveness, and human-centric tech.";
  } else {
    signatureTitle = "Versatile Polymath Cadence Operator";
    signatureTagline =
      "Balanced cognitive foundation with equal aptitude across multi-disciplinary computing domains.";
  }

  // 2. Behavioral Style & Decision-Making Traits
  let decisionMakingTrait =
    "Sistematis & Terencana (Analytical Deliberation)";
  let behavioralStyle = "Fokus pada struktur baku dan konsistensi pipeline.";
  let efficiencyRating = "Optimal Stability & Predictable Execution";

  if (route.includes("2") || route.toLowerCase().includes("manual")) {
    decisionMakingTrait = "Eksploratif & Berani Mengambil Risiko Terukur";
    behavioralStyle =
      "Menunjukkan inisiatif mandiri, siap menghadapi manuver tak terduga, dan adaptif terhadap dinamika kontrol lapangan.";
  } else if (route.includes("4") || route.toLowerCase().includes("cadence")) {
    decisionMakingTrait = "Kalkulatif, Berbasis Data & Heuristik Cepat";
    behavioralStyle =
      "Mengutamakan optimalisasi komputasi, kalkulasi efisiensi rute, dan penalaran logis sebelum mengeksekusi aksi.";
  }

  if (totalPlayTime > 0 && totalPlayTime < 240 && result.confidenceLevel >= 75) {
    efficiencyRating = "High-Velocity Rapid Thinker (Kecepatan Di Atas Rata-rata)";
  } else if (result.confidenceLevel >= 75) {
    efficiencyRating = "Thorough & Diligent Investigator (Presisi Tinggi)";
  }

  // 3. Narrative Synthesis
  const primaryMeta = ARCHETYPE_METAS[result.primaryArchetype];
  const secondaryMeta = ARCHETYPE_METAS[result.secondaryArchetype];

  const displayName = cadet.callsign || cadet.name || "Kadet Antariksa";
  const cognitiveProfileSummary =
    `Berdasarkan data telemetri simulasi antariksa, Kadet ${displayName} (${cadet.school} — ${cadet.major}) ` +
    `memperlihatkan profil kognitif utama sebagai ${primaryMeta.title} (${primaryMeta.socsTrack}) ` +
    `dengan dukungan kuat dari karakteristik ${secondaryMeta.title}. ` +
    `Kemampuan Anda dalam memproses informasi komputasi bersifat ${behavioralStyle.toLowerCase()} ` +
    `Pola penyelesaian masalah Anda terbukti sangat efektif dalam menguraikan tantangan kompleks menjadi sub-komponen yang dapat dieksekusi secara teratur.`;

  // 4. Pillar Diagnostics
  const getLevel = (
    val: number
  ): "Master" | "Advanced" | "Proficient" | "Developing" => {
    if (val >= 80) return "Master";
    if (val >= 65) return "Advanced";
    if (val >= 45) return "Proficient";
    return "Developing";
  };

  const pillarDiagnostics: PillarDiagnostic[] = [
    {
      key: "system",
      name: "System Architecture",
      score: radar.system,
      level: getLevel(radar.system),
      descriptor:
        radar.system >= 70
          ? "Pemahaman arsitektur sistematis, menyukai struktur modular dan integrasi alur kerja teratur."
          : "Fondasi struktural baik; mampu mengikuti alur kerja dan memecah masalah bertahap.",
      actionableFeedback:
        "Tingkatkan eksplorasi arsitektur cloud mikroservis dan orchestration pipeline di SOCS BINUS Bekasi.",
    },
    {
      key: "aiLogic",
      name: "AI & Computational Logic",
      score: radar.aiLogic,
      level: getLevel(radar.aiLogic),
      descriptor:
        radar.aiLogic >= 70
          ? "Penalaran induktif & deduktif tajam, unggul dalam memecahkan teka-teki logika biner dan algoritma rekursif."
          : "Logika analitis konsisten; dapat ditingkatkan melalui latihan problem solving algoritma bertingkat.",
      actionableFeedback:
        "Dalami machine learning models dan neural computational pathways di peminatan Artificial Intelligence.",
    },
    {
      key: "debugging",
      name: "Cyber Defense & QA",
      score: radar.debugging,
      level: getLevel(radar.debugging),
      descriptor:
        radar.debugging >= 70
          ? "Mata elang terhadap anomali kode, ketelitian observasi tinggi dalam mengisolasi bug kritis."
          : "Ketelitian verifikasi stabil; memiliki insting perlindungan sistem terhadap kegagalan operasional.",
      actionableFeedback:
        "Pertajam keterampilan automated unit testing, vulnerability assessment, dan ethical hacking.",
    },
    {
      key: "creative",
      name: "Interactive Tech Dev",
      score: radar.creative,
      level: getLevel(radar.creative),
      descriptor:
        radar.creative >= 70
          ? "Peka terhadap responsivitas interaksi, estetika visual digital, dan eksplorasi antarmuka real-time."
          : "Apresiasi pengalaman pengguna baik; mampu menyelaraskan aspek fungsi dan estetika.",
      actionableFeedback:
        "Kembangkan kompetensi WebGL, 3D interactive graphics, dan real-time game engine technology.",
    },
  ];

  // 5. Stage-by-Stage Forensic Breakdown (1 to 6)
  const stageEvaluations: StagePerformanceDetail[] = [1, 2, 3, 4, 5, 6].map(
    (stageId) => {
      const cfg = STAGE_CONFIGS[stageId];
      const rec = records[stageId];
      const isDone = !!rec?.completed;
      const sc = rec?.score ?? 0;
      const timeSec = rec?.timeSpentSeconds ?? 0;
      const attempts = rec?.attemptsCount ?? 1;

      let grade: "S" | "A+" | "A" | "B" | "IN TRAINING" = "IN TRAINING";
      let evalText =
        "Misi belum dieksekusi dalam simulasi; modul siap menerima telemetri aktif saat stage dibuka.";
      let highlight = "Standby Status";

      if (isDone) {
        if (sc >= 300 || (sc >= 100 && attempts === 1)) {
          grade = "S";
        } else if (sc >= 200 || attempts <= 2) {
          grade = "A+";
        } else if (sc >= 100) {
          grade = "A";
        } else {
          grade = "B";
        }

        switch (stageId) {
          case 1:
            evalText =
              timeSec < 45
                ? `Adaptabilitas orientasi sangat kilat (${timeSec}s). Berhasil menguasai instrumen kapal tanpa disorientasi kosmik.`
                : `Menyelesaikan onboarding sistem penerbangan dengan prosedur tertib dan akurasi kalibrasi stabil (${timeSec}s).`;
            highlight = `${timeSec}s Onboarding Speed`;
            break;
          case 2:
            evalText =
              sc >= 250
                ? `Skor ${sc} poin membuktikan penguasaan konsep komputasi dasar dan logika sains yang sangat prima.`
                : `Menuntaskan kuis komputasi (${sc} pts) dengan daya analisa rasional dan konsistensi jawaban yang baik.`;
            highlight = `${sc} Pts Conceptual Recall`;
            break;
          case 3:
            evalText =
              attempts === 1
                ? `Berhasil merangkai seluruh sekuens arsitektur SDLC dan pipeline data secara presisi! Memiliki pemahaman alur kerja software kelas enterprise.`
                : `Menuntaskan sekuens arsitektur pipeline sistem dengan pemahaman alur kerja rekayasa software yang baik.`;
            highlight = "SDLC Pipeline Mastery";
            break;
          case 4:
            evalText =
              attempts === 1
                ? `Perbaikan flowchart Flowra dilakukan secara presisi tanpa redundansi. Pemahaman alur branching sistem sempurna.`
                : `Menyelaraskan kembali percabangan logika pipeline Flowra; mampu mengidentifikasi hambatan alur proses.`;
            highlight = "Flawless Process Branching";
            break;
          case 5:
            evalText =
              timeSec < 60
                ? `Kecepatan analisis pipeline cloud Logitron (${timeSec}s) menunjukkan penguasaan logika backend infrastructure level tinggi.`
                : `Berhasil mengkonfigurasi seluruh sirkuit logika Cloud & Backend Pipeline Logitron dengan verifikasi kondisi yang akurat.`;
            highlight = `${timeSec}s Cloud Logic Synthesis`;
            break;
          case 6:
            evalText =
              sc >= 300
                ? `Karantina bug Ultimara tuntas sempurna (${sc} pts)! Daya observasi tajam layaknya Cyber Security Auditor profesional.`
                : `Berhasil mendeteksi anomali kode Ultimara; memiliki potensi besar dalam software testing dan QA defense.`;
            highlight = "Zero-Defect Code Inspection";
            break;
        }
      }

      return {
        stageId,
        stageName: cfg.stageName,
        planetName: cfg.planetName,
        competencyArea: cfg.competencyArea,
        score: sc,
        completed: isDone,
        grade,
        evaluationText: evalText,
        highlightMetric: highlight,
      };
    }
  );

  // 6. SOCS BINUS Bekasi Alignment
  const socsAcademicAlignment = {
    recommendedProgram: primaryMeta.socsTrack,
    curriculumFocus:
      `Program sarjana resmi di School of Computer Science (SOCS) BINUS University Bekasi ` +
      `dirancang untuk mengasah bakat Anda dalam ${primaryMeta.title.toLowerCase()}, ` +
      `didukung fasilitas laboratorium berstandar industri dan kurikulum berbasis proyek nyata.`,
    keySkillsMatched: [
      ...primaryMeta.careerPaths.slice(0, 2),
      ...secondaryMeta.careerPaths.slice(0, 2),
    ],
    industryOutlook:
      "Tingkat serapan industri 98.4% dengan peluang karir internasional di sektor Cloud Enterprise, AI Research, Cybersecurity, dan Modern Interactive Tech.",
  };

  return {
    signatureTitle,
    signatureTagline,
    cognitiveProfileSummary,
    behavioralStyle,
    decisionMakingTrait,
    efficiencyRating,
    pillarDiagnostics,
    stageEvaluations,
    socsAcademicAlignment,
  };
}
