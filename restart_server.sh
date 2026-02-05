#!/bin/bash

echo "🔄 Restarting Fantasy API Server..."

# Kill any existing server
echo "Stopping any existing servers..."
pkill -f "python.*api_server" 2>/dev/null || true
pkill -f "python.*debug_server" 2>/dev/null || true
pkill -f "python.*minimal_server" 2>/dev/null || true

# Wait a moment
sleep 2

# Generate fresh data if needed
if [ ! -f "players_data.json" ] || [ ! -f "fantasy_teams_data.json" ]; then
    echo "📊 Generating data files..."
    python3 generate_players.py > /dev/null 2>&1
    python3 generate_fantasy_teams.py > /dev/null 2>&1
    echo "✅ Data files generated"
fi

# Start the server
echo "🚀 Starting server on port 5000..."
PORT=5000 python3 api_server.py
