const { getDatabase } = require('./index');

// Record a hint view (with ON CONFLICT to prevent duplicates)
async function recordHintView(participantToken, challengeId) {
  const pool = getDatabase();
  
  // Get participant ID from token
  const participant = await pool.query('SELECT id FROM participants WHERE token = $1', [participantToken]);
  if (participant.rows.length === 0) {
    throw new Error('Participant not found');
  }
  const participantId = participant.rows[0].id;
  
  const result = await pool.query(
    'INSERT INTO hint_views (participant_id, challenge_id) VALUES ($1, $2) ON CONFLICT (participant_id, challenge_id) DO NOTHING RETURNING id',
    [participantId, challengeId]
  );
  return result.rows[0] || null;
}

// Check if participant has viewed hint for a challenge
async function hasViewedHint(participantToken, challengeId) {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT h.id FROM hint_views h
    JOIN participants p ON h.participant_id = p.id
    WHERE p.token = $1 AND h.challenge_id = $2
  `, [participantToken, challengeId]);
  return result.rows.length > 0;
}

// Get all hint views for a participant
async function getParticipantHintViews(participantToken) {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT h.challenge_id, h.viewed_at FROM hint_views h
    JOIN participants p ON h.participant_id = p.id
    WHERE p.token = $1
  `, [participantToken]);
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
      p.token as participant_token,
      h.challenge_id,
      h.viewed_at,
      p.name as participant_name,
      c.name as challenge_name
    FROM hint_views h
    JOIN participants p ON h.participant_id = p.id
    JOIN challenges c ON h.challenge_id = c.id
    ORDER BY h.viewed_at DESC
  `);
  return result.rows;
}

// Get comprehensive hint view statistics
async function getHintViewStats() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_hint_views,
      COUNT(DISTINCT h.participant_id) as unique_participants,
      COUNT(DISTINCT h.challenge_id) as challenges_with_hints,
      COALESCE(ROUND(AVG(hint_counts.hint_count), 2), 0) as avg_hints_per_participant,
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          COUNT(CASE WHEN s.is_correct = true THEN 1 END)::decimal / 
          COUNT(*)::decimal, 3
        )
      END as solve_rate_after_hint
    FROM hint_views h
    LEFT JOIN submissions s ON h.participant_id = s.participant_id AND h.challenge_id = s.challenge_id AND s.is_correct = true
    LEFT JOIN (
      SELECT participant_id, COUNT(*) as hint_count
      FROM hint_views
      GROUP BY participant_id
    ) hint_counts ON h.participant_id = hint_counts.participant_id
  `);
  return result.rows[0];
}

// Get hint usage statistics per challenge
async function getChallengeHintAnalytics() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      c.id as challenge_id,
      c.name as challenge_name,
      COUNT(h.id) as hint_count,
      COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solves_after_hint,
      ROUND(
        COALESCE(COUNT(CASE WHEN s.is_correct = true THEN 1 END)::decimal / NULLIF(COUNT(h.id), 0), 0), 3
      ) as solve_rate_after_hint
    FROM challenges c
    LEFT JOIN hint_views h ON c.id = h.challenge_id
    LEFT JOIN submissions s ON h.participant_id = s.participant_id AND h.challenge_id = s.challenge_id AND s.is_correct = true
    GROUP BY c.id, c.name
    ORDER BY hint_count DESC, c.name
  `);
  return result.rows;
}

// Get hint usage statistics per participant
async function getParticipantHintAnalytics() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      p.token as participant_token,
      p.name as participant_name,
      COUNT(h.id) as hint_count,
      COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solve_count
    FROM participants p
    LEFT JOIN hint_views h ON p.id = h.participant_id
    LEFT JOIN submissions s ON h.participant_id = s.participant_id AND h.challenge_id = s.challenge_id AND s.is_correct = true
    WHERE h.id IS NOT NULL
    GROUP BY p.id, p.token, p.name
    ORDER BY hint_count DESC, p.name
  `);
  return result.rows;
}

// Get detailed hint views with solve status
async function getDetailedHintViews() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      h.id,
      p.token as participant_token,
      h.challenge_id,
      h.viewed_at,
      p.name as participant_name,
      c.name as challenge_name,
      c.hint as hint_content,
      CASE WHEN s.is_correct = true THEN true ELSE false END as solved_after_hint
    FROM hint_views h
    JOIN participants p ON h.participant_id = p.id
    JOIN challenges c ON h.challenge_id = c.id
    LEFT JOIN submissions s ON h.participant_id = s.participant_id AND h.challenge_id = s.challenge_id AND s.is_correct = true
    ORDER BY h.viewed_at DESC
  `);
  return result.rows;
}

// Delete hint view by ID
async function deleteHintView(id) {
  const pool = getDatabase();
  const result = await pool.query('DELETE FROM hint_views WHERE id = $1', [id]);
  return { id, changes: result.rowCount };
}

// Bulk delete hint views
async function bulkDeleteHintViews(ids) {
  const pool = getDatabase();
  const result = await pool.query('DELETE FROM hint_views WHERE id = ANY($1)', [ids]);
  return { deletedCount: result.rowCount };
}

module.exports = {
  recordHintView,
  hasViewedHint,
  getParticipantHintViews,
  getChallengeHintStats,
  getAllHintViews,
  getHintViewStats,
  getChallengeHintAnalytics,
  getParticipantHintAnalytics,
  getDetailedHintViews,
  deleteHintView,
  bulkDeleteHintViews
};