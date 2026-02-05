from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timezone
import json
import os
import sys

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={r"/api/*": {"origins": "*"}})

print("📂 Loading data files...")

# Load players data
try:
    with open('players_data.json', 'r') as f:
        players_data = json.load(f)
    print(f"✅ Loaded {players_data.get('count', 0)} players")
except Exception as e:
    print(f"❌ Error loading players_data.json: {e}")
    players_data = {
        "success": False, 
        "message": "Data not loaded",
        "players": [],
        "count": 0
    }

# Load fantasy teams data
try:
    with open('fantasy_teams_data.json', 'r') as f:
        fantasy_teams_data = json.load(f)
    print(f"✅ Loaded {fantasy_teams_data.get('count', 0)} fantasy teams")
except Exception as e:
    print(f"❌ Error loading fantasy_teams_data.json: {e}")
    fantasy_teams_data = {
        "success": False,
        "message": "Data not loaded", 
        "teams": [],
        "count": 0
    }

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Fantasy API Server",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "endpoints": ["/api/players", "/api/fantasy/teams", "/api/health"],
        "data_stats": {
            "players": players_data.get('count', 0),
            "teams": fantasy_teams_data.get('count', 0)
        }
    })

@app.route('/api/players', methods=['GET'])
def get_players():
    # Update timestamp
    players_data['timestamp'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    players_data['lastUpdated'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    response = jsonify(players_data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/fantasy/teams', methods=['GET'])
def get_fantasy_teams():
    # Update timestamp
    fantasy_teams_data['timestamp'] = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    response = jsonify(fantasy_teams_data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    # Get port from environment or use 5001
    port = int(os.environ.get('PORT', 5001))
    
    print(f"\n{'='*60}")
    print("🚀 Fantasy API Server (Fixed Version)")
    print(f"{'='*60}")
    print(f"📊 Data loaded:")
    print(f"   • Players: {players_data.get('count', 0)}")
    print(f"   • Fantasy Teams: {fantasy_teams_data.get('count', 0)}")
    print(f"\n🌐 Server will run on:")
    print(f"   • http://localhost:{port}")
    print(f"   • http://127.0.0.1:{port}")
    print(f"\n🔗 Endpoints:")
    print(f"   • GET /api/health")
    print(f"   • GET /api/players")
    print(f"   • GET /api/fantasy/teams")
    print(f"\n📝 Test with:")
    print(f"   curl http://localhost:{port}/api/health")
    print(f"{'='*60}\n")
    
    # Run WITHOUT debug mode to avoid termios error
    # Also disable reloader to prevent issues
    app.run(debug=False, use_reloader=False, port=port, host='0.0.0.0')
