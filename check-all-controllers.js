// check-all-controllers.js
import fs from 'fs';
import path from 'path';

// Map of controllers to their expected functions based on routes
const controllerMap = {
    'admin.controller.js': [
        'getAllUsers', 'getUserById', 'updateUser', 'deleteUser',
        'getSystemStats', 'getAnalytics', 'getLogs', 'clearCache',
        'updateSystemSettings', 'banUser', 'unbanUser', 'getUserActivity',
        'getRevenueStats', 'getActiveUsers', 'getPlatformStats'
    ],
    'analytics.controller.js': [
        'getUserAnalytics', 'getAppAnalytics', 'getRevenueAnalytics',
        'getPerformanceAnalytics', 'getDailyStats', 'getWeeklyStats',
        'getMonthlyStats', 'getUserGrowth', 'getRetentionMetrics',
        'getEventAnalytics', 'getCustomReport', 'exportAnalytics'
    ],
    'bumpRisk.controller.js': [
        'getBumpRisks', 'getBumpRiskById', 'createBumpRisk',
        'updateBumpRisk', 'deleteBumpRisk', 'calculateRiskScore',
        'getRiskAnalysis', 'getTopRisks', 'getRiskTrends'
    ],
    'fantasyDraftController.js': [
        'getDraftSettings', 'createDraft', 'joinDraft', 'getDraftStatus',
        'makePick', 'undoPick', 'getAvailablePlayers', 'getDraftResults',
        'getDraftHistory', 'getMockDrafts', 'simulateDraft'
    ],
    'generation.controller.js': [
        'generateContent', 'generateSelections', 'generateAnalysis',
        'getGenerationStatus', 'getGenerationHistory', 'regenerateContent',
        'validateGeneration', 'getGenerationStats', 'cancelGeneration'
    ],
    'history.controller.js': [
        'getUserHistory', 'getSelectionHistory', 'getBettingHistory',
        'getActivityHistory', 'clearHistory', 'exportHistory',
        'getHistoricalStats', 'getTrendHistory', 'getPerformanceHistory'
    ],
    'lines.controller.js': [
        'getLineDiscrepancies', 'getTopDiscrepancies', 'getSportDiscrepancies',
        'getPlayerLines', 'getPlayerLineHistory', 'getPlayerComparison',
        'analyzeCustomLines', 'compareLines', 'validateLine',
        'calculateEdge', 'getTopEdgeOpportunities', 'getSportEdgeOpportunities',
        'monitorLine', 'setLineAlert', 'getLineAlerts'
    ],
    'preferences.controller.js': [
        'getUserPreferences', 'updatePreferences', 'resetPreferences',
        'getNotificationSettings', 'updateNotificationSettings',
        'getPrivacySettings', 'updatePrivacySettings', 'getThemeSettings'
    ],
    'search.controller.js': [
        'searchPlayers', 'searchGames', 'searchSelections', 'searchUsers',
        'advancedSearch', 'getSearchHistory', 'clearSearchHistory',
        'getSearchSuggestions', 'getTrendingSearches'
    ],
    'selections.controller.js': [
        'getAllSelections', 'getTodaySelections', 'getSelectionById',
        'createSelection', 'updateSelection', 'deleteSelection',
        'getWinnersForSelection', 'addWinnerToSelection', 'updateWinner',
        'removeWinner', 'createBatchSelections', 'updateSelectionStatus',
        'duplicateSelection', 'trackSelection', 'untrackSelection',
        'getTrackedSelections'
    ],
    'social.controller.js': [
        'getSocialFeed', 'postToFeed', 'likePost', 'commentOnPost',
        'sharePost', 'getUserProfile', 'followUser', 'unfollowUser',
        'getFollowers', 'getFollowing', 'getNotifications', 'markNotificationRead'
    ],
    'sportsData.Controller.js': [
        'getLiveGames', 'getGameDetails', 'getPlayerStats',
        'getTeamStats', 'getStandings', 'getSchedules',
        'getOdds', 'getInjuries', 'getNews', 'syncSportsData'
    ],
    'userController.js': [
        'register', 'login', 'logout', 'getProfile',
        'updateProfile', 'changePassword', 'forgotPassword',
        'resetPassword', 'deleteAccount', 'verifyEmail'
    ]
};

async function checkController(controllerName, expectedFunctions) {
    console.log(`\n🔍 Checking ${controllerName}...`);
    console.log('='.repeat(60));
    
    try {
        const filePath = path.join('./controllers', controllerName);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const foundFunctions = [];
        const missingFunctions = [];
        const duplicateFunctions = [];
        
        // Check each expected function
        for (const func of expectedFunctions) {
            const patterns = [
                new RegExp(`export\\s+(?:const|async\\s+function|function)\\s+${func}\\s*[=\(]`),
                new RegExp(`export\\s*{[^}]*\\b${func}\\b[^}]*}`, 's'),
                new RegExp(`export\\s+default\\s*{[^}]*\\b${func}\\b[^}]*}`, 's')
            ];
            
            const matches = patterns.map(pattern => {
                const match = content.match(pattern);
                return match ? match[0] : null;
            }).filter(Boolean);
            
            if (matches.length > 1) {
                duplicateFunctions.push(func);
                foundFunctions.push(func);
            } else if (matches.length === 1) {
                foundFunctions.push(func);
            } else {
                missingFunctions.push(func);
            }
        }
        
        // Check for duplicates in the file (any function declared multiple times)
        const exportRegex = /export\s+(?:const|async\s+function|function)\s+(\w+)\s*[=\(]/g;
        const allExports = [];
        const duplicatesInFile = [];
        let match;
        
        while ((match = exportRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (allExports.includes(funcName)) {
                if (!duplicatesInFile.includes(funcName)) {
                    duplicatesInFile.push(funcName);
                }
            }
            allExports.push(funcName);
        }
        
        // Display results
        console.log(`📊 Found: ${foundFunctions.length}/${expectedFunctions.length}`);
        
        if (missingFunctions.length > 0) {
            console.log(`❌ Missing: ${missingFunctions.length}`);
            missingFunctions.forEach(func => console.log(`   - ${func}`));
        }
        
        if (duplicateFunctions.length > 0) {
            console.log(`⚠️  Duplicate exports (in expected list): ${duplicateFunctions.length}`);
            duplicateFunctions.forEach(func => console.log(`   - ${func}`));
        }
        
        if (duplicatesInFile.length > 0) {
            console.log(`🚨 Duplicate functions in file: ${duplicatesInFile.length}`);
            duplicatesInFile.forEach(func => console.log(`   - ${func}`));
        }
        
        if (missingFunctions.length === 0 && duplicateFunctions.length === 0 && duplicatesInFile.length === 0) {
            console.log('✅ All checks passed!');
        }
        
        return {
            controllerName,
            found: foundFunctions.length,
            total: expectedFunctions.length,
            missing: missingFunctions,
            duplicatesInFile,
            hasIssues: missingFunctions.length > 0 || duplicatesInFile.length > 0
        };
        
    } catch (error) {
        console.log(`❌ Error reading ${controllerName}: ${error.message}`);
        return {
            controllerName,
            error: error.message,
            hasIssues: true
        };
    }
}

async function checkAllControllers() {
    console.log('🚀 Starting comprehensive controller verification...');
    console.log('='.repeat(60));
    
    const results = [];
    
    for (const [controllerName, expectedFunctions] of Object.entries(controllerMap)) {
        const result = await checkController(controllerName, expectedFunctions);
        results.push(result);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    
    const totalControllers = results.length;
    const controllersWithIssues = results.filter(r => r.hasIssues).length;
    const controllersOK = totalControllers - controllersWithIssues;
    
    console.log(`Total controllers checked: ${totalControllers}`);
    console.log(`✅ Controllers OK: ${controllersOK}`);
    console.log(`❌ Controllers with issues: ${controllersWithIssues}`);
    
    if (controllersWithIssues > 0) {
        console.log('\n📋 Controllers needing attention:');
        results.filter(r => r.hasIssues).forEach(result => {
            if (result.error) {
                console.log(`   - ${result.controllerName}: ${result.error}`);
            } else {
                console.log(`   - ${result.controllerName}: ${result.found}/${result.total} functions`);
                if (result.missing && result.missing.length > 0) {
                    console.log(`     Missing: ${result.missing.length} functions`);
                }
                if (result.duplicatesInFile && result.duplicatesInFile.length > 0) {
                    console.log(`     Duplicates: ${result.duplicatesInFile.join(', ')}`);
                }
            }
        });
        
        console.log('\n💡 Recommendations:');
        console.log('1. For missing functions: Add export declarations');
        console.log('2. For duplicate functions: Remove duplicate definitions');
        console.log('3. Check if imports in routes match export style (named vs default)');
    }
}

// Run the check
checkAllControllers().catch(console.error);
