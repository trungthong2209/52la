# 🎮 Wild Card Score Tracker

A modern web application to track wild card game scores, automatically save them to Google Sheets, and send notifications to Google Chat.

## Features

- 🌐 **Beautiful Web UI** - Modern, responsive interface for score submission
- 👥 **User Management** - Select from a predefined list of users
- 📊 **Real-time Validation** - Scores must sum to 0 with live feedback
- 💾 **Auto-save to Google Sheets** - Automatic spreadsheet updates
- 💬 **Google Chat Notifications** - Instant notifications to your team
- ✅ **Input Validation** - Comprehensive error handling
- 📱 **Mobile Friendly** - Works on all devices

## Prerequisites

- Node.js (v14 or higher)
- Google Cloud Project with Sheets API enabled
- Google Service Account credentials
- Google Chat Webhook URL (optional)

## Installation

1. **Navigate to the project:**
   ```bash
   cd telebot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Required
   GOOGLE_SHEETS_ID=your_google_sheets_id_here
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
   
   # Optional
   GOOGLE_CHAT_WEBHOOK_URL=your_google_chat_webhook_url_here
   TZ=Asia/Bangkok
   PORT=3000
   ```

4. **Configure Google Sheets:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable Google Sheets API
   - Create a Service Account
   - Download the JSON credentials file
   - Save it as `google-credentials.json` in `src/config/` directory
   - Share your Google Sheet with the service account email (Editor permissions)

5. **Set up Google Chat (Optional):**
   - Go to your Google Chat space
   - Click on the space name → Apps & integrations → Add webhooks
   - Create a webhook and copy the URL to your `.env` file

6. **Configure Users:**
   Edit `src/config/users.js` to add or remove users:
   ```javascript
   module.exports = {
     users: [
       'Winz',
       'Luffy',
       'Lucas',
       'Finn',
       'Guma',
       'Guest'
     ]
   };
   ```

## Usage

### Start the Web Application

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Using the Web Interface

1. **Select User**: Choose your name from the dropdown
2. **Add Players**: Enter player names and their scores
3. **Validate**: The app shows if scores sum to 0 (required)
4. **Submit**: Click "Submit Scores" to save

**Rules:**
- At least 2 players required
- Scores can be positive or negative integers
- **The sum of all scores must equal 0**
- Each submission records who submitted it

**Example Game:**
```
Winz: +5
Luffy: +10
Lucas: -10
Finn: -5
Total: 0 ✓

Submitted by: Lucas
```

## API Endpoints

The application provides a REST API:

### `GET /api/users`
Get the list of available users.

**Response:**
```json
{
  "users": ["Winz", "Luffy", "Lucas", "Finn", "Guma", "Guest"]
}
```

### `POST /api/submit-score`
Submit a new game score.

**Request Body:**
```json
{
  "scores": {
    "Winz": 5,
    "Luffy": 10,
    "Lucas": -10,
    "Finn": -5
  },
  "submittedBy": "Lucas"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game recorded successfully!",
  "data": {
    "scores": {...},
    "submittedBy": "Lucas",
    "sheetSuccess": true,
    "chatSuccess": true
  }
}
```

## Project Structure

```
telebot/
├── src/
│   ├── server.js             # Express web server
│   ├── index.js              # Legacy Telegram bot (optional)
│   ├── config/
│   │   ├── config.js         # Configuration management
│   │   ├── users.js          # User list configuration
│   │   └── google-credentials.json  # Google service account credentials
│   ├── public/
│   │   ├── index.html        # Web UI
│   │   ├── styles.css        # Styling
│   │   └── app.js            # Frontend JavaScript
│   ├── bot/
│   │   └── commands.js       # Telegram bot commands (legacy)
│   ├── services/
│   │   ├── googleSheets.js   # Google Sheets integration
│   │   └── googleChat.js     # Google Chat integration
│   └── utils/
│       └── validator.js      # Score validation logic
├── .env                      # Environment variables (not in repo)
├── package.json              # Dependencies
└── README.md                 # This file
```

## Data Format

### Google Sheets Output

Each game is recorded with:
- **Timestamp** - When the game was submitted (with timezone)
- **Player Columns** - Dynamic columns for each player
- **Submitted By** - User who submitted the record

The sheet automatically adds new player columns as needed!

Example:
```
| Timestamp           | Guma | Luffy | Lucas | Finn | Winz | Submitted By |
|---------------------|------|-------|-------|------|------|--------------|
| 10/22/2025 14:30:00 |      | 10    | -10   | -5   | 5    | Lucas        |
| 10/22/2025 15:45:00 | 5    | 10    | -10   | -5   |      | Finn         |
```

### Google Chat Notification

The bot sends a formatted message to Google Chat:
```
🎮 New Wild Card Game Result

📅 Time: 10/22/2025, 14:30

Scores:
  • Winz: +5
  • Luffy: +10
  • Lucas: -10
  • Finn: -5

👤 Submitted by: Lucas
```

## Troubleshooting

### Application won't start
- Run `npm install` to ensure dependencies are installed
- Check if `PORT` is available (default: 3000)
- Verify `.env` file exists and has correct values

### Google Sheets not saving
- Verify `src/config/google-credentials.json` exists
- Check if sheet is shared with service account email
- Verify `GOOGLE_SHEETS_ID` is correct (found in sheet URL)
- Check console logs for detailed errors

### Google Chat not working
- Verify webhook URL is correct
- Check if webhook is still active in Chat space
- Google Chat is optional - app works without it

### Users not showing in dropdown
- Check `src/config/users.js` has the correct user list
- Restart the server after changing user configuration

## Customization

### Adding/Removing Users

Edit `src/config/users.js`:
```javascript
module.exports = {
  users: [
    'YourName',
    'Friend1',
    'Friend2',
    // Add more users here
  ]
};
```

### Changing Port

Edit `.env`:
```env
PORT=8080
```

### Customizing UI Colors

Edit `src/public/styles.css` and modify the CSS variables:
```css
:root {
    --primary-color: #4f46e5;
    --success-color: #10b981;
    /* Add your colors */
}
```

## Legacy Telegram Bot

The original Telegram bot is still available. To use it:

```bash
# Add to .env
TELEGRAM_BOT_TOKEN=your_bot_token

# Run the bot
npm run bot
```

## Development

To add new features:

1. **Add new API endpoints**: Edit `src/server.js`
2. **Modify UI**: Edit `src/public/index.html`, `styles.css`, `app.js`
3. **Change validation rules**: Edit `src/utils/validator.js`
4. **Customize sheet format**: Edit `src/services/googleSheets.js`
5. **Update notifications**: Edit `src/services/googleChat.js`

## License

ISC

## Support

For issues or questions:
1. Check that all dependencies are installed
2. Verify environment variables are set correctly
3. Ensure Google credentials file exists
4. Check console logs for detailed error messages
5. Verify Google Sheet is shared with service account

---

**Happy Gaming! 🎮**
