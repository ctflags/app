const { getDatabase } = require('../database');
const { DatabaseError } = require('./errors');
const { DATABASE_ERRORS } = require('../constants');

/**
 * Base Database Utility Class
 */
class DatabaseUtils {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = getDatabase();
  }

  /**
   * Execute a query with error handling
   */
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error(`Database query error in ${this.tableName}:`, error);
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Handle database-specific errors
   */
  handleDatabaseError(error) {
    switch (error.code) {
      case DATABASE_ERRORS.UNIQUE_CONSTRAINT:
        return new DatabaseError('Resource already exists', error);
      case DATABASE_ERRORS.FOREIGN_KEY_VIOLATION:
        return new DatabaseError('Invalid reference to related resource', error);
      case DATABASE_ERRORS.NOT_NULL_VIOLATION:
        return new DatabaseError('Required field is missing', error);
      case DATABASE_ERRORS.CHECK_VIOLATION:
        return new DatabaseError('Data validation failed', error);
      default:
        return new DatabaseError('Database operation failed', error);
    }
  }

  /**
   * Find a record by ID
   */
  async findById(id, columns = '*') {
    const sql = `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find all records with optional conditions
   */
  async findAll(conditions = '', params = [], orderBy = 'id', limit = null) {
    let sql = `SELECT * FROM ${this.tableName}`;
    
    if (conditions) {
      sql += ` WHERE ${conditions}`;
    }
    
    sql += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Count records with optional conditions
   */
  async count(conditions = '', params = []) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    if (conditions) {
      sql += ` WHERE ${conditions}`;
    }

    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Insert a new record
   */
  async insert(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await this.query(sql, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   */
  async updateById(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause} 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await this.query(sql, [id, ...values]);
    return result.rows[0];
  }

  /**
   * Delete a record by ID
   */
  async deleteById(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(sql, [id]);
    return { id, changes: result.rowCount };
  }

  /**
   * Delete all records
   */
  async deleteAll() {
    const sql = `DELETE FROM ${this.tableName}`;
    const result = await this.query(sql);
    return { changes: result.rowCount };
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id) {
    const count = await this.count('id = $1', [id]);
    return count > 0;
  }

  /**
   * Get the next available ID
   */
  async getNextId() {
    const sql = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM ${this.tableName}`;
    const result = await this.query(sql);
    return result.rows[0].next_id;
  }

  /**
   * Execute a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw this.handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Batch insert multiple records
   */
  async batchInsert(records) {
    if (!records || records.length === 0) {
      return [];
    }

    const columns = Object.keys(records[0]);
    const values = [];
    const placeholders = [];
    
    records.forEach((record, recordIndex) => {
      const recordPlaceholders = columns.map((_, colIndex) => {
        const paramIndex = recordIndex * columns.length + colIndex + 1;
        return `$${paramIndex}`;
      });
      placeholders.push(`(${recordPlaceholders.join(', ')})`);
      values.push(...Object.values(record));
    });

    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')}) 
      VALUES ${placeholders.join(', ')} 
      RETURNING *
    `;

    const result = await this.query(sql, values);
    return result.rows;
  }

  /**
   * Get table statistics
   */
  async getTableStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_records,
        MAX(created_at) as latest_created,
        MIN(created_at) as earliest_created
      FROM ${this.tableName}
    `;

    const result = await this.query(sql);
    return result.rows[0];
  }
}

/**
 * Common query builders
 */
class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.selectClause = '*';
    this.whereClause = '';
    this.orderByClause = '';
    this.limitClause = '';
    this.joinClause = '';
    this.params = [];
  }

  select(columns) {
    this.selectClause = Array.isArray(columns) ? columns.join(', ') : columns;
    return this;
  }

  where(condition, params = []) {
    this.whereClause = condition;
    this.params = params;
    return this;
  }

  join(joinClause) {
    this.joinClause += ` ${joinClause}`;
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this.orderByClause = `ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(count) {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  build() {
    let sql = `SELECT ${this.selectClause} FROM ${this.tableName}`;
    
    if (this.joinClause) {
      sql += this.joinClause;
    }
    
    if (this.whereClause) {
      sql += ` WHERE ${this.whereClause}`;
    }
    
    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`;
    }
    
    if (this.limitClause) {
      sql += ` ${this.limitClause}`;
    }

    return { sql, params: this.params };
  }
}

module.exports = {
  DatabaseUtils,
  QueryBuilder
};