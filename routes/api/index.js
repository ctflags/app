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

// Participant file access endpoint with name-based filtering
const fs = require('fs').promises;
const path = require('path');
const { HTTP_STATUS } = require('../../constants');
const { asyncHandler } = require('../../utils/errors');
const { requireParticipantAuth } = require('../../middleware/auth');

// Helper function to check if participant can access a file
function canParticipantAccessFile(participantName, filename) {
  const filenameLower = filename.toLowerCase();
  
  // Allow access to files that start with "common."
  if (filenameLower.startsWith('common.')) {
    return true;
  }
  
  // Extract potential player identifier from participant name
  // e.g., "Sample Player01" -> "player01", "player01" -> "player01"
  const playerMatch = participantName.toLowerCase().match(/player(\d+)/);
  if (playerMatch) {
    const playerId = `player${playerMatch[1]}`;
    return filenameLower.startsWith(playerId + '.');
  }
  
  // Fallback: allow access if filename starts with participant's name followed by a dot
  // e.g., "alice" can access "alice.config", "alice.yaml", etc.
  return filenameLower.startsWith(participantName.toLowerCase() + '.');
}

router.get('/participant/files', requireParticipantAuth, asyncHandler(async (req, res) => {
  try {
    const participantName = req.participant.name;
    const files = await fs.readdir('/tmp/shared');
    
    // Filter files based on participant name
    const accessibleFiles = files.filter(filename => 
      canParticipantAccessFile(participantName, filename)
    );
    
    const fileDetails = await Promise.all(
      accessibleFiles.map(async (filename) => {
        const filePath = path.join('/tmp/shared', filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          size: stats.size,
          uploadedAt: stats.mtime,
          downloadUrl: `/api/participant/files/${encodeURIComponent(filename)}/download`
        };
      })
    );

    res.json(fileDetails);
  } catch (error) {
    console.error('Error reading shared directory:', error);
    res.json([]);
  }
}));

router.get('/participant/files/:filename/download', requireParticipantAuth, asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const participantName = req.participant.name;
  const filePath = path.join('/tmp/shared', filename);

  // Check if participant can access this file
  if (!canParticipantAccessFile(participantName, filename)) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Access denied to this file' });
  }

  try {
    await fs.access(filePath);
    res.download(filePath, filename);
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
  }
}));

module.exports = router;