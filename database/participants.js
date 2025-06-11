const { getDatabase } = require('./index');

// Get participant by token
function getParticipantByToken(token) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get('SELECT * FROM participants WHERE token = ?', [token], (err, participant) => {
      if (err) {
        reject(err);
      } else {
        resolve(participant);
      }
    });
  });
}

// Get all participants with their progress
function getParticipantsWithProgress() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(`SELECT 
              p.token,
              p.name,
              p.created_at,
              COUNT(CASE WHEN s.is_correct = 1 THEN 1 END) as solved_challenges,
              SUM(CASE WHEN s.is_correct = 1 THEN c.points ELSE 0 END) as total_points,
              MAX(s.submitted_at) as last_submission
            FROM participants p
            LEFT JOIN submissions s ON p.token = s.participant_token
            LEFT JOIN challenges c ON s.challenge_id = c.id
            GROUP BY p.token, p.name, p.created_at
            ORDER BY total_points DESC, last_submission ASC`, (err, participants) => {
      if (err) {
        reject(err);
      } else {
        resolve(participants);
      }
    });
  });
}

// Get participant progress matrix
function getParticipantProgress() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(`SELECT 
              p.token,
              c.id as challenge_id,
              MAX(s.is_correct) as solved
            FROM participants p
            CROSS JOIN challenges c
            LEFT JOIN submissions s ON p.token = s.participant_token AND c.id = s.challenge_id
            GROUP BY p.token, c.id`, (err, progress) => {
      if (err) {
        reject(err);
      } else {
        // Build progress matrix
        const progressMatrix = {};
        progress.forEach(p => {
          if (!progressMatrix[p.token]) progressMatrix[p.token] = {};
          progressMatrix[p.token][p.challenge_id] = p.solved === 1;
        });
        resolve(progressMatrix);
      }
    });
  });
}

// Get all participants
function getAllParticipants() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all('SELECT * FROM participants ORDER BY created_at DESC', (err, participants) => {
      if (err) {
        reject(err);
      } else {
        resolve(participants);
      }
    });
  });
}

// Create a new participant
function createParticipant(token, name) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('INSERT INTO participants (token, name) VALUES (?, ?)',
      [token, name], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ token, name });
      }
    });
  });
}

// Update an existing participant
function updateParticipant(token, name) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('UPDATE participants SET name = ? WHERE token = ?',
      [name, token], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ token, name, changes: this.changes });
      }
    });
  });
}

// Delete a participant
function deleteParticipant(token) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    // First delete related submissions
    db.run('DELETE FROM submissions WHERE participant_token = ?', [token], (err) => {
      if (err) {
        reject(err);
      } else {
        // Then delete the participant
        db.run('DELETE FROM participants WHERE token = ?', [token], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ token, changes: this.changes });
          }
        });
      }
    });
  });
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