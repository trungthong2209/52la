// API Base URL
const API_BASE = window.location.origin;

// State
let playerCount = 0;
let users = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
    // Initialize with exactly 4 players
    for (let i = 0; i < 4; i++) {
        addPlayerInput();
    }
    
    // Event listeners
    document.getElementById('submitBtn').addEventListener('click', handleSubmit);
});

/**
 * Load users from API
 */
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const data = await response.json();
        users = data.users;
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

/**
 * Create player name dropdown
 */
function createPlayerDropdown(playerId) {
    const select = document.createElement('select');
    select.className = 'player-name';
    select.dataset.playerId = playerId;
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Player --';
    select.appendChild(defaultOption);
    
    // Add user options
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        select.appendChild(option);
    });
    
    return select;
}

/**
 * Get all selected player names (excluding the current dropdown)
 */
function getSelectedPlayers(excludePlayerId = null) {
    const selected = [];
    const rows = document.querySelectorAll('.score-input-row');
    
    rows.forEach(row => {
        const nameSelect = row.querySelector('.player-name');
        const playerId = nameSelect.dataset.playerId;
        
        // Skip the current dropdown
        if (excludePlayerId && playerId === excludePlayerId.toString()) {
            return;
        }
        
        if (nameSelect.value) {
            selected.push(nameSelect.value);
        }
    });
    
    return selected;
}

/**
 * Update dropdown options to hide/show players based on selections
 */
function updateDropdownOptions() {
    const rows = document.querySelectorAll('.score-input-row');
    
    rows.forEach(row => {
        const nameSelect = row.querySelector('.player-name');
        const currentPlayerId = nameSelect.dataset.playerId;
        const currentValue = nameSelect.value;
        
        // Get players selected in other dropdowns
        const selectedPlayers = getSelectedPlayers(currentPlayerId);
        
        // Clear and rebuild options
        nameSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select Player --';
        nameSelect.appendChild(defaultOption);
        
        // Add only available players
        users.forEach(user => {
            // Skip if this player is already selected in another dropdown
            if (!selectedPlayers.includes(user)) {
                const option = document.createElement('option');
                option.value = user;
                option.textContent = user;
                // Mark as selected if this was the current value
                if (user === currentValue) {
                    option.selected = true;
                }
                nameSelect.appendChild(option);
            }
        });
    });
}

/**
 * Add a new player input row
 */
function addPlayerInput() {
    playerCount++;
    const container = document.getElementById('scoreInputs');
    
    const row = document.createElement('div');
    row.className = 'score-input-row';
    row.id = `player-${playerCount}`;
    
    // Create player dropdown
    const playerDropdown = createPlayerDropdown(playerCount);
    
    // Create score input
    const scoreInput = document.createElement('input');
    scoreInput.type = 'number';
    scoreInput.placeholder = 'Score';
    scoreInput.className = 'player-score';
    scoreInput.dataset.playerId = playerCount;
    scoreInput.value = '';
    
    // Append elements (no remove button for fixed 4 players)
    row.appendChild(playerDropdown);
    row.appendChild(scoreInput);
    
    container.appendChild(row);
    
    // Add event listeners for dropdown updates
    playerDropdown.addEventListener('change', () => {
        updateDropdownOptions();
    });
    
    // Update dropdown options for existing dropdowns
    updateDropdownOptions();
}

/**
 * Remove a player input row
 */
function removePlayer(id) {
    const row = document.getElementById(`player-${id}`);
    if (row) {
        row.remove();
        updateDropdownOptions();
    }
}

/**
 * Get scores from input fields
 */
function getScores() {
    const scores = {};
    const rows = document.querySelectorAll('.score-input-row');
    
    rows.forEach(row => {
        const nameSelect = row.querySelector('.player-name');
        const scoreInput = row.querySelector('.player-score');
        
        const name = nameSelect.value; // No need to trim, it's a select value
        const score = parseInt(scoreInput.value) || 0;
        
        if (name) {
            scores[name] = score;
        }
    });
    
    return scores;
}

/**
 * Validate form
 */
function validateForm() {
    const scores = getScores();
    
    // Check if exactly 4 players
    if (Object.keys(scores).length !== 4) {
        showStatus('Please select all 4 players', 'error');
        return false;
    }
    
    // Check if all players have names
    const hasEmptyNames = Object.keys(scores).some(name => !name);
    if (hasEmptyNames) {
        showStatus('Please select all 4 players', 'error');
        return false;
    }
    
    return true;
}

/**
 * Handle form submission
 */
async function handleSubmit() {
    // Validate
    if (!validateForm()) {
        return;
    }
    
    const scores = getScores();
    
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(`${API_BASE}/api/submit-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scores
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus('✅ Game recorded successfully!', 'success');
            displayLastSubmission(scores, data.data);
            resetForm();
        } else {
            showStatus(`❌ Error: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showStatus('❌ Failed to submit scores. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Scores';
    }
}

/**
 * Display last submission info
 */
function displayLastSubmission(scores, details) {
    const infoCard = document.getElementById('infoCard');
    const lastSubmission = document.getElementById('lastSubmission');
    
    let html = '<p><strong>Scores:</strong></p><ul>';
    
    for (const [player, score] of Object.entries(scores)) {
        const sign = score >= 0 ? '+' : '';
        html += `<li>${player}: ${sign}${score}</li>`;
    }
    
    html += '</ul>';
    
    if (details.sheetSuccess) {
        html += '<p>✓ Saved to Google Sheets</p>';
    }
    if (details.chatSuccess) {
        html += '<p>✓ Google Chat notified</p>';
    }
    
    lastSubmission.innerHTML = html;
    infoCard.style.display = 'block';
    
    // Scroll to show the card
    setTimeout(() => {
        infoCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const statusMsg = document.getElementById('statusMessage');
    statusMsg.textContent = message;
    statusMsg.className = `status-message ${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 5000);
}

/**
 * Reset form
 */
function resetForm() {
    // Clear player inputs
    const container = document.getElementById('scoreInputs');
    container.innerHTML = '';
    playerCount = 0;
    
    // Add exactly 4 player inputs
    for (let i = 0; i < 4; i++) {
        addPlayerInput();
    }
}

