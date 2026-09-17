
export interface Database {
  public: {
    Tables: {
      players: {
        Row: PlayerRow;
        Insert: PlayerInsert;
        Update: PlayerUpdate;
      };
      planet_scores: {
        Row: PlanetScoreRow;
        Insert: PlanetScoreInsert;
        Update: PlanetScoreUpdate;
      };
      leaderboard: {
        Row: LeaderboardRow;
        Insert: LeaderboardInsert;
        Update: LeaderboardUpdate;
      };
      boss_state: {
        Row: BossStateRow;
        Insert: never;
        Update: BossStateUpdate;
      };
      boss_damage_log: {
        Row: BossDamageLogRow;
        Insert: BossDamageLogInsert;
        Update: never;
      };
      game_sessions: {
        Row: GameSessionRow;
        Insert: GameSessionInsert;
        Update: GameSessionUpdate;
      };
    };
    Views: {
      export_all_players: { Row: ExportAllPlayersRow };
      export_by_major: { Row: ExportByMajorRow };
      export_planet_scores: { Row: ExportPlanetScoresRow };
    };
  };
}

export interface PlayerRow {
  id: string;
  name: string;
  phone: string;
  school: string;
  major: string;
  character_type: string;
  spaceman_color: string;
  spaceman_hat: string;
  spaceman_pet: string;
  intro_completed: boolean;
  game_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerInsert {
  id?: string;
  name: string;
  phone?: string;
  school?: string;
  major?: string;
  character_type?: string;
  spaceman_color?: string;
  spaceman_hat?: string;
  spaceman_pet?: string;
  intro_completed?: boolean;
  game_completed?: boolean;
}

export type PlayerUpdate = Partial<PlayerInsert>;

export interface PlanetScoreRow {
  id: string;
  player_id: string;
  planet_id: number;
  stage_id: number;
  score: number;
  completion_time: number;
  completed: boolean;
  created_at: string;
}

export interface PlanetScoreInsert {
  id?: string;
  player_id: string;
  planet_id: number;
  stage_id: number;
  score: number;
  completion_time?: number;
  completed?: boolean;
}

export type PlanetScoreUpdate = Partial<Omit<PlanetScoreInsert, "player_id">>;

export interface LeaderboardRow {
  id: string;
  player_id: string;
  player_name: string;
  total_score: number;
  major: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardInsert {
  id?: string;
  player_id: string;
  player_name: string;
  total_score: number;
  major?: string;
}

export type LeaderboardUpdate = Partial<
  Omit<LeaderboardInsert, "player_id">
>;

export interface BossStateRow {
  id: number;
  global_hp: number;
  max_hp: number;
  updated_at: string;
}

export interface BossStateUpdate {
  global_hp?: number;
  max_hp?: number;
}

export interface BossDamageLogRow {
  id: string;
  player_id: string | null;
  player_name: string;
  damage: number;
  created_at: string;
}

export interface BossDamageLogInsert {
  player_id?: string | null;
  player_name: string;
  damage: number;
}

export interface GameSessionRow {
  id: string;
  player_id: string;
  p2_name: string;
  p2_phone: string;
  stage_progress: Record<string, unknown>;
  started_at: string;
  ended_at: string | null;
}

export interface GameSessionInsert {
  player_id: string;
  p2_name?: string;
  p2_phone?: string;
  stage_progress?: Record<string, unknown>;
}

export type GameSessionUpdate = Partial<
  Omit<GameSessionInsert, "player_id">
> & {
  ended_at?: string;
};

export interface ExportAllPlayersRow {
  name: string;
  phone: string;
  school: string;
  major: string;
  character_type: string;
  spaceman_color: string;
  spaceman_hat: string;
  spaceman_pet: string;
  game_completed: boolean;
  registered_at: string;
  total_score: number;
  last_score_update: string | null;
  stages_completed: number;
}

export interface ExportByMajorRow {
  major: string;
  total_players: number;
  completed_game: number;
  avg_score: number;
  max_score: number;
}

export interface ExportPlanetScoresRow {
  player_name: string;
  school: string;
  major: string;
  planet_id: number;
  stage_id: number;
  score: number;
  completion_time: number;
  completed: boolean;
  created_at: string;
}
