const express = require('express');
const router = express.Router();
const ChallengeService = require('../../services/ChallengeService');
const { requireOrganizerAuth } = require('../../middleware/auth');
const { validateChallenge } = require('../../middleware/validation');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

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