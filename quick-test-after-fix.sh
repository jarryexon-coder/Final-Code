#!/bin/bash
# quick-test-after-fix.sh

echo "🧪 Quick test after fixes..."
echo "=============================================================="

# Test syntax of all controllers
echo "1. Testing controller syntax..."
for controller in controllers/*.js; do
    if node -c "$controller" 2>/dev/null; then
        echo "✅ $(basename $controller): Syntax OK"
    else
        echo "❌ $(basename $controller): Syntax ERROR"
        node -c "$controller" 2>&1 | head -3
    fi
done

echo ""
echo "2. Testing route imports..."
# Check a specific problematic route
if [ -f "routes/prizepicksAnalyticsRoutes.js" ]; then
    echo "📄 Testing prizepicksAnalyticsRoutes.js imports..."
    
    # Create a simple test file
    cat > /tmp/test_import.js << 'TEST'
import { getAllTimePerformance, getBumpRiskStats } from './controllers/analytics.controller.js';
console.log('✅ Imports successful!');
console.log('Functions available:');
console.log('- getAllTimePerformance:', typeof getAllTimePerformance);
console.log('- getBumpRiskStats:', typeof getBumpRiskStats);
TEST
    
    if node /tmp/test_import.js 2>&1 | grep -q "✅"; then
        echo "✅ Analytics imports work!"
    else
        echo "❌ Analytics imports failed"
        node /tmp/test_import.js 2>&1
    fi
fi

echo ""
echo "3. Testing server.js..."
if node -c server.js 2>/dev/null; then
    echo "✅ server.js: Syntax OK"
else
    echo "❌ server.js: Syntax ERROR"
    node -c server.js 2>&1 | head -5
fi

echo ""
echo "=============================================================="
echo "🎉 Test complete!"
echo "Run: npm start"
