const express = require('express');
const { initDatabase } = require('./database');
const { configureApp, configureErrorHandling } = require('./config/app');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Initialize and start the CTF server
 */
async function startServer() {
  try {
    // Initialize database
    console.log('🔧 Initializing database...');
    await initDatabase();
    
    // Configure Express app
    console.log('🔧 Configuring application...');
    configureApp(app);
    
    // Mount routes
    app.use('/', routes);
    
    // Configure error handling (must be after routes)
    configureErrorHandling(app);
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 CTF application running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;