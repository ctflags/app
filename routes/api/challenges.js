const express = require('express');
const router = express.Router();
const multer = require('multer');
const yaml = require('js-yaml');
const ChallengeService = require('../../services/ChallengeService');
const { requireOrganizerAuth } = require('../../middleware/auth');
const { validateChallenge } = require('../../middleware/validation');
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

// Get all challenges
router.get('/', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const challenges = await ChallengeService.getAllChallenges();
  res.json(createSuccessResponse(challenges));
}));

// Create new challenge
router.post('/', requireOrganizerAuth, validateChallenge, asyncHandler(async (req, res) => {
  const result = await ChallengeService.createChallenge(req.body);
  res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result.challenge, result.message));
}));

// Update existing challenge
router.put('/:id', requireOrganizerAuth, validateChallenge, asyncHandler(async (req, res) => {
  const result = await ChallengeService.updateChallenge(req.params.id, req.body);
  res.json(createSuccessResponse(result.challenge, result.message));
}));

// Delete all challenges and associated data (must come before :id route)
router.delete('/delete-all', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await ChallengeService.deleteAllChallenges();
  res.json(createSuccessResponse(result, result.message));
}));

// Upload challenges from YAML file
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

    if (!parsedData || !parsedData.challenges) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Invalid YAML format. Expected format with "challenges" array.'
      });
    }

    const result = await ChallengeService.createMultipleChallenges(parsedData.challenges);
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

// Delete challenge
router.delete('/:id', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await ChallengeService.deleteChallenge(req.params.id);
  res.json(createSuccessResponse(null, result.message));
}));

// Get challenge statistics
router.get('/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await ChallengeService.getChallengeStats();
  res.json(createSuccessResponse(stats));
}));

module.exports = router;