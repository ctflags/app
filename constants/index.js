// Database error codes
const DATABASE_ERRORS = {
  UNIQUE_CONSTRAINT: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// User roles
const USER_ROLES = {
  PARTICIPANT: 'participant',
  ORGANIZER: 'organizer'
};

// Submission status
const SUBMISSION_STATUS = {
  CORRECT: true,
  INCORRECT: false
};

// API endpoints
const API_ROUTES = {
  CHALLENGES: '/api/challenges',
  PARTICIPANTS: '/api/participants',
  SUBMISSIONS: '/api/submissions',
  HINT_VIEWS: '/api/hint-views',
  ORGANIZER: '/api/organizer'
};

// View routes
const VIEW_ROUTES = {
  INDEX: '/',
  PARTICIPANT_LOGIN: '/p',
  PARTICIPANT_DASHBOARD: '/p/:token',
  ORGANIZER_LOGIN: '/organizer',
  ORGANIZER_DASHBOARD: '/organizer',
  CHALLENGE_MANAGEMENT: '/organizer/challenges',
  PARTICIPANT_MANAGEMENT: '/organizer/participants',
  SUBMISSION_MANAGEMENT: '/organizer/submissions',
  HINT_MANAGEMENT: '/organizer/hints'
};

// Error messages
const ERROR_MESSAGES = {
  INVALID_TOKEN: 'Invalid token provided',
  PARTICIPANT_NOT_FOUND: 'Participant not found',
  ORGANIZER_NOT_FOUND: 'Organizer not found',
  CHALLENGE_NOT_FOUND: 'Challenge not found',
  SUBMISSION_NOT_FOUND: 'Submission not found',
  UNAUTHORIZED: 'Unauthorized access',
  MISSING_FIELDS: 'Missing required fields',
  DATABASE_ERROR: 'Database error occurred',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_CREDENTIALS: 'Invalid credentials',
  DUPLICATE_TOKEN: 'Token already exists',
  ALREADY_SOLVED: 'Challenge already solved'
};

// Success messages
const SUCCESS_MESSAGES = {
  CHALLENGE_CREATED: 'Challenge created successfully',
  CHALLENGE_UPDATED: 'Challenge updated successfully',
  CHALLENGE_DELETED: 'Challenge deleted successfully',
  PARTICIPANT_CREATED: 'Participant created successfully',
  PARTICIPANT_UPDATED: 'Participant updated successfully',
  PARTICIPANT_DELETED: 'Participant deleted successfully',
  SUBMISSION_CREATED: 'Submission created successfully',
  SUBMISSION_UPDATED: 'Submission updated successfully',
  SUBMISSION_DELETED: 'Submission deleted successfully',
  HINT_VIEW_RECORDED: 'Hint view recorded',
  FLAG_CORRECT: 'Correct flag!',
  FLAG_INCORRECT: 'Incorrect flag'
};

// Validation constraints
const VALIDATION = {
  TOKEN_MIN_LENGTH: 5,
  TOKEN_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  FLAG_MIN_LENGTH: 3,
  FLAG_MAX_LENGTH: 200,
  POINTS_MIN: 1,
  POINTS_MAX: 10000,
  HINT_MAX_LENGTH: 500
};

// Time constants
const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

module.exports = {
  DATABASE_ERRORS,
  HTTP_STATUS,
  USER_ROLES,
  SUBMISSION_STATUS,
  API_ROUTES,
  VIEW_ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
  TIME
};