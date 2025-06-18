const express = require('express');
const participantRoutes = require('./participant');
const organizerRoutes = require('./organizer');
const apiRoutes = require('./api');

const router = express.Router();

// Mount participant routes
router.use('/', participantRoutes);

// Mount organizer routes
router.use('/', organizerRoutes);

// Mount API routes
router.use('/api', apiRoutes);

// Root route
router.get('/', (req, res) => {
  res.render('index');
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;