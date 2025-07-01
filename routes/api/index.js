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

// Participant file access endpoint (public access to shared files)
const fs = require('fs').promises;
const path = require('path');
const { HTTP_STATUS } = require('../../constants');
const { asyncHandler } = require('../../utils/errors');

router.get('/participant/files', asyncHandler(async (req, res) => {
  try {
    const files = await fs.readdir('/tmp/shared');
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
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

router.get('/participant/files/:filename/download', asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('/tmp/shared', filename);

  try {
    await fs.access(filePath);
    res.download(filePath, filename);
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
  }
}));

module.exports = router;