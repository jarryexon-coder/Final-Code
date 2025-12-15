#!/bin/bash

echo "🔐 Testing MongoDB Authentication"
echo "================================"

# Check if MongoDB is running
echo "1. Checking MongoDB process..."
if ps aux | grep -q "[m]ongod --dbpath"; then
    echo "   ✅ MongoDB is running"
    MONGOD_PID=$(ps aux | grep "[m]ongod --dbpath" | awk '{print $2}' | head -1)
    echo "   PID: $MONGOD_PID"
    echo "   Command: $(ps -p $MONGOD_PID -o args=)"
else
    echo "   ❌ MongoDB is NOT running"
    exit 1
fi

echo ""
echo "2. Testing WITHOUT credentials (should FAIL):"
OUTPUT1=$(mongosh --quiet --eval "db.adminCommand('ping')" 2>&1)
echo "   Command: mongosh --quiet --eval \"db.adminCommand('ping')\""
echo "   Output: $OUTPUT1"
if echo "$OUTPUT1" | grep -q "{ ok: 1 }"; then
    echo "   ❌ FAIL: Can connect without authentication"
    AUTH_WORKING=false
else
    echo "   ✅ PASS: Authentication required"
    AUTH_WORKING=true
fi

echo ""
echo "3. Testing WITH wrong credentials (should FAIL):"
OUTPUT2=$(mongosh -u wrong -p wrong --quiet --eval "db.adminCommand('ping')" 2>&1)
echo "   Command: mongosh -u wrong -p wrong --quiet --eval \"db.adminCommand('ping')\""
echo "   Output: $(echo "$OUTPUT2" | head -1)"
if echo "$OUTPUT2" | grep -q "{ ok: 1 }"; then
    echo "   ❌ FAIL: Wrong credentials accepted"
    AUTH_WORKING=false
else
    echo "   ✅ PASS: Wrong credentials rejected"
fi

echo ""
echo "4. Testing WITH app credentials (should WORK):"
OUTPUT3=$(mongosh -u app -p app123 --authenticationDatabase nba-fantasy --quiet --eval "db.adminCommand('ping')" 2>&1)
echo "   Command: mongosh -u app -p app123 --authenticationDatabase nba-fantasy --quiet --eval \"db.adminCommand('ping')\""
echo "   Output: $OUTPUT3"
if echo "$OUTPUT3" | grep -q "{ ok: 1 }"; then
    echo "   ✅ PASS: Authentication works with correct credentials"
else
    echo "   ❌ FAIL: Authentication doesn't work"
    AUTH_WORKING=false
fi

echo ""
echo "5. Checking logs for authentication status:"
LOG_LINE=$(tail -20 /opt/homebrew/var/log/mongodb/mongo.log | grep -i "authorization" | tail -1)
echo "   Log: $LOG_LINE"

echo ""
echo "📊 FINAL RESULT:"
if [ "$AUTH_WORKING" = true ]; then
    echo "   ✅ MongoDB authentication is WORKING CORRECTLY!"
    echo ""
    echo "   🎉 SUCCESS! Use this connection string in your .env:"
    echo "   MONGODB_URI=mongodb://app:app123@localhost:27017/nba-fantasy?authSource=nba-fantasy"
else
    echo "   ❌ MongoDB authentication is NOT working"
    echo "   Try the nuclear reset again or use Docker instead"
fi
