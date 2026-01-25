#!/bin/bash
# quick-fix-sportsdata.sh

echo "🔧 Quick fix for sportsData.controller.js..."
echo "=============================================================="

if [ ! -f "controllers/sportsData.controller.js" ]; then
    echo "❌ sportsData.controller.js not found!"
    exit 1
fi

echo "📄 Checking sportsData.controller.js..."

# Check if it has a default export
if grep -q "export default" controllers/sportsData.controller.js; then
    echo "✅ Already has default export"
    
    # Check if it's valid
    if node -c controllers/sportsData.controller.js 2>/dev/null; then
        echo "✅ Syntax is valid"
        echo ""
        echo "The issue might be with the route file. Checking sportsDataRoutes.js..."
        
        if [ -f "routes/sportsDataRoutes.js" ]; then
            echo "📄 sportsDataRoutes.js:"
            head -5 routes/sportsDataRoutes.js
            
            # Check if the import is correct
            if grep -q "import sportsDataController from" routes/sportsDataRoutes.js; then
                echo "✅ Route imports default correctly"
            else
                echo "❌ Route doesn't import default correctly"
                echo "   Fixing import..."
                sed -i '' 's/import sportsDataController from/import sportsDataController from/' routes/sportsDataRoutes.js
            fi
        fi
    else
        echo "❌ Default export has syntax errors"
        echo "   Fixing..."
        
        # Backup
        cp controllers/sportsData.controller.js controllers/sportsData.controller.js.backup
        
        # Remove the broken default export and add a new one
        grep -v "export default" controllers/sportsData.controller.js > /tmp/sportsdata_fixed.js
        
        # Get all exports
        EXPORTS=$(grep -E "export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)" /tmp/sportsdata_fixed.js | \
                  sed -E 's/.*export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/' | uniq)
        
        # Add default export
        echo "" >> /tmp/sportsdata_fixed.js
        echo "// Default export" >> /tmp/sportsdata_fixed.js
        echo "export default {" >> /tmp/sportsdata_fixed.js
        echo "$EXPORTS" | while read -r export; do
            if [ -n "$export" ]; then
                echo "  $export," >> /tmp/sportsdata_fixed.js
            fi
        done
        echo "};" >> /tmp/sportsdata_fixed.js
        
        mv /tmp/sportsdata_fixed.js controllers/sportsData.controller.js
        echo "✅ Fixed default export"
    fi
else
    echo "❌ Missing default export"
    echo "   Adding default export..."
    
    # Backup
    cp controllers/sportsData.controller.js controllers/sportsData.controller.js.backup
    
    # Get all exports
    EXPORTS=$(grep -E "export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)" controllers/sportsData.controller.js | \
              sed -E 's/.*export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/' | uniq)
    
    # Add default export at the end
    echo "" >> controllers/sportsData.controller.js
    echo "// Default export" >> controllers/sportsData.controller.js
    echo "export default {" >> controllers/sportsData.controller.js
    echo "$EXPORTS" | while read -r export; do
        if [ -n "$export" ]; then
            echo "  $export," >> controllers/sportsData.controller.js
        fi
    done
    echo "};" >> controllers/sportsData.controller.js
    
    echo "✅ Added default export with functions:"
    echo "$EXPORTS" | while read -r export; do
        if [ -n "$export" ]; then
            echo "   - $export"
        fi
    done
fi

echo ""
echo "🧪 Testing syntax..."
if node -c controllers/sportsData.controller.js; then
    echo "✅ Syntax is valid"
    
    # Create a simple test
    cat > /tmp/test_sportsdata.js << 'TEST'
try {
    const module = await import('./controllers/sportsData.controller.js');
    if (module.default) {
        console.log('✅ sportsData.controller.js has default export');
        console.log('   Available methods:', Object.keys(module.default).join(', '));
    } else {
        console.log('❌ No default export');
    }
} catch (error) {
    console.log('❌ Error:', error.message);
}
TEST
    
    echo ""
    echo "🚀 Testing import..."
    cd /tmp
    cp -f "$OLDPWD/controllers/sportsData.controller.js" ./sportsData.controller.js 2>/dev/null
    if node -e "import('./sportsData.controller.js').then(m => console.log('✅ Import successful')).catch(e => console.log('❌', e.message))" 2>&1; then
        echo "✅ Import test passed!"
    else
        echo "❌ Import test failed"
    fi
    cd "$OLDPWD"
else
    echo "❌ Syntax error"
    node -c controllers/sportsData.controller.js 2>&1 | head -5
fi

echo ""
echo "🎉 Done! Try: npm start"
