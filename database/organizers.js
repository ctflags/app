const { getDatabase } = require('./index');

// Get organizer by token
function getOrganizerByToken(token) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get('SELECT * FROM organizers WHERE token = ?', [token], (err, organizer) => {
      if (err) {
        reject(err);
      } else {
        resolve(organizer);
      }
    });
  });
}

// Validate organizer token (for API endpoint)
function validateOrganizerToken(token) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get('SELECT token, name FROM organizers WHERE token = ?', [token], (err, organizer) => {
      if (err) {
        reject(err);
      } else {
        resolve(organizer);
      }
    });
  });
}

module.exports = {
  getOrganizerByToken,
  validateOrganizerToken
};