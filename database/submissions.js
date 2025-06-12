const { getDatabase } = require('./index');

// Check if participant already solved a challenge
async function getExistingSolve(participantToken, challengeId) {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT s.* FROM submissions s
    JOIN participants p ON s.participant_id = p.id
    WHERE p.token = $1 AND s.challenge_id = $2 AND s.is_correct = true
  `, [participantToken, challengeId]);
  return result.rows[0] || null;
}

// Create a new submission
async function createSubmission(participantToken, challengeId, submittedFlag, isCorrect) {
  const pool = getDatabase();
  
  // Get participant ID from token
  const participant = await pool.query('SELECT id FROM participants WHERE token = $1', [participantToken]);
  if (participant.rows.length === 0) {
    throw new Error('Participant not found');
  }
  const participantId = participant.rows[0].id;
  
  const result = await pool.query(
    'INSERT INTO submissions (participant_id, challenge_id, submitted_flag, is_correct) VALUES ($1, $2, $3, $4) RETURNING id',
    [participantId, challengeId, submittedFlag, isCorrect]
  );
  return { id: result.rows[0].id };
}

// Get all submissions with participant and challenge details
async function getAllSubmissions() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      s.id,
      p.token as participant_token,
      s.challenge_id,
      s.submitted_flag,
      s.is_correct,
      s.submitted_at,
      p.name as participant_name,
      c.name as challenge_name,
      c.flag as correct_flag,
      c.points
    FROM submissions s
    JOIN participants p ON s.participant_id = p.id
    JOIN challenges c ON s.challenge_id = c.id
    ORDER BY s.submitted_at DESC
  `);
  return result.rows;
}

// Get submission by ID
async function getSubmissionById(id) {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      s.*,
      p.token as participant_token,
      p.name as participant_name,
      c.name as challenge_name,
      c.flag as correct_flag,
      c.points
    FROM submissions s
    JOIN participants p ON s.participant_id = p.id
    JOIN challenges c ON s.challenge_id = c.id
    WHERE s.id = $1
  `, [id]);
  return result.rows[0] || null;
}

// Update submission (mainly to change correctness or flag)
async function updateSubmission(id, submittedFlag, isCorrect) {
  const pool = getDatabase();
  const result = await pool.query(
    'UPDATE submissions SET submitted_flag = $1, is_correct = $2 WHERE id = $3',
    [submittedFlag, isCorrect, id]
  );
  return { id, submittedFlag, isCorrect, changes: result.rowCount };
}

// Delete submission
async function deleteSubmission(id) {
  const pool = getDatabase();
  const result = await pool.query('DELETE FROM submissions WHERE id = $1', [id]);
  return { id, changes: result.rowCount };
}

// Create submission with all details (for admin creation)
async function createSubmissionAdmin(participantToken, challengeId, submittedFlag, isCorrect) {
  const pool = getDatabase();
  
  // Get participant ID from token
  const participant = await pool.query('SELECT id FROM participants WHERE token = $1', [participantToken]);
  if (participant.rows.length === 0) {
    throw new Error('Participant not found');
  }
  const participantId = participant.rows[0].id;
  
  const result = await pool.query(
    'INSERT INTO submissions (participant_id, challenge_id, submitted_flag, is_correct) VALUES ($1, $2, $3, $4) RETURNING id',
    [participantId, challengeId, submittedFlag, isCorrect]
  );
  return { 
    id: result.rows[0].id, 
    participantToken, 
    challengeId, 
    submittedFlag, 
    isCorrect 
  };
}

// Get submissions statistics
async function getSubmissionStats() {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_submissions,
      COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_submissions,
      COUNT(CASE WHEN is_correct = false THEN 1 END) as incorrect_submissions,
      COUNT(DISTINCT participant_id) as participants_with_submissions,
      COUNT(DISTINCT challenge_id) as challenges_with_submissions
    FROM submissions
  `);
  return result.rows[0];
}

module.exports = {
  getExistingSolve,
  createSubmission,
  getAllSubmissions,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  createSubmissionAdmin,
  getSubmissionStats
};