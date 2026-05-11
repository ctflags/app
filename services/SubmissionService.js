const { getExistingSolve, createSubmission, getAllSubmissions, getSubmissionById, updateSubmission, deleteSubmission, bulkDeleteSubmissions, createSubmissionAdmin, getSubmissionStats } = require('../database/submissions');
const { getChallengeById } = require('../database/challenges');
const { getParticipantByToken } = require('../database/participants');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const { SUCCESS_MESSAGES, ERROR_MESSAGES, SUBMISSION_STATUS } = require('../constants');

class SubmissionService {
  /**
   * Get all submissions
   */
  async getAllSubmissions() {
    try {
      return await getAllSubmissions();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id) {
    try {
      const submission = await getSubmissionById(id);
      if (!submission) {
        throw new NotFoundError(ERROR_MESSAGES.SUBMISSION_NOT_FOUND);
      }
      return submission;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get submission statistics
   */
  async getSubmissionStats() {
    try {
      return await getSubmissionStats();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Submit a flag for a challenge (participant submission)
   */
  async submitFlag(participantToken, challengeId, submittedFlag) {
    try {
      // Verify participant exists
      const participant = await getParticipantByToken(participantToken);
      if (!participant) {
        throw new NotFoundError(ERROR_MESSAGES.PARTICIPANT_NOT_FOUND);
      }

      // Verify challenge exists
      const challenge = await getChallengeById(challengeId);
      if (!challenge) {
        throw new NotFoundError(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
      }

      // Business logic: Check if already solved
      const existingSolve = await getExistingSolve(participantToken, challengeId);
      if (existingSolve) {
        return {
          correct: true,
          alreadySolved: true,
          message: ERROR_MESSAGES.ALREADY_SOLVED
        };
      }

      // Business logic: Normalize flags for comparison
      const normalizedSubmitted = submittedFlag.trim();
      const normalizedCorrect = challenge.flag.trim();
      const isCorrect = normalizedSubmitted.toLowerCase() === normalizedCorrect.toLowerCase();

      // Record submission
      const submission = await createSubmission(participantToken, challengeId, normalizedSubmitted, isCorrect);

      return {
        correct: isCorrect,
        alreadySolved: false,
        message: isCorrect ? SUCCESS_MESSAGES.FLAG_CORRECT : SUCCESS_MESSAGES.FLAG_INCORRECT,
        submission
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Create a submission (admin)
   */
  async createSubmission(submissionData) {
    try {
      const { participantToken, challengeId, submittedFlag, isCorrect } = submissionData;

      // Verify participant exists
      const participant = await getParticipantByToken(participantToken);
      if (!participant) {
        throw new NotFoundError(ERROR_MESSAGES.PARTICIPANT_NOT_FOUND);
      }

      // Verify challenge exists
      const challenge = await getChallengeById(challengeId);
      if (!challenge) {
        throw new NotFoundError(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
      }

      const submission = await createSubmissionAdmin(participantToken, challengeId, submittedFlag, isCorrect);
      
      return {
        submission,
        message: SUCCESS_MESSAGES.SUBMISSION_CREATED
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Update a submission
   */
  async updateSubmission(id, submissionData) {
    try {
      // Verify submission exists
      await this.getSubmissionById(id);

      const { submittedFlag, isCorrect } = submissionData;
      
      const result = await updateSubmission(id, submittedFlag, isCorrect);
      
      return {
        submission: result,
        message: SUCCESS_MESSAGES.SUBMISSION_UPDATED
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(id) {
    try {
      // Verify submission exists
      const submission = await this.getSubmissionById(id);
      
      const result = await deleteSubmission(id);
      
      return {
        deletedSubmission: submission,
        message: SUCCESS_MESSAGES.SUBMISSION_DELETED
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Bulk delete submissions
   */
  async bulkDeleteSubmissions(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ConflictError('Invalid submission IDs provided');
      }

      const intIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      const result = await bulkDeleteSubmissions(intIds);

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} submissions deleted successfully`
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get participant's submissions for a challenge
   */
  async getParticipantSubmissions(participantToken, challengeId = null) {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      let query = `
        SELECT s.*, c.name as challenge_name, c.points, p.name as participant_name
        FROM submissions s
        JOIN participants p ON s.participant_id = p.id
        JOIN challenges c ON s.challenge_id = c.id
        WHERE p.token = $1
      `;
      
      const params = [participantToken];
      
      if (challengeId) {
        query += ' AND s.challenge_id = $2';
        params.push(challengeId);
      }
      
      query += ' ORDER BY s.submitted_at DESC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get challenge submission statistics
   */
  async getChallengeSubmissionStats(challengeId) {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_submissions,
          COUNT(DISTINCT participant_id) as unique_participants,
          COUNT(DISTINCT CASE WHEN is_correct = true THEN participant_id END) as successful_participants
        FROM submissions s
        WHERE s.challenge_id = $1
      `, [challengeId]);
      
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get recent submissions
   */
  async getRecentSubmissions(limit = 10) {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          s.*,
          p.name as participant_name,
          p.token as participant_token,
          c.name as challenge_name,
          c.points
        FROM submissions s
        JOIN participants p ON s.participant_id = p.id
        JOIN challenges c ON s.challenge_id = c.id
        ORDER BY s.submitted_at DESC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Validate flag format
   */
  validateFlagFormat(flag) {
    // Basic flag format validation
    if (!flag || typeof flag !== 'string') {
      return false;
    }
    
    const trimmed = flag.trim();
    return trimmed.length > 0 && trimmed.length <= 200;
  }
}

module.exports = new SubmissionService();