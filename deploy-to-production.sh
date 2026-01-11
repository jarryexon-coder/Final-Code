#!/bin/bash
# Production Server Deployment Script
echo "🚀 Deploying NBA Backend to Production..."

# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
sudo apt install -y nodejs npm nginx mongodb redis-server git

# 3. Clone repository
git clone https://github.com/jarryexon-coder/Final-Code.git /opt/nba-backend
cd /opt/nba-backend

# 4. Install Node.js dependencies
npm ci --only=production

# 5. Copy environment file
cp .env.production.example .env
# EDIT .env with your production API keys

# 6. Set up PM2
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save

# 7. Configure Nginx
sudo cp nginx-production.conf /etc/nginx/sites-available/nba-backend
sudo ln -s /etc/nginx/sites-available/nba-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. Set up SSL (if domain configured)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

echo "✅ Production deployment complete!"
echo "📊 API: https://api.yourdomain.com"
echo "🏥 Health: https://api.yourdomain.com/health"
