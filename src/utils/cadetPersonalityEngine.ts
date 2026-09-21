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
  adaptiveRecommendation: string;
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

  const primaryKey = result.primaryArchetype;
  const secondaryKey = result.secondaryArchetype;
  const primaryMeta = ARCHETYPE_METAS[primaryKey];
  const secondaryMeta = ARCHETYPE_METAS[secondaryKey];


  const SIGNATURE_MATRIX: Record<string, { title: string; tagline: string }> = {
    "SYSTEM_ARCHITECT+AI_LOGIC_PIONEER": {
      title: "Enterprise AI & Scalable Systems Architect",
      tagline: "Synthesizes high-level cloud architectures with rigorous algorithmic reasoning.",
    },
    "SYSTEM_ARCHITECT+CYBER_DEBUGGER": {
      title: "Resilient Infrastructure & Enterprise Security Lead",
      tagline: "Engineers mission-critical distributed systems hardened against cyber threats and downtime.",
    },
    "SYSTEM_ARCHITECT+CREATIVE_TECH_DEV": {
      title: "Visionary Interactive Systems Architect",
      tagline: "Bridges complex backend microservices with elegant, high-impact user experiences.",
    },
    "AI_LOGIC_PIONEER+SYSTEM_ARCHITECT": {
      title: "Computational Systems & Intelligent Pipeline Pioneer",
      tagline: "Transforms massive data streams and predictive machine models into structured enterprise flows.",
    },
    "AI_LOGIC_PIONEER+CYBER_DEBUGGER": {
      title: "Algorithmic Forensic & Deep Logic Investigator",
      tagline: "Methodical investigator excelling in computational precision, threat modeling, and defect isolation.",
    },
    "AI_LOGIC_PIONEER+CREATIVE_TECH_DEV": {
      title: "Cognitive Interaction & Generative Tech Specialist",
      tagline: "Combines mathematical deduction and intelligent algorithms with immersive digital products.",
    },
    "CYBER_DEBUGGER+SYSTEM_ARCHITECT": {
      title: "Defensive Cloud Security & Reliability Engineer",
      tagline: "Relentless guardian of system architecture, specialized in vulnerability mitigation and zero defects.",
    },
    "CYBER_DEBUGGER+AI_LOGIC_PIONEER": {
      title: "Cyber Threat Intelligence & Forensic Analyst",
      tagline: "Applies deep algorithmic analysis to isolate security vulnerabilities and neutralize digital threats.",
    },
    "CYBER_DEBUGGER+CREATIVE_TECH_DEV": {
      title: "Interactive QA & Product Reliability Specialist",
      tagline: "Combines sharp perceptual defect observation with passionate empathy for user experience.",
    },
    "CREATIVE_TECH_DEV+SYSTEM_ARCHITECT": {
      title: "Interactive Systems & Digital Experience Architect",
      tagline: "Master of 3D WebGL interfaces, real-time spatial interaction, and scalable frontend engines.",
    },
    "CREATIVE_TECH_DEV+AI_LOGIC_PIONEER": {
      title: "Intelligent Interactive Experience Developer",
      tagline: "Designs responsive, AI-infused human-computer interfaces with intuitive visual harmony.",
    },
    "CREATIVE_TECH_DEV+CYBER_DEBUGGER": {
      title: "Defensive UI/UX & Frontend Reliability Specialist",
      tagline: "Builds flawless interactive applications marrying cutting-edge aesthetics with strict code safety.",
    },
  };

  const pairKey = `${primaryKey}+${secondaryKey}`;
  let signatureTitle = SIGNATURE_MATRIX[pairKey]?.title;
  let signatureTagline = SIGNATURE_MATRIX[pairKey]?.tagline;

  if (!signatureTitle) {
    if (result.confidenceLevel < 50) {
      signatureTitle = "Foundational Computing & Orbital Flight Trainee";
      signatureTagline = "Currently exploring foundational competencies across computational thinking and system navigation.";
    } else {
      signatureTitle = `${primaryMeta.title} Specialist`;
      signatureTagline = `${primaryMeta.tagline}`;
    }
  }


  let decisionMakingTrait = "Sistematis & Terencana (Analytical Deliberation)";
  let behavioralStyle = "Fokus pada struktur baku dan konsistensi pipeline.";

  switch (primaryKey) {
    case "AI_LOGIC_PIONEER":
      decisionMakingTrait = "Kalkulatif & Berbasis Data (Mathematical Deduction)";
      behavioralStyle = "Mengutamakan optimalisasi komputasi, penalaran induktif, dan kalkulasi heuristik sebelum eksekusi.";
      break;
    case "CYBER_DEBUGGER":
      decisionMakingTrait = "Refleks Cepat & Tanggap Anomali (Rapid Threat Neutralization)";
      behavioralStyle = "Daya observasi tinggi terhadap anomali kode, sigap mengeliminasi defect, dan berorientasi zero-error.";
      break;
    case "CREATIVE_TECH_DEV":
      decisionMakingTrait = "Eksploratif & Adaptif (Dynamic Problem Solving)";
      behavioralStyle = "Responsif terhadap dinamika interaksi, peka terhadap estetika digital, dan berani mencoba pendekatan baru.";
      break;
    case "SYSTEM_ARCHITECT":
    default:
      decisionMakingTrait = "Sistematis & Terstruktur (SDLC Pipeline Orchestration)";
      behavioralStyle = "Fokus pada struktur modular, kejelasan dependensi alur kerja, dan konsistensi pipeline enterprise.";
      break;
  }

  if (route.includes("2") || route.toLowerCase().includes("manual")) {
    behavioralStyle += " Menunjukkan inisiatif navigasi mandiri pada situasi tak terduga.";
  } else if (route.includes("4") || route.toLowerCase().includes("cadence")) {
    behavioralStyle += " Menerapkan kalkulasi efisiensi tinggi dalam setiap pergerakan.";
  }


  let efficiencyRating = "Steadily Calibrating Foundations (Proses Adaptasi Terarah)";
  const completedStages = Object.values(records).filter((r) => r.completed);
  const totalScore = completedStages.reduce((sum, r) => sum + (r.score || 0), 0);
  const avgScore = completedStages.length > 0 ? totalScore / completedStages.length : 0;

  if (completedStages.length >= 5) {
    if (avgScore >= 800 || (totalPlayTime > 0 && totalPlayTime < 300)) {
      efficiencyRating = "Tier-1 Apex Mastery (Performa Puncak Prestasi Akademi)";
    } else if (avgScore >= 500) {
      efficiencyRating = "High-Velocity Rapid Thinker (Kecepatan Di Atas Rata-rata)";
    } else {
      efficiencyRating = "Thorough & Diligent Investigator (Presisi Tinggi)";
    }
  } else if (completedStages.length >= 2) {
    if (avgScore >= 400) {
      efficiencyRating = "Agile Intermediate Operator (Adaptasi Cepat & Konsisten)";
    } else {
      efficiencyRating = "Diligent Precision Trainee (Ketelitian Bertahap)";
    }
  }


  const displayName = cadet.callsign || cadet.name || "Kadet Antariksa";
  const cognitiveProfileSummary =
    `Berdasarkan data telemetri simulasi antariksa, Kadet ${displayName} (${cadet.school} — ${cadet.major}) ` +
    `memperlihatkan profil kognitif utama sebagai ${primaryMeta.title} (${primaryMeta.socsTrack}) ` +
    `dengan dukungan kuat dari karakteristik ${secondaryMeta.title}. ` +
    `Kemampuan Anda dalam memproses informasi komputasi bersifat ${behavioralStyle.toLowerCase()} ` +
    `Pola penyelesaian masalah Anda terbukti sangat efektif dalam menguraikan tantangan kompleks menjadi sub-komponen yang dapat dieksekusi secara teratur.`;


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
        radar.system >= 75
          ? "Pemahaman arsitektur sistematis, unggul dalam struktur modular enterprise dan alur integrasi dependensi bertingkat."
          : radar.system >= 50
          ? "Fondasi struktural solid; mampu mengikuti alur kerja rekayasa software dan memecah proses menjadi modul teratur."
          : "Fondasi struktural berkembang; sedang membangun pemahaman siklus hidup software dan perancangan alur sistem.",
      actionableFeedback:
        "Tingkatkan eksplorasi arsitektur cloud mikroservis dan orchestration pipeline di SOCS BINUS Bekasi.",
    },
    {
      key: "aiLogic",
      name: "AI & Computational Logic",
      score: radar.aiLogic,
      level: getLevel(radar.aiLogic),
      descriptor:
        radar.aiLogic >= 75
          ? "Penalaran induktif & deduktif tajam, unggul dalam memecahkan teka-teki logika biner dan algoritma rekursif kompleks."
          : radar.aiLogic >= 50
          ? "Logika analitis konsisten; mampu mengaplikasikan prinsip komputasi terstruktur dalam problem solving."
          : "Logika komputasi berkembang; disarankan memperbanyak latihan pemodelan matematis dan penalaran algoritma.",
      actionableFeedback:
        "Dalami machine learning models dan neural computational pathways di peminatan Artificial Intelligence.",
    },
    {
      key: "debugging",
      name: "Cyber Defense & QA",
      score: radar.debugging,
      level: getLevel(radar.debugging),
      descriptor:
        radar.debugging >= 75
          ? "Mata elang terhadap anomali kode, ketelitian observasi tinggi, dan refleks kilat dalam mengisolasi bug kritis."
          : radar.debugging >= 50
          ? "Ketelitian verifikasi stabil; memiliki naluri pertahanan sistem terhadap kegagalan operasional software."
          : "Ketelitian observasi sedang terasah; terus latih insting audit kode dan pendeteksian celah kerentanan.",
      actionableFeedback:
        "Pertajam keterampilan automated unit testing, vulnerability assessment, dan ethical hacking.",
    },
    {
      key: "creative",
      name: "Interactive Tech Dev",
      score: radar.creative,
      level: getLevel(radar.creative),
      descriptor:
        radar.creative >= 75
          ? "Peka terhadap responsivitas interaksi, estetika visual digital modern, dan eksplorasi antarmuka real-time 3D."
          : radar.creative >= 50
          ? "Apresiasi pengalaman pengguna baik; mampu menyelaraskan aspek fungsi kontrol dan estetika visual interaktif."
          : "Pemahaman interaksi digital berkembang; siap mengeksplorasi teknologi grafis modern dan mekanika interaksi.",
      actionableFeedback:
        "Kembangkan kompetensi WebGL, 3D interactive graphics, dan real-time game engine technology.",
    },
  ];


  const stageEvaluations: StagePerformanceDetail[] = [1, 2, 3, 4, 5, 6].map(
    (stageId) => {
      const cfg = STAGE_CONFIGS[stageId];
      const rec = records[stageId];
      const isDone = !!rec?.completed;
      const sc = rec?.score ?? 0;
      const timeSec = rec?.timeSpentSeconds ?? 0;

      let grade: "S" | "A+" | "A" | "B" | "IN TRAINING" = "IN TRAINING";
      let evalText =
        "Misi belum dieksekusi dalam simulasi; modul siap menerima telemetri aktif saat stage dibuka.";
      let highlight = "Standby Status";

      if (isDone) {
        switch (stageId) {
          case 1: {
            if (timeSec <= 40) {
              grade = "S";
              evalText = `Manuver orientasi penerbangan luar biasa kilat (${timeSec}s). Berhasil menguasai kokpit orbital dengan refleks adaptasi sempurna.`;
              highlight = `${timeSec}s Apex Reflex`;
            } else if (timeSec <= 65) {
              grade = "A+";
              evalText = `Prosedur kalibrasi instrumen antariksa diselesaikan dengan tertib, presisi, dan stabil (${timeSec}s).`;
              highlight = `${timeSec}s Smooth Navigation`;
            } else if (timeSec <= 90) {
              grade = "A";
              evalText = `Menuntaskan orientasi penerbangan sistematis (${timeSec}s); instrumen dasar siap mendukung penerbangan antarplanet.`;
              highlight = `${timeSec}s Orbital Check`;
            } else {
              grade = "B";
              evalText = `Berhasil menyelesaikan orientasi pesawat (${timeSec}s); memerlukan adaptasi instrumen tambahan pada gravitasi nol.`;
              highlight = `${timeSec}s Standard Pass`;
            }
            break;
          }
          case 2: {
            if (sc >= 550) {
              grade = "S";
              evalText = `Skor gemilang ${sc} poin membuktikan penguasaan konsep komputasi dasar dan logika sains yang sangat prima tanpa celah.`;
              highlight = `${sc} Pts Flawless Recall`;
            } else if (sc >= 400) {
              grade = "A+";
              evalText = `Pemahaman algoritma komputasi kuat (${sc} pts); penalaran rasional terbukti konsisten di hampir seluruh topik sains.`;
              highlight = `${sc} Pts High Retention`;
            } else if (sc >= 250) {
              grade = "A";
              evalText = `Menuntaskan kuis logika komputasi (${sc} pts) dengan daya analisis baik; fondasi konseptual siap dikembangkan ke tingkat lanjut.`;
              highlight = `${sc} Pts Solid Logic`;
            } else {
              grade = "B";
              evalText = `Menyelesaikan evaluasi kuis (${sc} pts); disarankan memperdalam struktur data dasar dan computational thinking.`;
              highlight = `${sc} Pts Foundation Base`;
            }
            break;
          }
          case 3: {
            if (sc >= 450) {
              grade = "S";
              evalText = `Merangkai seluruh sekuens arsitektur SDLC dan pipeline data secara presisi (${sc} pts)! Memiliki visi alur rekayasa software enterprise.`;
              highlight = "SDLC Pipeline Mastery";
            } else if (sc >= 350) {
              grade = "A+";
              evalText = `Konfigurasi tahapan rekayasa perangkat lunak disusun rapi (${sc} pts); alur integrasi komponen sistem berjalan mulus.`;
              highlight = "Modular Pipeline Flow";
            } else if (sc >= 250) {
              grade = "A";
              evalText = `Menuntaskan sekuens arsitektur pipeline (${sc} pts) dengan pemahaman siklus hidup software yang teratur.`;
              highlight = "Structured Assembly";
            } else {
              grade = "B";
              evalText = `Berhasil menyusun komponen dasar pipeline (${sc} pts); memerlukan latihan lanjutan pada pemetaan dependensi sistem.`;
              highlight = "Basic Pipeline Order";
            }
            break;
          }
          case 4: {
            if (sc >= 500) {
              grade = "S";
              evalText = `Perbaikan percabangan logika Flowra tuntas sempurna (${sc} pts) tanpa redundansi! Pemahaman alur branching dan UI flow kelas atas.`;
              highlight = "Flawless Process Branching";
            } else if (sc >= 350) {
              grade = "A+";
              evalText = `Menyelaraskan diagram alir Flowra dengan tepat (${sc} pts); mampu mengidentifikasi dan membenahi hambatan logika proses.`;
              highlight = "Optimal Decision Logic";
            } else if (sc >= 220) {
              grade = "A";
              evalText = `Berhasil memetakan alur keputusan sistem (${sc} pts); struktur diagram alir fungsional dan berjalan sesuai spesifikasi.`;
              highlight = "Valid Flow Decomposition";
            } else {
              grade = "B";
              evalText = `Menyelesaikan perbaikan alur dasar (${sc} pts); disarankan memperdalam efisiensi branching dan kondisional sistem.`;
              highlight = "Iterative Branching Fix";
            }
            break;
          }
          case 5: {
            if (sc >= 250 || (sc >= 200 && timeSec < 40)) {
              grade = "S";
              evalText = `Sirkuit logika gerbang dan pipeline cloud Logitron (${sc} pts, ${timeSec}s) disintesis kilat dengan logika biner tajam.`;
              highlight = `${timeSec}s Cloud Logic Synthesis`;
            } else if (sc >= 180) {
              grade = "A+";
              evalText = `Konfigurasi array logika cloud berjalan stabil (${sc} pts); verifikasi kondisi gerbang logika akurat dan terencana.`;
              highlight = "Synchronized Cloud Gates";
            } else if (sc >= 130) {
              grade = "A";
              evalText = `Menuntaskan routing data cloud Logitron (${sc} pts); memahami prinsip dasar boolean gate dan integrasi backend.`;
              highlight = "Binary Logic Alignment";
            } else {
              grade = "B";
              evalText = `Menghubungkan jalur logika sistem (${sc} pts); memerlukan pengasahan kecepatan pada gerbang logika bertingkat.`;
              highlight = "Fundamental Logic Link";
            }
            break;
          }
          case 6: {
            if (sc >= 2800) {
              grade = "S";
              evalText = `Karantina bug Ultimara tuntas sempurna (${sc} pts)! Daya observasi tajam dan refleks defensif setara Cyber Security Auditor profesional.`;
              highlight = "Zero-Defect Code Quarantine";
            } else if (sc >= 2200) {
              grade = "A+";
              evalText = `Daya eliminasi anomali kode impresif (${sc} pts); ketelitian pengamatan tinggi dalam mengisolasi defect sistem sebelum eskalasi.`;
              highlight = `${sc} Pts Robust Bug Isolation`;
            } else if (sc >= 1400) {
              grade = "A";
              evalText = `Berhasil mendeteksi anomali kritis Ultimara (${sc} pts); memiliki potensi kuat dalam automated testing dan defensive security.`;
              highlight = `${sc} Pts Security Quarantine`;
            } else {
              grade = "B";
              evalText = `Menetralisir ancaman bug dasar (${sc} pts); disarankan meningkatkan ketangkasan observasi defect dalam kondisi stres operasional.`;
              highlight = "Target Threat Mitigation";
            }
            break;
          }
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
      primaryKey === "AI_LOGIC_PIONEER"
        ? "Peluang karir terdepan di era AI dengan pertumbuhan pasar kecerdasan buatan global mencapai 37.3% CAGR."
        : primaryKey === "CYBER_DEBUGGER"
        ? "Kebutuhan tenaga ahli keamanan siber & QA global defisit 3.4 juta profesional, menjamin prospek karir sangat tinggi."
        : primaryKey === "CREATIVE_TECH_DEV"
        ? "Ekspansi industri game, WebGL 3D, dan spatial interactive tech menawarkan peluang karir kreatif global bernilai tinggi."
        : "Tingkat serapan industri 98.4% dengan peluang karir internasional di sektor Cloud Enterprise, DevOps, dan Software Engineering.",
  };


  const adaptiveRecommendation =
    primaryKey === "CYBER_DEBUGGER"
      ? `Tingkatkan mitigasi arsitektur pertahanan sistem dan otomasi pengujian mendalam; kombinasikan ketelitian observasi Anda dengan pilar ${secondaryMeta.title} di ekosistem SOCS BINUS Bekasi.`
      : primaryKey === "AI_LOGIC_PIONEER"
      ? `Eksplorasi pemodelan machine learning mutakhir dan penalaran algoritma rekursif; hubungkan ketajaman komputasi Anda dengan pilar ${secondaryMeta.title} di ekosistem SOCS BINUS Bekasi.`
      : primaryKey === "CREATIVE_TECH_DEV"
      ? `Tingkatkan integrasi grafika 3D WebGL dan optimalisasi performa rendering interaktif; wujudkan imajinasi spasial Anda bersama pilar ${secondaryMeta.title} di SOCS BINUS Bekasi.`
      : `Pertahankan disiplin modularitas cloud dan orkestrasi pipeline skala besar; arahkan visi arsitektur Anda bersama pilar ${secondaryMeta.title} ke standar internasional di SOCS BINUS Bekasi.`;

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
    adaptiveRecommendation,
  };
}
