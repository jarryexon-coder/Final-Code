#!/bin/bash

echo "🔍 Checking MongoDB Authentication Status"
echo "========================================"

# Check which config is being used
echo "1. Checking running MongoDB process..."
PID=$(ps aux | grep mongod | grep -v grep | awk '{print $2}')
if [ -n "$PID" ]; then
    echo "   MongoDB PID: $PID"
    CONFIG=$(lsof -p $PID 2>/dev/null | grep mongod.conf | awk '{print $NF}')
    echo "   Config file: $CONFIG"
    
    if [ -f "$CONFIG" ]; then
        echo "   Config content (security section):"
        grep -A5 "security:" "$CONFIG" || echo "   No security section found"
    fi
else
    echo "   ❌ MongoDB is not running"
fi

echo ""
echo "2. Testing authentication..."

# Test without auth
echo "   a) Without credentials:"
mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "      ❌ FAIL: Connected without authentication"
else
    echo "      ✅ PASS: Authentication required"
fi

# Test with wrong auth
echo "   b) With wrong credentials:"
mongosh -u wrong -p wrong --quiet --eval "db.adminCommand('ping')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "      ❌ FAIL: Wrong credentials accepted"
else
    echo "      ✅ PASS: Wrong credentials rejected"
fi

# Test with correct auth
echo "   c) With correct admin credentials:"
mongosh -u adminUser -p SuperSecurePassword123!@# --authenticationDatabase admin --quiet --eval "db.adminCommand('ping')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "      ✅ PASS: Correct credentials work"
else
    echo "      ❌ FAIL: Correct credentials don't work"
fi

echo ""
echo "3. Checking log for authentication status..."
LOG_FILE="/opt/homebrew/var/log/mongodb/mongo.log"
if [ -f "$LOG_FILE" ]; then
    AUTH_LINE=$(tail -50 "$LOG_FILE" | grep -i "auth\|ACCESS" | tail -1)
    if echo "$AUTH_LINE" | grep -q "Authorization: enabled"; then
        echo "   ✅ Log shows authentication is enabled"
    else
        echo "   ⚠️  Log doesn't show authentication status"
        echo "   Last auth-related log: $AUTH_LINE"
    fi
else
    echo "   ⚠️  Log file not found at $LOG_FILE"
fi

echo ""
echo "📊 SUMMARY:"
echo "   If you see '✅ PASS' for all tests, authentication is working."
echo "   If you see '❌ FAIL' for test a or b, authentication is NOT enabled."
