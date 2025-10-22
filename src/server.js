const express = require('express');
const cors = require('cors');
const path = require('path');
const ScoreValidator = require('./utils/validator');
const googleSheets = require('./services/googleSheets');
const googleChat = require('./services/googleChat');
const { users: USERS } = require('./config/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

/**
 * Get list of users
 */
app.get('/api/users', (req, res) => {
  res.json({ users: USERS });
});

/**
 * Submit game scores
 */
app.post('/api/submit-score', async (req, res) => {
  try {
    const { scores } = req.body;

    // Validate input
    if (!scores) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: scores'
      });
    }

    // Validate scores format (should be object with player names as keys)
    if (typeof scores !== 'object' || Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scores format'
      });
    }

    // Validate sum equals 0
    if (!ScoreValidator.validateSum(scores)) {
      const sum = ScoreValidator.getSum(scores);
      return res.status(400).json({
        success: false,
        message: `Invalid scores! Sum must equal 0. Current sum: ${sum}`
      });
    }

    // Save to Google Sheets
    const sheetSuccess = await googleSheets.appendGameRecord(scores, null);
    
    // Send to Google Chat
    const chatSuccess = await googleChat.sendGameNotification(scores, null);

    // Return response
    res.json({
      success: true,
      message: 'Game recorded successfully!',
      data: {
        scores,
        sheetSuccess,
        chatSuccess
      }
    });

  } catch (error) {
    console.error('Error submitting score:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while saving scores'
    });
  }
});

/**
 * Initialize Google Sheets (optional, called on server start)
 */
app.get('/api/init', async (req, res) => {
  try {
    const success = await googleSheets.initializeSheet();
    res.json({
      success,
      message: success ? 'Google Sheets initialized' : 'Failed to initialize Google Sheets'
    });
  } catch (error) {
    console.error('Error initializing:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing Google Sheets'
    });
  }
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Initializing Google Sheets...`);
  
  // Initialize Google Sheets on startup
  await googleSheets.initializeSheet();
  
  console.log(`✅ Server ready!`);
});

module.exports = app;

