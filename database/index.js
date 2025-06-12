const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Database connection pool
let pool;

// Initialize database connection
async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    console.log('🐘 Connecting to PostgreSQL database...');
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test the connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    // Create tables
    await createTables();
    
    // Load initial data
    await seedInitialData();
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Create database tables
async function createTables() {
  const schema = `
    -- Participants table
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Challenges table
    CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      flag VARCHAR(255) NOT NULL UNIQUE,
      points INTEGER DEFAULT 100,
      hint TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Submissions table
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER,
      challenge_id INTEGER,
      submitted_flag VARCHAR(255),
      is_correct BOOLEAN,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants (id),
      FOREIGN KEY (challenge_id) REFERENCES challenges (id)
    );

    -- Organizers table
    CREATE TABLE IF NOT EXISTS organizers (
      id SERIAL PRIMARY KEY,
      token VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Hint views table
    CREATE TABLE IF NOT EXISTS hint_views (
      id SERIAL PRIMARY KEY,
      participant_id INTEGER,
      challenge_id INTEGER,
      viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (participant_id) REFERENCES participants (id),
      FOREIGN KEY (challenge_id) REFERENCES challenges (id),
      UNIQUE(participant_id, challenge_id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_participants_token ON participants(token);
    CREATE INDEX IF NOT EXISTS idx_organizers_token ON organizers(token);
    CREATE INDEX IF NOT EXISTS idx_submissions_participant ON submissions(participant_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON submissions(challenge_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_correct ON submissions(is_correct);
    CREATE INDEX IF NOT EXISTS idx_challenges_flag ON challenges(flag);
    CREATE INDEX IF NOT EXISTS idx_hint_views_participant ON hint_views(participant_id);
    CREATE INDEX IF NOT EXISTS idx_hint_views_challenge ON hint_views(challenge_id);
  `;

  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await pool.query(statement.trim());
      } catch (err) {
        // Ignore errors for objects that already exist
        if (!err.message.includes('already exists') && !err.message.includes('relation')) {
          console.warn('⚠️  Schema warning:', err.message);
        }
      }
    }
  }
  
  console.log('✅ Applied PostgreSQL schema');
}

// Load initial data from JSON files
async function seedInitialData() {
  const configDir = process.env.CONFIG_DIR || path.join(__dirname, '../config');
  
  try {
    // Load challenges
    await loadDataFromFile(
      path.join(configDir, 'challenges.json'),
      'challenges',
      async (challenge) => {
        await pool.query(
          'INSERT INTO challenges (name, description, flag, points, hint) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (flag) DO NOTHING',
          [challenge.name, challenge.description, challenge.flag, challenge.points, challenge.hint || '']
        );
      }
    );
    
    // Load participants
    await loadDataFromFile(
      path.join(configDir, 'participants.json'),
      'participants',
      async (participant) => {
        await pool.query(
          'INSERT INTO participants (token, name) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
          [participant.token, participant.name]
        );
      }
    );
    
    // Load organizers
    await loadDataFromFile(
      path.join(configDir, 'organizers.json'),
      'organizers',
      async (organizer) => {
        await pool.query(
          'INSERT INTO organizers (token, name) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
          [organizer.token, organizer.name]
        );
      }
    );
    
  } catch (error) {
    console.error('❌ Error loading initial data:', error.message);
    throw error;
  }
}

// Helper function to load data from a specific file
async function loadDataFromFile(filePath, dataType, insertFunction) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`ℹ️  No ${dataType}.json file found, skipping ${dataType} seed data`);
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data)) {
      console.log(`⚠️  ${dataType}.json should contain an array, skipping`);
      return;
    }
    
    for (const item of data) {
      await insertFunction(item);
    }
    
    if (data.length > 0) {
      console.log(`✅ Seeded ${data.length} ${dataType}`);
    }
    
  } catch (error) {
    console.error(`❌ Error loading ${dataType} from ${filePath}:`, error.message);
    // Don't throw here, continue with other files
  }
}

// Get database pool
function getDatabase() {
  return pool;
}

module.exports = {
  initDatabase,
  getDatabase
};