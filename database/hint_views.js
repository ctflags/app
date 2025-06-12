const { getDatabase } = require('./index');

// Record a hint view (with ON CONFLICT to prevent duplicates)
async function recordHintView(participantToken, challengeId) {
  const pool = getDatabase();
  const result = await pool.query(
    'INSERT INTO hint_views (participant_token, challenge_id) VALUES ($1, $2) ON CONFLICT (participant_token, challenge_id) DO NOTHING RETURNING id',
    [participantToken, challengeId]
  );
  return result.rows[0] || null;
}

// Check if participant has viewed hint for a challenge
async function hasViewedHint(participantToken, challengeId) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT id FROM hint_views WHERE participant_token = $1 AND challenge_id = $2',
    [participantToken, challengeId]
  );
  return result.rows.length > 0;
}

// Get all hint views for a participant
async function getParticipantHintViews(participantToken) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT challenge_id, viewed_at FROM hint_views WHERE participant_token = $1',
    [participantToken]
  );
  return result.rows;
}

// Get hint view statistics for a challenge
async function getChallengeHintStats(challengeId) {
  const pool = getDatabase();
  const result = await pool.query(
    'SELECT COUNT(*) as hint_views FROM hint_views WHERE challenge_id = $1',
    [challengeId]
  );
  return parseInt(result.rows[0].hint_views);
}

// Get all hint views (for admin)
async function getAllHintViews() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      h.id,
      h.participant_token,
      h.challenge_id,
      h.viewed_at,
      p.name as participant_name,
      c.name as challenge_name
    FROM hint_views h
    JOIN participants p ON h.participant_token = p.token
    JOIN challenges c ON h.challenge_id = c.id
    ORDER BY h.viewed_at DESC
  `);
  return result.rows;
}

module.exports = {
  recordHintView,
  hasViewedHint,
  getParticipantHintViews,
  getChallengeHintStats,
  getAllHintViews
};