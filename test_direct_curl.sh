#!/bin/bash
cd /Users/jerryexon/sports-app-production/nba-backend

echo "🛑 Stopping existing backend..."
pkill -9 -f "node server.js" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 2

echo "🚀 Starting fixed backend..."
node server.js > /tmp/server_fixed_test.log 2>&1 &
SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"

# Wait for startup
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
  if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Server is up and running!"
    break
  fi
  echo -n "."
  sleep 1
done

echo -e "\n📋 Health check:"
curl -s http://localhost:3002/health | grep -E "status|mongodb"

echo -e "\n🧪 Testing secret phrase endpoint..."
TEST_ID="DIRECT_TEST_$(date +%s)"
echo "Test User ID: $TEST_ID"

# Test with curl directly
curl -v -X POST http://localhost:3002/api/secret-phrases/log-event \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'"$TEST_ID"'",
    "phraseKey": "26arbitrage",
    "phraseCategory": "direct_test",
    "eventType": "discovery",
    "inputText": "Direct curl test with fixed server",
    "sport": "NBA"
  }'

echo -e "\n🔍 Checking server logs..."
sleep 2
echo "=== Last 15 lines of server log ==="
tail -15 /tmp/server_fixed_test.log

echo -e "\n📊 Direct MongoDB check command:"
echo 'mongosh "mongodb+srv://Jerryexon1:Bigyear1@cluster0.6sqqrz.mongodb.net/sports-app?appName=Cluster0" --eval "'
echo '  print(\"Searching for: '$TEST_ID'\");'
echo '  const doc = db.analyticsevents.findOne({userId: \"'$TEST_ID'\"});'
echo '  if (doc) {'
echo '    print(\"✅ FOUND!\");'
echo '    print(\"  ID: \" + doc._id);'
echo '    print(\"  User: \" + doc.userId);'
echo '    print(\"  Phrase: \" + doc.phraseKey);'
echo '    print(\"  Time: \" + doc.timestamp);'
echo '  } else {'
echo '    print(\"❌ NOT FOUND\");'
echo '    print(\"\\nRecent documents:\");'
echo '    db.analyticsevents.find().sort({_id: -1}).limit(3).forEach(d => {'
echo '      print(\"  - \" + d.userId + \" (\" + d.phraseKey + \") at \" + d.timestamp);'
echo '    });'
echo '  }'
echo '"'

# Kill server at the end
echo -e "\n🛑 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
