const express = require('express');
const router = express.Router();
const multer = require('multer');
const yaml = require('js-yaml');
const ParticipantService = require('../../services/ParticipantService');
const { requireOrganizerAuth } = require('../../middleware/auth');
const { validateParticipant } = require('../../middleware/validation');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

// Configure multer for YAML file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 // 1MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept yaml, yml files and text files
    if (file.mimetype === 'text/plain' || 
        file.mimetype === 'application/x-yaml' ||
        file.originalname.match(/\.(yaml|yml)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only YAML files are allowed'), false);
    }
  }
});

// Get all participants (for organizer)
router.get('/', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const participants = await ParticipantService.getParticipantsWithProgress();
  res.json(createSuccessResponse(participants));
}));

// Create new participant
router.post('/', requireOrganizerAuth, validateParticipant, asyncHandler(async (req, res) => {
  const result = await ParticipantService.createParticipant(req.body);
  res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result.participant, result.message));
}));

// Update existing participant
router.put('/:token', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await ParticipantService.updateParticipant(req.params.token, req.body);
  res.json(createSuccessResponse(result.participant, result.message));
}));

// Delete participant
router.delete('/:token', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await ParticipantService.deleteParticipant(req.params.token);
  res.json(createSuccessResponse(null, result.message));
}));

// Get participant statistics
router.get('/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await ParticipantService.getParticipantStats();
  res.json(createSuccessResponse(stats));
}));

// Get leaderboard
router.get('/leaderboard', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = await ParticipantService.getLeaderboard(limit);
  res.json(createSuccessResponse(leaderboard));
}));

// Delete all participants
router.delete('/', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await ParticipantService.deleteAllParticipants();
  res.json(createSuccessResponse(null, result.message));
}));

// Upload participants from YAML file
router.post('/upload', requireOrganizerAuth, upload.single('yamlFile'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'No YAML file uploaded'
    });
  }

  try {
    // Parse YAML content
    const yamlContent = req.file.buffer.toString('utf8');
    const parsedData = yaml.load(yamlContent);

    if (!parsedData || !parsedData.participants) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid YAML format. Expected format with "participants" array.'
      });
    }

    const result = await ParticipantService.createMultipleParticipants(parsedData.participants);
    res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result, result.message));
  } catch (yamlError) {
    if (yamlError.name === 'YAMLException') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: `YAML parsing error: ${yamlError.message}`
      });
    }
    throw yamlError;
  }
}));

module.exports = router;