import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getLocalPlayerId } from "./playerService";

interface LeaderboardRow {
  id: string;
  player_id: string;
  player_name: string;
  total_score: number;
  major: string;
  created_at: string;
  updated_at: string;
}

export async function submitLeaderboardEntry(
  playerName: string,
  totalScore: number,
  major: string
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;

  const playerId = getLocalPlayerId();
  if (!playerId) return false;

const { data: existing } = await supabase!
    .from("leaderboard")
    .select("total_score")
    .eq("player_id", playerId)
    .maybeSingle();

  const existingEntry = existing as { total_score: number } | null;
  if (existingEntry && existingEntry.total_score >= totalScore) {
    return true;
  }

  const { error } = await supabase!.from("leaderboard").upsert(
    {
      player_id: playerId,
      player_name: playerName,
      total_score: totalScore,
      major,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "player_id" }
  );

  if (error) {
    console.error("[leaderboardService] submit failed:", error.message);
    return false;
  }

  return true;
}

export async function fetchGlobalLeaderboard(): Promise<LeaderboardRow[]> {
  if (!isSupabaseEnabled()) return [];

  const { data, error } = await supabase!
    .from("leaderboard")
    .select("*")
    .order("total_score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[leaderboardService] fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as LeaderboardRow[];
}

export async function fetchPlanetLeaderboard(
  planetId: number
): Promise<
  Array<{
    player_name: string;
    planet_id: number;
    score: number;
    completion_time: number;
  }>
> {
  if (!isSupabaseEnabled()) return [];

  const { data, error } = await supabase!
    .from("planet_scores")
    .select("score, completion_time, planet_id, players!inner(name)")
    .eq("planet_id", planetId)
    .eq("completed", true)
    .order("score", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[leaderboardService] planet fetch failed:", error.message);
    return [];
  }

  interface JoinedRow {
    score: number;
    completion_time: number;
    planet_id: number;
    players: Array<{ name: string }>;
  }

  return ((data ?? []) as JoinedRow[]).map((row) => ({
    player_name: row.players[0]?.name ?? "Unknown",
    planet_id: row.planet_id,
    score: row.score,
    completion_time: row.completion_time,
  }));
}
