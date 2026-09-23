

CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  school TEXT DEFAULT '',
  major TEXT DEFAULT '' CHECK (major IN ('IPA', 'IPS', '')),
  character_type TEXT DEFAULT 'pink' CHECK (character_type IN ('pink', 'white')),
  spaceman_color TEXT DEFAULT 'original',
  spaceman_hat TEXT DEFAULT 'none',
  spaceman_pet TEXT DEFAULT 'none',
  device_id TEXT DEFAULT '',
  intro_completed BOOLEAN DEFAULT FALSE,
  game_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure device_id exists on existing databases
ALTER TABLE players ADD COLUMN IF NOT EXISTS device_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_players_device_id ON players(device_id);

CREATE TABLE planet_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  planet_id INT NOT NULL CHECK (planet_id BETWEEN 1 AND 6),
  stage_id INT NOT NULL CHECK (stage_id BETWEEN 1 AND 6),
  score INT NOT NULL DEFAULT 0,
  completion_time FLOAT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, planet_id, stage_id)
);

CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  player_name TEXT NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  major TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boss_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  global_hp INT NOT NULL DEFAULT 10000,
  max_hp INT NOT NULL DEFAULT 10000,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO boss_state (global_hp, max_hp) VALUES (10000, 10000);

CREATE TABLE boss_damage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  damage INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  p2_name TEXT DEFAULT '',
  p2_phone TEXT DEFAULT '',
  stage_progress JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_planet_scores_player ON planet_scores(player_id);
CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX idx_boss_damage_log_time ON boss_damage_log(created_at DESC);
CREATE INDEX idx_game_sessions_player ON game_sessions(player_id);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_damage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);
CREATE POLICY "public_insert_players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_players" ON players FOR UPDATE USING (true);
CREATE POLICY "public_delete_players" ON players FOR DELETE USING (true);

CREATE POLICY "public_read_scores" ON planet_scores FOR SELECT USING (true);
CREATE POLICY "public_insert_scores" ON planet_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_scores" ON planet_scores FOR UPDATE USING (true);
CREATE POLICY "public_delete_scores" ON planet_scores FOR DELETE USING (true);

CREATE POLICY "public_read_leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "public_insert_leaderboard" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_leaderboard" ON leaderboard FOR UPDATE USING (true);
CREATE POLICY "public_delete_leaderboard" ON leaderboard FOR DELETE USING (true);

CREATE POLICY "public_read_boss" ON boss_state FOR SELECT USING (true);
CREATE POLICY "public_update_boss" ON boss_state FOR UPDATE USING (true);

CREATE POLICY "public_read_boss_log" ON boss_damage_log FOR SELECT USING (true);
CREATE POLICY "public_insert_boss_log" ON boss_damage_log FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "public_insert_sessions" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON game_sessions FOR UPDATE USING (true);
CREATE POLICY "public_delete_sessions" ON game_sessions FOR DELETE USING (true);

-- Enable Realtime for live cross-device leaderboard updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE planet_scores;
  ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE VIEW export_all_players AS
SELECT
  p.name,
  p.phone,
  p.school,
  p.major,
  p.character_type,
  p.spaceman_color,
  p.spaceman_hat,
  p.spaceman_pet,
  p.game_completed,
  p.created_at AS registered_at,
  COALESCE(l.total_score, 0) AS total_score,
  l.updated_at AS last_score_update,
  (SELECT COUNT(*) FROM planet_scores ps
   WHERE ps.player_id = p.id AND ps.completed = true) AS stages_completed
FROM players p
LEFT JOIN leaderboard l ON l.player_id = p.id
ORDER BY COALESCE(l.total_score, 0) DESC;

CREATE VIEW export_by_major AS
SELECT
  p.major,
  COUNT(*) AS total_players,
  COUNT(*) FILTER (WHERE p.game_completed = true) AS completed_game,
  ROUND(AVG(COALESCE(l.total_score, 0)), 0) AS avg_score,
  MAX(COALESCE(l.total_score, 0)) AS max_score
FROM players p
LEFT JOIN leaderboard l ON l.player_id = p.id
WHERE p.major != ''
GROUP BY p.major;

CREATE VIEW export_planet_scores AS
SELECT
  p.name AS player_name,
  p.school,
  p.major,
  ps.planet_id,
  ps.stage_id,
  ps.score,
  ps.completion_time,
  ps.completed,
  ps.created_at
FROM planet_scores ps
JOIN players p ON p.id = ps.player_id
ORDER BY p.name, ps.planet_id, ps.stage_id;

-- =========================================================================
-- MIGRATION: CADET SPECIALIZATION & TELEMETRY FOR MARKETING / ADVISORY
-- =========================================================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS specialization_result JSONB DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS recommended_track TEXT DEFAULT '';
ALTER TABLE players ADD COLUMN IF NOT EXISTS primary_archetype TEXT DEFAULT '';
ALTER TABLE players ADD COLUMN IF NOT EXISTS secondary_archetype TEXT DEFAULT '';
ALTER TABLE players ADD COLUMN IF NOT EXISTS system_score INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ai_score INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS cyber_score INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS creative_score INT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS confidence_level INT DEFAULT 0;

-- Update export_all_players to provide actionable advisory columns for Excel export
CREATE OR REPLACE VIEW export_all_players AS
SELECT
  p.name,
  p.phone,
  p.school,
  p.major,
  p.recommended_track,
  p.primary_archetype,
  p.secondary_archetype,
  p.system_score,
  p.ai_score,
  p.cyber_score,
  p.creative_score,
  p.confidence_level,
  p.character_type,
  p.spaceman_color,
  p.spaceman_hat,
  p.spaceman_pet,
  p.game_completed,
  p.created_at AS registered_at,
  COALESCE(l.total_score, 0) AS total_score,
  l.updated_at AS last_score_update,
  (SELECT COUNT(*) FROM planet_scores ps
   WHERE ps.player_id = p.id AND ps.completed = true) AS stages_completed
FROM players p
LEFT JOIN leaderboard l ON l.player_id = p.id
ORDER BY COALESCE(l.total_score, 0) DESC;

