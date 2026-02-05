from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import random
import os

app = Flask(__name__)

# Configure CORS properly for development
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load the generated data
with open('players_data.json', 'r') as f:
    players_data = json.load(f)

with open('fantasy_teams_data.json', 'r') as f:
    fantasy_teams_data = json.load(f)

@app.route('/api/players', methods=['GET', 'OPTIONS'])
def get_players():
    """Return comprehensive player data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Update timestamp
    players_data['timestamp'] = datetime.utcnow().isoformat() + 'Z'
    players_data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
    
    # Filter by sport if provided
    sport = request.args.get('sport', 'NBA')
    if sport:
        # In a real app, you'd filter players by sport
        players_data['sport'] = sport
        
    # Filter by team if provided
    team = request.args.get('team')
    if team:
        filtered_players = [p for p in players_data['players'] 
                           if p['teamAbbrev'] == team.upper() or 
                           team.lower() in p['team'].lower()]
        players_data['players'] = filtered_players
        players_data['count'] = len(filtered_players)
    
    response = jsonify(players_data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/fantasy/teams', methods=['GET', 'OPTIONS'])
def get_fantasy_teams():
    """Return fantasy teams data"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Update timestamp
    fantasy_teams_data['timestamp'] = datetime.utcnow().isoformat() + 'Z'
    
    # Filter by league if provided
    league = request.args.get('league')
    if league:
        filtered_teams = [t for t in fantasy_teams_data['teams'] 
                         if league.lower() in t['league'].lower() or
                         league.lower() in t['leagueName'].lower()]
        fantasy_teams_data['teams'] = filtered_teams
        fantasy_teams_data['count'] = len(filtered_teams)
    
    response = jsonify(fantasy_teams_data)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/players/<player_id>', methods=['GET', 'OPTIONS'])
def get_player_by_id(player_id):
    """Get specific player by ID"""
    if request.method == 'OPTIONS':
        return '', 200
    
    player = next((p for p in players_data['players'] if p['id'] == player_id), None)
    
    if player:
        response = jsonify({
            "success": True,
            "message": "Player found",
            "player": player,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    else:
        response = jsonify({
            "success": False,
            "message": "Player not found",
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response, 404

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    
    response = jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + 'Z',
        "endpoints": {
            "/api/players": "GET - Returns all players",
            "/api/fantasy/teams": "GET - Returns fantasy teams",
            "/api/players/<id>": "GET - Returns specific player"
        }
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == '__main__':
    # Get port from environment variable or use 5000
    port = int(os.environ.get('PORT', 5000))
    
    print("Starting Fantasy API Server...")
    print("Available endpoints:")
    print(f"  http://localhost:{port}/api/players")
    print(f"  http://localhost:{port}/api/fantasy/teams")
    print(f"  http://localhost:{port}/api/health")
    print(f"  http://127.0.0.1:{port}/api/players")
    
    app.run(debug=True, port=port, host='0.0.0.0')
