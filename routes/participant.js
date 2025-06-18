const express = require('express');
const { getParticipantByToken } = require('../database/participants');
const { getChallengeById, getChallengesWithSolutions } = require('../database/challenges');
const { getExistingSolve, createSubmission } = require('../database/submissions');
const { recordHintView } = require('../database/hint_views');

const router = express.Router();

// Participant token handler
router.get('/p', (req, res) => {
  const token = req.query.token;
  
  if (token) {
    // If token provided, redirect to participant page
    return res.redirect(`/p/${token}`);
  }
  
  // No token provided, redirect to main page
  res.redirect('/');
});

// Participant dashboard
router.get('/p/:token', async (req, res) => {
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

// Backward compatibility redirects
router.get('/participant', (req, res) => {
  const token = req.query.token;
  if (token) {
    return res.redirect(`/p/${token}`);
  }
  return res.redirect('/p');
});

router.get('/participant/:token', (req, res) => {
  return res.redirect(`/p/${req.params.token}`);
});

// API endpoint for flag submission
router.post('/api/submit', async (req, res) => {
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

// API endpoint for recording hint views
router.post('/api/hint-viewed', async (req, res) => {
  const { token, challengeId } = req.body;

  if (!token || !challengeId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Verify participant exists
    const participant = await getParticipantByToken(token);
    if (!participant) {
      return res.status(400).json({ error: 'Invalid participant token' });
    }

    // Verify challenge exists
    const challenge = await getChallengeById(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: 'Invalid challenge' });
    }

    // Record hint view (will not duplicate due to unique constraint)
    const result = await recordHintView(token, challengeId);
    
    res.json({ 
      success: true, 
      message: result ? 'Hint view recorded' : 'Hint view already recorded'
    });
  } catch (error) {
    console.error('Hint view recording error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;