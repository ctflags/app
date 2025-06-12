const express = require('express');
const router = express.Router();

// Import route modules
const challengeRoutes = require('./challenges');
const participantRoutes = require('./participants');
const submissionRoutes = require('./submissions');
const hintViewRoutes = require('./hint-views');
const organizerRoutes = require('./organizer');

// Mount route modules
router.use('/challenges', challengeRoutes);
router.use('/participants', participantRoutes);
router.use('/submissions', submissionRoutes);
router.use('/hint-views', hintViewRoutes);
router.use('/organizer', organizerRoutes);

// Legacy submission endpoint for backward compatibility
router.post('/submit', (req, res, next) => {
  // Redirect to new submission endpoint
  req.url = '/submissions/submit';
  submissionRoutes(req, res, next);
});

// Legacy hint-viewed endpoint for backward compatibility
router.post('/hint-viewed', (req, res, next) => {
  // Redirect to new hint-views endpoint
  req.url = '/hint-views/viewed';
  hintViewRoutes(req, res, next);
});

module.exports = router;