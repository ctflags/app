const express = require('express');
const path = require('path');

// Database modules
const { initDatabase } = require('./database');
const { getParticipantByToken, getParticipantsWithProgress, getParticipantProgress, getAllParticipants, createParticipant, updateParticipant, deleteParticipant } = require('./database/participants');
const { getAllChallenges, getChallengesWithSolutions, getChallengeById, createChallenge, updateChallenge, deleteChallenge } = require('./database/challenges');
const { getExistingSolve, createSubmission, getAllSubmissions, getSubmissionById, updateSubmission, deleteSubmission, createSubmissionAdmin, getSubmissionStats } = require('./database/submissions');
const { getOrganizerByToken, validateOrganizerToken } = require('./database/organizers');

const app = express();
const PORT = process.env.PORT || 3000;


// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize database
initDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

// Middleware to check organizer token
async function requireOrganizerAuth(req, res, next) {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).render('organizer-login');
  }

  try {
    const organizer = await getOrganizerByToken(token);
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    req.organizer = organizer;
    next();
  } catch (error) {
    return res.status(403).render('access-denied');
  }
}

// Routes

// Participant login page
app.get('/participant', (req, res) => {
  const token = req.query.token;
  
  if (token) {
    // If token provided, redirect to participant page
    return res.redirect(`/participant/${token}`);
  }
  
  // Show login form
  res.render('participant-login');
});

// Participant page
app.get('/participant/:token', async (req, res) => {
  const token = req.params.token;
  
  try {
    const participant = await getParticipantByToken(token);
    
    if (!participant) {
      return res.status(404).render('participant-access-denied');
    }

    const challenges = await getChallengesWithSolutions(token);

    res.render('participant-dashboard', {
      participant: participant,
      token: token,
      challenges: challenges
    });
  } catch (error) {
    console.error('Participant dashboard error:', error);
    res.status(500).send('Database error');
  }
});

// Organizer dashboard (now protected)
app.get('/organizer', requireOrganizerAuth, async (req, res) => {
  const organizer = req.organizer;
  
  try {
    const participants = await getParticipantsWithProgress();
    const challenges = await getAllChallenges();
    const progressMatrix = await getParticipantProgress();

    res.render('organizer-dashboard', {
      organizer: organizer,
      participants: participants,
      challenges: challenges,
      progressMatrix: progressMatrix
    });
  } catch (error) {
    res.status(500).send('Database error');
  }
});

// Challenge management page (protected)
app.get('/organizer/challenges', requireOrganizerAuth, async (req, res) => {
  try {
    const challenges = await getAllChallenges();
    res.render('challenge-management', {
      challenges: challenges,
      token: req.organizer.token
    });
  } catch (error) {
    res.status(500).send('Database error');
  }
});

// Participant management page (protected)
app.get('/organizer/participants', requireOrganizerAuth, async (req, res) => {
  try {
    const participants = await getParticipantsWithProgress();
    res.render('participant-management', {
      participants: participants,
      token: req.organizer.token
    });
  } catch (error) {
    res.status(500).send('Database error');
  }
});

// Submission management page (protected)
app.get('/organizer/submissions', requireOrganizerAuth, async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    const participants = await getAllParticipants();
    const challenges = await getAllChallenges();
    const stats = await getSubmissionStats();
    
    res.render('submission-management', {
      submissions: submissions,
      participants: participants,
      challenges: challenges,
      stats: stats,
      token: req.organizer.token
    });
  } catch (error) {
    res.status(500).send('Database error');
  }
});

// API endpoint for flag submission
app.post('/api/submit', async (req, res) => {
  const { token, challengeId, flag } = req.body;

  if (!token || !challengeId || !flag) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify participant exists
    const participant = await getParticipantByToken(token);
    if (!participant) {
      return res.status(400).json({ error: 'Invalid participant token' });
    }

    // Get challenge and check flag
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge' });
    }

    // Check if already solved
    const existingSolve = await getExistingSolve(token, challengeId);
    if (existingSolve) {
      return res.json({ correct: true, message: 'Already solved' });
    }

    // Normalize flags for comparison (trim whitespace, case-insensitive)
    const submittedFlag = flag.trim();
    const correctFlag = challenge.flag.trim();
    const isCorrect = submittedFlag.toLowerCase() === correctFlag.toLowerCase();

    // Record submission
    await createSubmission(token, challengeId, submittedFlag, isCorrect);

    res.json({ 
      correct: isCorrect,
      message: isCorrect ? 'Correct flag!' : 'Incorrect flag'
    });
  } catch (error) {
    console.error('Flag submission error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API endpoint for organizer token validation
app.post('/api/organizer/validate', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const organizer = await validateOrganizerToken(token);

    if (!organizer) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    res.json({ 
      valid: true, 
      organizer: { token: organizer.token, name: organizer.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// API endpoints for challenge management

// Create new challenge
app.post('/api/challenges', requireOrganizerAuth, async (req, res) => {
  const { name, description, flag, points, hint } = req.body;

  if (!name || !description || !flag || !points) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const challenge = await createChallenge(name, description, flag, parseInt(points), hint || '');
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Update existing challenge
app.put('/api/challenges/:id', requireOrganizerAuth, async (req, res) => {
  const challengeId = req.params.id;
  const { name, description, flag, points, hint } = req.body;

  if (!name || !description || !flag || !points) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await updateChallenge(challengeId, name, description, flag, parseInt(points), hint || '');
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json({ success: true, challenge: result });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Delete challenge
app.delete('/api/challenges/:id', requireOrganizerAuth, async (req, res) => {
  const challengeId = req.params.id;

  try {
    const result = await deleteChallenge(challengeId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json({ success: true, message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// API endpoints for participant management

// Create new participant
app.post('/api/participants', requireOrganizerAuth, async (req, res) => {
  const { token, name } = req.body;

  if (!token || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const participant = await createParticipant(token, name);
    res.json({ success: true, participant });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      res.status(400).json({ error: 'Participant token already exists' });
    } else {
      res.status(500).json({ error: 'Database error', message: error.message });
    }
  }
});

// Update existing participant
app.put('/api/participants/:token', requireOrganizerAuth, async (req, res) => {
  const participantToken = req.params.token;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await updateParticipant(participantToken, name);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json({ success: true, participant: result });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Delete participant
app.delete('/api/participants/:token', requireOrganizerAuth, async (req, res) => {
  const participantToken = req.params.token;

  try {
    const result = await deleteParticipant(participantToken);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json({ success: true, message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// API endpoints for submission management

// Create new submission (admin)
app.post('/api/submissions', requireOrganizerAuth, async (req, res) => {
  const { participantToken, challengeId, submittedFlag, isCorrect } = req.body;

  if (!participantToken || !challengeId || !submittedFlag || isCorrect === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify participant exists
    const participant = await getParticipantByToken(participantToken);
    if (!participant) {
      return res.status(400).json({ error: 'Invalid participant token' });
    }

    // Verify challenge exists
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge ID' });
    }

    const submission = await createSubmissionAdmin(participantToken, challengeId, submittedFlag, isCorrect);
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Update existing submission
app.put('/api/submissions/:id', requireOrganizerAuth, async (req, res) => {
  const submissionId = req.params.id;
  const { submittedFlag, isCorrect } = req.body;

  if (!submittedFlag || isCorrect === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await updateSubmission(submissionId, submittedFlag, isCorrect);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ success: true, submission: result });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Delete submission
app.delete('/api/submissions/:id', requireOrganizerAuth, async (req, res) => {
  const submissionId = req.params.id;

  try {
    const result = await deleteSubmission(submissionId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root redirect
app.get('/', (req, res) => {
  res.render('index');
});

app.listen(PORT, () => {
  console.log(`CTF application running on port ${PORT}`);
});

module.exports = app;