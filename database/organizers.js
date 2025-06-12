const { getDatabase } = require('./index');

// Get organizer by token
async function getOrganizerByToken(token) {
  const pool = getDatabase();
  const result = await pool.query('SELECT * FROM organizers WHERE token = $1', [token]);
  return result.rows[0] || null;
}

// Validate organizer token
async function validateOrganizerToken(token) {
  const pool = getDatabase();
  const result = await pool.query('SELECT token, name FROM organizers WHERE token = $1', [token]);
  return result.rows[0] || null;
}

module.exports = {
  getOrganizerByToken,
  validateOrganizerToken
};