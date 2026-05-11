const express = require('express');
const router = express.Router();
const SubmissionService = require('../../services/SubmissionService');
const { requireOrganizerAuth, requireParticipantAuth } = require('../../middleware/auth');
const { validateSubmission, validateRequiredFields } = require('../../middleware/validation');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

// Submit flag (participant endpoint)
router.post('/submit', asyncHandler(async (req, res) => {
  const { token, challengeId, flag } = req.body;
  
  if (!token || !challengeId || !flag) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing required fields' });
  }

  const result = await SubmissionService.submitFlag(token, challengeId, flag);
  res.json({
    correct: result.correct,
    message: result.message
  });
}));

// Get all submissions (organizer)
router.get('/', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const submissions = await SubmissionService.getAllSubmissions();
  res.json(createSuccessResponse(submissions));
}));

// Create new submission (admin)
router.post('/', requireOrganizerAuth, validateSubmission, asyncHandler(async (req, res) => {
  const result = await SubmissionService.createSubmission(req.body);
  res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(result.submission, result.message));
}));

// Update existing submission
router.put('/:id', requireOrganizerAuth, validateRequiredFields(['submittedFlag', 'isCorrect']), asyncHandler(async (req, res) => {
  const result = await SubmissionService.updateSubmission(req.params.id, req.body);
  res.json(createSuccessResponse(result.submission, result.message));
}));

// Bulk delete submissions (must come before /:id)
router.delete('/bulk-delete', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'ids array required' });
  }
  const result = await SubmissionService.bulkDeleteSubmissions(ids);
  res.json(createSuccessResponse(null, result.message));
}));

// Delete submission
router.delete('/:id', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const result = await SubmissionService.deleteSubmission(req.params.id);
  res.json(createSuccessResponse(null, result.message));
}));

// Get submission statistics
router.get('/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await SubmissionService.getSubmissionStats();
  res.json(createSuccessResponse(stats));
}));

// Get recent submissions
router.get('/recent', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const submissions = await SubmissionService.getRecentSubmissions(limit);
  res.json(createSuccessResponse(submissions));
}));

// Get participant submissions
router.get('/participant/:token', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const challengeId = req.query.challengeId ? parseInt(req.query.challengeId) : null;
  const submissions = await SubmissionService.getParticipantSubmissions(req.params.token, challengeId);
  res.json(createSuccessResponse(submissions));
}));

// Get challenge submission statistics
router.get('/challenge/:challengeId/stats', requireOrganizerAuth, asyncHandler(async (req, res) => {
  const stats = await SubmissionService.getChallengeSubmissionStats(req.params.challengeId);
  res.json(createSuccessResponse(stats));
}));

module.exports = router;