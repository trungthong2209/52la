const { google } = require('googleapis');
const fs = require('fs');
const config = require('../config/config');
const { users } = require('../config/users');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.initialized = false;
    this.sheetName = null;
  }

  /**
   * Initialize Google Sheets API
   */
  async initialize() {
    try {
      // Check if credentials file exists
      if (!fs.existsSync(config.googleSheets.credentialsPath)) {
        console.error('Google credentials file not found!');
        return false;
      }

      // Load credentials
      const credentials = JSON.parse(
        fs.readFileSync(config.googleSheets.credentialsPath, 'utf8')
      );

      // Create auth client
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;
      
      // Get the first sheet name
      await this.getSheetName();
      
      console.log('Google Sheets API initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error.message);
      return false;
    }
  }

  /**
   * Get the first sheet name from the spreadsheet
   */
  async getSheetName() {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId
      });
      
      if (response.data.sheets && response.data.sheets.length > 0) {
        this.sheetName = response.data.sheets[0].properties.title;
        console.log(`Using sheet: "${this.sheetName}"`);
      } else {
        this.sheetName = 'Sheet1'; // Fallback
      }
    } catch (error) {
      console.error('Failed to get sheet name:', error.message);
      this.sheetName = 'Sheet1'; // Fallback
    }
  }

  /**
   * Match input name to predefined user
   * @param {string} inputName - Name from user input
   * @returns {string|null} Matched user name or null
   */
  matchUser(inputName) {
    if (!inputName) return null;
    
    const normalizedInput = inputName.toLowerCase().trim();
    
    // Try exact match first (case-insensitive)
    const exactMatch = users.find(user => user.toLowerCase() === normalizedInput);
    if (exactMatch) return exactMatch;
    
    // Try partial match (if input contains user name or vice versa)
    const partialMatch = users.find(user => {
      const normalizedUser = user.toLowerCase();
      return normalizedUser.includes(normalizedInput) || normalizedInput.includes(normalizedUser);
    });
    
    return partialMatch || null;
  }

  /**
   * Match scores object keys to predefined users
   * @param {Object} scores - Original scores object
   * @returns {Object} Scores object with matched user names
   */
  matchScores(scores) {
    const matchedScores = {};
    
    for (const [inputName, score] of Object.entries(scores)) {
      const matchedUser = this.matchUser(inputName);
      if (matchedUser) {
        matchedScores[matchedUser] = score;
      } else {
        console.warn(`Could not match input "${inputName}" to any user`);
      }
    }
    
    return matchedScores;
  }

  /**
   * Get standard headers with all predefined users
   */
  getStandardHeaders() {
    return ['Timestamp', ...users];
  }

  /**
   * Get current headers from the sheet
   */
  async getHeaders() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${this.sheetName}!1:1`
      });

      if (response.data.values && response.data.values.length > 0) {
        return response.data.values[0];
      }
      return this.getStandardHeaders();
    } catch (error) {
      console.error('Failed to get headers:', error.message);
      return this.getStandardHeaders();
    }
  }

  /**
   * Ensure headers include all predefined users
   */
  async ensureHeaders() {
    try {
      const currentHeaders = await this.getHeaders();
      const standardHeaders = this.getStandardHeaders();
      
      // Check if headers match the standard structure
      const headersMatch = JSON.stringify(currentHeaders) === JSON.stringify(standardHeaders);
      
      if (!headersMatch) {
        // Update headers to standard structure
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheets.spreadsheetId,
          range: `${this.sheetName}!1:1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [standardHeaders]
          }
        });

        console.log('Headers updated to include all users:', users);
        return standardHeaders;
      }

      return currentHeaders;
    } catch (error) {
      console.error('Failed to ensure headers:', error.message);
      return null;
    }
  }

  /**
   * Append game record to Google Sheets
   * @param {Object} scores - Player scores
   * @param {string} submittedBy - User who submitted the record
   * @returns {Promise<boolean>} Success status
   */
  async appendGameRecord(scores, submittedBy) {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: config.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Match input names to predefined users
      const matchedScores = this.matchScores(scores);
      
      // Ensure headers include all users
      const headers = await this.ensureHeaders();

      if (!headers) {
        return false;
      }

      // Build row data matching header columns
      const rowData = [];
      for (const header of headers) {
        if (header === 'Timestamp') {
          rowData.push(timestamp);
        } else if (header === 'Submitted By') {
          rowData.push(submittedBy);
        } else if (matchedScores.hasOwnProperty(header)) {
          rowData.push(matchedScores[header]);
        } else {
          rowData.push(''); // Empty cell for players not in this game
        }
      }

      // Append to sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${this.sheetName}!A:Z`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      });

      console.log('Game record added to Google Sheets:', response.data.updates);
      console.log('Matched scores:', matchedScores);
      return true;
    } catch (error) {
      console.error('Failed to append to Google Sheets:', error.message);
      return false;
    }
  }

  /**
   * Initialize sheet with headers if needed
   */
  async initializeSheet() {
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      // Check if sheet has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${this.sheetName}!1:1`
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add standard headers with all users
        const standardHeaders = this.getStandardHeaders();
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheets.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [standardHeaders]
          }
        });
        console.log('Sheet initialized with all users:', users);
      } else {
        // Ensure headers are up to date
        await this.ensureHeaders();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize sheet:', error.message);
      return false;
    }
  }
}

module.exports = new GoogleSheetsService();

