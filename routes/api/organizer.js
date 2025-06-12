const express = require('express');
const router = express.Router();
const { validateOrganizerToken } = require('../../database/organizers');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

// Validate organizer token
router.post('/validate', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Token required' });
  }

  const organizer = await validateOrganizerToken(token);

  if (!organizer) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid token' });
  }

  res.json({
    valid: true,
    organizer: { 
      token: organizer.token, 
      name: organizer.name 
    }
  });
}));

module.exports = router;