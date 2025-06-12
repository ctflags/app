const express = require('express');
const router = express.Router();
const ParticipantService = require('../../services/ParticipantService');
const { requireOrganizerAuth } = require('../../middleware/auth');
const { validateParticipant } = require('../../middleware/validation');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

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

module.exports = router;