const { getAllChallenges, getChallengesWithSolutions, getChallengeById, createChallenge, updateChallenge, deleteChallenge, deleteAllChallenges, createMultipleChallenges } = require('../database/challenges');
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
      
      // Business logic: Basic flag validation
      if (!flag || flag.trim().length === 0) {
        throw new ConflictError('Flag cannot be empty');
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
      
      // Business logic: Basic flag validation
      if (!flag || flag.trim().length === 0) {
        throw new ConflictError('Flag cannot be empty');
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
      
      if (result.changes === 0) {
        throw new NotFoundError(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
      }
      
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
   * Delete all challenges and their related records
   */
  async deleteAllChallenges() {
    try {
      const result = await deleteAllChallenges();
      return {
        deletedCount: result.changes,
        message: `Successfully deleted ${result.changes} challenges and all related records`
      };
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Create multiple challenges from YAML data
   */
  async createMultipleChallenges(challengesData) {
    try {
      // Basic validation
      if (!Array.isArray(challengesData)) {
        throw new ConflictError('Challenges data must be an array');
      }

      const validatedChallenges = [];
      const errors = [];

      // Validate each challenge
      for (let i = 0; i < challengesData.length; i++) {
        const challenge = challengesData[i];
        
        if (!challenge.name || !challenge.description || !challenge.flag) {
          errors.push(`Challenge ${i + 1}: Missing required fields (name, description, flag)`);
          continue;
        }

        if (!challenge.flag.trim()) {
          errors.push(`Challenge ${i + 1}: Flag cannot be empty`);
          continue;
        }

        // Check for duplicates within the input data
        const duplicateInInput = validatedChallenges.find(c => c.name.toLowerCase() === challenge.name.toLowerCase());
        if (duplicateInInput) {
          errors.push(`Challenge ${i + 1}: Duplicate name "${challenge.name}" in input data`);
          continue;
        }

        validatedChallenges.push({
          name: challenge.name.trim(),
          description: challenge.description.trim(),
          flag: challenge.flag.trim(),
          points: challenge.points || 100,
          hint: challenge.hint ? challenge.hint.trim() : ''
        });
      }

      if (errors.length > 0) {
        throw new ConflictError(`Validation errors:\n${errors.join('\n')}`);
      }

      if (validatedChallenges.length === 0) {
        throw new ConflictError('No valid challenges found in the data');
      }

      // Check for existing challenge names in database
      const existingChallenges = await getAllChallenges();
      const existingNames = [];
      for (const challenge of validatedChallenges) {
        const duplicate = existingChallenges.find(c => c.name.toLowerCase() === challenge.name.toLowerCase());
        if (duplicate) {
          existingNames.push(challenge.name);
        }
      }

      if (existingNames.length > 0) {
        throw new ConflictError(`The following challenge names already exist: ${existingNames.join(', ')}`);
      }

      // Create all challenges
      const results = await createMultipleChallenges(validatedChallenges);
      
      return {
        challenges: results,
        createdCount: results.length,
        message: `Successfully created ${results.length} challenges`
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
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