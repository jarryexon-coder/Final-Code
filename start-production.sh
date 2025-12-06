#!/bin/bash

echo "🚀 NBA Fantasy Platform - Production Startup"
echo "============================================"

# Load environment
export NODE_ENV=production

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ Error: .env file not found!"
  echo "Please copy .env.production to .env and update with your credentials"
  exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
PGPASSWORD=$(grep DB_PASSWORD .env | cut -d= -f2) \
psql -h $(grep DB_HOST .env | cut -d= -f2) \
     -p $(grep DB_PORT .env | cut -d= -f2) \
     -d $(grep DB_NAME .env | cut -d= -f2) \
     -U $(grep DB_USER .env | cut -d= -f2) \
     -c "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Database connection failed!"
  echo "Please check your .env file and ensure PostgreSQL is running"
  exit 1
fi

echo "✅ Database connected successfully"

# Check if Redis is configured and running
if grep -q "REDIS_URL" .env; then
  REDIS_URL=$(grep REDIS_URL .env | cut -d= -f2)
  echo "🔍 Checking Redis connection..."
  if command -v redis-cli &> /dev/null; then
    redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ Redis connected successfully"
    else
      echo "⚠️  Redis not responding, continuing without cache"
    fi
  else
    echo "⚠️  redis-cli not found, skipping Redis check"
  fi
fi

# Create logs directory
mkdir -p logs

# Run database migrations
echo "📊 Running database migrations..."
for migration in db/migrations/*.sql; do
  echo "  Running: $(basename $migration)"
  PGPASSWORD=$(grep DB_PASSWORD .env | cut -d= -f2) \
  psql -h $(grep DB_HOST .env | cut -d= -f2) \
       -p $(grep DB_PORT .env | cut -d= -f2) \
       -d $(grep DB_NAME .env | cut -d= -f2) \
       -U $(grep DB_USER .env | cut -d= -f2) \
       -f "$migration" > /dev/null 2>&1
done

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm ci --only=production
fi

# Start the server with PM2 (if installed) or node
if command -v pm2 &> /dev/null; then
  echo "🚀 Starting with PM2..."
  pm2 start server.js --name "nba-fantasy-api" \
    --log logs/pm2.log \
    --error logs/pm2-error.log \
    --output logs/pm2-out.log \
    --time
  echo "✅ API started with PM2"
  echo "   View logs: pm2 logs nba-fantasy-api"
  echo "   Status: pm2 status"
else
  echo "🚀 Starting with Node.js..."
  echo "📝 Logs will be written to logs/ directory"
  nohup node server.js > logs/server.log 2> logs/server-error.log &
  echo $! > server.pid
  echo "✅ API started (PID: $(cat server.pid))"
  echo "   View logs: tail -f logs/server.log"
fi

echo ""
echo "🎯 API Endpoints:"
echo "   Health: http://$(hostname -I | awk '{print $1}'):$(grep PORT .env | cut -d= -f2)/api/monitoring/health"
echo "   Promo: http://$(hostname -I | awk '{print $1}'):$(grep PORT .env | cut -d= -f2)/api/promo/health"
echo "   NBA Data: http://$(hostname -I | awk '{print $1}'):$(grep PORT .env | cut -d= -f2)/api/nba/games/today"
echo ""
echo "📱 Frontend should connect to: http://$(hostname -I | awk '{print $1}'):$(grep PORT .env | cut -d= -f2)"
