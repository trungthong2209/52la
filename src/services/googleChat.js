const axios = require('axios');
const config = require('../config/config');

class GoogleChatService {
  /**
   * Send message to Google Chat
   * @param {Object} scores - Player scores
   * @param {string} submittedBy - User who submitted the record
   * @returns {Promise<boolean>} Success status
   */
  async sendGameNotification(scores, submittedBy) {
    try {
      if (!config.googleChat.webhookUrl) {
        console.warn('Google Chat webhook URL not configured');
        return false;
      }

      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: config.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Format scores display
      const scoresText = Object.entries(scores)
        .map(([player, score]) => `  • ${player}: ${score > 0 ? '+' : ''}${score}`)
        .join('\n');

      // Create message
      const message = {
        text: `🎮 *New Wild Card Game Result*\n\n` +
              `📅 Time: ${timestamp}\n\n` +
          `*Scores:*\n${scoresText}\n\n`
      };

      // Send to Google Chat
      const response = await axios.post(config.googleChat.webhookUrl, message);
      
      if (response.status === 200) {
        console.log('Notification sent to Google Chat successfully');
        return true;
      } else {
        console.error('Failed to send Google Chat notification:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error sending Google Chat notification:', error.message);
      return false;
    }
  }

  /**
   * Send error notification to Google Chat
   * @param {string} errorMessage - Error message
   * @returns {Promise<boolean>} Success status
   */
  async sendErrorNotification(errorMessage) {
    try {
      if (!config.googleChat.webhookUrl) {
        return false;
      }

      const message = {
        text: `⚠️ *Wild Card Bot Error*\n\n${errorMessage}`
      };

      await axios.post(config.googleChat.webhookUrl, message);
      return true;
    } catch (error) {
      console.error('Error sending error notification:', error.message);
      return false;
    }
  }
}

module.exports = new GoogleChatService();

