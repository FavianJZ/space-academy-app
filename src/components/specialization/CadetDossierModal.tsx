import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ARCHETYPE_METAS } from "../../utils/specializationCalculator";
import { RadarChart } from "./RadarChart";
import { generateCadetCardPdf } from "../../services/cadetCardPdfService";
import { useGameStore } from "../../stores/useGameStore";
import { SpacemanPink, SpacemanWhite, SpacemanPet } from "../models";
import AvatarCharacterModel from "../../scenes/mainhub/AvatarCharacterModel";
import {
  getSpacemanColorOption,
  getSpacemanPetOption,
} from "../../constants/characterCustomization.constants";
import type {
  SpecializationResult,
  SpecializationArchetypeKey,
} from "../../types/specialization.types";
import { getTranslation } from "../../i18n/translations";
import "./CadetDossierModal.css";

interface CadetIdentity {
  name: string;
  school: string;
  major: string;
}

interface CadetDossierModalProps {
  result: SpecializationResult;
  cadet: CadetIdentity;
  onClose: () => void;
}

interface ConfidenceMilestone {
  threshold: number;
  label: string;
}

const CONFIDENCE_MILESTONES: ConfidenceMilestone[] = [
  { threshold: 25, label: "25%" },
  { threshold: 50, label: "50%" },
  { threshold: 75, label: "75%" },
  { threshold: 100, label: "100%" },
];

interface ArchetypeCardProps {
  archetypeKey: SpecializationArchetypeKey;
  rank: "Primary" | "Secondary";
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({ archetypeKey, rank }) => {
  const meta = ARCHETYPE_METAS[archetypeKey];
  const isPrimary = rank === "Primary";
  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).dossier;

  return (
    <div
      className={`dossier-archetype-card ${isPrimary ? "is-primary" : ""}`}
      style={{ "--archetype-color": meta.color } as React.CSSProperties}
    >
      <span className="dossier-archetype-rank">
        {isPrimary ? t.primaryArchetype : t.secondaryArchetype}
      </span>
      <span className="dossier-archetype-badge">{meta.badge}</span>
      <span className="dossier-archetype-title">{meta.title}</span>
      <span className="dossier-archetype-tagline">{meta.tagline}</span>
    </div>
  );
};

export const CadetDossierModal: React.FC<CadetDossierModalProps> = ({
  result,
  cadet,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const primaryMeta = ARCHETYPE_METAS[result.primaryArchetype];
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const language = useGameStore((state) => state.language);
  const t = getTranslation(language).dossier;

  const character = useGameStore((state) => state.character);
  const spacemanColor = useGameStore((state) => state.spacemanColor);
  const spacemanHat = useGameStore((state) => state.spacemanHat);
  const spacemanPet = useGameStore((state) => state.spacemanPet);
  const telemetrySignals = useGameStore((state) => state.telemetrySignals);

  const selectedColor = getSpacemanColorOption(spacemanColor);
  const selectedPet = getSpacemanPetOption(spacemanPet);
  const hasPet = spacemanPet !== "none";
  const suitColor = selectedColor.modelColor ?? undefined;
  const accentColor =
    selectedColor.modelColor ??
    (character === "pink" ? "#f46bad" : "#77eaff");
  const petAccentColor = hasPet ? selectedPet.accent : "#7595a0";
  const pilotX = hasPet ? -0.58 : 0;

  const handleSaveCadetCard = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setDownloadFeedback(t.generatingPdf);
      // Wait for HD 3D frame to render to buffer
      await new Promise((resolve) => setTimeout(resolve, 400));
      await generateCadetCardPdf(
        cadet,
        result,
        {
          character,
          colorId: spacemanColor,
          hatId: spacemanHat,
          petId: spacemanPet,
        },
        telemetrySignals
      );
      setDownloadFeedback(
        language === "en"
          ? "Cadet Card (2 Slides) downloaded successfully!"
          : "Kartu Kadet (2 Halaman) berhasil diunduh!"
      );
      setTimeout(() => setDownloadFeedback(null), 4000);
    } catch (err) {
      console.error("Failed to generate Cadet Card PDF:", err);
      setDownloadFeedback(
        language === "en"
          ? "Download error. Please try again."
          : "Gagal mengunduh. Silakan coba lagi."
      );
      setTimeout(() => setDownloadFeedback(null), 4000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      className="dossier-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div className="dossier-container" ref={containerRef}>
        {/* ── Header ─────────────────────────────────── */}
        <header className="dossier-header">
          <div className="dossier-header-content">
            <p className="dossier-classification">
              {language === "en" ? "Space Academy — Cadet Dossier" : "Space Academy — Dosir Kadet"}
            </p>
            <h1 className="dossier-cadet-name">
              {cadet.name || (language === "en" ? "Unknown Cadet" : "Kadet Tidak Dikenal")}
            </h1>
            <ul className="dossier-cadet-info">
              {cadet.school && (
                <li>
                  {t.school}: <strong>{cadet.school}</strong>
                </li>
              )}
              {cadet.major && (
                <li>
                  {t.major}: <strong>{cadet.major}</strong>
                </li>
              )}
              <li>
                Status:{" "}
                <strong>
                  {result.confidenceLevel >= 100
                    ? (language === "en" ? "Certified Graduate" : "Lulusan Tersertifikasi")
                    : (language === "en" ? "In Training" : "Dalam Pelatihan")}
                </strong>
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="dossier-close-btn"
            onClick={onClose}
            aria-label={t.closeBtn}
          >
            ✕
          </button>
        </header>

        {/* ── Body ───────────────────────────────────── */}
        <div className="dossier-body">
          {/* Confidence Meter */}
          <section className="dossier-section dossier-confidence">
            <span className="dossier-section-label">
              {language === "en" ? "Assessment Confidence" : "Tingkat Keyakinan Asesmen"}
            </span>
            <div className="dossier-confidence-header">
              <span className="dossier-confidence-pct">
                {result.confidenceLevel}%
              </span>
              <span className="dossier-confidence-milestone">
                {result.milestoneReached}
              </span>
            </div>
            <div className="dossier-confidence-track">
              <div
                className="dossier-confidence-fill"
                style={{ width: `${result.confidenceLevel}%` }}
              />
            </div>
            <div className="dossier-confidence-markers">
              {CONFIDENCE_MILESTONES.map((ms) => (
                <span
                  key={ms.threshold}
                  className={result.confidenceLevel >= ms.threshold ? "is-reached" : ""}
                >
                  {ms.label}
                </span>
              ))}
            </div>
          </section>

          {/* Radar Chart */}
          <section className="dossier-section">
            <span className="dossier-section-label">
              {language === "en" ? "Competency Radar — 4 Pillars" : "Radar Kompetensi — 4 Pilar"}
            </span>
            <div className="dossier-radar-wrapper">
              <RadarChart scores={result.radarScores} size={260} />
            </div>
          </section>

          {/* Archetype Badges */}
          <section className="dossier-section">
            <span className="dossier-section-label">
              {language === "en" ? "Specialization Archetypes" : "Arketipe Spesialisasi"}
            </span>
            <div className="dossier-archetypes">
              <ArchetypeCard
                archetypeKey={result.primaryArchetype}
                rank="Primary"
              />
              <ArchetypeCard
                archetypeKey={result.secondaryArchetype}
                rank="Secondary"
              />
            </div>
          </section>

          {/* Analysis Narrative */}
          <section className="dossier-section">
            <span className="dossier-section-label">
              {language === "en" ? "Personality Analysis" : "Analisis Karakter & Bakat"}
            </span>
            <p className="dossier-analysis-text">{result.analysisText}</p>
          </section>

          {/* SOCS Recommendation */}
          <section className="dossier-section">
            <span className="dossier-section-label">
              {language === "en" ? "SOCS BINUS Bekasi — Recommendation" : "Rekomendasi SOCS BINUS Bekasi"}
            </span>
            <p className="dossier-recommendation">{result.recommendationNote}</p>
            <div
              className="dossier-socs-track"
              style={
                {
                  "--archetype-color": primaryMeta.color,
                } as React.CSSProperties
              }
            >
              <span className="dossier-socs-dot" />
              {primaryMeta.socsTrack}
            </div>
          </section>

          {/* Career Paths */}
          <section className="dossier-section">
            <span className="dossier-section-label">
              {language === "en" ? "Recommended Career Paths" : "Rekomendasi Jalur Karier"}
            </span>
            <div className="dossier-career-paths">
              {primaryMeta.careerPaths.map((career) => (
                <span key={career} className="dossier-career-pill">
                  {career}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <footer className="dossier-footer">
          {downloadFeedback && (
            <div className="dossier-feedback-toast">
              {downloadFeedback}
            </div>
          )}
          <button
            type="button"
            className="dossier-footer-btn"
            onClick={onClose}
            disabled={isGeneratingPdf}
          >
            {t.closeBtn}
          </button>
          <button
            type="button"
            className={`dossier-footer-btn is-primary ${isGeneratingPdf ? "is-loading" : ""}`}
            onClick={handleSaveCadetCard}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (language === "en" ? "GENERATING PDF..." : "MEMBUAT PDF...") : t.savePdfBtn}
          </button>
        </footer>
      </div>

      {/* Active on-screen HD Render Viewport (positioned behind backdrop, always active in WebGL loop) */}
      <div
        className="cadet-card-hd-canvas"
        style={{
          position: "fixed",
          left: "0",
          top: "0",
          width: "900px",
          height: "900px",
          pointerEvents: "none",
          opacity: 0.005,
          zIndex: 0,
        }}
        aria-hidden="true"
      >
        <Canvas
          gl={{
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
          }}
          dpr={[1.5, 2]}
          camera={{
            position: [hasPet ? 0.16 : 0, -0.40, 5.8],
            fov: 40,
          }}
          style={{ width: "900px", height: "900px" }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[-3, 2, -1]} intensity={0.9} color="#72ccff" />
            <pointLight
              position={[0, 0, 2.5]}
              intensity={2.2}
              color={accentColor}
              distance={6}
            />
            {hasPet && (
              <pointLight
                position={[1.3, -0.6, 2.2]}
                intensity={2.4}
                color={petAccentColor}
                distance={5}
              />
            )}

            <group position={[pilotX, 0, 0]}>
              <AvatarCharacterModel
                CharacterModel={character === "pink" ? SpacemanPink : SpacemanWhite}
                suitColor={suitColor}
                hatId={spacemanHat}
                modelScale={spacemanHat === "none" ? 0.62 : 0.54}
                modelPosition={spacemanHat === "none" ? [0, -1.68, 0] : [0, -1.60, 0]}
                rotationSpeed={0}
                floatAmplitude={0}
              />
            </group>

            {hasPet && (
              <group
                position={[0.92, spacemanHat === "none" ? -1.45 : -1.38, 0.06]}
                scale={0.84}
              >
                <SpacemanPet petId={spacemanPet} />
              </group>
            )}
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default CadetDossierModal;
