#!/bin/bash
# deploy.sh
echo "🚀 Deploying NBA Fantasy Backend..."

# Stop existing processes
pm2 stop nba-backend 2>/dev/null

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Set environment
export NODE_ENV=production

# Start with PM2
pm2 start pm2.config.cjs --env production

# Save PM2 state
pm2 save

echo "✅ Deployment complete!"
echo "📊 Check logs: pm2 logs nba-backend"
echo "🌐 Health check: https://your-domain.com/health"
