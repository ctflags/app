const { recordHintView, hasViewedHint, getParticipantHintViews, getChallengeHintStats, getAllHintViews, getHintViewStats, getChallengeHintAnalytics, getParticipantHintAnalytics, getDetailedHintViews, deleteHintView, bulkDeleteHintViews } = require('../database/hint_views');
const { getChallengeById } = require('../database/challenges');
const { getParticipantByToken } = require('../database/participants');
const { getExistingSolve } = require('../database/submissions');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants');

class HintService {
  /**
   * Record a hint view
   */
  async recordHintView(participantToken, challengeId) {
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

      // Business logic: Check if challenge is already solved
      const existingSolve = await getExistingSolve(participantToken, challengeId);
      if (existingSolve) {
        throw new ConflictError('Cannot view hint for already solved challenge');
      }

      // Business logic: Check if hint exists
      if (!challenge.hint || challenge.hint.trim() === '') {
        throw new NotFoundError('No hint available for this challenge');
      }

      // Record hint view (will not duplicate due to unique constraint)
      const result = await recordHintView(participantToken, challengeId);
      
      return {
        success: true,
        message: result ? SUCCESS_MESSAGES.HINT_VIEW_RECORDED : 'Hint view already recorded',
        isNewView: !!result
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Check if participant has viewed hint
   */
  async hasViewedHint(participantToken, challengeId) {
    try {
      return await hasViewedHint(participantToken, challengeId);
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get all hint views for a participant
   */
  async getParticipantHintViews(participantToken) {
    try {
      // Verify participant exists
      const participant = await getParticipantByToken(participantToken);
      if (!participant) {
        throw new NotFoundError(ERROR_MESSAGES.PARTICIPANT_NOT_FOUND);
      }

      return await getParticipantHintViews(participantToken);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get hint statistics for a challenge
   */
  async getChallengeHintStats(challengeId) {
    try {
      // Verify challenge exists
      const challenge = await getChallengeById(challengeId);
      if (!challenge) {
        throw new NotFoundError(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
      }

      return await getChallengeHintStats(challengeId);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get all hint views
   */
  async getAllHintViews() {
    try {
      return await getAllHintViews();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get overall hint view statistics
   */
  async getHintViewStats() {
    try {
      return await getHintViewStats();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get hint analytics by challenge
   */
  async getChallengeHintAnalytics() {
    try {
      return await getChallengeHintAnalytics();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get hint analytics by participant
   */
  async getParticipantHintAnalytics() {
    try {
      return await getParticipantHintAnalytics();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get detailed hint views
   */
  async getDetailedHintViews() {
    try {
      return await getDetailedHintViews();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Delete a hint view
   */
  async deleteHintView(id) {
    try {
      // Verify hint view exists
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const checkResult = await pool.query('SELECT * FROM hint_views WHERE id = $1', [id]);
      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Hint view not found');
      }

      const result = await deleteHintView(id);
      
      return {
        deletedHintView: checkResult.rows[0],
        message: 'Hint view deleted successfully'
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Bulk delete hint views
   */
  async bulkDeleteHintViews(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ConflictError('Invalid hint view IDs provided');
      }

      const intIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      // Verify all hint views exist
      const { getDatabase } = require('../database');
      const pool = getDatabase();

      const checkResult = await pool.query(
        'SELECT id FROM hint_views WHERE id = ANY($1::int[])',
        [intIds]
      );

      if (checkResult.rows.length !== intIds.length) {
        throw new NotFoundError('Some hint views not found');
      }

      const result = await bulkDeleteHintViews(intIds);
      
      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} hint views deleted successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Export hint view data
   */
  async exportHintViewData(filters = {}) {
    try {
      let hintViews = await getDetailedHintViews();
      
      // Apply filters
      const { participant, challenge, status } = filters;
      
      if (participant) {
        hintViews = hintViews.filter(h => h.participant_token === participant);
      }
      
      if (challenge) {
        hintViews = hintViews.filter(h => h.challenge_id == challenge);
      }
      
      if (status) {
        const isSolved = status === 'solved';
        hintViews = hintViews.filter(h => h.solved_after_hint === isSolved);
      }

      return hintViews;
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get hint effectiveness metrics
   */
  async getHintEffectiveness() {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          c.id,
          c.name as challenge_name,
          COUNT(hv.id) as hint_views,
          COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solves_after_hint,
          CASE 
            WHEN COUNT(hv.id) = 0 THEN 0 
            ELSE ROUND(COUNT(CASE WHEN s.is_correct = true THEN 1 END)::decimal / COUNT(hv.id)::decimal, 3) 
          END as effectiveness_ratio
        FROM challenges c
        LEFT JOIN hint_views hv ON c.id = hv.challenge_id
        LEFT JOIN submissions s ON hv.participant_id = s.participant_id 
          AND hv.challenge_id = s.challenge_id 
          AND s.is_correct = true 
          AND s.submitted_at > hv.viewed_at
        WHERE c.hint IS NOT NULL AND c.hint != ''
        GROUP BY c.id, c.name
        ORDER BY effectiveness_ratio DESC, hint_views DESC
      `);
      
      return result.rows;
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }
}

module.exports = new HintService();