const { getParticipantByToken, getParticipantsWithProgress, getAllParticipants, createParticipant, updateParticipant, deleteParticipant, deleteAllParticipants, createMultipleParticipants, getParticipantProgress } = require('../database/participants');
const { NotFoundError, ConflictError, DatabaseError } = require('../utils/errors');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants');

class ParticipantService {
  /**
   * Get all participants
   */
  async getAllParticipants() {
    try {
      return await getAllParticipants();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get participants with their progress
   */
  async getParticipantsWithProgress() {
    try {
      return await getParticipantsWithProgress();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get participant by token
   */
  async getParticipantByToken(token) {
    try {
      const participant = await getParticipantByToken(token);
      if (!participant) {
        throw new NotFoundError(ERROR_MESSAGES.PARTICIPANT_NOT_FOUND);
      }
      return participant;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get participant progress matrix
   */
  async getParticipantProgress() {
    try {
      return await getParticipantProgress();
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Create a new participant
   */
  async createParticipant(participantData) {
    try {
      const { token, name } = participantData;
      
      // Business logic: Validate token format
      if (!this.isValidTokenFormat(token)) {
        throw new ConflictError('Token must contain only alphanumeric characters and hyphens');
      }
      
      // Business logic: Check for duplicate token
      try {
        await this.getParticipantByToken(token);
        throw new ConflictError('Participant token already exists');
      } catch (error) {
        // If participant not found, we can proceed
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
      
      const participant = await createParticipant(token, name);
      return {
        participant,
        message: SUCCESS_MESSAGES.PARTICIPANT_CREATED
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Update an existing participant
   */
  async updateParticipant(originalToken, participantData) {
    try {
      // Verify participant exists
      await this.getParticipantByToken(originalToken);
      
      const { token, name } = participantData;
      
      // Business logic: Validate name
      if (!name || name.trim().length === 0) {
        throw new ConflictError('Participant name cannot be empty');
      }
      
      // If token is being changed, validate new token
      if (token && token !== originalToken) {
        if (!this.isValidTokenFormat(token)) {
          throw new ConflictError('Token must contain only alphanumeric characters and hyphens');
        }
        
        // Check if new token already exists (excluding current participant)
        try {
          await this.getParticipantByToken(token);
          // If we found a participant with this token, it's a duplicate
          throw new ConflictError('Participant token already exists');
        } catch (error) {
          // If participant not found, we can proceed with the token change
          if (!(error instanceof NotFoundError)) {
            throw error;
          }
        }
      }
      
      const updates = {
        token: token || originalToken,
        name: name.trim()
      };
      
      const result = await updateParticipant(originalToken, updates);
      return {
        participant: result,
        message: SUCCESS_MESSAGES.PARTICIPANT_UPDATED
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Delete a participant
   */
  async deleteParticipant(token) {
    try {
      // Verify participant exists
      const participant = await this.getParticipantByToken(token);
      
      const result = await deleteParticipant(token);
      return {
        deletedParticipant: participant,
        message: SUCCESS_MESSAGES.PARTICIPANT_DELETED
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get participant statistics
   */
  async getParticipantStats() {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_participants,
          COUNT(CASE WHEN total_points > 0 THEN 1 END) as active_participants,
          AVG(total_points) as avg_points,
          MAX(total_points) as max_points,
          COUNT(CASE WHEN solved_challenges > 0 THEN 1 END) as participants_with_solves
        FROM (
          SELECT 
            p.*,
            COALESCE(SUM(CASE WHEN s.is_correct = true THEN c.points ELSE 0 END), 0) as total_points,
            COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solved_challenges
          FROM participants p
          LEFT JOIN submissions s ON p.id = s.participant_id
          LEFT JOIN challenges c ON s.challenge_id = c.id
          GROUP BY p.id
        ) participant_stats
      `);
      
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      const { getDatabase } = require('../database');
      const pool = getDatabase();
      
      const result = await pool.query(`
        SELECT 
          p.token,
          p.name,
          COALESCE(SUM(CASE WHEN s.is_correct = true THEN c.points ELSE 0 END) - SUM(CASE WHEN hv.id IS NOT NULL AND s.is_correct = true THEN 10 ELSE 0 END), 0) as total_points,
          COUNT(CASE WHEN s.is_correct = true THEN 1 END) as solved_challenges,
          MAX(s.submitted_at) as last_submission
        FROM participants p
        LEFT JOIN submissions s ON p.id = s.participant_id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        LEFT JOIN hint_views hv ON p.id = hv.participant_id AND c.id = hv.challenge_id
        GROUP BY p.id, p.token, p.name
        ORDER BY total_points DESC, last_submission ASC
        LIMIT $1
      `, [limit]);
      
      return result.rows;
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token) {
    // Allow alphanumeric characters, hyphens, and underscores
    const tokenRegex = /^[a-zA-Z0-9\-_]+$/;
    return tokenRegex.test(token);
  }

  /**
   * Delete all participants and their related records
   */
  async deleteAllParticipants() {
    try {
      const result = await deleteAllParticipants();
      return {
        deletedCount: result.changes,
        message: `Successfully deleted ${result.changes} participants and all related records`
      };
    } catch (error) {
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Create multiple participants from YAML data
   */
  async createMultipleParticipants(participantsData) {
    try {
      // Basic validation
      if (!Array.isArray(participantsData)) {
        throw new ConflictError('Participants data must be an array');
      }

      const validatedParticipants = [];
      const errors = [];

      // Validate each participant
      for (let i = 0; i < participantsData.length; i++) {
        const participant = participantsData[i];
        
        if (!participant.token || !participant.name) {
          errors.push(`Participant ${i + 1}: Missing token or name`);
          continue;
        }

        if (!this.isValidTokenFormat(participant.token)) {
          errors.push(`Participant ${i + 1}: Invalid token format`);
          continue;
        }

        // Check for duplicates within the input data
        const duplicateInInput = validatedParticipants.find(p => p.token === participant.token);
        if (duplicateInInput) {
          errors.push(`Participant ${i + 1}: Duplicate token "${participant.token}" in input data`);
          continue;
        }

        validatedParticipants.push({
          token: participant.token.trim(),
          name: participant.name.trim()
        });
      }

      if (errors.length > 0) {
        throw new ConflictError(`Validation errors:\n${errors.join('\n')}`);
      }

      if (validatedParticipants.length === 0) {
        throw new ConflictError('No valid participants found in the data');
      }

      // Check for existing tokens in database
      const existingTokens = [];
      for (const participant of validatedParticipants) {
        try {
          await this.getParticipantByToken(participant.token);
          existingTokens.push(participant.token);
        } catch (error) {
          if (!(error instanceof NotFoundError)) {
            throw error;
          }
        }
      }

      if (existingTokens.length > 0) {
        throw new ConflictError(`The following tokens already exist: ${existingTokens.join(', ')}`);
      }

      // Create all participants
      const results = await createMultipleParticipants(validatedParticipants);
      
      return {
        participants: results,
        createdCount: results.length,
        message: `Successfully created ${results.length} participants`
      };
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw new DatabaseError(ERROR_MESSAGES.DATABASE_ERROR, error);
    }
  }

  /**
   * Generate a unique participant token
   */
  async generateUniqueToken(baseName) {
    const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    
    while (true) {
      const token = `${cleanName}-${String(counter).padStart(3, '0')}`;
      
      try {
        await getParticipantByToken(token);
        counter++;
      } catch (error) {
        if (error instanceof NotFoundError) {
          return token;
        }
        throw error;
      }
    }
  }
}

module.exports = new ParticipantService();