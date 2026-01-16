#!/bin/bash
echo "📦 Backing up backend files..."
echo "==============================="

# Backup route files
cp routes/nba.js routes/nba.js.backup 2>/dev/null || echo "No nba.js found"
cp routes/nfl.js routes/nfl.js.backup 2>/dev/null || echo "No nfl.js found"
cp routes/nhl.js routes/nhl.js.backup 2>/dev/null || echo "No nhl.js found"

# Backup server.js
cp server.js server.js.backup
cp index.js index.js.backup

echo "✅ Backups created:"
ls -la routes/*.backup server.js.backup index.js.backup
echo ""
echo "📝 Ready to update routes with stub endpoints"
