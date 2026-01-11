#!/bin/bash
# NBA Backend Final Deployment
echo "🎯 NBA BACKEND FINAL DEPLOYMENT"
echo "==============================="

# 1. Stop services
pm2 stop nba-backend

# 2. Update code
git pull origin main

# 3. Install dependencies
npm ci --only=production

# 4. Run migrations (if any)
node scripts/migrate-database.js

# 5. Start with cluster mode
pm2 delete nba-backend
pm2 start ecosystem.config.cjs --env production

# 6. Wait for health
sleep 5
curl -f https://api.yourdomain.com/health || exit 1

# 7. Update Nginx
sudo nginx -t && sudo systemctl reload nginx

# 8. Create deployment tag
git tag -a "v5.0.0-production-$(date +%Y%m%d)" -m "Production deployment"
git push origin --tags

echo "✅ DEPLOYMENT COMPLETE!"
echo "📊 Dashboard: https://api.yourdomain.com/status"
echo "📚 Docs: https://api.yourdomain.com/api-docs"
echo "🔧 Health: https://api.yourdomain.com/health"
