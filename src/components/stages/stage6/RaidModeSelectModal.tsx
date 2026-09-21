import React from "react";
import { useGameStore } from "../../../stores/useGameStore";
import type { RaidMode } from "../../../types/game.types";
import "./RaidModeSelectModal.css";

interface RaidModeSelectModalProps {
  onSelectMode: (mode: RaidMode) => void;
  onOpenOnlineLobby: () => void;
  onClose: () => void;
}

export const RaidModeSelectModal: React.FC<RaidModeSelectModalProps> = ({
  onSelectMode,
  onOpenOnlineLobby,
  onClose,
}) => {
  const language = useGameStore((state) => state.language);
  const isEn = language === "en";

  return (
    <div className="raid-select-overlay" onClick={onClose}>
      <div
        className="raid-select-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="raid-select-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="raid-select-header-bar">
          <span className="raid-select-tag">
            {isEn ? "MISSION CLASSIFICATION // STAGE 06" : "KLASIFIKASI MISI // STAGE 06"}
          </span>
          <button
            type="button"
            className="raid-select-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="raid-select-title-area">
          <h2 id="raid-select-title">
            {isEn ? "SELECT RAID COMBAT MODE" : "PILIH MODE SERANGAN RAID"}
          </h2>
          <p>
            {isEn
              ? "Choose your operational setup before engaging the Ultimara Boss."
              : "Tentukan konfigurasi operasional armada sebelum menghadapi Bos Ultimara."}
          </p>
        </div>

        <div className="raid-modes-grid">

          <div
            className="raid-mode-card mode-solo"
            onClick={() => onSelectMode("solo")}
          >
            <div className="mode-card-badge">SOLO</div>
            <div className="mode-icon">👤</div>
            <h3>{isEn ? "Solo Pilot" : "Pilot Mandiri"}</h3>
            <p className="mode-desc">
              {isEn
                ? "Engage the UFO alone with a full-width, centered 3x3 terminal grid."
                : "Hadapi Bos UFO sendirian dengan grid terminal 3x3 terpusat yang luas dan leluasa."}
            </p>
            <div className="mode-specs">
              <span>{isEn ? "1 Device" : "1 Perangkat"}</span>
              <span>•</span>
              <span>{isEn ? "Mouse / Touch" : "Mouse / Layar Sentuh"}</span>
            </div>
            <button
              type="button"
              className="mode-action-btn btn-solo"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMode("solo");
              }}
            >
              {isEn ? "Launch Solo" : "Mulai Solo"}
            </button>
          </div>


          <div
            className="raid-mode-card mode-local"
            onClick={() => onSelectMode("local_coop")}
          >
            <div className="mode-card-badge">SHARED</div>
            <div className="mode-icon">⌨️</div>
            <h3>{isEn ? "Local Co-Op" : "Co-Op Lokal"}</h3>
            <p className="mode-desc">
              {isEn
                ? "Share 1 PC/keyboard with a classmate: P1 Mouse on left, P2 Numpad on right."
                : "Bermain bersama di 1 laptop/PC: P1 Mouse di kiri, P2 Numpad 1-9 di kanan."}
            </p>
            <div className="mode-specs">
              <span>{isEn ? "1 Keyboard" : "1 Keyboard"}</span>
              <span>•</span>
              <span>{isEn ? "Split Screen" : "Layar Terbagi"}</span>
            </div>
            <button
              type="button"
              className="mode-action-btn btn-local"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMode("local_coop");
              }}
            >
              {isEn ? "Setup Local" : "Atur Lokal"}
            </button>
          </div>


          <div
            className="raid-mode-card mode-online"
            onClick={onOpenOnlineLobby}
          >
            <div className="mode-card-badge badge-glow">ONLINE</div>
            <div className="mode-icon">🌐</div>
            <h3>{isEn ? "Online Party" : "Party Online"}</h3>
            <p className="mode-desc">
              {isEn
                ? "Cross-device raid via Party Code. Each pilot gets a full screen on PC or Mobile!"
                : "Mabar di perangkat berbeda via Party Code. Masing-masing pemain dapat layar penuh di PC atau HP!"}
            </p>
            <div className="mode-specs highlight-specs">
              <span>{isEn ? "Multi-Device" : "Beda Perangkat"}</span>
              <span>•</span>
              <span>{isEn ? "Party Code" : "Party Code"}</span>
            </div>
            <button
              type="button"
              className="mode-action-btn btn-online"
              onClick={(e) => {
                e.stopPropagation();
                onOpenOnlineLobby();
              }}
            >
              {isEn ? "Host / Join Party" : "Buat / Gabung Tim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaidModeSelectModal;
