#!/bin/bash

echo "========================================="
echo "  NBA FANTASY AI BACKEND - START        "
echo "========================================="
echo ""

# Kill any existing process on port 3002
echo "🔍 Checking for existing processes on port 3002..."
PID=$(lsof -ti:3002)
if [ ! -z "$PID" ]; then
    echo "Found existing process(es): $PID"
    kill -9 $PID 2>/dev/null
    echo "✅ Killed existing processes"
    sleep 2
fi

# Check dependencies
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running npm install..."
    npm install
else
    echo "✅ node_modules exists"
fi

# Check environment
echo ""
echo "🔧 Environment check:"
echo "PORT: ${PORT:-3002}"
echo "NODE_ENV: ${NODE_ENV:-development}"
if [ -z "$MONGODB_URI" ] && [ -f ".env" ]; then
    echo "MONGODB_URI: Loaded from .env"
else
    echo "MONGODB_URI: ${MONGODB_URI:+Set}"
fi

# Verify syntax
echo ""
echo "🔍 Verifying server.js syntax..."
if node -c server.js; then
    echo "✅ server.js syntax is valid"
else
    echo "❌ server.js has syntax errors"
    exit 1
fi

# Start server
echo ""
echo "🚀 Starting server..."
echo "========================================="
echo ""

# Set default port if not set
export PORT=${PORT:-3002}

# Start the server
node server.js
