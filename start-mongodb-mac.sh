#!/bin/bash

echo "🚀 Starting MongoDB on macOS..."
echo "================================"

# Stop everything
echo "1. Stopping any running MongoDB..."
brew services stop mongodb-community 2>/dev/null
pkill -9 mongod 2>/dev/null || true

# Verify config
echo "2. Checking configuration..."
CONFIG_FILE="/opt/homebrew/etc/mongod.conf"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "   Creating config file..."
    sudo tee "$CONFIG_FILE" > /dev/null << 'CONFIG'
systemLog:
  destination: file
  path: /opt/homebrew/var/log/mongodb/mongo.log
  logAppend: true

storage:
  dbPath: /opt/homebrew/var/mongodb

net:
  bindIp: 127.0.0.1
  port: 27017

security:
  authorization: enabled
CONFIG
fi

# Make sure config has auth enabled
if grep -q "authorization: enabled" "$CONFIG_FILE"; then
    echo "   ✅ Config has authentication enabled"
else
    echo "   ❌ Config missing authentication - fixing..."
    echo "security:" >> "$CONFIG_FILE"
    echo "  authorization: enabled" >> "$CONFIG_FILE"
fi

# Ensure directories exist
echo "3. Setting up directories..."
sudo mkdir -p /opt/homebrew/var/log/mongodb 2>/dev/null
sudo mkdir -p /opt/homebrew/var/mongodb 2>/dev/null
sudo touch /opt/homebrew/var/log/mongodb/mongo.log 2>/dev/null
sudo chown -R $(whoami) /opt/homebrew/var/log/mongodb 2>/dev/null
sudo chown -R $(whoami) /opt/homebrew/var/mongodb 2>/dev/null

# Start MongoDB
echo "4. Starting MongoDB..."
echo "   Note: On macOS, we can't use --fork option"

# Try starting with Homebrew service first
if brew services start mongodb-community 2>/dev/null; then
    echo "   ✅ Started via Homebrew service"
else
    echo "   ⚠️  Homebrew service failed, starting manually..."
    # Start manually in background
    mongod --config "$CONFIG_FILE" > /dev/null 2>&1 &
    echo "   ✅ Started manually"
fi

# Wait and test
echo "5. Testing connection..."
sleep 5

# Check if running
if ps aux | grep -q "[m]ongod"; then
    echo "   ✅ MongoDB is running"
    
    # Test authentication
    echo "6. Testing authentication..."
    
    # Test without auth
    if mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null; then
        echo "   ❌ FAIL: Can connect without authentication"
        AUTH_WORKING=false
    else
        echo "   ✅ PASS: Authentication required"
        AUTH_WORKING=true
    fi
    
    # Test with auth
    if mongosh -u adminUser -p AdminSecure123 --authenticationDatabase admin --quiet --eval "db.adminCommand('ping')" 2>/dev/null; then
        echo "   ✅ PASS: Authentication works with correct credentials"
    else
        echo "   ⚠️  Could not test with credentials (user may not exist)"
    fi
else
    echo "   ❌ MongoDB failed to start"
    echo "   Check logs: tail -50 /opt/homebrew/var/log/mongodb/mongo.log"
fi

echo ""
echo "📊 Summary:"
echo "   To view logs: tail -f /opt/homebrew/var/log/mongodb/mongo.log"
echo "   To stop: brew services stop mongodb-community"
echo "   To restart: brew services restart mongodb-community"
