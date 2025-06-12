const { getDatabase } = require('./index');

// Get all challenges
async function getAllChallenges() {
  const pool = getDatabase();
  const result = await pool.query('SELECT * FROM challenges ORDER BY id');
  return result.rows;
}

// Get challenges with participant's solution status
async function getChallengesWithSolutions(participantToken) {
  const pool = getDatabase();
  const result = await pool.query(`
    SELECT c.*, 
           CASE WHEN s.is_correct = 1 THEN true ELSE false END as solved
    FROM challenges c
    LEFT JOIN (
      SELECT challenge_id, MAX(CASE WHEN is_correct = true THEN 1 ELSE 0 END) as is_correct
      FROM submissions 
      WHERE participant_token = $1 
      GROUP BY challenge_id
    ) s ON c.id = s.challenge_id
    ORDER BY c.id
  `, [participantToken]);
  return result.rows;
}

// Get challenge by ID
async function getChallengeById(challengeId) {
  const pool = getDatabase();
  const result = await pool.query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
  return result.rows[0] || null;
}

// Create a new challenge
async function createChallenge(name, description, flag, points = 100, hint = '') {
  const pool = getDatabase();
  const result = await pool.query(
    'INSERT INTO challenges (name, description, flag, points, hint) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, description, flag, points, hint]
  );
  return result.rows[0];
}

// Update an existing challenge
async function updateChallenge(id, name, description, flag, points, hint = '') {
  const pool = getDatabase();
  const result = await pool.query(
    'UPDATE challenges SET name = $1, description = $2, flag = $3, points = $4, hint = $5 WHERE id = $6 RETURNING *',
    [name, description, flag, points, hint, id]
  );
  return { ...result.rows[0], changes: result.rowCount };
}

// Delete a challenge
async function deleteChallenge(id) {
  const pool = getDatabase();
  
  // First delete related submissions
  await pool.query('DELETE FROM submissions WHERE challenge_id = $1', [id]);
  
  // Then delete the challenge
  const result = await pool.query('DELETE FROM challenges WHERE id = $1', [id]);
  return { id, changes: result.rowCount };
}

module.exports = {
  getAllChallenges,
  getChallengesWithSolutions,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge
};