#!/bin/bash

echo "🏀 Starting NBA Fantasy AI Development Environment"
echo "=================================================="

cd ~/nba-backend

# Kill any existing server
echo "Stopping any existing server..."
pkill -f "node server" 2>/dev/null || true

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Creating default .env file..."
    cat > .env << 'ENV_DEFAULT'
NODE_ENV=development
ENV_PROD=false
PORT=3000
DOMAIN=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/nba-fantasy-ai
FRONTEND_URL=http://localhost:8081
ALLOWED_ORIGINS=http://localhost:8081,http://10.0.0.183:8081
LOG_LEVEL=info
JWT_SECRET=development-jwt-secret
ENV_DEFAULT
    echo "✅ Created .env file"
fi

# Start the server
echo "🚀 Starting backend server on port 3000..."
node server.js &

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend server is running!"
    echo "🌐 API available at: http://localhost:3000"
    echo "🔗 Health check: http://localhost:3000/health"
    echo "👑 Influencer API: http://localhost:3000/api/influencer/health"
    echo "🎁 Promo API: http://localhost:3000/api/promo/health"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

echo ""
echo "🏀 Starting frontend..."
echo "======================="
cd ~/nba-frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting Expo development server..."
echo "📱 Open the Expo Go app on your phone and scan the QR code"
echo "💻 Or press 'w' to open in web browser"
echo ""
echo "Press Ctrl+C to stop both servers"

# Start Expo
npx expo start --clear
