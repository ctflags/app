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
  const { errorHandler } = require('../utils/errors');
  
  // Use the comprehensive error handler from utils/errors.js
  app.use(errorHandler);
}

module.exports = { configureApp, configureErrorHandling };