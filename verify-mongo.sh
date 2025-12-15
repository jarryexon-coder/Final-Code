#!/bin/bash

echo "🔍 MongoDB Authentication Verification"
echo "====================================="

# Check if running
echo "1. MongoDB process:"
if ps aux | grep -q "[m]ongod --dbpath"; then
    echo "   ✅ Running"
    echo "   Command: $(ps aux | grep '[m]ongod --dbpath' | head -1 | awk '{$1=$2=$3=$4=$5=$6=$7=$8=$9=""; print $0}')"
else
    echo "   ❌ Not running"
    exit 1
fi

echo ""
echo "2. Authentication tests:"

# Test without auth
OUTPUT1=$(mongosh --quiet --eval "db.adminCommand('ping')" 2>&1)
if echo "$OUTPUT1" | grep -q "{ ok: 1 }"; then
    echo "   ❌ Can connect WITHOUT authentication"
    echo "   Output: $OUTPUT1"
else
    echo "   ✅ Cannot connect without authentication"
    echo "   Error: $(echo "$OUTPUT1" | head -1)"
fi

# Test with auth
OUTPUT2=$(mongosh -u nbaAppUser -p AppSecure456 --authenticationDatabase nba-fantasy --quiet --eval "db.adminCommand('ping')" 2>&1)
if echo "$OUTPUT2" | grep -q "{ ok: 1 }"; then
    echo "   ✅ Can connect WITH authentication"
else
    echo "   ❌ Cannot connect with authentication"
    echo "   Error: $(echo "$OUTPUT2" | head -1)"
fi

echo ""
echo "3. Log check (last 5 lines):"
tail -5 /opt/homebrew/var/log/mongodb/mongo.log

echo ""
echo "📊 Result:"
if echo "$OUTPUT1" | grep -q "Authentication failed" && echo "$OUTPUT2" | grep -q "{ ok: 1 }"; then
    echo "✅ MongoDB authentication is WORKING correctly!"
else
    echo "❌ MongoDB authentication is NOT working correctly."
    echo "   Try running: ./reset-mongo-complete.sh"
fi
