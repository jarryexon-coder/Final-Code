#!/bin/bash

PORT=3002
BASE_URL="http://localhost:$PORT"

echo "🧪 Testing Fantasy API on port $PORT..."

echo "1. Testing health endpoint..."
curl -s "$BASE_URL/api/health" | python3 -m json.tool

echo -e "\n2. Testing players endpoint..."
curl -s "$BASE_URL/api/players" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Success: {data.get(\"success\", False)}')
print(f'📊 Player count: {data.get(\"count\", 0)}')
if data.get('players'):
    print(f'👤 Sample player: {data[\"players\"][0][\"name\"]}')
"

echo -e "\n3. Testing fantasy teams endpoint..."
curl -s "$BASE_URL/api/fantasy/teams" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'✅ Success: {data.get(\"success\", False)}')
print(f'🏀 Team count: {data.get(\"count\", 0)}')
if data.get('teams'):
    print(f'👥 Sample team: {data[\"teams\"][0][\"name\"]}')
"

echo -e "\n✅ Testing complete!"
