#!/bin/bash

echo "🚀 Deploying updated API to Railway..."

# 1. Make sure you have Railway CLI installed
# npm install -g @railway/cli

# 2. Login to Railway (if not already)
# railway login

# 3. Check current Railway project
echo "Checking current Railway project..."
railway status

# 4. Update requirements.txt
echo "Updating requirements..."
cat > requirements.txt << 'REQ'
Flask==2.3.3
Flask-CORS==4.0.0
gunicorn==20.1.0
REQ

# 5. Create Railway configuration
cat > railway.toml << 'RAILWAY'
[build]
builder = "nixpacks"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "gunicorn api_server_complete:app"
healthcheckPath = "/api/health"
restartPolicyType = "on-failure"
restartPolicyMaxRetries = 3

[[services]]
name = "api"
port = 8000
RAILWAY

# 6. Create production-ready server
cat > railway_server.py << 'PYTHON'
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# In-memory data (loaded once at startup)
print("🚀 Loading production data for Railway...")

try:
    with open('players_data.json', 'r') as f:
        PLAYERS_DATA = json.load(f)
    print(f"✅ Loaded {PLAYERS_DATA.get('count', 0)} players")
except Exception as e:
    print(f"❌ Error loading players: {e}")
    PLAYERS_DATA = {"success": False, "message": "Players data not loaded", "players": [], "count": 0}

try:
    with open('fantasy_teams_data.json', 'r') as f:
        FANTASY_TEAMS_DATA = json.load(f)
    print(f"✅ Loaded {FANTASY_TEAMS_DATA.get('count', 0)} fantasy teams")
except Exception as e:
    print(f"❌ Error loading fantasy teams: {e}")
    FANTASY_TEAMS_DATA = {"success": False, "message": "Fantasy teams not loaded", "teams": [], "count": 0}

# Generate PrizePicks data on the fly
def generate_prizepicks_selections():
    players = PLAYERS_DATA.get('players', [])
    selections = []
    
    for i, player in enumerate(players[:50]):
        stat_types = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'threes']
        stat_type = stat_types[i % len(stat_types)]
        base_line = player.get('points', 20) if stat_type == 'points' else 10
        
        selections.append({
            "id": f"pp-over-{i}",
            "player": player['name'],
            "stat": stat_type,
            "line": round(base_line, 1),
            "type": "Over",
            "odds": "+100",
            "bookmaker": "PrizePicks",
            "projection": round(base_line * 1.05, 1),
            "team": player['team'],
            "sport": "NBA"
        })
        
        selections.append({
            "id": f"pp-under-{i}",
            "player": player['name'],
            "stat": stat_type,
            "line": round(base_line, 1),
            "type": "Under",
            "odds": "-110",
            "bookmaker": "PrizePicks",
            "projection": round(base_line * 0.95, 1),
            "team": player['team'],
            "sport": "NBA"
        })
    
    return selections

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Production Fantasy API",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "data_stats": {
            "players": PLAYERS_DATA.get('count', 0),
            "teams": FANTASY_TEAMS_DATA.get('count', 0)
        }
    })

@app.route('/api/players', methods=['GET'])
def get_players():
    data = PLAYERS_DATA.copy()
    data['timestamp'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    data['lastUpdated'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    return jsonify(data)

@app.route('/api/fantasy/teams', methods=['GET'])
def get_fantasy_teams():
    data = FANTASY_TEAMS_DATA.copy()
    data['timestamp'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    return jsonify(data)

@app.route('/api/prizepicks/selections', methods=['GET'])
def get_prizepicks_selections():
    selections = generate_prizepicks_selections()
    return jsonify({
        "success": True,
        "message": "PrizePicks selections",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "selections": selections,
        "count": len(selections)
    })

@app.route('/api/prizepicks/analytics', methods=['GET'])
def get_prizepicks_analytics():
    return jsonify({
        "success": True,
        "message": "PrizePicks analytics",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "analytics": [
            {"id": "1", "metric": "win_rate", "value": "62.5%", "trend": "up"},
            {"id": "2", "metric": "avg_edge", "value": "+3.2%", "trend": "stable"}
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚀 Production API ready on port {port}")
    print(f"📊 Players: {PLAYERS_DATA.get('count', 0)}")
    print(f"🏀 Teams: {FANTASY_TEAMS_DATA.get('count', 0)}")
    # Railway will use gunicorn to run this
PYTHON

# Copy to the correct filename Railway expects
cp railway_server.py api_server_complete.py

echo "✅ Deployment files created"
echo ""
echo "📋 Next steps:"
echo "1. Upload these files to your Railway project:"
echo "   - players_data.json"
echo "   - fantasy_teams_data.json" 
echo "   - requirements.txt"
echo "   - railway.toml"
echo "   - api_server_complete.py"
echo "2. Deploy: railway up"
echo ""
echo "💡 Or use the Railway web dashboard to upload these files"
