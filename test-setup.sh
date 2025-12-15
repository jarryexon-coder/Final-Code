#!/bin/bash

echo "🏀 NBA Fantasy AI - Setup Status Report"
echo "======================================="
echo ""
echo "📅 Report generated: $(date)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Checking Directory Structure..."
echo "---------------------------------"

# Check parent directory
if [ -d "nba-backend" ] && [ -d "nba-fantasy-fresh" ]; then
    echo -e "${GREEN}✅ Both projects found in current directory${NC}"
    echo "   Location: $(pwd)"
else
    echo -e "${RED}❌ Projects not found in expected locations${NC}"
    exit 1
fi

echo ""
echo "📦 BACKEND STATUS (nba-backend/)"
echo "--------------------------------"

cd nba-backend
BACKEND_DIR=$(pwd)

# 1. Check required files
echo "1. Required Files:"
if [ -f "package.json" ]; then
    echo -e "   ${GREEN}✅ package.json${NC}"
else
    echo -e "   ${RED}❌ package.json (MISSING)${NC}"
fi

if [ -f "server.js" ]; then
    echo -e "   ${GREEN}✅ server.js${NC}"
else
    echo -e "   ${RED}❌ server.js (MISSING)${NC}"
fi

if [ -f ".env" ] || [ -f ".env.production" ] || [ -f ".env.example" ]; then
    echo -e "   ${GREEN}✅ Environment file${NC}"
else
    echo -e "   ${YELLOW}⚠️  No environment file found${NC}"
fi

# 2. Check dependencies
echo ""
echo "2. Dependencies:"
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✅ node_modules installed${NC}"
    NODE_MODULES=true
else
    echo -e "   ${YELLOW}⚠️  node_modules not installed${NC}"
    NODE_MODULES=false
fi

# 3. Check package.json scripts
echo ""
echo "3. Package Scripts:"
if [ -f "package.json" ]; then
    SCRIPTS=$(grep -A 10 '"scripts"' package.json)
    if echo "$SCRIPTS" | grep -q '"start"'; then
        echo -e "   ${GREEN}✅ start script${NC}"
    else
        echo -e "   ${RED}❌ start script (MISSING)${NC}"
    fi
    
    if echo "$SCRIPTS" | grep -q '"dev"'; then
        echo -e "   ${GREEN}✅ dev script${NC}"
    else
        echo -e "   ${YELLOW}⚠️  dev script (optional)${NC}"
    fi
fi

# 4. Check server.js structure
echo ""
echo "4. Server.js Analysis:"
if [ -f "server.js" ]; then
    # Count endpoints
    ENDPOINTS=$(grep -c "app\." server.js)
    echo -e "   ${GREEN}✅ Found $ENDPOINTS API endpoints${NC}"
    
    # Check for common patterns
    if grep -q "express()" server.js; then
        echo -e "   ${GREEN}✅ Express setup found${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Express setup not found${NC}"
    fi
    
    if grep -q "listen" server.js; then
        echo -e "   ${GREEN}✅ Server listener found${NC}"
    else
        echo -e "   ${RED}❌ Server listener missing${NC}"
    fi
fi

# 5. Try to start backend
echo ""
echo "5. Backend Health Check:"
if [ "$NODE_MODULES" = true ]; then
    # Check if server is already running
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "   ${GREEN}✅ Backend is running${NC}"
        BACKEND_RUNNING=true
    else
        echo -e "   ${YELLOW}⚠️  Backend not running. Attempting to start...${NC}"
        # Start in background
        node server.js > /tmp/backend-test.log 2>&1 &
        BACKEND_PID=$!
        sleep 3
        
        if curl -s http://localhost:3000/health > /dev/null; then
            echo -e "   ${GREEN}✅ Backend started successfully${NC}"
            BACKEND_RUNNING=true
            # Kill the test backend
            kill $BACKEND_PID 2>/dev/null
        else
            echo -e "   ${RED}❌ Failed to start backend${NC}"
            echo -e "   ${YELLOW}   Logs:${NC}"
            tail -5 /tmp/backend-test.log | sed 's/^/        /'
            BACKEND_RUNNING=false
        fi
    fi
else
    echo -e "   ${YELLOW}⚠️  Skipping (dependencies not installed)${NC}"
    BACKEND_RUNNING=false
fi

echo ""
echo "📱 FRONTEND STATUS (nba-fantasy-fresh/)"
echo "---------------------------------------"

cd ../nba-fantasy-fresh
FRONTEND_DIR=$(pwd)

# 1. Check required files
echo "1. Required Files:"
if [ -f "package.json" ]; then
    echo -e "   ${GREEN}✅ package.json${NC}"
else
    echo -e "   ${RED}❌ package.json (MISSING)${NC}"
fi

if [ -f "App.js" ]; then
    echo -e "   ${GREEN}✅ App.js${NC}"
else
    echo -e "   ${RED}❌ App.js (MISSING)${NC}"
fi

if [ -d "src" ]; then
    echo -e "   ${GREEN}✅ src/ directory${NC}"
else
    echo -e "   ${RED}❌ src/ directory (MISSING)${NC}"
fi

# 2. Check screens
echo ""
echo "2. Screen Files:"
SCREENS=("HomeScreen" "FantasyScreen" "LiveGamesScreen" "SportsNewsHub" "NHLScreen" "NFLScreen" "PlayerStatsScreen" "AnalyticsScreen" "PremiumScreen" "SettingsScreen")
SCREEN_COUNT=0

for screen in "${SCREENS[@]}"; do
    if find src -name "*$screen*" -type f | grep -q .; then
        echo -e "   ${GREEN}✅ $screen${NC}"
        ((SCREEN_COUNT++))
    else
        echo -e "   ${RED}❌ $screen${NC}"
    fi
done
echo -e "   ${GREEN}📊 Total: $SCREEN_COUNT/${#SCREENS[@]} screens found${NC}"

# 3. Check API service
echo ""
echo "3. API Configuration:"
if [ -f "src/services/ApiService.js" ]; then
    echo -e "   ${GREEN}✅ ApiService.js${NC}"
    
    # Check if using your IP
    if grep -q "10.0.0.183" src/services/ApiService.js; then
        echo -e "   ${GREEN}✅ Your IP configured${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Your IP not found in ApiService${NC}"
    fi
else
    echo -e "   ${RED}❌ ApiService.js (MISSING)${NC}"
fi

# 4. Check dependencies
echo ""
echo "4. Dependencies:"
if [ -d "node_modules" ]; then
    echo -e "   ${GREEN}✅ node_modules installed${NC}"
    FRONTEND_DEPS=true
else
    echo -e "   ${YELLOW}⚠️  node_modules not installed${NC}"
    FRONTEND_DEPS=false
fi

# 5. Check environment
echo ""
echo "5. Environment:"
if [ -f ".env" ] || [ -f ".env.production" ] || [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✅ Environment file found${NC}"
    
    # Check API URL
    if grep -q "EXPO_PUBLIC_API_URL" .env 2>/dev/null || grep -q "EXPO_PUBLIC_API_URL" .env.production 2>/dev/null; then
        echo -e "   ${GREEN}✅ API URL configured${NC}"
    else
        echo -e "   ${YELLOW}⚠️  API URL not configured${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  No environment file${NC}"
fi

echo ""
echo "🔗 INTEGRATION STATUS"
echo "-------------------"

if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Backend is accessible${NC}"
    
    # Test API endpoints
    echo ""
    echo "Testing API endpoints:"
    
    ENDPOINTS=("health" "api/health" "api/nba/games" "api/nba/news" "api/nhl/games" "api/nfl/games")
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -s "http://localhost:3000/$endpoint" > /dev/null; then
            echo -e "   ${GREEN}✅ http://localhost:3000/$endpoint${NC}"
        else
            echo -e "   ${RED}❌ http://localhost:3000/$endpoint${NC}"
        fi
    done
    
    # Test from frontend perspective
    echo ""
    echo "Frontend connectivity:"
    if [ -f "src/services/ApiService.js" ]; then
        API_URL=$(grep "BASE_URL" src/services/ApiService.js | head -1 | sed "s/.*['\"]\(.*\)['\"].*/\1/" || echo "not found")
        echo -e "   ${YELLOW}🌐 API URL in frontend: $API_URL${NC}"
        
        if [[ "$API_URL" == *"10.0.0.183"* ]] || [[ "$API_URL" == *"localhost"* ]]; then
            if curl -s "$API_URL/health" > /dev/null; then
                echo -e "   ${GREEN}✅ Frontend can connect to backend${NC}"
            else
                echo -e "   ${RED}❌ Frontend cannot connect to backend${NC}"
            fi
        fi
    fi
else
    echo -e "${RED}❌ Backend not running - integration tests skipped${NC}"
fi

echo ""
echo "📊 SUMMARY REPORT"
echo "----------------"

# Calculate completion percentages
BACKEND_SCORE=0
BACKEND_TOTAL=10

if [ -f "package.json" ]; then ((BACKEND_SCORE+=2)); fi
if [ -f "server.js" ]; then ((BACKEND_SCORE+=2)); fi
if [ "$NODE_MODULES" = true ]; then ((BACKEND_SCORE+=1)); fi
if [ -f ".env" ] || [ -f ".env.production" ]; then ((BACKEND_SCORE+=1)); fi
if [ "$BACKEND_RUNNING" = true ]; then ((BACKEND_SCORE+=4)); fi

FRONTEND_SCORE=0
FRONTEND_TOTAL=10

if [ -f "package.json" ]; then ((FRONTEND_SCORE+=2)); fi
if [ -f "App.js" ]; then ((FRONTEND_SCORE+=2)); fi
if [ "$FRONTEND_DEPS" = true ]; then ((FRONTEND_SCORE+=1)); fi
if [ -f ".env" ] || [ -f ".env.production" ]; then ((FRONTEND_SCORE+=1)); fi
if [ -f "src/services/ApiService.js" ]; then ((FRONTEND_SCORE+=2)); fi
if [ "$BACKEND_RUNNING" = true ] && grep -q "10.0.0.183" src/services/ApiService.js 2>/dev/null; then ((FRONTEND_SCORE+=2)); fi

BACKEND_PERCENT=$((BACKEND_SCORE * 100 / BACKEND_TOTAL))
FRONTEND_PERCENT=$((FRONTEND_SCORE * 100 / FRONTEND_TOTAL))
OVERALL_PERCENT=$(((BACKEND_SCORE + FRONTEND_SCORE) * 100 / (BACKEND_TOTAL + FRONTEND_TOTAL)))

echo -e "${GREEN}Backend Completion: $BACKEND_PERCENT% ($BACKEND_SCORE/$BACKEND_TOTAL)${NC}"
echo -e "${GREEN}Frontend Completion: $FRONTEND_PERCENT% ($FRONTEND_SCORE/$FRONTEND_TOTAL)${NC}"
echo -e "${YELLOW}Overall Completion: $OVERALL_PERCENT%${NC}"

echo ""
echo "🚨 AREAS NEEDING ATTENTION"
echo "-------------------------"

# Backend issues
if [ ! -f "package.json" ]; then echo -e "${RED}❌ Backend package.json missing${NC}"; fi
if [ ! -f "server.js" ]; then echo -e "${RED}❌ Backend server.js missing${NC}"; fi
if [ "$NODE_MODULES" = false ]; then echo -e "${YELLOW}⚠️  Backend dependencies not installed${NC}"; fi
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then echo -e "${YELLOW}⚠️  Backend environment file missing${NC}"; fi
if [ "$BACKEND_RUNNING" = false ]; then echo -e "${RED}❌ Backend not running${NC}"; fi

# Frontend issues
if [ ! -f "package.json" ]; then echo -e "${RED}❌ Frontend package.json missing${NC}"; fi
if [ ! -f "App.js" ]; then echo -e "${RED}❌ Frontend App.js missing${NC}"; fi
if [ "$FRONTEND_DEPS" = false ]; then echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"; fi
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then echo -e "${YELLOW}⚠️  Frontend environment file missing${NC}"; fi
if [ ! -f "src/services/ApiService.js" ]; then echo -e "${RED}❌ ApiService.js missing${NC}"; fi
if [ "$SCREEN_COUNT" -lt 10 ]; then echo -e "${YELLOW}⚠️  Missing screens ($SCREEN_COUNT/10 found)${NC}"; fi

echo ""
echo "📋 NEXT STEPS"
echo "------------"

if [ "$OVERALL_PERCENT" -lt 50 ]; then
    echo "1. Install dependencies in both projects"
    echo "2. Create basic server.js for backend"
    echo "3. Ensure App.js exists in frontend"
    echo "4. Set up ApiService.js with your IP"
elif [ "$OVERALL_PERCENT" -lt 80 ]; then
    echo "1. Fix backend startup issues"
    echo "2. Complete missing screens"
    echo "3. Configure environment variables"
    echo "4. Test API connectivity"
else
    echo "1. Run full integration test"
    echo "2. Set up production environment"
    echo "3. Build for iOS/Android"
    echo "4. Deploy backend"
fi

echo ""
echo "🛠️  QUICK FIX COMMANDS"
echo "--------------------"

echo "# Backend:"
echo "cd nba-backend && npm install && node server.js"
echo ""
echo "# Frontend:"
echo "cd nba-fantasy-fresh && npm install && expo start -c"
echo ""
echo "# Test connectivity:"
echo "curl http://localhost:3000/health"
echo "curl http://10.0.0.183:3000/health"

echo ""
echo "✅ Test complete. Review the report above."
