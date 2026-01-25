#!/bin/bash
# fix-all-missing-exports-macos.sh

echo "🔍 Fixing all missing exports for macOS compatibility..."
echo "=============================================================="

# First, let's backup the original files
echo "📦 Creating backups..."
cp controllers/fantasyDraftController.js controllers/fantasyDraftController.js.backup
cp routes/fantasyRoutes.js routes/fantasyRoutes.js.backup

echo "✅ Backups created"
echo ""

# Check what's actually needed
echo "🔍 Analyzing fantasyRoutes.js imports..."
IMPORT_LINE=$(grep "from '../controllers/fantasyDraftController.js'" routes/fantasyRoutes.js)
echo "Import line found: $IMPORT_LINE"
echo ""

# Extract the function names needed
FUNCTIONS_NEEDED=$(echo "$IMPORT_LINE" | grep -o "{.*}" | tr -d '{}' | sed 's/,/ /g')
echo "Functions needed: $FUNCTIONS_NEEDED"
echo ""

# Check which functions exist in the controller
EXISTING_FUNCTIONS=$(grep -E "export\s+(const|function)\s+" controllers/fantasyDraftController.js | sed -E 's/.*export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/' | tr '\n' ' ')
echo "Existing functions: $EXISTING_FUNCTIONS"
echo ""

# Identify missing functions
MISSING_FUNCTIONS=""
for func in $FUNCTIONS_NEEDED; do
    if ! echo "$EXISTING_FUNCTIONS" | grep -q "\b$func\b"; then
        MISSING_FUNCTIONS="$MISSING_FUNCTIONS $func"
        echo "❌ Missing: $func"
    else
        echo "✅ Found: $func"
    fi
done

echo ""
echo "📝 Adding missing functions to fantasyDraftController.js..."

# Create temporary file with new functions
cat > /tmp/new_functions.js << 'EOF'
// Get snake draft settings
export const getSnakeDraft = async (req, res) => {
  try {
    const settings = {
      name: 'Snake Draft',
      description: 'Traditional snake draft with reversed order each round',
      minTeams: 4,
      maxTeams: 20,
      rounds: 15,
      timePerPick: 90,
      strategy: 'balanced',
      notes: 'Snake drafts are great for beginners and experienced players alike'
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get snake draft error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get snake draft settings', 
      error: error.message 
    });
  }
};

// Get turn draft settings
export const getTurnDraft = async (req, res) => {
  try {
    const settings = {
      name: 'Turn Draft',
      description: 'Standard turn-based draft with consistent order',
      minTeams: 4,
      maxTeams: 20,
      rounds: 15,
      timePerPick: 60,
      strategy: 'positional',
      notes: 'Turn drafts maintain the same draft position each round'
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get turn draft error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get turn draft settings', 
      error: error.message 
    });
  }
};

// Generate optimal draft strategy
export const generateOptimalDraft = async (req, res) => {
  try {
    const {
      draftType = 'snake',
      teams = 10,
      rounds = 15,
      userPosition = 1,
      strategy = 'balanced',
      sport = 'NBA'
    } = req.body;

    // Mock optimal draft generation
    const optimalDraft = {
      draftType,
      teams,
      rounds,
      userPosition,
      strategy,
      sport,
      picks: [],
      strategyTips: [],
      recommendations: []
    };

    // Generate mock picks
    for (let i = 1; i <= rounds; i++) {
      optimalDraft.picks.push({
        round: i,
        recommendedPosition: getPositionForRound(i, strategy),
        playerType: getPlayerTypeForRound(i, strategy),
        strategy: getStrategyForRound(i, strategy)
      });
    }

    // Add strategy tips based on draft type
    if (draftType === 'snake') {
      optimalDraft.strategyTips = [
        'Early picks (1-3): Secure elite talent at scarce positions',
        'Middle picks (4-8): Balance value and positional needs',
        'Late picks (9+): Target high-upside players and fill roster needs'
      ];
    } else {
      optimalDraft.strategyTips = [
        'Set a budget for each position before drafting',
        'Nominate expensive players early to drain opponents\' budgets',
        'Save 10-15% of budget for late-round value picks'
      ];
    }

    // Add recommendations
    optimalDraft.recommendations = [
      `With pick ${userPosition} in a ${teams}-team draft, focus on:`,
      '1. Securing at least 2 elite players in the first 4 rounds',
      '2. Filling starting lineup positions by round 8',
      '3. Targeting high-upside players in rounds 9-12',
      '4. Using final rounds for bench depth and handcuffs'
    ];

    res.json({
      success: true,
      data: optimalDraft
    });
  } catch (error) {
    console.error('Generate optimal draft error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate optimal draft', 
      error: error.message 
    });
  }
};

// Helper functions
function getPositionForRound(round, strategy) {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  if (round <= 3) return positions[round - 1] || 'BPA';
  if (round <= 8) return positions[(round - 1) % 5];
  return 'BPA'; // Best Player Available
}

function getPlayerTypeForRound(round, strategy) {
  if (round <= 3) return 'Elite/Star';
  if (round <= 8) return 'Starter/Solid';
  if (round <= 12) return 'Upside/Value';
  return 'Depth/Bench';
}

function getStrategyForRound(round, strategy) {
  if (round <= 3) return 'Secure elite talent';
  if (round <= 8) return 'Build starting lineup';
  if (round <= 12) return 'Find value and upside';
  return 'Complete roster with depth';
}
EOF

echo "✅ Created new functions template"
echo ""

# Insert the new functions before the default export
echo "📝 Inserting new functions into controller..."
LINE_NUMBER=$(grep -n "export default {" controllers/fantasyDraftController.js | tail -1 | cut -d: -f1)
LINE_NUMBER=$((LINE_NUMBER - 1))

# Use awk for macOS compatibility
awk -v n="$LINE_NUMBER" -v s="$(cat /tmp/new_functions.js)" 'NR == n {print s} {print}' controllers/fantasyDraftController.js > /tmp/temp_controller.js
mv /tmp/temp_controller.js controllers/fantasyDraftController.js

echo "✅ Inserted new functions"
echo ""

# Update the default export
echo "🔄 Updating default export..."
# First, remove the existing default export line
grep -v "export default {" controllers/fantasyDraftController.js > /tmp/temp1.js
echo "export default {" >> /tmp/temp1.js

# Add all functions in order
echo "  getDraftSettings," >> /tmp/temp1.js
echo "  createDraft," >> /tmp/temp1.js
echo "  joinDraft," >> /tmp/temp1.js
echo "  getDraftStatus," >> /tmp/temp1.js
echo "  makePick," >> /tmp/temp1.js
echo "  undoPick," >> /tmp/temp1.js
echo "  getAvailablePlayers," >> /tmp/temp1.js
echo "  getDraftResults," >> /tmp/temp1.js
echo "  getDraftHistory," >> /tmp/temp1.js
echo "  getMockDrafts," >> /tmp/temp1.js
echo "  simulateDraft," >> /tmp/temp1.js
echo "  getSnakeDraft," >> /tmp/temp1.js
echo "  getTurnDraft," >> /tmp/temp1.js
echo "  generateOptimalDraft," >> /tmp/temp1.js
echo "};" >> /tmp/temp1.js

mv /tmp/temp1.js controllers/fantasyDraftController.js

echo "✅ Updated default export"
echo ""

# Verify the fix
echo "🔍 Verifying the fix..."
echo "=============================================================="
echo "Checking if all needed functions are now exported:"

for func in $FUNCTIONS_NEEDED; do
    if grep -q "export.*$func" controllers/fantasyDraftController.js; then
        echo "✅ $func is now exported"
    else
        echo "❌ $func is still missing"
    fi
done

echo ""
echo "🎉 Fix complete!"
echo "📁 Backups saved as:"
echo "   - controllers/fantasyDraftController.js.backup"
echo "   - routes/fantasyRoutes.js.backup"
echo ""
echo "🚀 You can now restart your server with: npm start"
