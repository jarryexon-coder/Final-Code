#!/bin/bash
# diagnostic.sh - Run in your nba-backend directory

echo "🔍 Backend Structure Diagnostic"
echo "================================"

echo ""
echo "1. Main server file:"
ls -la server.js index.js app.js main.js 2>/dev/null

echo ""
echo "2. Route definitions for /api/news:"
grep -r "/api/news" . --include="*.js" --include="*.ts" --include="*.yaml" --include="*.yml" 2>/dev/null

echo ""
echo "3. Route definitions for /api/players:"
grep -r "/api/players" . --include="*.js" --include="*.ts" --include="*.yaml" --include="*.yml" 2>/dev/null

echo ""
echo "4. Directory structure:"
find . -type d -name "routes" -o -name "controllers" -o -name "api" | head -10

echo ""
echo "5. Package.json scripts:"
grep -A5 '"scripts"' package.json 2>/dev/null || echo "No package.json found"

echo ""
echo "6. Recent file changes:"
git log --oneline -5 2>/dev/null || echo "Not a git repo"

