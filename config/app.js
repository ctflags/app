const express = require('express');
const path = require('path');

/**
 * Configure Express application
 */
function configureApp(app) {
  // Set EJS as template engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('public'));
}

/**
 * Configure error handling middleware
 */
function configureErrorHandling(app) {
  // Error handling middleware for API routes
  app.use('/api', (err, req, res, next) => {
    console.error('API Error:', err.message);
    
    // Handle authentication errors
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (err.name === 'ForbiddenError') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    
    // Generic error
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Error handling for web routes
  app.use((err, req, res, next) => {
    console.error('Web Error:', err.message);
    
    // Handle authentication errors for web routes
    if (err.name === 'UnauthorizedError' && req.path.startsWith('/organizer')) {
      return res.render('organizer-login');
    }
    
    if (err.name === 'ForbiddenError') {
      return res.status(403).render('access-denied');
    }
    
    // Generic error page
    res.status(500).send('Internal Server Error');
  });
}

module.exports = { configureApp, configureErrorHandling };