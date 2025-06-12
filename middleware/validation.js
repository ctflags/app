const { ValidationError } = require('../utils/errors');
const { VALIDATION, ERROR_MESSAGES } = require('../constants');

/**
 * Generic validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }
    
    req.validatedBody = value;
    next();
  };
};

/**
 * Validate required fields are present
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
    
    next();
  };
};

/**
 * Validate token format
 */
const validateToken = (req, res, next) => {
  const token = req.params.token || req.body.token;
  
  if (!token) {
    throw new ValidationError('Token is required');
  }
  
  if (typeof token !== 'string' || 
      token.length < VALIDATION.TOKEN_MIN_LENGTH || 
      token.length > VALIDATION.TOKEN_MAX_LENGTH) {
    throw new ValidationError(`Token must be between ${VALIDATION.TOKEN_MIN_LENGTH} and ${VALIDATION.TOKEN_MAX_LENGTH} characters`);
  }
  
  next();
};

/**
 * Validate participant data
 */
const validateParticipant = (req, res, next) => {
  const { token, name } = req.body;
  
  if (!token || !name) {
    throw new ValidationError(ERROR_MESSAGES.MISSING_FIELDS);
  }
  
  if (typeof token !== 'string' || 
      token.length < VALIDATION.TOKEN_MIN_LENGTH || 
      token.length > VALIDATION.TOKEN_MAX_LENGTH) {
    throw new ValidationError(`Token must be between ${VALIDATION.TOKEN_MIN_LENGTH} and ${VALIDATION.TOKEN_MAX_LENGTH} characters`);
  }
  
  if (typeof name !== 'string' || 
      name.length < VALIDATION.NAME_MIN_LENGTH || 
      name.length > VALIDATION.NAME_MAX_LENGTH) {
    throw new ValidationError(`Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`);
  }
  
  next();
};

/**
 * Validate challenge data
 */
const validateChallenge = (req, res, next) => {
  const { name, description, flag, points, hint } = req.body;
  
  if (!name || !description || !flag || points === undefined) {
    throw new ValidationError(ERROR_MESSAGES.MISSING_FIELDS);
  }
  
  if (typeof name !== 'string' || 
      name.length < VALIDATION.NAME_MIN_LENGTH || 
      name.length > VALIDATION.NAME_MAX_LENGTH) {
    throw new ValidationError(`Challenge name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`);
  }
  
  if (typeof description !== 'string' || description.length > VALIDATION.DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`Description cannot exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`);
  }
  
  if (typeof flag !== 'string' || 
      flag.length < VALIDATION.FLAG_MIN_LENGTH || 
      flag.length > VALIDATION.FLAG_MAX_LENGTH) {
    throw new ValidationError(`Flag must be between ${VALIDATION.FLAG_MIN_LENGTH} and ${VALIDATION.FLAG_MAX_LENGTH} characters`);
  }
  
  const pointsNum = parseInt(points);
  if (isNaN(pointsNum) || pointsNum < VALIDATION.POINTS_MIN || pointsNum > VALIDATION.POINTS_MAX) {
    throw new ValidationError(`Points must be between ${VALIDATION.POINTS_MIN} and ${VALIDATION.POINTS_MAX}`);
  }
  
  if (hint && (typeof hint !== 'string' || hint.length > VALIDATION.HINT_MAX_LENGTH)) {
    throw new ValidationError(`Hint cannot exceed ${VALIDATION.HINT_MAX_LENGTH} characters`);
  }
  
  next();
};

/**
 * Validate submission data
 */
const validateSubmission = (req, res, next) => {
  const { participantToken, challengeId, submittedFlag, isCorrect } = req.body;
  
  if (!participantToken || !challengeId || !submittedFlag || isCorrect === undefined) {
    throw new ValidationError(ERROR_MESSAGES.MISSING_FIELDS);
  }
  
  if (typeof participantToken !== 'string') {
    throw new ValidationError('Participant token must be a string');
  }
  
  const challengeIdNum = parseInt(challengeId);
  if (isNaN(challengeIdNum) || challengeIdNum <= 0) {
    throw new ValidationError('Challenge ID must be a positive number');
  }
  
  if (typeof submittedFlag !== 'string' || submittedFlag.trim().length === 0) {
    throw new ValidationError('Submitted flag cannot be empty');
  }
  
  if (typeof isCorrect !== 'boolean') {
    throw new ValidationError('isCorrect must be a boolean value');
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ValidationError('Page must be a positive number');
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
  
  next();
};

module.exports = {
  validate,
  validateRequiredFields,
  validateToken,
  validateParticipant,
  validateChallenge,
  validateSubmission,
  validatePagination
};