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
): Promise<import("../types/game.types").PlanetLeaderboardEntry[]> {
  if (!isSupabaseEnabled()) return [];

  const { data, error } = await supabase!
    .from("planet_scores")
    .select("score, completion_time, planet_id, created_at, players!inner(name)")
    .eq("planet_id", planetId)
    .eq("completed", true)
    .order("score", { ascending: false })
    .limit(40);

  if (error) {
    console.warn("[leaderboardService] planet fetch failed:", error.message);
    return [];
  }

  const mapped: import("../types/game.types").PlanetLeaderboardEntry[] = (
    (data ?? []) as any[]
  ).map((row) => {
    let name = "Cadet Pilot";
    if (row.players) {
      if (
        typeof row.players === "object" &&
        !Array.isArray(row.players) &&
        row.players.name
      ) {
        name = row.players.name;
      } else if (Array.isArray(row.players) && row.players[0]?.name) {
        name = row.players[0].name;
      }
    }

    return {
      playerName: name,
      planetId: row.planet_id as import("../types/planet.types").PlanetId,
      score: row.score,
      completionTime: Math.round(row.completion_time ?? 0),
      timestamp: row.created_at
        ? new Date(row.created_at).getTime()
        : Date.now(),
    };
  });

  // Deduplicate by playerName (keep highest score, fastest time)
  const uniqueByPlayer = new Map<
    string,
    import("../types/game.types").PlanetLeaderboardEntry
  >();

  for (const item of mapped) {
    const existing = uniqueByPlayer.get(item.playerName);
    if (
      !existing ||
      item.score > existing.score ||
      (item.score === existing.score &&
        item.completionTime < existing.completionTime)
    ) {
      uniqueByPlayer.set(item.playerName, item);
    }
  }

  return [...uniqueByPlayer.values()].sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : a.completionTime - b.completionTime
  );
}
