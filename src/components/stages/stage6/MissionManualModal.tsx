import React, { useState } from "react";
import { useGameStore } from "../../../stores/useGameStore";
import "./MissionManualModal.css";

interface MissionManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionManualModal: React.FC<MissionManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  const language = useGameStore((state) => state.language);
  const isEn = language === "en";
  const [activeTab, setActiveTab] = useState<"overview" | "combos" | "controls">("overview");

  if (!isOpen) return null;

  return (
    <div className="mission-manual-backdrop" onClick={onClose}>
      <div
        className="mission-manual-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >

        <div className="mission-manual-header">
          <div className="manual-title-wrapper">
            <span className="manual-book-badge">📖</span>
            <div>
              <div className="manual-pretitle">TACTICAL RAID PROTOCOL // ARCHIVE</div>
              <h2 className="manual-title">
                {isEn ? "MISSION MANUAL & FIELD GUIDE" : "PANDUAN MISI & CARA BERMAIN"}
              </h2>
            </div>
          </div>
          <button className="manual-close-btn" onClick={onClose} aria-label="Close manual">
            ✕
          </button>
        </div>


        <div className="manual-tabs">
          <button
            className={`manual-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            🎯 {isEn ? "Combat Rules" : "Aturan Tempur"}
          </button>
          <button
            className={`manual-tab-btn ${activeTab === "combos" ? "active" : ""}`}
            onClick={() => setActiveTab("combos")}
          >
            ⚡ {isEn ? "Combos & Hazards" : "Combo & Bahaya"}
          </button>
          <button
            className={`manual-tab-btn ${activeTab === "controls" ? "active" : ""}`}
            onClick={() => setActiveTab("controls")}
          >
            🎮 {isEn ? "Control Schemes" : "Skema Kontrol"}
          </button>
        </div>


        <div className="manual-body">
          {activeTab === "overview" && (
            <div className="manual-tab-content">
              <div className="manual-card good">
                <div className="manual-card-header">
                  <span className="manual-card-badge green">01</span>
                  <h3>{isEn ? "Squash Bugs to Blast Boss" : "Basmi Bug Kode untuk Menembak Bos"}</h3>
                </div>
                <p>
                  {isEn
                    ? "Identify code snippet errors (syntax, typos, infinite loops). Each correct bug squashed instantly fires a photon laser at UFO Ultimara dealing +100 Base Damage."
                    : "Temukan potongan kode yang salah (sintaks, typo, loop tak hingga). Setiap bug yang dibasmi akan menembakkan laser foton ke Bos UFO Ultimara (+100 Base Damage)."}
                </p>
              </div>

              <div className="manual-card danger">
                <div className="manual-card-header">
                  <span className="manual-card-badge red">02</span>
                  <h3>{isEn ? "Avoid Clean Code Penalties" : "Hindari Kode Bersih / Benar"}</h3>
                </div>
                <p>
                  {isEn
                    ? "Do NOT click on syntactically correct code snippets! Attacking valid code will disrupt your weapon system, triggering a -300 point penalty and resetting your combo."
                    : "JANGAN klik kode yang sudah benar! Menyerang kode bersih akan mengacaukan sistem persenjataan, mengurangi -300 poin, dan mereset kombo menjadi 0."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "combos" && (
            <div className="manual-tab-content">
              <div className="manual-card gold">
                <div className="manual-card-header">
                  <span className="manual-card-badge yellow">03</span>
                  <h3>{isEn ? "Continuous Strike Combos" : "Sistem Multiplier Combo"}</h3>
                </div>
                <p>
                  {isEn
                    ? "Maintain consecutive bug hits without missing or striking clean code. Combos amplify damage up to 3x, dealing massive strikes against UFO Ultimara's health pool!"
                    : "Pertahankan tembakan beruntun tanpa meleset dan tanpa menekan kode bersih. Combo melipatgandakan serangan hingga 3x damage ke darah UFO Ultimara!"}
                </p>
              </div>

              <div className="manual-card warning">
                <div className="manual-card-header">
                  <span className="manual-card-badge purple">04</span>
                  <h3>{isEn ? "UFO Abduction Beam Hazard" : "Sinar Abduksi UFO Traps"}</h3>
                </div>
                <p>
                  {isEn
                    ? "UFO Ultimara periodically charges an alien tractor beam that targets clean code blocks with green hazard lights. Avoid clicking beaming tiles!"
                    : "UFO Ultimara secara berkala menembakkan sinar traktor hijau yang mengincar modul kode bersih. Berhati-hatilah dan jangan mengklik kotak yang sedang diabduksi!"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="manual-tab-content">
              <div className="manual-controls-grid">
                <div className="control-card">
                  <div className="control-icon">🖱️ MOUSE</div>
                  <h4>{isEn ? "Direct Pointer" : "Klik Langsung"}</h4>
                  <p>{isEn ? "Click any tile directly using left click." : "Klik kotak aktif secara langsung dengan kursor mouse."}</p>
                </div>

                <div className="control-card">
                  <div className="control-icon">⌨️ NUMPAD</div>
                  <h4>{isEn ? "Numpad 1-9 Matrix" : "Matriks Numpad 1-9"}</h4>
                  <div className="numpad-preview">
                    <span>7</span><span>8</span><span>9</span>
                    <span>4</span><span>5</span><span>6</span>
                    <span>1</span><span>2</span><span>3</span>
                  </div>
                  <p>{isEn ? "Corresponds 1:1 to the 3x3 combat sector." : "Posisi tombol sesuai 1:1 dengan kisi sektor 3x3."}</p>
                </div>

                <div className="control-card">
                  <div className="control-icon">🔤 KEYBOARD</div>
                  <h4>{isEn ? "Letter Keys" : "Tombol Huruf"}</h4>
                  <div className="keyboard-preview">
                    <span>Q</span><span>W</span><span>E</span>
                    <span>A</span><span>S</span><span>D</span>
                    <span>Z</span><span>X</span><span>C</span>
                  </div>
                  <p>{isEn ? "Ideal for laptop keyboards without a numpad." : "Cocok untuk laptop tanpa tombol numpad fisik."}</p>
                </div>
              </div>
            </div>
          )}
        </div>


        <div className="mission-manual-footer">
          <button className="manual-action-btn" onClick={onClose}>
            {isEn ? "UNDERSTOOD // RETURN TO LOBBY" : "MENGERTI // KEMBALI KE LOBBY"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default MissionManualModal;
