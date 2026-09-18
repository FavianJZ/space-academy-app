import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { getLocalPlayerId } from "./playerService";

export async function submitScore(
  planetId: number,
  stageId: number,
  score: number,
  completionTime?: number,
  playerIdOverride?: string
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;

  const playerId = playerIdOverride || getLocalPlayerId();
  if (!playerId) return false;

const { data: existing } = await supabase!
    .from("planet_scores")
    .select("score")
    .eq("player_id", playerId)
    .eq("planet_id", planetId)
    .eq("stage_id", stageId)
    .maybeSingle();

  const existingScore = existing as { score: number } | null;
  if (existingScore && existingScore.score >= score) {
    return true; 
  }

  const { error } = await supabase!.from("planet_scores").upsert(
    {
      player_id: playerId,
      planet_id: planetId,
      stage_id: stageId,
      score,
      completion_time: completionTime ?? 0,
      completed: true,
    },
    { onConflict: "player_id,planet_id,stage_id" }
  );

  if (error) {
    console.error("[scoreService] submit failed:", error.message);
    return false;
  }

  return true;
}

export async function fetchPlayerScores(
  playerId: string
): Promise<
  Array<{
    planet_id: number;
    stage_id: number;
    score: number;
    completion_time: number;
    completed: boolean;
  }>
> {
  if (!isSupabaseEnabled()) return [];

  const { data, error } = await supabase!
    .from("planet_scores")
    .select("planet_id, stage_id, score, completion_time, completed")
    .eq("player_id", playerId);

  if (error) {
    console.error("[scoreService] fetch failed:", error.message);
    return [];
  }

  return (data ?? []) as Array<{
    planet_id: number;
    stage_id: number;
    score: number;
    completion_time: number;
    completed: boolean;
  }>;
}
