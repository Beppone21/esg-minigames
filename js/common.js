// === ESG MINI GAMES - UPDATED TOKEN SYSTEM ===

// Game Configuration - NEW BALANCED SYSTEM
const GAME_CONFIG = {
    maxTokens: 100, // Realistic cap for engaging progression
    
    // Daily limits per account type
    dailyLimits: {
        free: {
            quickQuiz: 3,        // 5-question quiz
            dailyPrediction: 1,  // Market prediction
            memoryMatch: 5,      // Memory game
            weeklyChallenge: 1,  // Once per week
            monthlyEvent: 1      // Once per month
        },
        premium: {
            quickQuiz: 10,
            dailyPrediction: 5,
            memoryMatch: 15,
            weeklyChallenge: 3,
            monthlyEvent: 3
        }
    },
    
    // Token rewards - NEW REALISTIC SYSTEM
    tokenRewards: {
        free: {
            // Daily Micro-Games: 1-3 tokens
            quickQuiz: { min: 1, max: 2, perfect: 3 },      // 5 questions
            dailyPrediction: { min: 2, max: 3, bonus: 1 },  // Market prediction
            memoryMatch: { base: 1, streak: 0.5 },          // Memory game
            
            // Weekly Challenges: 5-8 tokens  
            portfolioBuilder: { min: 5, max: 7, perfect: 8 },
            esgCrisis: { min: 3, max: 5, expert: 2 },
            companyDetective: { min: 4, max: 6, bonus: 2 },
            
            // Monthly Events: 10-15 tokens
            knowledgeChampionship: { min: 10, max: 15, champion: 5 },
            seasonalChallenge: { min: 8, max: 12, seasonal: 3 }
        },
        premium: {
            // Daily Micro-Games: 3-9 tokens (3x multiplier)
            quickQuiz: { min: 3, max: 6, perfect: 9 },
            dailyPrediction: { min: 6, max: 9, bonus: 3 },
            memoryMatch: { base: 3, streak: 1.5 },
            
            // Weekly Challenges: 15-24 tokens
            portfolioBuilder: { min: 15, max: 21, perfect: 24 },
            esgCrisis: { min: 9, max: 15, expert: 6 },
            companyDetective: { min: 12, max: 18, bonus: 6 },
            
            // Monthly Events: 30-45 tokens
            knowledgeChampionship: { min: 30, max: 45, champion: 15 },
            seasonalChallenge: { min: 24, max: 36, seasonal: 9 }
        }
    }
};

// === GAME TYPE DEFINITIONS ===

const GAME_TYPES = {
    // Daily Micro-Games
    QUICK_QUIZ: 'quickQuiz',
    DAILY_PREDICTION: 'dailyPrediction', 
    MEMORY_MATCH: 'memoryMatch',
    
    // Weekly Challenges
    PORTFOLIO_BUILDER: 'portfolioBuilder',
    ESG_CRISIS: 'esgCrisis',
    COMPANY_DETECTIVE: 'companyDetective',
    
    // Monthly Events
    KNOWLEDGE_CHAMPIONSHIP: 'knowledgeChampionship',
    SEASONAL_CHALLENGE: 'seasonalChallenge'
};

const GAME_FREQUENCIES = {
    DAILY: 'daily',
    WEEKLY: 'weekly', 
    MONTHLY: 'monthly'
};

// === ENHANCED TOKEN MANAGEMENT ===

// Calculate tokens for specific game and performance
function calculateTokenReward(gameType, performance = {}) {
    const isPremium = isPremiumUser();
    const rewards = isPremium ? GAME_CONFIG.tokenRewards.premium : GAME_CONFIG.tokenRewards.free;
    const gameReward = rewards[gameType];
    
    if (!gameReward) return 0;
    
    let tokens = 0;
    
    // Base calculation
    if (gameReward.min && gameReward.max) {
        const range = gameReward.max - gameReward.min;
        const performanceMultiplier = (performance.score || 50) / 100; // 0-1 based on score
        tokens = Math.round(gameReward.min + (range * performanceMultiplier));
    } else if (gameReward.base) {
        tokens = gameReward.base;
        if (performance.streak && gameReward.streak) {
            tokens += Math.floor(performance.streak * gameReward.streak);
        }
    }
    
    // Bonus calculations
    if (performance.perfect && gameReward.perfect) {
        tokens = gameReward.perfect;
    } else if (performance.expert && gameReward.expert) {
        tokens += gameReward.expert;
    } else if (performance.bonus && gameReward.bonus) {
        tokens += gameReward.bonus;
    }
    
    return Math.max(1, tokens); // Minimum 1 token
}

// Add tokens with enhanced tracking
function addTokens(amount, gameType = null, performance = {}) {
    const current = getTotalTokens();
    const newTotal = setTotalTokens(current + amount);
    
    // Enhanced tracking
    incrementGamesPlayed(gameType);
    updateLastPlayTime();
    
    // Record specific game stats
    if (gameType) {
        recordGameStats(gameType, performance, amount);
    }
    
    // Show reward animation
    showTokenReward(amount, gameType);
    
    // Check achievements after token addition
    checkAchievements();
    
    return newTotal;
}

// === GAME FREQUENCY MANAGEMENT ===

// Check if game can be played based on frequency
function canPlayGame(gameType) {
    const today = getTodayString();
    const thisWeek = getWeekString();
    const thisMonth = getMonthString();
    
    let playKey, frequency, limit;
    
    // Determine frequency and limits
    if (['quickQuiz', 'dailyPrediction', 'memoryMatch'].includes(gameType)) {
        frequency = GAME_FREQUENCIES.DAILY;
        playKey = `esg_${gameType}_plays_${today}`;
        limit = isPremiumUser() ? 
            GAME_CONFIG.dailyLimits.premium[gameType] : 
            GAME_CONFIG.dailyLimits.free[gameType];
    } else if (['portfolioBuilder', 'esgCrisis', 'companyDetective'].includes(gameType)) {
        frequency = GAME_FREQUENCIES.WEEKLY;
        playKey = `esg_${gameType}_plays_${thisWeek}`;
        limit = isPremiumUser() ? 
            GAME_CONFIG.dailyLimits.premium.weeklyChallenge : 
            GAME_CONFIG.dailyLimits.free.weeklyChallenge;
    } else {
        frequency = GAME_FREQUENCIES.MONTHLY;
        playKey = `esg_${gameType}_plays_${thisMonth}`;
        limit = isPremiumUser() ? 
            GAME_CONFIG.dailyLimits.premium.monthlyEvent : 
            GAME_CONFIG.dailyLimits.free.monthlyEvent;
    }
    
    const plays = parseInt(localStorage.getItem(playKey)) || 0;
    
    return {
        canPlay: plays < limit,
        plays: plays,
        limit: limit,
        remaining: Math.max(0, limit - plays),
        frequency: frequency,
        resetTime: getNextResetTime(frequency)
    };
}

// Record game play with frequency awareness
function recordGamePlay(gameType) {
    const today = getTodayString();
    const thisWeek = getWeekString();
    const thisMonth = getMonthString();
    
    let playKey;
    
    if (['quickQuiz', 'dailyPrediction', 'memoryMatch'].includes(gameType)) {
        playKey = `esg_${gameType}_plays_${today}`;
    } else if (['portfolioBuilder', 'esgCrisis', 'companyDetective'].includes(gameType)) {
        playKey = `esg_${gameType}_plays_${thisWeek}`;
    } else {
        playKey = `esg_${gameType}_plays_${thisMonth}`;
    }
    
    const plays = parseInt(localStorage.getItem(playKey)) || 0;
    localStorage.setItem(playKey, plays + 1);
}

// === DATE UTILITY FUNCTIONS ===

function getWeekString() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${today.getFullYear()}-W${weekNumber}`;
}

function getMonthString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function getNextResetTime(frequency) {
    const now = new Date();
    let resetTime = new Date();
    
    switch(frequency) {
        case GAME_FREQUENCIES.DAILY:
            resetTime.setDate(now.getDate() + 1);
            resetTime.setHours(0, 0, 0, 0);
            break;
        case GAME_FREQUENCIES.WEEKLY:
            const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
            resetTime.setDate(now.getDate() + daysUntilMonday);
            resetTime.setHours(0, 0, 0, 0);
            break;
        case GAME_FREQUENCIES.MONTHLY:
            resetTime.setMonth(now.getMonth() + 1, 1);
            resetTime.setHours(0, 0, 0, 0);
            break;
    }
    
    return resetTime;
}

// === ENHANCED GAME STATISTICS ===

function recordGameStats(gameType, performance, tokensEarned) {
    const statsKey = `esg_${gameType}_stats`;
    const existingStats = JSON.parse(localStorage.getItem(statsKey)) || {
        totalPlays: 0,
        totalTokens: 0,
        bestScore: 0,
        averageScore: 0,
        perfectGames: 0,
        lastPlayed: null
    };
    
    existingStats.totalPlays++;
    existingStats.totalTokens += tokensEarned;
    existingStats.lastPlayed = new Date().toISOString();
    
    if (performance.score) {
        existingStats.bestScore = Math.max(existingStats.bestScore, performance.score);
        existingStats.averageScore = ((existingStats.averageScore * (existingStats.totalPlays - 1)) + performance.score) / existingStats.totalPlays;
    }
    
    if (performance.perfect) {
        existingStats.perfectGames++;
    }
    
    localStorage.setItem(statsKey, JSON.stringify(existingStats));
}

// Get game-specific statistics
function getGameStats(gameType) {
    const statsKey = `esg_${gameType}_stats`;
    return JSON.parse(localStorage.getItem(statsKey)) || {
        totalPlays: 0,
        totalTokens: 0,
        bestScore: 0,
        averageScore: 0,
        perfectGames: 0,
        lastPlayed: null
    };
}

// === ENHANCED ACHIEVEMENTS ===

const ENHANCED_ACHIEVEMENTS = {
    // Daily Game Achievements
    first_quiz: { name: "Quiz Beginner", description: "Complete your first ESG quiz", tokens: 2, gameType: 'quickQuiz' },
    quiz_streak_3: { name: "Quiz Enthusiast", description: "Complete 3 quizzes in a row", tokens: 5, gameType: 'quickQuiz' },
    quiz_perfect: { name: "ESG Scholar", description: "Score 100% on a quiz", tokens: 8, gameType: 'quickQuiz' },
    
    prediction_master: { name: "Market Prophet", description: "Correct prediction 5 days in a row", tokens: 10, gameType: 'dailyPrediction' },
    memory_champion: { name: "Memory Master", description: "Complete memory game in under 30 seconds", tokens: 6, gameType: 'memoryMatch' },
    
    // Weekly Challenge Achievements  
    portfolio_genius: { name: "Portfolio Genius", description: "Build perfect ESG portfolio", tokens: 15, gameType: 'portfolioBuilder' },
    crisis_manager: { name: "Crisis Manager", description: "Handle 10 ESG crises expertly", tokens: 12, gameType: 'esgCrisis' },
    company_detective: { name: "ESG Detective", description: "Investigate 5 companies successfully", tokens: 10, gameType: 'companyDetective' },
    
    // Monthly Event Achievements
    knowledge_champion: { name: "Knowledge Champion", description: "Win monthly championship", tokens: 25, gameType: 'knowledgeChampionship' },
    seasonal_expert: { name: "Seasonal Expert", description: "Complete all seasonal challenges", tokens: 20, gameType: 'seasonalChallenge' },
    
    // Token Milestones
    token_collector_25: { name: "Token Starter", description: "Earn 25 tokens", tokens: 2 },
    token_collector_50: { name: "Token Collector", description: "Earn 50 tokens", tokens: 5 },
    token_collector_100: { name: "Token Master", description: "Reach 100 tokens", tokens: 10 },
    
    // Streak Achievements
    daily_player_7: { name: "Weekly Warrior", description: "Play 7 days in a row", tokens: 10 },
    daily_player_30: { name: "Monthly Master", description: "Play 30 days in a row", tokens: 25 },
    
    // Accuracy Achievements
    accuracy_expert: { name: "Accuracy Expert", description: "Maintain 85% accuracy over 10 games", tokens: 8 },
    esg_guru: { name: "ESG Guru", description: "Maintain 95% accuracy over 20 games", tokens: 15 }
};

// === ENHANCED UI FUNCTIONS ===

// Show enhanced token reward with game context
function showTokenReward(amount, gameType = null) {
    const reward = document.createElement('div');
    reward.className = 'token-reward-popup';
    
    let gameIcon = '🪙';
    let gameText = '';
    
    if (gameType) {
        const gameIcons = {
            quickQuiz: '🧠',
            dailyPrediction: '🔮', 
            memoryMatch: '🃏',
            portfolioBuilder: '🎯',
            esgCrisis: '⚡',
            companyDetective: '🔍',
            knowledgeChampionship: '🏆',
            seasonalChallenge: '🌟'
        };
        gameIcon = gameIcons[gameType] || '🪙';
        gameText = gameType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    reward.innerHTML = `
        <div style="font-size: 2rem;">${gameIcon}</div>
        <div style="font-size: 1.5rem; font-weight: bold;">+${amount} tokens!</div>
        ${gameText ? `<div style="font-size: 0.9rem; opacity: 0.8;">${gameText}</div>` : ''}
    `;
    
    Object.assign(reward.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(45deg, #10B981, #34D399)',
        color: 'white',
        padding: '1.5rem 2rem',
        borderRadius: '20px',
        textAlign: 'center',
        zIndex: '1000',
        animation: 'bounceIn 0.5s ease-out',
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)'
    });
    
    document.body.appendChild(reward);
    
    setTimeout(() => {
        reward.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => reward.remove(), 500);
    }, 2500);
}

// Display available games with limits
function displayAvailableGames() {
    const gamesList = document.getElementById('availableGames');
    if (!gamesList) return;
    
    const games = [
        { type: 'quickQuiz', name: 'ESG Quick Quiz', icon: '🧠', desc: '5 quick questions' },
        { type: 'dailyPrediction', name: 'Market Prediction', icon: '🔮', desc: 'Predict ETF performance' },
        { type: 'memoryMatch', name: 'ESG Memory', icon: '🃏', desc: 'Match ESG concepts' },
        { type: 'portfolioBuilder', name: 'Portfolio Builder', icon: '🎯', desc: 'Build ESG portfolio' },
        { type: 'esgCrisis', name: 'ESG Crisis', icon: '⚡', desc: 'Handle sustainability crisis' },
        { type: 'companyDetective', name: 'Company Detective', icon: '🔍', desc: 'Investigate ESG practices' }
    ];
    
    gamesList.innerHTML = games.map(game => {
        const availability = canPlayGame(game.type);
        const isPremium = isPremiumUser();
        const rewards = isPremium ? 
            GAME_CONFIG.tokenRewards.premium[game.type] : 
            GAME_CONFIG.tokenRewards.free[game.type];
        
        let tokenRange = '';
        if (rewards.min && rewards.max) {
            tokenRange = `${rewards.min}-${rewards.max} tokens`;
        } else if (rewards.base) {
            tokenRange = `${rewards.base}+ tokens`;
        }
        
        const canPlay = availability.canPlay;
        const resetTime = availability.resetTime;
        
        return `
            <div class="game-card ${canPlay ? '' : 'disabled'}" 
                 onclick="${canPlay ? `playGame('${game.type}')` : ''}">
                <div class="game-icon">${game.icon}</div>
                <h3>${game.name}</h3>
                <p>${game.desc}</p>
                <div class="token-info">${tokenRange}</div>
                <div class="availability-info">
                    ${canPlay ? 
                        `${availability.remaining} plays remaining` : 
                        `Resets ${formatResetTime(resetTime)}`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Format reset time for display
function formatResetTime(resetTime) {
    const now = new Date();
    const diff = resetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `in ${hours}h ${minutes}m`;
    } else {
        return `in ${minutes}m`;
    }
}

// === INITIALIZATION ===

// Enhanced initialization
function initializeCommon() {
    // Update displays
    updateTokenDisplay();
    updateStatsDisplay();
    updatePremiumDisplay();
    displayAvailableGames();
    
    // Check achievements
    checkAchievements();
    
    // Add enhanced CSS
    addEnhancedCSS();
    
    // Set up periodic updates
    setInterval(() => {
        displayAvailableGames();
        updateTokenDisplay();
    }, 60000); // Update every minute
}

function addEnhancedCSS() {
    if (!document.getElementById('enhanced-game-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-game-styles';
        style.textContent = `
            .game-card.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .token-info {
                background: rgba(16, 185, 129, 0.2);
                padding: 0.5rem;
                border-radius: 8px;
                margin: 0.5rem 0;
                font-weight: bold;
                color: #10B981;
            }
            
            .availability-info {
                font-size: 0.8rem;
                opacity: 0.8;
                margin-top: 0.5rem;
            }
            
            .premium-badge {
                background: linear-gradient(45deg, #FFD700, #FFA500);
                color: #000;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.7rem;
                font-weight: bold;
                display: inline-block;
                margin-left: 0.5rem;
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

// === EXPORT ENHANCED FUNCTIONS ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GAME_TYPES,
        GAME_FREQUENCIES,
        calculateTokenReward,
        addTokens,
        canPlayGame,
        recordGamePlay,
        getGameStats,
        displayAvailableGames,
        initializeCommon
    };
}
