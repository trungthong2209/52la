const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const BotCommands = require('./bot/commands');
const googleSheets = require('./services/googleSheets');

// Validate configuration
if (!config.telegram.botToken) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(config.telegram.botToken, { polling: true });

console.log('🤖 Wild Card Score Tracker Bot starting...');

// Initialize Google Sheets
googleSheets.initialize().then((success) => {
  if (success) {
    googleSheets.initializeSheet();
  } else {
    console.warn('⚠️  Google Sheets not configured. Bot will still work but won\'t save to sheets.');
  }
});

// Command handlers
bot.onText(/\/start/, (msg) => BotCommands.handleStart(bot, msg));
bot.onText(/\/help/, (msg) => BotCommands.handleHelp(bot, msg));
bot.onText(/\/record/, (msg) => BotCommands.handleRecord(bot, msg));

// Handle all text messages (for score input)
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  // Check if message contains score format (Name: number pattern)
  if (msg.text && msg.text.match(/\w+:\s*-?\d+/)) {
    await BotCommands.handleScoreInput(bot, msg);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error.message);
});

console.log('✅ Bot is running! Send /start to begin.');

