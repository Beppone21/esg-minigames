// === ESG MINI GAMES - COMMON FUNCTIONS ===

// Game Configuration
const GAME_CONFIG = {
    maxTokens: 1000,
    dailyLimits: {
        free: {
            quiz: 3,
            predictions: 1,
            memory: 5,
            portfolio: 1
        },
        premium: {
            quiz: 10,
            predictions: 5,
            memory: 15,
            portfolio: 3
        }
    },
    tokenRewards: {
        quiz: { min: 2, max: 9 },
        predictions: { min: 3, max: 21 },
        memory: { min: 1, max: 5 },
        portfolio: { min: 5, max: 15 }
    }
};

// === TOKEN MANAGEMENT ===

// Get total tokens
function getTotalTokens() {
    return parseInt(localStorage.getItem('esg_total_tokens')) || 0;
}

// Set total tokens
function setTotalTokens(amount) {
    const maxTokens = GAME_CONFIG.maxTokens;
    const finalAmount = Math.min(amount, maxTokens);
    localStorage.setItem('esg_total_tokens', finalAmount);
    updateTokenDisplay();
    return finalAmount;
}

// Add tokens with cap
function addTokens(amount) {
    const current = getTotalTokens();
    const newTotal = setTotalTokens(current + amount);
    
    // Update game stats
    incrementGamesPlayed();
    updateLastPlayTime();
    
    // Show reward animation
    showTokenReward(amount);
    
    return newTotal;
}

// Spend tokens
function spendTokens(amount) {
    const current = getTotalTokens();
    if (current >= amount) {
        setTotalTokens(current - amount);
        return true;
    }
    return false;
}

// === GAME STATISTICS ===

// Get game stats
function getGameStats() {
    return {
        totalTokens: getTotalTokens(),
        gamesPlayed: parseInt(localStorage.getItem('esg_games_played')) || 0,
        accuracy: parseInt(localStorage.getItem('esg_accuracy')) || 0,
        streak: parseInt(localStorage.getItem('esg_streak')) || 0,
        quizScore: parseInt(localStorage.getItem('esg_quiz_score')) || 0,
        predictionsWon: parseInt(localStorage.getItem('esg_predictions_won')) || 0,
        memoryBest: parseInt(localStorage.getItem('esg_memory_best')) || 0,
        portfolioScore: parseInt(localStorage.getItem('esg_portfolio_score')) || 0
    };
}

// Update specific stat
function updateStat(statName, value) {
    localStorage.setItem(`esg_${statName}`, value);
    updateStatsDisplay();
}

// Increment games played
function incrementGamesPlayed() {
    const current = parseInt(localStorage.getItem('esg_games_played')) || 0;
    updateStat('games_played', current + 1);
}

// Update accuracy
function updateAccuracy(correct, total) {
    const currentGames = parseInt(localStorage.getItem('esg_games_played')) || 0;
    const currentAccuracy = parseInt(localStorage.getItem('esg_accuracy')) || 0;
    
    // Calculate weighted average
    const newAccuracy = Math.round(((currentAccuracy * currentGames) + (correct / total * 100)) / (currentGames + 1));
    updateStat('accuracy', newAccuracy);
}

// Update streak
function updateStreak(won) {
    const currentStreak = parseInt(localStorage.getItem('esg_streak')) || 0;
    const newStreak = won ? currentStreak + 1 : 0;
    updateStat('streak', newStreak);
}

// === DAILY LIMITS ===

// Get today's date string
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// Check daily limit for a game
function checkDailyLimit(gameType) {
    const today = getTodayString();
    const playKey = `esg_${gameType}_plays_${today}`;
    const plays = parseInt(localStorage.getItem(playKey)) || 0;
    const isPremium = isPremiumUser();
    const limit = isPremium ? GAME_CONFIG.dailyLimits.premium[gameType] : GAME_CONFIG.dailyLimits.free[gameType];
    
    return {
        plays: plays,
        limit: limit,
        remaining: Math.max(0, limit - plays),
        canPlay: plays < limit
    };
}

// Record a game play
function recordGamePlay(gameType) {
    const today = getTodayString();
    const playKey = `esg_${gameType}_plays_${today}`;
    const plays = parseInt(localStorage.getItem(playKey)) || 0;
    localStorage.setItem(playKey, plays + 1);
}

// === USER PREMIUM STATUS ===

// Check if user is premium (you can modify this logic)
function isPremiumUser() {
    return localStorage.getItem('esg_premium_user') === 'true';
}

// Set premium status
function setPremiumStatus(isPremium) {
    localStorage.setItem('esg_premium_user', isPremium);
    updatePremiumDisplay();
}

// === ACHIEVEMENTS SYSTEM ===

// Achievement definitions
const ACHIEVEMENTS = {
    first_game: { name: "First Steps", description: "Play your first game", tokens: 5 },
    token_collector: { name: "Token Collector", description: "Earn 100 tokens", tokens: 10 },
    quiz_master: { name: "Quiz Master", description: "Score 100% on a quiz", tokens: 15 },
    prediction_pro: { name: "Prediction Pro", description: "Win 5 predictions in a row", tokens: 20 },
    daily_player: { name: "Daily Player", description: "Play games 7 days in a row", tokens: 25 },
    esg_expert: { name: "ESG Expert", description: "Reach 90% overall accuracy", tokens: 30 }
};

// Check and unlock achievements
function checkAchievements() {
    const stats = getGameStats();
    const unlockedAchievements = JSON.parse(localStorage.getItem('esg_achievements')) || [];
    let newAchievements = [];

    // Check each achievement
    Object.keys(ACHIEVEMENTS).forEach(key => {
        if (!unlockedAchievements.includes(key)) {
            let unlocked = false;
            
            switch(key) {
                case 'first_game':
                    unlocked = stats.gamesPlayed >= 1;
                    break;
                case 'token_collector':
                    unlocked = stats.totalTokens >= 100;
                    break;
                case 'quiz_master':
                    unlocked = localStorage.getItem('esg_perfect_quiz') === 'true';
                    break;
                case 'prediction_pro':
                    unlocked = stats.streak >= 5;
                    break;
                case 'daily_player':
                    unlocked = checkDailyStreak() >= 7;
                    break;
                case 'esg_expert':
                    unlocked = stats.accuracy >= 90 && stats.gamesPlayed >= 10;
                    break;
            }
            
            if (unlocked) {
                unlockedAchievements.push(key);
                newAchievements.push(key);
                addTokens(ACHIEVEMENTS[key].tokens);
            }
        }
    });

    // Save updated achievements
    localStorage.setItem('esg_achievements', JSON.stringify(unlockedAchievements));
    
    // Show new achievements
    newAchievements.forEach(achievement => {
        showAchievementUnlock(achievement);
    });
}

// Check daily playing streak
function checkDailyStreak() {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const hadActivity = localStorage.getItem(`esg_activity_${dateString}`) === 'true';
        if (hadActivity) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// === UI UPDATES ===

// Update token display
function updateTokenDisplay() {
    const tokenElements = document.querySelectorAll('.token-display, #totalTokens');
    const tokens = getTotalTokens();
    
    tokenElements.forEach(element => {
        if (element) {
            element.textContent = tokens;
        }
    });
}

// Update stats display
function updateStatsDisplay() {
    const stats = getGameStats();
    
    // Update individual stat elements
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (key === 'accuracy') {
                element.textContent = stats[key] + '%';
            } else {
                element.textContent = stats[key];
            }
        }
    });
}

// Update premium display
function updatePremiumDisplay() {
    const isPremium = isPremiumUser();
    const premiumElements = document.querySelectorAll('.premium-indicator');
    
    premiumElements.forEach(element => {
        element.style.display = isPremium ? 'block' : 'none';
    });
}

// === ANIMATIONS & NOTIFICATIONS ===

// Show token reward animation
function showTokenReward(amount) {
    const reward = document.createElement('div');
    reward.className = 'token-reward-popup';
    reward.innerHTML = `+${amount} 🪙`;
    
    // Style the popup
    Object.assign(reward.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(45deg, #10B981, #34D399)',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '20px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        zIndex: '1000',
        animation: 'bounceIn 0.5s ease-out',
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
    });
    
    document.body.appendChild(reward);
    
    // Remove after animation
    setTimeout(() => {
        reward.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => reward.remove(), 500);
    }, 2000);
}

// Show achievement unlock
function showAchievementUnlock(achievementKey) {
    const achievement = ACHIEVEMENTS[achievementKey];
    
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <h3>🏆 Achievement Unlocked!</h3>
        <h4>${achievement.name}</h4>
        <p>${achievement.description}</p>
        <small>+${achievement.tokens} tokens bonus!</small>
    `;
    
    Object.assign(popup.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(16, 185, 129, 0.95)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '15px',
        maxWidth: '300px',
        zIndex: '1001',
        animation: 'slideInRight 0.5s ease-out',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
    });
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => popup.remove(), 500);
    }, 4000);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: `${colors[type]}20`,
        border: `2px solid ${colors[type]}`,
        color: 'white',
        padding: '1rem',
        borderRadius: '10px',
        zIndex: '1001',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === UTILITY FUNCTIONS ===

// Update last play time
function updateLastPlayTime() {
    const today = getTodayString();
    localStorage.setItem('esg_last_play', today);
    localStorage.setItem(`esg_activity_${today}`, 'true');
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get random element from array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate percentage
function calculatePercentage(part, total) {
    return total === 0 ? 0 : Math.round((part / total) * 100);
}

// === GAME NAVIGATION ===

// Navigate to game
function navigateToGame(gameType) {
    const limits = checkDailyLimit(gameType);
    
    if (!limits.canPlay) {
        showNotification(`Daily limit reached! Come back tomorrow or upgrade to premium.`, 'warning');
        return;
    }
    
    const gameUrls = {
        quiz: 'quiz.html',
        predictions: 'predictions.html',
        memory: 'memory.html',
        portfolio: 'portfolio.html'
    };
    
    window.location.href = gameUrls[gameType] || 'index.html';
}

// === INITIALIZATION ===

// Initialize common functionality
function initializeCommon() {
    // Update displays
    updateTokenDisplay();
    updateStatsDisplay();
    updatePremiumDisplay();
    
    // Check achievements
    checkAchievements();
    
    // Add CSS animations if not already present
    if (!document.getElementById('common-animations')) {
        const style = document.createElement('style');
        style.id = 'common-animations';
        style.textContent = `
            @keyframes bounceIn {
                0% { transform: translate(-50%, -50%) scale(0); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCommon);
} else {
    initializeCommon();
}

// === EXPORT FOR MODULE USAGE ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTotalTokens,
        addTokens,
        spendTokens,
        getGameStats,
        updateAccuracy,
        updateStreak,
        checkDailyLimit,
        recordGamePlay,
        isPremiumUser,
        setPremiumStatus,
        checkAchievements,
        showNotification,
        navigateToGame,
        initializeCommon
    };
}
