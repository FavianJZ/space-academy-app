import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/useGameStore";
import { isSupabaseEnabled } from "../lib/supabase";
import {
  registerPlayer,
  updatePlayer,
  getLocalPlayerId,
  updateCustomization,
  markGameCompleted,
  markIntroCompleted,
} from "../services/playerService";
import { submitScore } from "../services/scoreService";
import { submitLeaderboardEntry } from "../services/leaderboardService";
import { dealBossDamage as remoteDealBossDamage } from "../services/bossService";
import {
  snapshotCurrentStoreAccount,
  syncAllLocalAccountsToSupabase,
} from "../services/deviceAccountService";

export function useSupabaseSync(): void {
  const lastRegisteredName = useRef<string>("");


  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    syncAllLocalAccountsToSupabase().catch((err) =>
      console.warn("[useSupabaseSync] Initial sync warning:", err)
    );
  }, []);

  const playerData = useGameStore((s) => s.playerData);
  const character = useGameStore((s) => s.character);
  const spacemanColor = useGameStore((s) => s.spacemanColor);
  const spacemanHat = useGameStore((s) => s.spacemanHat);
  const spacemanPet = useGameStore((s) => s.spacemanPet);
  const introCompleted = useGameStore((s) => s.introCompleted);
  const isGameCompleted = useGameStore((s) => s.isGameCompleted);
  const specializationResult = useGameStore((s) => s.specializationResult);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    const cleanName = playerData.name?.trim();
    if (!cleanName) return;

    if (window.location.pathname.includes("/bedroom")) return;
    if (lastRegisteredName.current.toLowerCase() === cleanName.toLowerCase() && getLocalPlayerId()) return;

    registerPlayer({
      name: cleanName,
      phone: playerData.phone,
      school: playerData.school,
      major: playerData.major,
      character_type: character,
      spaceman_color: spacemanColor,
      spaceman_hat: spacemanHat,
      spaceman_pet: spacemanPet,
      specialization_result: specializationResult,
    }).then((id) => {
      if (id) {
        lastRegisteredName.current = cleanName;
        useGameStore.setState({ playerId: id });
        snapshotCurrentStoreAccount();
      }
    });
  }, [
    playerData.name,
    playerData.phone,
    playerData.school,
    playerData.major,
    character,
    spacemanColor,
    spacemanHat,
    spacemanPet,
  ]);

  useEffect(() => {
    snapshotCurrentStoreAccount();
    if (!isSupabaseEnabled()) return;
    const playerId = useGameStore.getState().playerId || getLocalPlayerId();
    if (!playerId) return;

    updateCustomization(playerId, {
      character_type: character,
      spaceman_color: spacemanColor,
      spaceman_hat: spacemanHat,
      spaceman_pet: spacemanPet,
    });
  }, [character, spacemanColor, spacemanHat, spacemanPet]);

  useEffect(() => {
    if (!isSupabaseEnabled() || !introCompleted) return;
    const playerId = useGameStore.getState().playerId || getLocalPlayerId();
    if (!playerId) return;

    markIntroCompleted(playerId);
  }, [introCompleted]);

  useEffect(() => {
    snapshotCurrentStoreAccount();
    if (!isSupabaseEnabled() || !isGameCompleted) return;
    const playerId = useGameStore.getState().playerId || getLocalPlayerId();
    if (!playerId) return;

    markGameCompleted(playerId);
  }, [isGameCompleted]);

  useEffect(() => {
    if (!isSupabaseEnabled() || !specializationResult) return;
    const playerId = useGameStore.getState().playerId || getLocalPlayerId();
    if (!playerId) return;

    updatePlayer(playerId, {
      specialization_result: specializationResult,
    });
  }, [specializationResult]);
}

export async function syncScoreToSupabase(
  planetId: number,
  stageId: number,
  score: number,
  completionTime?: number
): Promise<void> {
  if (!isSupabaseEnabled()) return;

  try {
    const state = useGameStore.getState();
    let playerId = state.playerId || getLocalPlayerId();
    if (!playerId) {
      const cleanName = state.playerData.name?.trim() || "Cadet Pilot";
      playerId = await registerPlayer({
        name: cleanName,
        phone: state.playerData.phone,
        school: state.playerData.school,
        major: state.playerData.major,
        character_type: state.character,
        spaceman_color: state.spacemanColor,
        spaceman_hat: state.spacemanHat,
        spaceman_pet: state.spacemanPet,
        specialization_result: state.specializationResult,
      });
      if (playerId) {
        useGameStore.setState({ playerId });
      }
    }

    if (playerId) {
      await submitScore(planetId, stageId, score, completionTime, playerId);
    }
  } catch (err) {
    console.error("[sync] score push failed:", err);
  }
}

export async function syncLeaderboardToSupabase(
  playerName: string,
  totalScore: number,
  major: string
): Promise<void> {
  if (!isSupabaseEnabled()) return;

  try {
    const state = useGameStore.getState();
    let playerId = state.playerId || getLocalPlayerId();
    if (!playerId) {
      const cleanName = state.playerData.name?.trim() || playerName || "Cadet Pilot";
      playerId = await registerPlayer({
        name: cleanName,
        phone: state.playerData.phone,
        school: state.playerData.school,
        major: state.playerData.major || major,
        character_type: state.character,
        spaceman_color: state.spacemanColor,
        spaceman_hat: state.spacemanHat,
        spaceman_pet: state.spacemanPet,
        specialization_result: state.specializationResult,
      });
      if (playerId) {
        useGameStore.setState({ playerId });
      }
    }

    if (playerId) {
      await submitLeaderboardEntry(playerName, totalScore, major, playerId);
    }
  } catch (err) {
    console.error("[sync] leaderboard push failed:", err);
  }
}

export function syncBossDamageToSupabase(
  damage: number,
  playerName: string
): void {
  if (!isSupabaseEnabled()) return;

  remoteDealBossDamage(damage, playerName).catch((err) =>
    console.error("[sync] boss damage push failed:", err)
  );
}
