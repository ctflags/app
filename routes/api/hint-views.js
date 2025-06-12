const express = require('express');
const router = express.Router();
const HintService = require('../../services/HintService');
const { requireOrganizerAuth } = require('../../middleware/auth');
const { validateRequiredFields } = require('../../middleware/validation');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

// Record hint view (participant endpoint)
router.post('/viewed', asyncHandler(async (req, res) => {
  const { token, challengeId } = req.body;
  
  if (!token || !challengeId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
  }

  const result = await HintService.recordHintView(token, challengeId);
  res.json({
    success: result.success,
    message: result.message
  });
}));

// Get all hint views (organizer)
router.get('/', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const hintViews = await HintService.getDetailedHintViews();
  res.json(createSuccessResponse(hintViews));
}));

// Get hint view statistics
router.get('/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await HintService.getHintViewStats();
  res.json(createSuccessResponse(stats));
}));

// Get challenge hint analytics
router.get('/analytics/challenges', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const analytics = await HintService.getChallengeHintAnalytics();
  res.json(createSuccessResponse(analytics));
}));

// Get participant hint analytics
router.get('/analytics/participants', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const analytics = await HintService.getParticipantHintAnalytics();
  res.json(createSuccessResponse(analytics));
}));

// Get hint effectiveness metrics
router.get('/effectiveness', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const effectiveness = await HintService.getHintEffectiveness();
  res.json(createSuccessResponse(effectiveness));
}));

// Bulk delete hint views (must come before the :id route)
router.delete('/bulk-delete', requireOrganizerAuth, validateRequiredFields(['ids']), asyncHandler(async (req, res) => {
  const result = await HintService.bulkDeleteHintViews(req.body.ids);
  res.json(createSuccessResponse(null, result.message));
}));

// Delete hint view
router.delete('/:id', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await HintService.deleteHintView(req.params.id);
  res.json(createSuccessResponse(null, result.message));
}));

// Export hint view data
router.get('/export', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const filters = {
    participant: req.query.participant,
    challenge: req.query.challenge,
    status: req.query.status
  };
  
  const hintViews = await HintService.exportHintViewData(filters);
  
  // Convert to CSV
  const csvHeader = 'ID,Participant Token,Participant Name,Challenge ID,Challenge Name,Viewed At,Solved After Hint,Hint Content\n';
  const csvRows = hintViews.map(h => 
    `${h.id},"${h.participant_token}","${h.participant_name}",${h.challenge_id},"${h.challenge_name}","${h.viewed_at}",${h.solved_after_hint},"${(h.hint_content || '').replace(/"/g, '""')}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="hint-views-export.csv"');
  res.send(csvContent);
}));

// Get participant hint views
router.get('/participant/:token', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const hintViews = await HintService.getParticipantHintViews(req.params.token);
  res.json(createSuccessResponse(hintViews));
}));

// Get challenge hint statistics
router.get('/challenge/:challengeId/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await HintService.getChallengeHintStats(req.params.challengeId);
  res.json(createSuccessResponse(stats));
}));

module.exports = router;