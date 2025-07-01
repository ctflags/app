const { getDatabase } = require('./index');

// Get participant by token
async function getParticipantByToken(token) {
  const pool = getDatabase();
  const result = await pool.query('SELECT * FROM participants WHERE token = $1', [token]);
  return result.rows[0] || null;
}

// Get all participants with their progress
async function getParticipantsWithProgress() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      p.id,
      p.token,
      p.name,
      p.created_at,
      COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solved_challenges,
      COALESCE(SUM(CASE WHEN s.is_correct = true THEN c.points ELSE 0 END) - SUM(CASE WHEN hv.id IS NOT NULL AND s.is_correct = true THEN 10 ELSE 0 END), 0)::INTEGER as total_points,
      MAX(s.submitted_at) as last_submission
    FROM participants p
    LEFT JOIN submissions s ON p.id = s.participant_id
    LEFT JOIN challenges c ON s.challenge_id = c.id
    LEFT JOIN hint_views hv ON p.id = hv.participant_id AND c.id = hv.challenge_id
    GROUP BY p.id, p.token, p.name, p.created_at
    ORDER BY total_points DESC, last_submission ASC
  `);
  return result.rows;
}

// Get participant progress matrix with hint data
async function getParticipantProgress() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      p.token,
      c.id as challenge_id,
      MAX(CASE WHEN s.is_correct = true THEN 1 ELSE 0 END) as solved,
      MAX(CASE WHEN h.id IS NOT NULL THEN 1 ELSE 0 END) as hint_viewed
    FROM participants p
    CROSS JOIN challenges c
    LEFT JOIN submissions s ON p.id = s.participant_id AND c.id = s.challenge_id
    LEFT JOIN hint_views h ON p.id = h.participant_id AND c.id = h.challenge_id
    GROUP BY p.token, c.id
  `);
  
  // Build progress matrix
  const progressMatrix = {};
  result.rows.forEach(p => {
    if (!progressMatrix[p.token]) progressMatrix[p.token] = {};
    progressMatrix[p.token][p.challenge_id] = {
      solved: p.solved === 1,
      hint_viewed: p.hint_viewed === 1
    };
  });
  
  return progressMatrix;
}

// Get all participants
async function getAllParticipants() {
  const pool = getDatabase();
  const result = await pool.query('SELECT * FROM participants ORDER BY created_at DESC');
  return result.rows;
}

// Create a new participant
async function createParticipant(token, name) {
  const pool = getDatabase();
  await pool.query('INSERT INTO participants (token, name) VALUES ($1, $2)', [token, name]);
  return { token, name };
}

// Update an existing participant
async function updateParticipant(originalToken, updates) {
  const pool = getDatabase();
  const { token, name } = updates;
  
  // If token is being changed, update both token and name
  if (token && token !== originalToken) {
    const result = await pool.query(
      'UPDATE participants SET token = $1, name = $2 WHERE token = $3',
      [token, name, originalToken]
    );
    return { token, name, changes: result.rowCount };
  } else {
    // Only update name if token hasn't changed
    const result = await pool.query(
      'UPDATE participants SET name = $1 WHERE token = $2',
      [name, originalToken]
    );
    return { token: originalToken, name, changes: result.rowCount };
  }
}

// Delete a participant
async function deleteParticipant(token) {
  const pool = getDatabase();
  
  // Get participant ID first
  const participant = await pool.query('SELECT id FROM participants WHERE token = $1', [token]);
  if (participant.rows.length === 0) {
    return { token, changes: 0 };
  }
  const participantId = participant.rows[0].id;
  
  // First delete related submissions and hint views
  await pool.query('DELETE FROM submissions WHERE participant_id = $1', [participantId]);
  await pool.query('DELETE FROM hint_views WHERE participant_id = $1', [participantId]);
  
  // Then delete the participant
  const result = await pool.query('DELETE FROM participants WHERE token = $1', [token]);
  return { token, changes: result.rowCount };
}

module.exports = {
  getParticipantByToken,
  getParticipantsWithProgress,
  getParticipantProgress,
  getAllParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant
};