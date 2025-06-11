const { getDatabase } = require('./index');

// Check if participant already solved a challenge
function getExistingSolve(participantToken, challengeId) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get('SELECT * FROM submissions WHERE participant_token = ? AND challenge_id = ? AND is_correct = 1', 
      [participantToken, challengeId], (err, submission) => {
      if (err) {
        reject(err);
      } else {
        resolve(submission);
      }
    });
  });
}

// Create a new submission
function createSubmission(participantToken, challengeId, submittedFlag, isCorrect) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('INSERT INTO submissions (participant_token, challenge_id, submitted_flag, is_correct) VALUES (?, ?, ?, ?)',
      [participantToken, challengeId, submittedFlag, isCorrect], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// Get all submissions with participant and challenge details
function getAllSubmissions() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(`SELECT 
              s.id,
              s.participant_token,
              s.challenge_id,
              s.submitted_flag,
              s.is_correct,
              s.submitted_at,
              p.name as participant_name,
              c.name as challenge_name,
              c.flag as correct_flag,
              c.points
            FROM submissions s
            JOIN participants p ON s.participant_token = p.token
            JOIN challenges c ON s.challenge_id = c.id
            ORDER BY s.submitted_at DESC`, (err, submissions) => {
      if (err) {
        reject(err);
      } else {
        resolve(submissions);
      }
    });
  });
}

// Get submission by ID
function getSubmissionById(id) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(`SELECT 
              s.*,
              p.name as participant_name,
              c.name as challenge_name,
              c.flag as correct_flag,
              c.points
            FROM submissions s
            JOIN participants p ON s.participant_token = p.token
            JOIN challenges c ON s.challenge_id = c.id
            WHERE s.id = ?`, [id], (err, submission) => {
      if (err) {
        reject(err);
      } else {
        resolve(submission);
      }
    });
  });
}

// Update submission (mainly to change correctness or flag)
function updateSubmission(id, submittedFlag, isCorrect) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('UPDATE submissions SET submitted_flag = ?, is_correct = ? WHERE id = ?',
      [submittedFlag, isCorrect, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, submittedFlag, isCorrect, changes: this.changes });
      }
    });
  });
}

// Delete submission
function deleteSubmission(id) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('DELETE FROM submissions WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, changes: this.changes });
      }
    });
  });
}

// Create submission with all details (for admin creation)
function createSubmissionAdmin(participantToken, challengeId, submittedFlag, isCorrect) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run('INSERT INTO submissions (participant_token, challenge_id, submitted_flag, is_correct) VALUES (?, ?, ?, ?)',
      [participantToken, challengeId, submittedFlag, isCorrect], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, participantToken, challengeId, submittedFlag, isCorrect });
      }
    });
  });
}

// Get submissions statistics
function getSubmissionStats() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(`SELECT 
              COUNT(*) as total_submissions,
              COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct_submissions,
              COUNT(CASE WHEN is_correct = 0 THEN 1 END) as incorrect_submissions,
              COUNT(DISTINCT participant_token) as participants_with_submissions,
              COUNT(DISTINCT challenge_id) as challenges_with_submissions
            FROM submissions`, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
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