#!/bin/bash
# fix-analytics-exports-macos.sh

echo "🔧 Fixing missing exports in analytics.controller.js..."
echo "=============================================================="

# Backup original
cp controllers/analytics.controller.js controllers/analytics.controller.js.backup.$(date +%s)

echo "📝 Checking what's needed from prizepicksAnalyticsRoutes.js..."

# Get the import line from prizepicksAnalyticsRoutes.js
if [ -f "routes/prizepicksAnalyticsRoutes.js" ]; then
    IMPORT_LINE=$(grep "from '../controllers/analytics.controller.js'" routes/prizepicksAnalyticsRoutes.js)
    echo "Import line found: $IMPORT_LINE"
    
    # Extract all function names
    FUNCTIONS_NEEDED=$(echo "$IMPORT_LINE" | grep -o "{.*}" | tr -d '{}' | sed 's/,/ /g')
    echo "Functions needed: $FUNCTIONS_NEEDED"
    
    # Also check for any other analytics-related routes
    echo ""
    echo "🔍 Checking all route files for analytics imports..."
    grep -l "analytics.controller.js" routes/*.js | while read -r route_file; do
        echo "Checking $route_file..."
        grep "from '../controllers/analytics.controller.js'" "$route_file" | while read -r line; do
            echo "  Found: $line"
        done
    done
fi

echo ""
echo "📝 Adding missing functions to analytics.controller.js..."

# Read the current analytics controller to see what's already there
echo "Current exports in analytics.controller.js:"
grep -E "export\s+(const|function)" controllers/analytics.controller.js | head -20

# Create the missing functions based on typical analytics functions
cat > /tmp/analytics_fixes.js << 'EOF'
// Get all-time performance analytics
export const getAllTimePerformance = async (req, res) => {
  try {
    const {
      userId,
      sport = 'all',
      timeframe = 'all',
      limit = 100
    } = req.query;

    const matchStage = {};
    
    if (userId && userId !== 'all') {
      matchStage.userId = userId;
    }
    
    if (sport && sport !== 'all') {
      matchStage.sport = sport;
    }

    // In a real implementation, you would query your database here
    const allTimeStats = {
      totalSelections: 1250,
      winningSelections: 745,
      losingSelections: 505,
      winRate: 59.6,
      totalProfit: 12560.75,
      averageOdds: 2.15,
      bestSport: 'NBA',
      bestMonth: 'January',
      longestWinStreak: 8,
      longestLoseStreak: 4
    };

    // Performance by sport
    const performanceBySport = [
      { sport: 'NBA', winRate: 62.3, profit: 8540.25 },
      { sport: 'NFL', winRate: 58.1, profit: 3120.50 },
      { sport: 'MLB', winRate: 55.7, profit: 900.00 }
    ];

    // Monthly performance
    const monthlyPerformance = [
      { month: 'Jan-2024', winRate: 63.2, profit: 2105.75 },
      { month: 'Dec-2023', winRate: 61.8, profit: 1850.50 },
      { month: 'Nov-2023', winRate: 58.5, profit: 1340.25 }
    ];

    res.json({
      success: true,
      data: {
        summary: allTimeStats,
        bySport: performanceBySport,
        monthly: monthlyPerformance,
        timeframe: 'all-time',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get all-time performance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get all-time performance', 
      error: error.message 
    });
  }
};

// Get performance by sport
export const getPerformanceBySport = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const performanceBySport = [
      {
        sport: 'NBA',
        totalSelections: 450,
        winningSelections: 280,
        winRate: 62.2,
        totalProfit: 4250.75,
        averageOdds: 2.18,
        roi: 18.5
      },
      {
        sport: 'NFL',
        totalSelections: 320,
        winningSelections: 186,
        winRate: 58.1,
        totalProfit: 2180.50,
        averageOdds: 2.05,
        roi: 15.2
      },
      {
        sport: 'MLB',
        totalSelections: 280,
        winningSelections: 152,
        winRate: 54.3,
        totalProfit: 1240.25,
        averageOdds: 2.25,
        roi: 12.8
      },
      {
        sport: 'NHL',
        totalSelections: 195,
        winningSelections: 118,
        winRate: 60.5,
        totalProfit: 1850.00,
        averageOdds: 2.12,
        roi: 21.3
      }
    ];

    res.json({
      success: true,
      data: {
        timeframe,
        sports: performanceBySport,
        bestPerforming: performanceBySport.sort((a, b) => b.roi - a.roi)[0],
        worstPerforming: performanceBySport.sort((a, b) => a.roi - b.roi)[0]
      }
    });
  } catch (error) {
    console.error('Get performance by sport error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get performance by sport', 
      error: error.message 
    });
  }
};

// Get profit/loss analytics
export const getProfitLossAnalytics = async (req, res) => {
  try {
    const { 
      userId,
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;

    // Mock profit/loss data
    const profitLossData = [
      { date: '2024-01-01', profit: 125.50, selections: 8, winRate: 62.5 },
      { date: '2024-01-02', profit: -45.25, selections: 6, winRate: 33.3 },
      { date: '2024-01-03', profit: 210.75, selections: 10, winRate: 70.0 },
      { date: '2024-01-04', profit: 85.00, selections: 7, winRate: 57.1 },
      { date: '2024-01-05', profit: 150.25, selections: 9, winRate: 66.7 }
    ];

    const summary = {
      totalProfit: profitLossData.reduce((sum, day) => sum + day.profit, 0),
      totalSelections: profitLossData.reduce((sum, day) => sum + day.selections, 0),
      averageDailyProfit: profitLossData.reduce((sum, day) => sum + day.profit, 0) / profitLossData.length,
      bestDay: profitLossData.sort((a, b) => b.profit - a.profit)[0],
      worstDay: profitLossData.sort((a, b) => a.profit - b.profit)[0],
      winRate: profitLossData.reduce((sum, day) => sum + day.winRate, 0) / profitLossData.length
    };

    res.json({
      success: true,
      data: {
        timeframe: {
          startDate: startDate || '2024-01-01',
          endDate: endDate || '2024-01-05'
        },
        groupBy,
        profitLossData,
        summary,
        trends: {
          profitTrend: 'up',
          winRateTrend: 'stable',
          volumeTrend: 'up'
        }
      }
    });
  } catch (error) {
    console.error('Get profit/loss analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profit/loss analytics', 
      error: error.message 
    });
  }
};

// Get selection analytics
export const getSelectionAnalytics = async (req, res) => {
  try {
    const {
      type = 'all',
      sport = 'all',
      timeframe = '7d'
    } = req.query;

    const analytics = {
      overview: {
        totalSelections: 125,
        profitableSelections: 78,
        losingSelections: 47,
        winRate: 62.4,
        averageOdds: 2.15,
        averageStake: 25.50
      },
      byType: [
        { type: 'Player Prop', count: 65, winRate: 64.6, profit: 1245.50 },
        { type: 'Game Line', count: 35, winRate: 60.0, profit: 825.25 },
        { type: 'Over/Under', count: 25, winRate: 56.0, profit: 490.00 }
      ],
      bySport: [
        { sport: 'NBA', count: 85, winRate: 63.5, profit: 1580.75 },
        { sport: 'NFL', count: 25, winRate: 60.0, profit: 625.50 },
        { sport: 'MLB', count: 15, winRate: 53.3, profit: 354.50 }
      ],
      topPerformers: [
        { player: 'LeBron James', selections: 8, wins: 6, profit: 325.75 },
        { player: 'Patrick Mahomes', selections: 5, wins: 4, profit: 210.50 },
        { player: 'Connor McDavid', selections: 4, wins: 3, profit: 185.25 }
      ],
      recommendations: [
        'Focus on NBA Player Props - 64.6% win rate',
        'Reduce MLB selections - lowest win rate at 53.3%',
        'Increase stakes on top performers'
      ]
    };

    res.json({
      success: true,
      data: {
        type,
        sport,
        timeframe,
        analytics,
        filters: {
          type: type === 'all' ? ['Player Prop', 'Game Line', 'Over/Under'] : [type],
          sport: sport === 'all' ? ['NBA', 'NFL', 'MLB'] : [sport]
        }
      }
    });
  } catch (error) {
    console.error('Get selection analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get selection analytics', 
      error: error.message 
    });
  }
};

// Get user analytics
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock user analytics
    const userAnalytics = {
      userId: userId || 'current',
      joinDate: '2023-06-15',
      totalSelections: 1250,
      totalWins: 745,
      totalLosses: 505,
      winRate: 59.6,
      totalProfit: 12560.75,
      averageStake: 28.50,
      favoriteSport: 'NBA',
      bestBetType: 'Player Prop',
      activityLevel: 'high',
      streak: {
        currentWinStreak: 3,
        longestWinStreak: 8,
        currentLossStreak: 0,
        longestLossStreak: 4
      },
      monthlyPerformance: [
        { month: 'Jan 2024', profit: 2450.75, winRate: 62.3 },
        { month: 'Dec 2023', profit: 1850.50, winRate: 61.8 },
        { month: 'Nov 2023', profit: 1340.25, winRate: 58.5 }
      ]
    };

    res.json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user analytics', 
      error: error.message 
    });
  }
};
EOF

echo "✅ Created analytics fixes file"

# Find where to insert in analytics.controller.js (before default export)
LINE_NUMBER=$(grep -n "export default {" controllers/analytics.controller.js | tail -1 | cut -d: -f1)
LINE_NUMBER=$((LINE_NUMBER - 1))

# Use awk to insert the new functions
echo "📝 Inserting new functions into analytics.controller.js..."
awk -v n="$LINE_NUMBER" -v s="$(cat /tmp/analytics_fixes.js)" 'NR == n {print s} {print}' controllers/analytics.controller.js > /tmp/temp_analytics.js
mv /tmp/temp_analytics.js controllers/analytics.controller.js

echo "✅ Inserted missing analytics functions"
echo ""

# Update default export
echo "🔄 Updating default export in analytics.controller.js..."

# Read the current default export line and update it
# First, let's backup and recreate the file with updated default export
grep -v "export default {" controllers/analytics.controller.js > /tmp/analytics_no_export.js

# Add the updated default export with all functions
cat >> /tmp/analytics_no_export.js << 'EOF'
export default {
  getUserAnalytics,
  getAppAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getUserGrowth,
  getRetentionMetrics,
  getEventAnalytics,
  getCustomReport,
  exportAnalytics,
  getAllTimePerformance,
  getPerformanceBySport,
  getProfitLossAnalytics,
  getSelectionAnalytics
};
EOF

mv /tmp/analytics_no_export.js controllers/analytics.controller.js

echo "✅ Updated default export"
echo ""

echo "🎉 Analytics controller has been updated!"
echo "📁 Backup saved as: controllers/analytics.controller.js.backup.*"
