import React, { useState } from "react";
import { useGameStore } from "../../stores/useGameStore";
import { useGameAudio } from "../../hooks/useGameAudio";
import { updateCadetProfile } from "../../services/deviceAccountService";
import { validateAppropriateText } from "../../utils/profanityFilter";
import type { Major } from "../../types/game.types";
import "./EditProfileModal.css";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { playSfx } = useGameAudio();
  const language = useGameStore((state) => state.language);
  const isEn = language === "en";

  const playerData = useGameStore((state) => state.playerData);

  const [name, setName] = useState(playerData.name || "");
  const [school, setSchool] = useState(playerData.school || "");
  const [phone, setPhone] = useState(playerData.phone || "");
  const [major, setMajor] = useState<Major>((playerData.major as Major) || "IPA");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const nameValidation = validateAppropriateText(name);
    if (!nameValidation.isValid) {
      setErrorMsg(
        isEn
          ? nameValidation.errorMessage || "Invalid pilot name."
          : nameValidation.errorMessage || "Nama kadet tidak valid."
      );
      playSfx("feedbackIncorrect");
      return;
    }

    const schoolValidation = validateAppropriateText(school);
    if (!schoolValidation.isValid) {
      setErrorMsg(
        isEn
          ? schoolValidation.errorMessage || "Invalid school name."
          : schoolValidation.errorMessage || "Nama sekolah tidak valid."
      );
      playSfx("feedbackIncorrect");
      return;
    }

    if (phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      setErrorMsg(
        isEn
          ? "Please enter a valid phone number (min 7 digits)."
          : "Nomor telepon tidak valid (minimal 7 digit)."
      );
      playSfx("feedbackIncorrect");
      return;
    }

    try {
      setIsSaving(true);
      await updateCadetProfile({
        name: name.trim(),
        school: school.trim(),
        phone: phone.trim(),
        major,
      });

      playSfx("uiConfirm");
      setSaveSuccess(true);
      onProfileUpdated?.();

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error("[EditProfileModal] Failed to update profile:", err);
      setErrorMsg(
        isEn
          ? "Failed to save profile. Please try again."
          : "Gagal menyimpan profil. Silakan coba lagi."
      );
      playSfx("feedbackIncorrect");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="epm-overlay" onClick={onClose}>
      <div
        className="epm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="epm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="epm-header">
          <div className="epm-header-left">
            <span className="epm-icon">✏️</span>
            <div>
              <h2 id="epm-title">
                {isEn ? "EDIT PILOT CARD" : "UBAH KARTU PILOT"}
              </h2>
              <p>
                {isEn
                  ? "Update your personal credentials and academy data"
                  : "Perbarui identitas personal & data kadet antariksa"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="epm-close-btn"
            onClick={onClose}
            aria-label={isEn ? "Close" : "Tutup"}
          >
            ✕
          </button>
        </div>

        <form className="epm-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="epm-alert-error" role="alert">
              <span>⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="epm-alert-success" role="status">
              <span>✓</span>
              <p>
                {isEn
                  ? "Pilot profile updated successfully!"
                  : "Profil pilot berhasil diperbarui!"}
              </p>
            </div>
          )}

          <div className="epm-field">
            <label htmlFor="epm-name">
              {isEn ? "PILOT NAME" : "NAMA KADET / PILOT"}
            </label>
            <input
              id="epm-name"
              type="text"
              required
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? "Enter pilot name..." : "Masukkan nama..."}
            />
          </div>

          <div className="epm-field">
            <label htmlFor="epm-school">
              {isEn ? "SCHOOL / ACADEMY" : "ASAL SEKOLAH / AKADEMI"}
            </label>
            <input
              id="epm-school"
              type="text"
              required
              maxLength={64}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder={isEn ? "High school name..." : "Nama SMA / SMK / Sederajat..."}
            />
          </div>

          <div className="epm-field">
            <label htmlFor="epm-phone">
              {isEn ? "PHONE / WHATSAPP NUMBER" : "NOMOR TELEPON / WHATSAPP"}
            </label>
            <input
              id="epm-phone"
              type="tel"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="epm-field">
            <label htmlFor="epm-major">
              {isEn ? "TRACK / MAJOR" : "PEMINATAN / JURUSAN"}
            </label>
            <select
              id="epm-major"
              value={major}
              onChange={(e) => setMajor(e.target.value as Major)}
            >
              <option value="IPA">IPA (Sains, Teknologi & Rekayasa)</option>
              <option value="IPS">IPS (Sosial, Bisnis & Humaniora)</option>
            </select>
          </div>

          <div className="epm-actions">
            <button
              type="button"
              className="epm-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
            >
              {isEn ? "Cancel" : "Batal"}
            </button>
            <button
              type="submit"
              className="epm-save-btn"
              disabled={isSaving}
            >
              {isSaving
                ? (isEn ? "Saving..." : "Menyimpan...")
                : (isEn ? "💾 Save Changes" : "💾 Simpan Perubahan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
