require('dotenv').config();
const credentials = require('./google-credentials.json');

module.exports = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    credentialsPath: './src/config/google-credentials.json',
    credentials: credentials
  },
  googleChat: {
    webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL
  },
  timezone: process.env.TZ || 'Asia/Bangkok'
};

