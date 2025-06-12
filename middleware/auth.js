const { getOrganizerByToken } = require('../database/organizers');
const { getParticipantByToken } = require('../database/participants');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { ERROR_MESSAGES } = require('../constants');

/**
 * Middleware to require organizer authentication
 */
const requireOrganizerAuth = async (req, res, next) => {
  try {
    const token = req.query.token || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    const organizer = await getOrganizerByToken(token);
    if (!organizer) {
      throw new ForbiddenError(ERROR_MESSAGES.ORGANIZER_NOT_FOUND);
    }

    req.organizer = organizer;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require participant authentication
 */
const requireParticipantAuth = async (req, res, next) => {
  try {
    const token = req.params.token || req.query.token || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    const participant = await getParticipantByToken(token);
    if (!participant) {
      throw new ForbiddenError(ERROR_MESSAGES.PARTICIPANT_NOT_FOUND);
    }

    req.participant = participant;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate token (organizer or participant)
 */
const validateToken = async (req, res, next) => {
  try {
    const token = req.params.token || req.query.token || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
    }

    // Try organizer first
    let user = await getOrganizerByToken(token);
    if (user) {
      req.user = user;
      req.userType = 'organizer';
      req.token = token;
      return next();
    }

    // Try participant
    user = await getParticipantByToken(token);
    if (user) {
      req.user = user;
      req.userType = 'participant';
      req.token = token;
      return next();
    }

    throw new ForbiddenError(ERROR_MESSAGES.INVALID_TOKEN);
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth middleware - doesn't throw if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.params.token || req.query.token || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    // Try to identify user but don't fail if not found
    let user = await getOrganizerByToken(token);
    if (user) {
      req.user = user;
      req.userType = 'organizer';
      req.token = token;
      return next();
    }

    user = await getParticipantByToken(token);
    if (user) {
      req.user = user;
      req.userType = 'participant';
      req.token = token;
    }

    next();
  } catch (error) {
    // Continue without auth if there's an error
    next();
  }
};

module.exports = {
  requireOrganizerAuth,
  requireParticipantAuth,
  validateToken,
  optionalAuth
};