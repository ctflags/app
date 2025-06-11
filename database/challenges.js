const { getDatabase } = require('./index');

// Get all challenges
function getAllChallenges() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all('SELECT * FROM challenges ORDER BY id', (err, challenges) => {
      if (err) {
        reject(err);
      } else {
        resolve(challenges);
      }
    });
  });
}

// Get challenges with participant's solution status
function getChallengesWithSolutions(participantToken) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(`SELECT c.*, 
              CASE WHEN s.is_correct = 1 THEN 1 ELSE 0 END as solved
            FROM challenges c
            LEFT JOIN (
              SELECT challenge_id, MAX(is_correct) as is_correct
              FROM submissions 
              WHERE participant_token = ? 
              GROUP BY challenge_id
            ) s ON c.id = s.challenge_id
            ORDER BY c.id`, [participantToken], (err, challenges) => {
      if (err) {
        reject(err);
      } else {
        resolve(challenges);
      }
    });
  });
}

// Get challenge by ID
function getChallengeById(challengeId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get('SELECT * FROM challenges WHERE id = ?', [challengeId], (err, challenge) => {
      if (err) {
        reject(err);
      } else {
        resolve(challenge);
      }
    });
  });
}

// Create a new challenge
function createChallenge(name, description, flag, points = 100, hint = '') {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('INSERT INTO challenges (name, description, flag, points, hint) VALUES (?, ?, ?, ?, ?)',
      [name, description, flag, points, hint], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, name, description, flag, points, hint });
      }
    });
  });
}

// Update an existing challenge
function updateChallenge(id, name, description, flag, points, hint = '') {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('UPDATE challenges SET name = ?, description = ?, flag = ?, points = ?, hint = ? WHERE id = ?',
      [name, description, flag, points, hint, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, name, description, flag, points, hint, changes: this.changes });
      }
    });
  });
}

// Delete a challenge
function deleteChallenge(id) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    // First delete related submissions
    db.run('DELETE FROM submissions WHERE challenge_id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        // Then delete the challenge
        db.run('DELETE FROM challenges WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, changes: this.changes });
          }
        });
      }
    });
  });
}

module.exports = {
  getAllChallenges,
  getChallengesWithSolutions,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge
};