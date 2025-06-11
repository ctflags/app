const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database instance
let db;

// Initialize database
function initDatabase() {
  db = new sqlite3.Database('./ctf.db');
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Participants table
      db.run(`CREATE TABLE IF NOT EXISTS participants (
        token TEXT PRIMARY KEY,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Challenges table
      db.run(`CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        flag TEXT NOT NULL UNIQUE,
        points INTEGER DEFAULT 100,
        hint TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Add hint column if it doesn't exist (for existing databases)
      db.run(`ALTER TABLE challenges ADD COLUMN hint TEXT DEFAULT ''`, (err) => {
        // Ignore error if column already exists
      });

      // Add unique constraint on flag for existing databases
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_flag_unique ON challenges(flag)`, (err) => {
        // Ignore error if index already exists
      });

      // Submissions table
      db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_token TEXT,
        challenge_id INTEGER,
        submitted_flag TEXT,
        is_correct BOOLEAN,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (participant_token) REFERENCES participants (token),
        FOREIGN KEY (challenge_id) REFERENCES challenges (id)
      )`);

      // Create organizers table
      db.run(`CREATE TABLE IF NOT EXISTS organizers (
        token TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Load and insert initial data from JSON files only
      seedInitialData().then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  });
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
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO challenges (name, description, flag, points, hint) VALUES (?, ?, ?, ?, ?)',
            [challenge.name, challenge.description, challenge.flag, challenge.points, challenge.hint || ''],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    );
    
    // Load participants
    await loadDataFromFile(
      path.join(configDir, 'participants.json'),
      'participants',
      async (participant) => {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO participants (token, name) VALUES (?, ?)',
            [participant.token, participant.name],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    );
    
    // Load organizers
    await loadDataFromFile(
      path.join(configDir, 'organizers.json'),
      'organizers',
      async (organizer) => {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO organizers (token, name) VALUES (?, ?)',
            [organizer.token, organizer.name],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
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

// Get database instance
function getDatabase() {
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};