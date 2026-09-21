import React, { useState } from "react";
import { useGameStore } from "../../../stores/useGameStore";
import { useOnlineRaid } from "../../../hooks/useOnlineRaid";
import "./OnlinePartyLobbyModal.css";

interface OnlinePartyLobbyModalProps {
  onStartOnlineRaid: (partyCode: string, isHost: boolean) => void;
  onClose: () => void;
}

function generateRandomPartyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const OnlinePartyLobbyModal: React.FC<OnlinePartyLobbyModalProps> = ({
  onStartOnlineRaid,
  onClose,
}) => {
  const language = useGameStore((state) => state.language);
  const isEn = language === "en";
  const remoteCoPilot = useGameStore((state) => state.remoteCoPilot);

  const [activeTab, setActiveTab] = useState<"host" | "join">("host");
  const [hostCode] = useState(() => generateRandomPartyCode());
  const [inputCode, setInputCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isJoining, setIsJoining] = useState(false);


  const activeCode = activeTab === "host" ? hostCode : submittedCode;

  const hasPartnerJoinedRef = React.useRef(false);


  const { isConnected, hasPartner, isCloud } = useOnlineRaid({
    partyCode: activeCode,
    isHost: activeTab === "host",
    onPartnerJoined: () => {
      if (!hasPartnerJoinedRef.current) {
        hasPartnerJoinedRef.current = true;
        setTimeout(() => {
          onStartOnlineRaid(activeCode, activeTab === "host");
        }, 350);
      }
    },
    onRaidStart: () => {
      onStartOnlineRaid(activeCode, activeTab === "host");
    },
  });

  React.useEffect(() => {
    if (hasPartner && remoteCoPilot && !hasPartnerJoinedRef.current) {
      hasPartnerJoinedRef.current = true;
      const timer = setTimeout(() => {
        onStartOnlineRaid(activeCode, activeTab === "host");
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [hasPartner, remoteCoPilot, activeCode, activeTab, onStartOnlineRaid]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(hostCode);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleLaunchHostRaid = () => {

    onStartOnlineRaid(hostCode, true);
  };

  const handleTabSwitch = (tab: "host" | "join") => {
    setActiveTab(tab);
    if (tab === "host") {
      setSubmittedCode("");
      setIsJoining(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.toUpperCase().trim();
    if (!clean) return;
    setSubmittedCode(clean);
    setIsJoining(true);
  };

  return (
    <div className="party-lobby-overlay" onClick={onClose}>
      <div
        className="party-lobby-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="party-lobby-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="party-lobby-top">
          <div className="party-lobby-top-left">
            <span className="party-lobby-badge">
              {isEn ? "QUANTUM TELEMETRY LINK // MULTIPLAYER" : "TAUTAN TELEMETRI KUANTUM // MULTIPLAYER"}
            </span>
            <span className={`net-mode-pill ${isCloud ? "cloud" : "local"}`}>
              {isCloud
                ? (isEn ? "● CLOUD (CROSS-DEVICE)" : "● CLOUD (BEDA PERANGKAT)")
                : (isEn ? "● LOCAL LINK (BROWSER PEER)" : "● LOCAL LINK (PEER BROWSER)")}
            </span>
          </div>
          <button
            type="button"
            className="party-lobby-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="party-lobby-tabs">
          <button
            type="button"
            className={`lobby-tab-btn ${activeTab === "host" ? "active" : ""}`}
            onClick={() => handleTabSwitch("host")}
          >
            {isEn ? "HOST RAID (CREATE CODE)" : "BUAT TIM (HOST CODE)"}
          </button>
          <button
            type="button"
            className={`lobby-tab-btn ${activeTab === "join" ? "active" : ""}`}
            onClick={() => handleTabSwitch("join")}
          >
            {isEn ? "JOIN RAID (ENTER CODE)" : "GABUNG TIM (MASUKKAN KODE)"}
          </button>
        </div>

        <div className="party-lobby-body">
          {activeTab === "host" ? (
            <div className="tab-content host-content">
              <div className="party-code-card">
                <span className="party-code-label">
                  {isEn ? "YOUR SECRET PARTY CODE" : "KODE TIM RAHASIA ANDA"}
                </span>
                <div className="party-code-display">
                  <span className="code-text">{hostCode}</span>
                  <button
                    type="button"
                    className="copy-code-btn"
                    onClick={handleCopyCode}
                  >
                    {copyFeedback
                      ? (isEn ? "COPIED!" : "TERSALIN!")
                      : (isEn ? "COPY CODE" : "SALIN KODE")}
                  </button>
                </div>
                <p className="code-instruction">
                  {isEn
                    ? "Share this code with your classmate or open on your smartphone to play together."
                    : "Bagikan kode ini ke teman Anda atau buka di tab/jendela lain untuk bermain bersama."}
                </p>
              </div>

              <div className="partner-status-box">
                {hasPartner && remoteCoPilot ? (
                  <div className="partner-connected-card">
                    <div className="partner-status-dot online" />
                    <div className="partner-avatar-placeholder">
                      {remoteCoPilot.character === "pink" ? "🌸" : "🤖"}
                    </div>
                    <div className="partner-meta">
                      <div className="partner-role">CO-PILOT CONNECTED</div>
                      <div className="partner-name">{remoteCoPilot.name.toUpperCase()}</div>
                    </div>
                    <span className="partner-ready-tag">READY FOR RAID</span>
                  </div>
                ) : (
                  <div className="partner-waiting-card">
                    <div className="radar-spinner" />
                    <div>
                      <div className="waiting-title">
                        {isEn ? "WAITING FOR CO-PILOT TO JOIN..." : "MENUNGGU CO-PILOT BERGABUNG..."}
                      </div>
                      <div className="waiting-sub">
                        {isConnected
                          ? isCloud
                            ? (isEn ? "Cloud room active. Waiting for teammate signal." : "Room cloud aktif. Menunggu sinyal rekan.")
                            : (isEn ? "Local browser frequency active. Waiting for teammate." : "Frekuensi peer browser aktif. Menunggu rekan menyambung.")
                          : (isEn ? "Initializing connection..." : "Menginisialisasi koneksi...")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lobby-actions">
                <button
                  type="button"
                  className="launch-raid-btn"
                  onClick={handleLaunchHostRaid}
                >
                  🚀 {hasPartner
                    ? (isEn ? "ENTER PARTY LOBBY" : "MASUK KE LOBBY TIM")
                    : (isEn ? "ENTER 3D LOBBY NOW" : "MASUK KE LOBBY (TUNGGU DI DALAM)")}
                </button>
              </div>

              {!isCloud && (
                <div className="local-mode-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    {isEn
                      ? "Local Peer Link active: Open another window in this browser to test multiplayer immediately!"
                      : "Mode Peer Lokal aktif: Buka tab/jendela lain di browser ini untuk langsung uji coba multiplayer!"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="tab-content join-content">
              <form onSubmit={handleJoinSubmit} className="join-form">
                <label htmlFor="party-code-input" className="join-label">
                  {isEn ? "ENTER 6-DIGIT PARTY PIN:" : "MASUKKAN 6 ANGKA KODE TIM:"}
                </label>
                <div className="join-input-wrap">
                  <input
                    id="party-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="misal: 629148"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="join-input"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="join-submit-btn"
                    disabled={inputCode.trim().length !== 6}
                  >
                    {isEn ? "LINK ROOM" : "SAMBUNGKAN"}
                  </button>
                </div>
              </form>

              {isJoining && (
                <div className="partner-status-box">
                  {hasPartner && remoteCoPilot ? (
                    <div className="partner-connected-card">
                      <div className="partner-status-dot online" />
                      <div className="partner-meta">
                        <div className="partner-role">HOST IDENTIFIED</div>
                        <div className="partner-name">{remoteCoPilot.name.toUpperCase()}</div>
                      </div>
                      <button
                        type="button"
                        className="join-enter-lobby-btn"
                        onClick={() => onStartOnlineRaid(activeCode, false)}
                      >
                        🚀 {isEn ? "ENTER PARTY LOBBY" : "MASUK KE LOBBY TIM"}
                      </button>
                    </div>
                  ) : (
                    <div className="partner-waiting-card">
                      <div className="radar-spinner" />
                      <div>
                        <div className="waiting-title">
                          {isEn ? `CONNECTING TO ROOM [${activeCode}]...` : `MENGHUBUNGKAN KE ROOM [${activeCode}]...`}
                        </div>
                        <div className="waiting-sub">
                          {isEn ? "Sending peer handshake signal to Host..." : "Mengirim sinyal jabat tangan peer ke Host..."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isCloud && (
                <div className="local-mode-tip-box">
                  <span className="tip-icon">💡</span>
                  <span>
                    {isEn
                      ? "Testing on localhost: Enter the Host code from your other tab/window to connect instantly!"
                      : "Pengujian lokal: Masukkan kode Host dari jendela/tab Anda yang lain untuk langsung terhubung!"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlinePartyLobbyModal;
