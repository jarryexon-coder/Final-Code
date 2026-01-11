#!/bin/bash
# setup.sh - Complete PM2 setup for NBA Backend

set -e  # Exit on error

echo "🔧 Setting up NBA Backend with PM2..."

# 1. Navigate to project
cd /Users/jerryexon/sports-app-production/nba-backend
echo "📁 Working directory: $(pwd)"

# 2. Check server.js exists
if [ ! -f "server.js" ]; then
  echo "❌ ERROR: server.js not found!"
  echo "Available .js files:"
  find . -name "*.js" -type f | head -10
  exit 1
fi

echo "✅ Found server.js"

# 3. Stop any existing PM2 processes
echo "🛑 Stopping any existing processes..."
pm2 delete nba-backend 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 4. Create logs directory
mkdir -p logs
echo "📁 Created logs directory"

# 5. Create a simple PM2 config
cat > pm2-config.json << 'PM2EOF'
{
  "apps": [{
    "name": "nba-backend",
    "script": "server.js",
    "cwd": "/Users/jerryexon/sports-app-production/nba-backend",
    "instances": 1,
    "exec_mode": "fork",
    "autorestart": true,
    "watch": false,
    "max_memory_restart": "500M",
    "env": {
      "NODE_ENV": "production",
      "PORT": "3002"
    },
    "error_file": "logs/err.log",
    "out_file": "logs/out.log",
    "log_date_format": "YYYY-MM-DD HH:mm:ss"
  }]
}
PM2EOF

echo "📝 Created PM2 config"

# 6. Start with PM2
echo "🚀 Starting server with PM2..."
pm2 start pm2-config.json

# 7. Wait and check status
sleep 3
echo "📊 PM2 Status:"
pm2 status

# 8. Check logs for errors
echo "📋 Checking logs..."
if [ -f "logs/err.log" ]; then
  echo "Error log (last 10 lines):"
  tail -10 logs/err.log
fi

if [ -f "logs/out.log" ]; then
  echo "Output log (last 10 lines):"
  tail -10 logs/out.log
fi

# 9. Test the server
echo "🏥 Testing server health..."
sleep 2
curl -s -f http://localhost:3002/health >/dev/null && echo "✅ Server is healthy!" || echo "❌ Server health check failed"

# 10. Set up PM2 startup
echo "🔐 Setting up PM2 startup..."
pm2 startup 2>/dev/null || echo "⚠️  PM2 startup already configured"
pm2 save

echo ""
echo "🎉 Setup complete!"
echo "📌 Use 'pm2 status' to check status"
echo "📌 Use 'pm2 logs nba-backend' to view logs"
echo "📌 Use 'pm2 monit' for real-time monitoring"
