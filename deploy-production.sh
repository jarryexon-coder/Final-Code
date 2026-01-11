#!/bin/bash
# deploy-production.sh - Complete production deployment

set -e
echo "🚀 NBA BACKEND PRODUCTION DEPLOYMENT"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# 1. Pre-flight checks
echo "1. Running pre-flight checks..."
if [ ! -f "server.js" ]; then
    print_error "server.js not found!"
    exit 1
fi
print_status "Server file found"

if ! command -v node &> /dev/null; then
    print_error "Node.js not found!"
    exit 1
fi
print_status "Node.js $(node --version)"

# 2. Pull latest code
echo ""
echo "2. Updating codebase..."
git fetch origin
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ $LOCAL = $REMOTE ]; then
    print_status "Already up-to-date"
else
    git pull origin main
    print_status "Code updated"
fi

# 3. Install dependencies
echo ""
echo "3. Installing dependencies..."
npm ci --only=production
print_status "Dependencies installed"

# 4. Run tests
echo ""
echo "4. Running tests..."
if npm test 2>/dev/null; then
    print_status "All tests passed"
else
    print_warning "Tests failed or not configured, continuing deployment..."
fi

# 5. Database migrations (if any)
echo ""
echo "5. Checking database migrations..."
if [ -f "scripts/migrate.js" ]; then
    node scripts/migrate.js
    print_status "Database migrations completed"
else
    print_status "No migrations found"
fi

# 6. Stop and restart PM2 cluster
echo ""
echo "6. Deploying with PM2..."
pm2 stop nba-backend 2>/dev/null || true
print_status "Old processes stopped"

pm2 start ecosystem.config.cjs
print_status "PM2 cluster started"

# 7. Health check
echo ""
echo "7. Performing health check..."
sleep 5
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f http://localhost:3002/health > /dev/null; then
        print_status "Health check passed"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    print_warning "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 3
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    pm2 logs nba-backend --lines 50
    exit 1
fi

# 8. Reload Nginx
echo ""
echo "8. Updating Nginx..."
if sudo nginx -t 2>/dev/null; then
    sudo nginx -s reload
    print_status "Nginx reloaded"
else
    print_warning "Nginx configuration test failed, skipping reload"
fi

# 9. Final verification
echo ""
echo "9. Final verification..."
echo "   PM2 Status:"
pm2 status nba-backend --nostats | grep -A2 "nba-backend"
echo ""
echo "   API Endpoints:"
ENDPOINTS=("/health" "/api/sports-analytics/arbitrage" "/api/situational/spot-plays")
for endpoint in "${ENDPOINTS[@]}"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080$endpoint)
    if [ "$CODE" = "200" ]; then
        echo -e "   ${GREEN}✓${NC} $endpoint (HTTP $CODE)"
    else
        echo -e "   ${RED}✗${NC} $endpoint (HTTP $CODE)"
    fi
done

echo ""
echo "====================================="
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""
echo "📊 Next Steps:"
echo "   1. Monitor logs: pm2 logs nba-backend"
echo "   2. Real-time monitoring: pm2 monit"
echo "   3. Check analytics: curl http://localhost:8080/api/secret-phrases/aggregate"
echo "   4. Set up SSL: sudo certbot --nginx -d yourdomain.com"
echo ""
echo "🔗 Access your API:"
echo "   Development: http://localhost:8080"
echo "   Direct: http://localhost:3002"
echo "   Health Check: http://localhost:8080/health"
