const { getAllChallenges, getChallengesWithSolutions, getChallengeById, createChallenge, updateChallenge, deleteChallenge } = require('../database/challenges');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants');

class ChallengeService {
  /**
   * Get all challenges
   */
  async getAllChallenges() {
    try {
      return await getAllChallenges();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get challenges with participant's solution status
   */
  async getChallengesWithSolutions(participantToken) {
    try {
      return await getChallengesWithSolutions(participantToken);
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get challenge by ID
   */
  async getChallengeById(id) {
    try {
      const challenge = await getChallengeById(id);
      if (!challenge) {
        throw new NotFoundError(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
      }
      return challenge;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Create a new challenge
   */
  async createChallenge(challengeData) {
    try {
      const { name, description, flag, points, hint = '' } = challengeData;
      
      // Business logic: Validate flag format
      if (!flag.startsWith('CTF{') || !flag.endsWith('}')) {
        throw new ConflictError('Flag must be in CTF{...} format');
      }
      
      // Business logic: Check for duplicate challenge names
      const existingChallenges = await getAllChallenges();
      const duplicateName = existingChallenges.find(c => 
        c.name.toLowerCase() === name.toLowerCase()
      );
      
      if (duplicateName) {
        throw new ConflictError('Challenge name already exists');
      }
      
      const challenge = await createChallenge(name, description, flag, points, hint);
      return {
        challenge,
        message: SUCCESS_MESSAGES.CHALLENGE_CREATED
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Update an existing challenge
   */
  async updateChallenge(id, challengeData) {
    try {
      // Verify challenge exists
      await this.getChallengeById(id);
      
      const { name, description, flag, points, hint = '' } = challengeData;
      
      // Business logic: Validate flag format
      if (!flag.startsWith('CTF{') || !flag.endsWith('}')) {
        throw new ConflictError('Flag must be in CTF{...} format');
      }
      
      // Business logic: Check for duplicate challenge names (excluding current)
      const existingChallenges = await getAllChallenges();
      const duplicateName = existingChallenges.find(c => 
        c.name.toLowerCase() === name.toLowerCase() && c.id !== parseInt(id)
      );
      
      if (duplicateName) {
        throw new ConflictError('Challenge name already exists');
      }
      
      const result = await updateChallenge(id, name, description, flag, points, hint);
      return {
        challenge: result,
        message: SUCCESS_MESSAGES.CHALLENGE_UPDATED
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Delete a challenge
   */
  async deleteChallenge(id) {
    try {
      // Verify challenge exists
      const challenge = await this.getChallengeById(id);
      
      const result = await deleteChallenge(id);
      return {
        deletedChallenge: challenge,
        message: SUCCESS_MESSAGES.CHALLENGE_DELETED
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Delete all challenges
   */
  async deleteAllChallenges() {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      // Get counts before deletion
      const challengeCount = await pool.query('SELECT COUNT(*) as count FROM challenges');
      const submissionCount = await pool.query('SELECT COUNT(*) as count FROM submissions');
      const hintViewCount = await pool.query('SELECT COUNT(*) as count FROM hint_views');
      
      // Delete all related data in correct order (foreign key constraints)
      await pool.query('DELETE FROM hint_views');
      await pool.query('DELETE FROM submissions');
      await pool.query('DELETE FROM challenges');
      
      return {
        challengesDeleted: parseInt(challengeCount.rows[0].count),
        submissionsDeleted: parseInt(submissionCount.rows[0].count),
        hintViewsDeleted: parseInt(hintViewCount.rows[0].count),
        message: 'All challenges and related data deleted successfully'
      };
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get challenge statistics
   */
  async getChallengeStats() {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_challenges,
          AVG(points) as avg_points,
          MIN(points) as min_points,
          MAX(points) as max_points,
          COUNT(CASE WHEN hint IS NOT NULL AND hint != '' THEN 1 END) as challenges_with_hints
        FROM challenges
      `);
      
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }
}

module.exports = new ChallengeService();