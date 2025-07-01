const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validateOrganizerToken } = require('../../database/organizers');
const { asyncHandler, createSuccessResponse } = require('../../utils/errors');
const { HTTP_STATUS } = require('../../constants');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/shared');
  },
  filename: function (req, file, cb) {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types for CTF purposes
    cb(null, true);
  }
});

// Middleware to validate organizer token from Authorization header
const authenticateOrganizer = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Authorization token required' });
  }

  const token = authHeader.substring(7);
  const organizer = await validateOrganizerToken(token);

  if (!organizer) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid token' });
  }

  req.organizer = organizer;
  next();
});

// Validate organizer token
router.post('/validate', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Token required' });
  }

  const organizer = await validateOrganizerToken(token);

  if (!organizer) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({ error: 'Invalid token' });
  }

  res.json({
    valid: true,
    organizer: { 
      token: organizer.token, 
      name: organizer.name 
    }
  });
}));

// File upload endpoint
router.post('/upload-file', authenticateOrganizer, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'No file uploaded' });
  }

  res.json({
    success: true,
    file: {
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
}));

// Get list of uploaded files
router.get('/files', authenticateOrganizer, asyncHandler(async (req, res) => {
  try {
    const files = await fs.readdir('/tmp/shared');
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join('/tmp/shared', filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          size: stats.size,
          uploadedAt: stats.mtime,
          downloadUrl: `/api/organizer/files/${encodeURIComponent(filename)}/download`
        };
      })
    );

    res.json(fileDetails);
  } catch (error) {
    console.error('Error reading shared directory:', error);
    res.json([]);
  }
}));

// Download file endpoint
router.get('/files/:filename/download', authenticateOrganizer, asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('/tmp/shared', filename);

  try {
    await fs.access(filePath);
    res.download(filePath, filename);
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
  }
}));

// Delete file endpoint
router.delete('/files/:filename', authenticateOrganizer, asyncHandler(async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('/tmp/shared', filename);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'File not found' });
  }
}));

module.exports = router;