#!/bin/bash
# route-diagnostic.sh

echo "🔍 Route Structure Diagnostic"
echo "============================="

echo ""
echo "1. Current route stack in server.js:"
grep -n "app\.use\|app\.get\|app\.post\|app\.put\|app\.delete" server.js | head -20

echo ""
echo "2. Swagger configuration:"
grep -n "swagger\|openapi\|apis:" server.js -B2 -A2

echo ""
echo "3. Route loading order:"
awk '/app\.listen/{exit} /app\.(use|get|post|put|delete).*api/{print NR ": " $0}' server.js | tail -30

echo ""
echo "4. Check for route overrides:"
if grep -q "overrideRoutes" server.js; then
  echo "✅ Route override code already exists"
else
  echo "❌ No route override code found"
fi
