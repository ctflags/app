const path = require('path');

// Load environment-specific configuration
const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  env,
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/ctf_db',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 2000
    }
  },
  paths: {
    uploads: process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'),
    challenges: process.env.CHALLENGES_DIR || path.join(__dirname, '..', 'challenges'),
    views: path.join(__dirname, '..', 'views'),
    public: path.join(__dirname, '..', 'public')
  },
  session: {
    secret: process.env.SESSION_SECRET || 'ctf-default-secret-change-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    tokenLength: parseInt(process.env.TOKEN_LENGTH) || 32
  },
  features: {
    enableHintTracking: process.env.ENABLE_HINT_TRACKING !== 'false',
    enableSubmissionLimits: process.env.ENABLE_SUBMISSION_LIMITS === 'true',
    maxSubmissionsPerChallenge: parseInt(process.env.MAX_SUBMISSIONS_PER_CHALLENGE) || 10
  }
};

// Environment-specific overrides
const envConfigs = {
  development: {
    database: {
      logging: true
    },
    server: {
      cors: true
    }
  },
  
  production: {
    database: {
      logging: false,
      ssl: true
    },
    server: {
      cors: false,
      trustProxy: true
    }
  },
  
  test: {
    database: {
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/ctf_test_db'
    },
    server: {
      port: 0 // Use random port for testing
    }
  }
};

// Merge base config with environment-specific config
const config = {
  ...baseConfig,
  ...envConfigs[env]
};

module.exports = config;