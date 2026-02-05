#!/bin/bash

# Configuration
PORT=${1:-5001}  # Use first argument or default to 5001
LOG_FILE="fantasy_api.log"

echo "🧹 Cleaning up old processes..."
sudo lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 1

echo "🚀 Starting Fantasy API Server on port $PORT..."

# Run server in background with proper output redirection
python3 api_server_fixed.py > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start (PID: $SERVER_PID)..."
sleep 3

# Test if server is running
if curl -s --max-time 5 "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "✅ Server started successfully on port $PORT!"
    echo ""
    echo "🌐 API Endpoints:"
    echo "   Health:      curl http://localhost:$PORT/api/health"
    echo "   Players:     curl http://localhost:$PORT/api/players"
    echo "   Teams:       curl http://localhost:$PORT/api/fantasy/teams"
    echo ""
    echo "📊 Quick test:"
    curl -s "http://localhost:$PORT/api/health" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'   Status: {data.get(\"status\", \"unknown\")}')
    print(f'   Players: {data.get(\"data_stats\", {}).get(\"players\", 0)}')
    print(f'   Teams: {data.get(\"data_stats\", {}).get(\"teams\", 0)}')
except:
    print('   Could not parse response')
"
    echo ""
    echo "📝 Log file: $LOG_FILE (tail -f $LOG_FILE)"
    echo "🛑 Stop with: kill $SERVER_PID"
else
    echo "❌ Server failed to start. Checking logs..."
    tail -20 "$LOG_FILE"
    echo ""
    echo "💡 Try a different port: ./start_fantasy_api.sh 5002"
fi
