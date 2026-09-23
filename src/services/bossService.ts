import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getLocalPlayerId } from "./playerService";
import { BOSS_MAX_HP } from "../constants/game.constants";

export async function fetchBossHP(): Promise<{
  global_hp: number;
  max_hp: number;
} | null> {
  if (!isSupabaseEnabled()) return null;

  const { data, error } = await supabase!
    .from("boss_state")
    .select("global_hp, max_hp")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("[bossService] fetch HP failed:", error.message);
    return null;
  }

  return data as { global_hp: number; max_hp: number };
}

export async function dealBossDamage(
  damage: number,
  playerName: string
): Promise<number | null> {
  if (!isSupabaseEnabled()) return null;

  const playerId = getLocalPlayerId();

  try {
    await supabase!.from("boss_damage_log").insert({
      player_id: playerId,
      player_name: playerName,
      damage,
    });
  } catch (err) {
    console.warn("[bossService] log damage error:", err);
  }

  return damage;
}

export async function resetBoss(): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;

  const { error } = await supabase!
    .from("boss_state")
    .update({
      global_hp: BOSS_MAX_HP,
      max_hp: BOSS_MAX_HP,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("[bossService] reset failed:", error.message);
    return false;
  }

  return true;
}

export async function fetchBossDamageLog(): Promise<
  Array<{ player_name: string; damage: number; created_at: string }>
> {
  if (!isSupabaseEnabled()) return [];

  const { data, error } = await supabase!
    .from("boss_damage_log")
    .select("player_name, damage, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[bossService] fetch log failed:", error.message);
    return [];
  }

  return (data ?? []) as Array<{
    player_name: string;
    damage: number;
    created_at: string;
  }>;
}
