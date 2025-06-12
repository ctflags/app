const { HTTP_STATUS, ERROR_MESSAGES } = require('../constants');

/**
 * Custom API Error class for consistent error handling
 */
class APIError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, APIError);
  }
}

/**
 * Specific error classes for different types of errors
 */
class ValidationError extends APIError {
  constructor(message = ERROR_MESSAGES.MISSING_FIELDS) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends APIError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

class UnauthorizedError extends APIError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends APIError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}

class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

class DatabaseError extends APIError {
  constructor(message = ERROR_MESSAGES.DATABASE_ERROR, originalError = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

/**
 * Error handler middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle known API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        timestamp: err.timestamp
      }
    });
  }

  // Handle database-specific errors
  if (err.code) {
    const { DATABASE_ERRORS } = require('../constants');
    
    switch (err.code) {
      case DATABASE_ERRORS.UNIQUE_CONSTRAINT:
        return res.status(HTTP_STATUS.CONFLICT).json({
          error: {
            message: 'Resource already exists',
            code: 'DUPLICATE_RESOURCE'
          }
        });
        
      case DATABASE_ERRORS.FOREIGN_KEY_VIOLATION:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            message: 'Invalid reference to related resource',
            code: 'INVALID_REFERENCE'
          }
        });
        
      case DATABASE_ERRORS.NOT_NULL_VIOLATION:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: {
            message: 'Required field is missing',
            code: 'MISSING_REQUIRED_FIELD'
          }
        });
    }
  }

  // Handle unexpected errors
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Async error wrapper to catch async function errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create standardized error responses
 */
const createErrorResponse = (message, code = null, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
  return {
    error: {
      message,
      code,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Create standardized success responses
 */
const createSuccessResponse = (data = null, message = null) => {
  const response = {
    success: true,
    timestamp: new Date().toISOString()
  };
  
  if (message) response.message = message;
  if (data) response.data = data;
  
  return response;
};

module.exports = {
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
  errorHandler,
  asyncHandler,
  createErrorResponse,
  createSuccessResponse
};