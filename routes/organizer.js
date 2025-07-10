const express = require('express');
const { requireOrganizerAuth } = require('../middleware/auth');
const { 
  getParticipantsWithProgress, 
  getParticipantProgress, 
  getAllParticipants 
} = require('../database/participants');
const { getAllChallenges } = require('../database/challenges');
const { getAllSubmissions, getSubmissionStats } = require('../database/submissions');
const { validateOrganizerToken } = require('../database/organizers');
const { 
  getHintViewStats, 
  getChallengeHintAnalytics, 
  getParticipantHintAnalytics, 
  getDetailedHintViews 
} = require('../database/hint_views');

const router = express.Router();

// Organizer dashboard handler
router.get('/organizer', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, show login page
  if (!token) {
    return res.render('organizer-login');
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show dashboard
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
    console.error('Organizer dashboard error:', error);
    res.status(500).send('Database error');
  }
});

// Admin panel page
router.get('/organizer/admin', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, render page with authentication check (will redirect via JS)
  if (!token) {
    return res.render('admin-panel', {
      participants: [],
      challenges: [],
      token: null,
      needsAuth: true
    });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show admin panel
    const participants = await getParticipantsWithProgress();
    const challenges = await getAllChallenges();
    
    res.render('admin-panel', {
      participants: participants,
      challenges: challenges,
      token: organizer.token,
      needsAuth: false
    });
  } catch (error) {
    console.error('Admin panel error:', error);
    res.status(500).send('Database error');
  }
});

// Challenge management page
router.get('/organizer/challenges', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, render page with authentication check (will redirect via JS)
  if (!token) {
    return res.render('challenge-management', {
      challenges: [],
      token: null,
      needsAuth: true
    });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show management page
    const challenges = await getAllChallenges();
    res.render('challenge-management', {
      challenges: challenges,
      token: organizer.token,
      needsAuth: false
    });
  } catch (error) {
    console.error('Challenge management error:', error);
    res.status(500).send('Database error');
  }
});

// Participant management page
router.get('/organizer/participants', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, render page with authentication check (will redirect via JS)
  if (!token) {
    return res.render('participant-management', {
      participants: [],
      token: null,
      needsAuth: true
    });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show management page
    const participants = await getParticipantsWithProgress();
    res.render('participant-management', {
      participants: participants,
      token: organizer.token,
      needsAuth: false
    });
  } catch (error) {
    console.error('Participant management error:', error);
    res.status(500).send('Database error');
  }
});

// Submission management page
router.get('/organizer/submissions', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, render page with authentication check (will redirect via JS)
  if (!token) {
    return res.render('submission-management', {
      submissions: [],
      participants: [],
      challenges: [],
      stats: {},
      token: null,
      needsAuth: true
    });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show management page
    const submissions = await getAllSubmissions();
    const participants = await getAllParticipants();
    const challenges = await getAllChallenges();
    const stats = await getSubmissionStats();
    
    res.render('submission-management', {
      submissions: submissions,
      participants: participants,
      challenges: challenges,
      stats: stats,
      token: organizer.token,
      needsAuth: false
    });
  } catch (error) {
    console.error('Submission management error:', error);
    res.status(500).send('Database error');
  }
});

// Hint view management page
router.get('/organizer/hints', async (req, res) => {
  const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
  
  // If no token, render page with authentication check (will redirect via JS)
  if (!token) {
    return res.render('hint-management', {
      stats: {},
      challengeStats: [],
      participantStats: [],
      hintViews: [],
      token: null,
      needsAuth: true
    });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);
    
    if (!organizer) {
      return res.status(403).render('access-denied');
    }

    // Token is valid, show management page
    const stats = await getHintViewStats();
    const challengeStats = await getChallengeHintAnalytics();
    const participantStats = await getParticipantHintAnalytics();
    const hintViews = await getDetailedHintViews();
    
    res.render('hint-management', {
      stats: stats,
      challengeStats: challengeStats,
      participantStats: participantStats,
      hintViews: hintViews,
      token: organizer.token,
      needsAuth: false
    });
  } catch (error) {
    console.error('Hint management error:', error);
    res.status(500).send('Database error');
  }
});

// Organizer login endpoint for JSON token submission
router.post('/organizer/login', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);

    if (!organizer) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    res.json({ 
      success: true, 
      token: organizer.token,
      organizer: { token: organizer.token, name: organizer.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API endpoint for dashboard data refresh
router.get('/api/organizer/dashboard', async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const { getOrganizerByToken } = require('../database/organizers');
    const organizer = await getOrganizerByToken(token);

    if (!organizer) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Get fresh dashboard data
    const participants = await getParticipantsWithProgress();
    const challenges = await getAllChallenges();
    const progressMatrix = await getParticipantProgress();

    res.json({
      participants: participants,
      challenges: challenges,
      progressMatrix: progressMatrix
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API endpoint for organizer token validation
router.post('/api/organizer/validate', async (req, res) => {
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

module.exports = router;