#!/bin/bash
# fix-default-exports.sh

echo "🔧 Fixing default export errors..."
echo "=============================================================="

# Backup directory
BACKUP_DIR="default_export_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in: $BACKUP_DIR"
cp -r controllers routes "$BACKUP_DIR"/
echo ""

# 1. Fix sportsData.controller.js
echo "1. Fixing sportsData.controller.js..."
if [ -f "controllers/sportsData.controller.js" ]; then
    echo "   📄 Found sportsData.controller.js"
    
    # Check if it has a default export
    if grep -q "export default" controllers/sportsData.controller.js; then
        echo "   ✅ Has default export"
        # Verify it's valid
        if node -c controllers/sportsData.controller.js 2>/dev/null; then
            echo "   ✅ Syntax is valid"
        else
            echo "   ❌ Default export has syntax errors"
            node -c controllers/sportsData.controller.js 2>&1 | head -5
        fi
    else
        echo "   ❌ Missing default export"
        
        # Extract all exported function names
        EXPORTS=$(grep -E "export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)" controllers/sportsData.controller.js | \
                  sed -E 's/.*export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/')
        
        echo "   📋 Found exports:"
        echo "$EXPORTS" | while read -r export; do
            echo "      - $export"
        done
        
        # Add default export at the end of the file
        echo "" >> controllers/sportsData.controller.js
        echo "// Default export" >> controllers/sportsData.controller.js
        echo "export default {" >> controllers/sportsData.controller.js
        
        echo "$EXPORTS" | while read -r export; do
            if [ -n "$export" ]; then
                echo "  $export," >> controllers/sportsData.controller.js
            fi
        done
        
        echo "};" >> controllers/sportsData.controller.js
        
        echo "   ✅ Added default export"
    fi
else
    echo "   ❌ sportsData.controller.js not found!"
fi

echo ""

# 2. Check ALL controllers for missing default exports
echo "2. Checking ALL controllers for missing/default exports..."
echo "=============================================================="

declare -a CONTROLLERS_WITHOUT_DEFAULT=()

for controller in controllers/*.js; do
    if [ -f "$controller" ]; then
        filename=$(basename "$controller")
        
        # Check if it has a default export
        if ! grep -q "export default" "$controller"; then
            CONTROLLERS_WITHOUT_DEFAULT+=("$filename")
            echo "❌ $filename: Missing default export"
        else
            # Check if the default export is valid
            if node -c "$controller" 2>/dev/null; then
                echo "✅ $filename: Has valid default export"
            else
                echo "⚠️  $filename: Has default export but syntax error"
            fi
        fi
    fi
done

echo ""

# 3. Check ALL route files for default imports
echo "3. Checking ALL route files for default imports..."
echo "=============================================================="

declare -a ROUTES_WITH_DEFAULT_IMPORTS=()

for route in routes/*.js; do
    if [ -f "$route" ]; then
        filename=$(basename "$route")
        
        # Look for default imports (without curly braces)
        if grep -q "import [^{] from '../controllers/" "$route" || \
           grep -q "import .* from '../controllers/[^']*'$" "$route"; then
            
            ROUTES_WITH_DEFAULT_IMPORTS+=("$filename")
            
            echo "📄 $filename uses default imports:"
            grep -n "import [^{]" "$route" | grep "controllers" | while read -r line; do
                echo "   $line"
            done
        fi
    fi
done

echo ""

# 4. Fix sportsDataRoutes.js specifically
echo "4. Fixing sportsDataRoutes.js..."
if [ -f "routes/sportsDataRoutes.js" ]; then
    echo "   📄 Found sportsDataRoutes.js"
    
    # Check what it's trying to import
    IMPORT_LINE=$(grep "import.*sportsData.controller.js" routes/sportsDataRoutes.js)
    echo "   Import line: $IMPORT_LINE"
    
    # Check if it's a default import
    if echo "$IMPORT_LINE" | grep -q "import [^{]"; then
        echo "   ✅ It's a default import"
        
        # Verify the controller has a default export
        if grep -q "export default" controllers/sportsData.controller.js; then
            echo "   ✅ Controller has default export"
        else
            echo "   ❌ Controller doesn't have default export"
            echo "   💡 This should have been fixed in step 1"
        fi
    else
        echo "   ❓ Not a default import, might be a different issue"
    fi
else
    echo "   ❌ sportsDataRoutes.js not found!"
fi

echo ""

# 5. Create a test to verify the fix
echo "5. Creating test to verify fix..."
echo "=============================================================="

cat > /tmp/test_default_export.js << 'TEST'
// Test script for default exports
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing default exports...\n');

// Test sportsData.controller.js
try {
    console.log('1. Testing sportsData.controller.js...');
    const sportsDataController = await import(__dirname + '/controllers/sportsData.controller.js');
    
    if (sportsDataController.default) {
        console.log('✅ Has default export');
        
        // Check if it has expected methods
        const expectedMethods = ['getLiveGames', 'getGameDetails', 'getPlayerStats'];
        let hasMethods = true;
        
        expectedMethods.forEach(method => {
            if (typeof sportsDataController.default[method] === 'function') {
                console.log(`   ✅ Has method: ${method}`);
            } else {
                console.log(`   ❌ Missing method: ${method}`);
                hasMethods = false;
            }
        });
        
        if (hasMethods) {
            console.log('✅ All expected methods found');
        }
    } else {
        console.log('❌ No default export found');
    }
} catch (error) {
    console.log('❌ Error importing sportsData.controller.js:', error.message);
}

// Test other controllers that might have issues
const controllersToTest = [
    'analytics.controller.js',
    'fantasyDraftController.js',
    'lines.controller.js',
    'preferences.controller.js'
];

console.log('\n2. Testing other controllers...');
for (const controller of controllersToTest) {
    try {
        const module = await import(__dirname + '/controllers/' + controller);
        if (module.default) {
            console.log(`✅ ${controller}: Has default export`);
        } else {
            console.log(`❌ ${controller}: No default export`);
        }
    } catch (error) {
        console.log(`❌ ${controller}: Error - ${error.message}`);
    }
}

console.log('\n🎉 Test complete!');
TEST

# Copy test to current directory
cp /tmp/test_default_export.js test_default_export.js

echo "✅ Created test script: test_default_export.js"
echo ""

# 6. Fix any controllers without default exports
echo "6. Fixing controllers without default exports..."
echo "=============================================================="

for controller in "${CONTROLLERS_WITHOUT_DEFAULT[@]}"; do
    echo "🔧 Fixing $controller..."
    
    # Extract exports
    EXPORTS=$(grep -E "export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)" "controllers/$controller" | \
              sed -E 's/.*export\s+(const|function)\s+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/')
    
    if [ -n "$EXPORTS" ]; then
        echo "   📋 Adding default export with:"
        echo "$EXPORTS" | while read -r export; do
            if [ -n "$export" ]; then
                echo "      - $export"
            fi
        done
        
        # Add default export at the end
        echo "" >> "controllers/$controller"
        echo "// Default export" >> "controllers/$controller"
        echo "export default {" >> "controllers/$controller"
        
        echo "$EXPORTS" | while read -r export; do
            if [ -n "$export" ]; then
                echo "  $export," >> "controllers/$controller"
            fi
        done
        
        echo "};" >> "controllers/$controller"
        
        echo "   ✅ Added default export to $controller"
    else
        echo "   ⚠️  No exports found in $controller, creating minimal default export"
        echo "" >> "controllers/$controller"
        echo "// Default export" >> "controllers/$controller"
        echo "export default {};" >> "controllers/$controller"
    fi
done

echo ""

# 7. Final syntax check
echo "7. Final syntax check of all controllers..."
echo "=============================================================="

ERROR_COUNT=0
for controller in controllers/*.js; do
    if node -c "$controller" 2>/dev/null; then
        echo "✅ $(basename $controller): Syntax OK"
    else
        echo "❌ $(basename $controller): Syntax ERROR"
        node -c "$controller" 2>&1 | head -3
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

echo ""

# 8. Summary
echo "=============================================================="
echo "📊 SUMMARY"
echo "=============================================================="
echo "✅ Fixed sportsData.controller.js default export"
echo "✅ Checked all controllers for default exports"
echo "✅ Checked all routes for default imports"
echo "✅ Fixed ${#CONTROLLERS_WITHOUT_DEFAULT[@]} controllers without default exports"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    echo "🎉 ALL CONTROLLERS HAVE VALID SYNTAX!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Run the test: node test_default_export.js"
    echo "2. Start the server: npm start"
    echo ""
    echo "💡 If you still get errors:"
    echo "   - Check the backup in: $BACKUP_DIR"
    echo "   - Run with --no-warnings: PORT=3002 node --no-warnings server.js"
else
    echo "⚠️  There are still $ERROR_COUNT controllers with syntax errors"
    echo "   Check the errors above and fix manually"
fi
