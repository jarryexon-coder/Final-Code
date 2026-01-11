#!/bin/bash
# deploy.sh - Production deployment script for NBA Backend

set -e  # Exit on error

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# 3. Stop current cluster
echo "🛑 Stopping current PM2 cluster..."
pm2 stop nba-backend 2>/dev/null || true
pm2 delete nba-backend 2>/dev/null || true

# 4. Start new cluster
echo "🚀 Starting PM2 cluster..."
pm2 start ecosystem.config.js

# 5. Wait for health check
echo "🏥 Waiting for health check..."
sleep 3

for i in {1..10}; do
  if curl -s -f http://localhost:3002/health > /dev/null; then
    echo "✅ Health check passed!"
    break
  fi
  echo "⏳ Waiting for server to start... ($i/10)"
  sleep 2
done

# 6. Reload Nginx
echo "🔧 Reloading Nginx..."
sudo nginx -s reload 2>/dev/null || echo "⚠️  Nginx reload skipped (might not be installed)"

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 PM2 Status:"
pm2 status nba-backend --nostats | head -10
