
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS specialization_result JSONB DEFAULT NULL;

CREATE OR REPLACE VIEW export_specialization_summary AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.phone AS player_phone,
  p.school AS player_school,
  p.major AS high_school_major,
  COALESCE(p.specialization_result->>'primaryArchetype', 'GENERAL_EXPLORER') AS primary_archetype,
  COALESCE(p.specialization_result->>'secondaryArchetype', 'EXPLORER') AS secondary_archetype,
  COALESCE((p.specialization_result->>'confidenceLevel')::INT, 25) AS confidence_level_pct,
  COALESCE(p.specialization_result->>'milestoneReached', 'Onboarding') AS milestone_reached,
  COALESCE((p.specialization_result->'radarScores'->>'system')::INT, 40) AS score_system_architect,
  COALESCE((p.specialization_result->'radarScores'->>'aiLogic')::INT, 40) AS score_ai_logic,
  COALESCE((p.specialization_result->'radarScores'->>'debugging')::INT, 40) AS score_quality_cyber,
  COALESCE((p.specialization_result->'radarScores'->>'creative')::INT, 40) AS score_interactive_tech,
  COALESCE(l.total_score, 0) AS total_gameplay_score,
  (SELECT COUNT(*) FROM planet_scores ps WHERE ps.player_id = p.id AND ps.completed = true) AS stages_completed,
  p.game_completed,
  p.created_at AS registered_at,
  COALESCE((p.specialization_result->>'lastUpdated')::TIMESTAMPTZ, p.updated_at) AS assessment_last_updated
FROM players p
LEFT JOIN leaderboard l ON l.player_id = p.id
ORDER BY p.created_at DESC;

GRANT SELECT ON export_specialization_summary TO anon, authenticated, service_role;
