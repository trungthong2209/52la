const ScoreValidator = require('../utils/validator');
const googleSheets = require('../services/googleSheets');
const googleChat = require('../services/googleChat');

class BotCommands {
  /**
   * Handle /start command
   */
  static async handleStart(bot, msg) {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🎮 *Welcome to Wild Card Score Tracker!*

This bot helps you track your wild card game scores.

*Commands:*
/start - Show this help message
/record - Record a new game (interactive mode)
/history - View recent games (coming soon)
/help - Show help

*Quick Record Format:*
Send scores directly in this format:
\`Name1: score1, Name2: score2, ...\`

*Example:*
\`Winz: 5, Luffy: 10, Lucas: -10, Finn: -5\`

⚠️ *Important:* All scores must sum to 0!
    `.trim();

    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /help command
   */
  static async handleHelp(bot, msg) {
    await this.handleStart(bot, msg);
  }

  /**
   * Handle direct score input
   */
  static async handleScoreInput(bot, msg) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from.username || msg.from.first_name || 'Unknown';

    // Parse scores
    const scores = ScoreValidator.parseScores(text);
    
    if (!scores) {
      await bot.sendMessage(
        chatId,
        '❌ Invalid format! Please use:\n' +
        '`Name1: score1, Name2: score2, ...`\n\n' +
        'Example: `Winz: 5, Luffy: 10, Lucas: -10, Finn: -5`',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Validate sum
    if (!ScoreValidator.validateSum(scores)) {
      const sum = ScoreValidator.getSum(scores);
      await bot.sendMessage(
        chatId,
        `❌ Invalid scores! Sum must equal 0.\n` +
        `Current sum: ${sum}\n\n` +
        `Scores: ${ScoreValidator.formatScores(scores)}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Show loading message
    const loadingMsg = await bot.sendMessage(chatId, '⏳ Saving game record...');

    try {
      // Save to Google Sheets
      const sheetSuccess = await googleSheets.appendGameRecord(scores, username);
      
      // Send to Google Chat
      const chatSuccess = await googleChat.sendGameNotification(scores, username);

      // Delete loading message
      await bot.deleteMessage(chatId, loadingMsg.message_id);

      // Send success message
      let statusMessage = '✅ *Game recorded successfully!*\n\n';
      statusMessage += `*Scores:*\n${ScoreValidator.formatScores(scores)}\n\n`;
      
      if (sheetSuccess) {
        statusMessage += '📊 Saved to Google Sheets ✓\n';
      } else {
        statusMessage += '📊 Google Sheets: Failed ✗\n';
      }
      
      if (chatSuccess) {
        statusMessage += '💬 Google Chat notified ✓';
      } else {
        statusMessage += '💬 Google Chat: Failed ✗';
      }

      await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error processing game record:', error);
      await bot.deleteMessage(chatId, loadingMsg.message_id);
      await bot.sendMessage(
        chatId,
        '❌ Error saving game record. Please try again later.'
      );
    }
  }

  /**
   * Handle /record command (interactive mode)
   */
  static async handleRecord(bot, msg) {
    const chatId = msg.chat.id;
    
    const instructions = `
📝 *Record New Game*

Please send the scores in this format:
\`Name1: score1, Name2: score2, ...\`

*Example:*
\`Winz: 5, Luffy: 10, Lucas: -10, Finn: -5\`

⚠️ Remember: All scores must sum to 0!
    `.trim();

    await bot.sendMessage(chatId, instructions, { parse_mode: 'Markdown' });
  }
}

module.exports = BotCommands;

