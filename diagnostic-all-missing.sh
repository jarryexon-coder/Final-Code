#!/bin/bash
# diagnostic-all-missing.sh

echo "🔍 DIAGNOSTIC: Checking ALL missing exports..."
echo "=============================================================="

echo "📋 Route files that import analytics.controller.js:"
grep -l "analytics.controller.js" routes/*.js | while read file; do
    echo "  📄 $file"
    grep -n "from '../controllers/analytics.controller.js'" "$file" | while read line; do
        echo "    Line: $line"
    done
done

echo ""
echo "📊 Current exports in analytics.controller.js:"
grep -E "export\s+(const|function)" controllers/analytics.controller.js | \
    sed 's/export\s*//' | \
    sort

echo ""
echo "🔍 Missing exports in prizepicksAnalyticsRoutes.js:"
if [ -f "routes/prizepicksAnalyticsRoutes.js" ]; then
    # Get the import block
    awk '/import.*analytics\.controller\.js/,/from/' routes/prizepicksAnalyticsRoutes.js | \
        grep -v "import\|from" | \
        tr ',' '\n' | \
        sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
        while read func; do
            if [ -n "$func" ]; then
                if ! grep -q "export.*$func" controllers/analytics.controller.js; then
                    echo "❌ MISSING: $func"
                else
                    echo "✅ FOUND: $func"
                fi
            fi
        done
fi
