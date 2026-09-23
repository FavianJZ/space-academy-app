import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

import { gameAudio } from "../../audio/gameAudio";
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
} from "../../constants/game.constants";
import { useGameStore } from "../../stores/useGameStore";
import { getTranslation } from "../../i18n/translations";
import {
  AudioSettingsContext,
  useAudioSettings,
} from "./audioSettingsContext";
import { EditProfileModal } from "../character-selection/EditProfileModal";

import "./AudioSettings.css";

type AudioSettingsProviderProps = {
  children: ReactNode;
};

type AudioSettingsButtonProps = {
  className?: string;
  label?: string;
};

type SceneAudioProfile = {
  id: "selection" | "intro" | "bedroom" | "mainhub" | "leaderboard" | "stage";
  code: string;
  label: string;
  accent: string;
};

type SliderStyle = CSSProperties & {
  "--audio-fill": string;
};

const STAGE_ACCENTS: Record<string, string> = {
  "1": "#72e9ff",
  "2": "#76d8ff",
  "3": "#9be8ff",
  "4": "#ff8fc9",
  "5": "#bda7ff",
  "6": "#78f0dc",
};

const getSceneAudioProfile = (pathname: string): SceneAudioProfile => {
  const stageMatch = pathname.match(/^\/stage\/([1-6])/);
  if (stageMatch) {
    return {
      id: "stage",
      code: `MODULE ${stageMatch[1].padStart(2, "0")}`,
      label: "Academy simulation",
      accent: STAGE_ACCENTS[stageMatch[1]],
    };
  }

  if (pathname === "/intro") {
    return { id: "intro", code: "FLIGHT 01", label: "Flight record", accent: "#67e8ff" };
  }

  if (pathname === "/bedroom") {
    return { id: "bedroom", code: "CABIN 01", label: "Recovery cabin", accent: "#54f4de" };
  }

  if (pathname === "/mainhub") {
    return { id: "mainhub", code: "NAV 02", label: "Orbital navigation", accent: "#4fffc2" };
  }

  if (pathname === "/leaderboard") {
    return { id: "leaderboard", code: "RANK 07", label: "Pilot archive", accent: "#ffd166" };
  }

  return { id: "selection", code: "SUIT 00", label: "Pilot calibration", accent: "#8bdcff" };
};

const clampVolume = (value: number) => Math.max(0, Math.min(1, value));
const toPercent = (value: number) => Math.round(clampVolume(value) * 100);

const SoundMixerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h8M16 7h4M4 17h4M12 17h8M8 4v6M12 14v6" />
    <circle cx="14" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 18V6l10-2v12M9 9l10-2" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

const EffectsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 14a7 7 0 0 1 14 0v3M5 17h3v3H6a1 1 0 0 1-1-1v-2ZM19 17h-3v3h2a1 1 0 0 0 1-1v-2ZM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4" />
  </svg>
);

const VolumeGlyph = ({ muted }: { muted: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" />
    {muted ? <path d="m17 9 4 6M21 9l-4 6" /> : <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />}
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const PilotBadgeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
    <path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
    <path d="M9 9h6" />
  </svg>
);

const EditPencilIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const SchoolMiniIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12, display: "inline-block", verticalAlign: "-1px" }}>
    <path d="m2 7 10-5 10 5-10 5z" />
    <path d="M12 22V12" />
    <path d="M6 9.5v5c0 1.5 2.5 3.5 6 3.5s6-2 6-3.5v-5" />
  </svg>
);

const PhoneMiniIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12, display: "inline-block", verticalAlign: "-1px" }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const AudioSettingsButton = ({
  className = "",
  label = "AUDIO",
}: AudioSettingsButtonProps) => {
  const { openAudioSettings } = useAudioSettings();

  return (
    <button
      type="button"
      className={`audio-settings-launcher ${className}`.trim()}
      aria-label="Open audio settings"
      data-audio-cue="none"
      onClick={openAudioSettings}
    >
      <SoundMixerIcon />
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  );
};

export const AudioSettingsProvider = ({ children }: AudioSettingsProviderProps) => {
  const location = useLocation();
  const musicVolume = useGameStore((state) => state.musicVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const setMusicVolume = useGameStore((state) => state.setMusicVolume);
  const setSfxVolume = useGameStore((state) => state.setSfxVolume);
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const playerData = useGameStore((state) => state.playerData);
  const t = getTranslation(language).settings;
  const [isOpen, setIsOpen] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastMusicVolumeRef = useRef(musicVolume || DEFAULT_MUSIC_VOLUME);
  const lastSfxVolumeRef = useRef(sfxVolume || DEFAULT_SFX_VOLUME);
  const lastMixRef = useRef({
    music: musicVolume || DEFAULT_MUSIC_VOLUME,
    sfx: sfxVolume || DEFAULT_SFX_VOLUME,
  });
  const scene = useMemo(
    () => getSceneAudioProfile(location.pathname),
    [location.pathname]
  );

  const openAudioSettings = useCallback(() => {
    gameAudio.playSfx("loadoutOpen");
    setIsOpen(true);
  }, []);

  const closeAudioSettings = useCallback(() => {
    gameAudio.playSfx("uiClose");
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(closeTimer);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAudioSettings();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = closeButtonRef.current?.closest<HTMLElement>("[role='dialog']");
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [closeAudioSettings, isOpen]);

  const handleMusicChange = (value: number) => {
    const next = clampVolume(value);
    if (next > 0) lastMusicVolumeRef.current = next;
    setMusicVolume(next);
  };

  const handleSfxChange = (value: number) => {
    const next = clampVolume(value);
    if (next > 0) lastSfxVolumeRef.current = next;
    setSfxVolume(next);
  };

  const toggleMusic = () => {
    if (musicVolume > 0) {
      lastMusicVolumeRef.current = musicVolume;
      setMusicVolume(0);
    } else {
      setMusicVolume(lastMusicVolumeRef.current || DEFAULT_MUSIC_VOLUME);
    }
  };

  const toggleSfx = () => {
    if (sfxVolume > 0) {
      lastSfxVolumeRef.current = sfxVolume;
      setSfxVolume(0);
    } else {
      setSfxVolume(lastSfxVolumeRef.current || DEFAULT_SFX_VOLUME);
    }
  };

  const allMuted = musicVolume === 0 && sfxVolume === 0;
  const toggleAllAudio = () => {
    if (!allMuted) {
      lastMixRef.current = {
        music: musicVolume || lastMusicVolumeRef.current,
        sfx: sfxVolume || lastSfxVolumeRef.current,
      };
      setMusicVolume(0);
      setSfxVolume(0);
      return;
    }

    setMusicVolume(lastMixRef.current.music || DEFAULT_MUSIC_VOLUME);
    setSfxVolume(lastMixRef.current.sfx || DEFAULT_SFX_VOLUME);
  };

  const resetAudio = () => {
    lastMusicVolumeRef.current = DEFAULT_MUSIC_VOLUME;
    lastSfxVolumeRef.current = DEFAULT_SFX_VOLUME;
    setMusicVolume(DEFAULT_MUSIC_VOLUME);
    setSfxVolume(DEFAULT_SFX_VOLUME);
    window.setTimeout(() => gameAudio.playSfx("customizationEquip"), 0);
  };

  const averageSignal = Math.round((toPercent(musicVolume) + toPercent(sfxVolume)) / 2);
  const contextValue = useMemo(
    () => ({ isOpen, openAudioSettings, closeAudioSettings }),
    [closeAudioSettings, isOpen, openAudioSettings]
  );
  const panelStyle = { "--audio-settings-accent": scene.accent } as CSSProperties;
  const musicSliderStyle = { "--audio-fill": `${toPercent(musicVolume)}%` } as SliderStyle;
  const sfxSliderStyle = { "--audio-fill": `${toPercent(sfxVolume)}%` } as SliderStyle;

  return (
    <AudioSettingsContext.Provider value={contextValue}>
      {children}

      {!isOpen && (
        <AudioSettingsButton className={`audio-settings-launcher--${scene.id}`} />
      )}

      {isOpen &&
        createPortal(
          <div
            className="audio-settings-overlay"
            style={panelStyle}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAudioSettings();
            }}
          >
            <section
              className="audio-settings-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="audio-settings-title"
              aria-describedby="audio-settings-description"
            >
              <div className="audio-settings-scanline" aria-hidden="true" />
              <span className="audio-settings-corner audio-settings-corner--tl" aria-hidden="true" />
              <span className="audio-settings-corner audio-settings-corner--br" aria-hidden="true" />

              <header className="audio-settings-header">
                <div>
                  <span className="audio-settings-eyebrow">
                    {t.eyebrow} // {scene.code}
                  </span>
                  <h2 id="audio-settings-title">{t.title}</h2>
                  <p id="audio-settings-description">
                    {t.description}
                  </p>
                </div>

                <div className="audio-settings-header-actions">
                  <span className="audio-settings-live"><i /> {t.liveMix}</span>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="audio-settings-close"
                    aria-label={t.closeAria}
                    data-audio-cue="none"
                    onClick={closeAudioSettings}
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              </header>

              <div className="audio-settings-body">
                <aside className="audio-settings-monitor" aria-label="Current audio output">
                  <div className="audio-settings-monitor-head">
                    <span>{t.outputRouting}</span>
                    <strong>{allMuted ? t.muted : t.online}</strong>
                  </div>

                  <div className="audio-settings-wave" aria-hidden="true">
                    {[28, 54, 76, 46, 88, 62, 94, 52, 72, 36, 66, 44].map((height, index) => (
                      <i
                        key={`${height}-${index}`}
                        style={{ "--wave-height": `${height}%`, "--wave-delay": `${index * -70}ms` } as CSSProperties}
                      />
                    ))}
                  </div>

                  <div className="audio-settings-signal">
                    <span>{t.masterSignal}</span>
                    <strong>{averageSignal}%</strong>
                    <div><i style={{ width: `${averageSignal}%` }} /></div>
                  </div>

                  <dl>
                    <div><dt>{t.sector}</dt><dd>{scene.label}</dd></div>
                    <div><dt>{t.pilotLabel || (language === "en" ? "PILOT" : "KADET")}</dt><dd style={{ color: "#4fffc2", fontWeight: "bold" }}>{playerData.name || "CADET"}</dd></div>
                    <div><dt>{t.profile}</dt><dd>{t.autoSaved}</dd></div>
                    <div><dt>{t.output}</dt><dd>{t.stereoWeb}</dd></div>
                    <div><dt>{t.languagePrefHeading}</dt><dd style={{ color: "var(--audio-settings-accent)", fontWeight: "bold" }}>{language === "id" ? "INDONESIA (ID)" : "ENGLISH (EN)"}</dd></div>
                  </dl>

                  <button
                    type="button"
                    className={`audio-settings-master ${allMuted ? "is-muted" : ""}`}
                    onClick={toggleAllAudio}
                  >
                    <VolumeGlyph muted={allMuted} />
                    {allMuted ? t.restoreAll : t.muteAll}
                  </button>
                </aside>

                <div className="audio-settings-mixer">

                  <div className="audio-settings-channel audio-settings-channel--profile">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon audio-settings-channel-icon--profile">
                        <PilotBadgeIcon />
                      </div>
                      <div className="audio-settings-profile-info">
                        <span className="audio-settings-profile-kicker">
                          {t.cadetIdentityHeading || (language === "en" ? "CADET IDENTITY" : "IDENTITAS KADET")}
                        </span>
                        <div className="audio-settings-profile-name-row">
                          <h3 className="audio-settings-profile-name">
                            {playerData.name || (language === "en" ? "Cadet Pilot" : "Kadet Antariksa")}
                          </h3>
                          {playerData.major && (
                            <span className="audio-settings-major-pill">
                              {playerData.major}
                            </span>
                          )}
                        </div>
                        <div className="audio-settings-profile-meta-row">
                          <span className="profile-meta-tag">
                            <SchoolMiniIcon />
                            <span>{playerData.school || "Space Academy"}</span>
                          </span>
                          <span className="profile-meta-tag">
                            <PhoneMiniIcon />
                            <span>{playerData.phone || (language === "en" ? "No phone set" : "Belum diatur")}</span>
                          </span>
                        </div>
                      </div>
                      <div className="audio-settings-profile-action">
                        <button
                          type="button"
                          className="audio-settings-edit-btn"
                          data-audio-cue="none"
                          onClick={() => {
                            gameAudio.playSfx("uiConfirm");
                            setShowEditProfileModal(true);
                          }}
                        >
                          <EditPencilIcon />
                          <span>{t.editProfileBtn || (language === "en" ? "EDIT PROFILE" : "UBAH PROFIL")}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="audio-settings-channel audio-settings-channel--lang">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon"><GlobeIcon /></div>
                      <div>
                        <span>{t.languagePrefHeading}</span>
                        <h3>{t.languageTitle}</h3>
                        <p>{t.languageDesc}</p>
                      </div>
                      <div className="audio-settings-lang-pills">
                        <button
                          type="button"
                          className={`audio-settings-lang-pill ${language === "id" ? "active" : ""}`}
                          onClick={() => {
                            gameAudio.playSfx("uiConfirm");
                            setLanguage("id");
                          }}
                        >
                          <span className="lang-flag">🇮🇩</span> {t.idOption}
                        </button>
                        <button
                          type="button"
                          className={`audio-settings-lang-pill ${language === "en" ? "active" : ""}`}
                          onClick={() => {
                            gameAudio.playSfx("uiConfirm");
                            setLanguage("en");
                          }}
                        >
                          <span className="lang-flag">🇬🇧</span> {t.enOption}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="audio-settings-channel">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon"><MusicIcon /></div>
                      <div>
                        <span>{t.channel01}</span>
                        <h3>{t.bgmTitle}</h3>
                        <p>{t.bgmDesc}</p>
                      </div>
                      <output htmlFor="audio-music-volume">{toPercent(musicVolume)}%</output>
                    </div>

                    <div className="audio-settings-slider-row">
                      <button
                        type="button"
                        className={musicVolume === 0 ? "is-muted" : ""}
                        aria-label={musicVolume === 0 ? "Unmute background music" : "Mute background music"}
                        aria-pressed={musicVolume === 0}
                        onClick={toggleMusic}
                      >
                        <VolumeGlyph muted={musicVolume === 0} />
                      </button>
                      <label className="sr-only" htmlFor="audio-music-volume">Background music volume</label>
                      <input
                        id="audio-music-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={musicVolume}
                        style={musicSliderStyle}
                        aria-valuetext={`${toPercent(musicVolume)} percent`}
                        onChange={(event) => handleMusicChange(Number(event.target.value))}
                      />
                    </div>
                    <div className="audio-settings-scale" aria-hidden="true">
                      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                  </div>

                  <div className="audio-settings-channel">
                    <div className="audio-settings-channel-head">
                      <div className="audio-settings-channel-icon"><EffectsIcon /></div>
                      <div>
                        <span>{t.channel02}</span>
                        <h3>{t.sfxTitle}</h3>
                        <p>{t.sfxDesc}</p>
                      </div>
                      <output htmlFor="audio-sfx-volume">{toPercent(sfxVolume)}%</output>
                    </div>

                    <div className="audio-settings-slider-row">
                      <button
                        type="button"
                        className={sfxVolume === 0 ? "is-muted" : ""}
                        aria-label={sfxVolume === 0 ? "Unmute sound effects" : "Mute sound effects"}
                        aria-pressed={sfxVolume === 0}
                        onClick={toggleSfx}
                      >
                        <VolumeGlyph muted={sfxVolume === 0} />
                      </button>
                      <label className="sr-only" htmlFor="audio-sfx-volume">Sound effects volume</label>
                      <input
                        id="audio-sfx-volume"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sfxVolume}
                        style={sfxSliderStyle}
                        aria-valuetext={`${toPercent(sfxVolume)} percent`}
                        onChange={(event) => handleSfxChange(Number(event.target.value))}
                      />
                    </div>
                    <div className="audio-settings-scale" aria-hidden="true">
                      <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              <footer className="audio-settings-footer">
                <div className="audio-settings-shortcuts">
                  <span><kbd>ESC</kbd> {t.escClose}</span>
                  <span><kbd>←</kbd><kbd>→</kbd> {t.arrowAdjust}</span>
                </div>
                <div className="audio-settings-footer-actions">
                  <button
                    type="button"
                    className="audio-settings-secondary"
                    data-audio-cue="none"
                    onClick={resetAudio}
                  >
                    {t.resetAudio}
                  </button>
                  <button
                    type="button"
                    className="audio-settings-secondary"
                    data-audio-cue="none"
                    disabled={sfxVolume === 0}
                    onClick={() => gameAudio.playSfx("uiConfirm")}
                  >
                    {t.testSignal}
                  </button>
                  <button
                    type="button"
                    className="audio-settings-primary"
                    data-audio-cue="none"
                    onClick={closeAudioSettings}
                  >
                    {t.applyAndClose} <span aria-hidden="true">→</span>
                  </button>
                </div>
              </footer>

              {showEditProfileModal && (
                <EditProfileModal
                  isOpen={showEditProfileModal}
                  onClose={() => setShowEditProfileModal(false)}
                />
              )}
            </section>
          </div>,
          document.body
        )}
    </AudioSettingsContext.Provider>
  );
};

export default AudioSettingsProvider;
