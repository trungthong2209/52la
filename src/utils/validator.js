/**
 * Validates game scores
 */
class ScoreValidator {
  /**
   * Parse score input from text
   * Expected format: "Name1: score1, Name2: score2, ..."
   * Example: "Winz: 5, Luffy: 10, Lucas: -10, Finn: -5"
   * 
   * @param {string} text - Input text with scores
   * @returns {Object} Parsed scores object or null if invalid
   */
  static parseScores(text) {
    try {
      const scores = {};
      const pairs = text.split(',').map(p => p.trim());
      
      for (const pair of pairs) {
        const match = pair.match(/^(.+?):\s*(-?\d+)$/);
        if (!match) {
          return null;
        }
        
        const name = match[1].trim();
        const score = parseInt(match[2]);
        
        if (name && !isNaN(score)) {
          scores[name] = score;
        } else {
          return null;
        }
      }
      
      return Object.keys(scores).length > 0 ? scores : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate that scores sum to zero
   * @param {Object} scores - Object with player names as keys and scores as values
   * @returns {boolean} True if sum equals zero
   */
  static validateSum(scores) {
    const sum = Object.values(scores).reduce((acc, score) => acc + score, 0);
    return sum === 0;
  }

  /**
   * Format scores for display
   * @param {Object} scores - Scores object
   * @returns {string} Formatted string
   */
  static formatScores(scores) {
    return Object.entries(scores)
      .map(([name, score]) => `${name}: ${score > 0 ? '+' : ''}${score}`)
      .join(', ');
  }

  /**
   * Get sum of scores
   * @param {Object} scores - Scores object
   * @returns {number} Sum of all scores
   */
  static getSum(scores) {
    return Object.values(scores).reduce((acc, score) => acc + score, 0);
  }
}

module.exports = ScoreValidator;

