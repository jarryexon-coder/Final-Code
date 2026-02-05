import json
from datetime import datetime, timezone

# Load existing data
with open('players_data.json', 'r') as f:
    players_data = json.load(f)

with open('fantasy_teams_data.json', 'r') as f:
    fantasy_teams_data = json.load(f)

# Create PrizePicks selections data from players
def create_prizepicks_selections():
    players = players_data.get('players', [])
    
    # Create PrizePicks selections from top 50 players
    selections = []
    for i, player in enumerate(players[:50]):
        # Create Over/Under selections for each player
        stat_types = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'threes']
        stat_type = stat_types[i % len(stat_types)]
        
        # Base line on player's average
        base_line = player.get('points', 20) if stat_type == 'points' else \
                   player.get('rebounds', 8) if stat_type == 'rebounds' else \
                   player.get('assists', 5) if stat_type == 'assists' else \
                   player.get('steals', 1.2) if stat_type == 'steals' else \
                   player.get('blocks', 0.8) if stat_type == 'blocks' else \
                   player.get('threes', 2.5)
        
        # Create Over selection
        selections.append({
            "id": f"pp-over-{i}",
            "player": player['name'],
            "stat": stat_type,
            "line": round(base_line, 1),
            "type": "Over",
            "odds": "+100",
            "confidence": "medium",
            "bookmaker": "PrizePicks",
            "projection": round(base_line * 1.05, 1),  # 5% over line
            "team": player['team'],
            "sport": "NBA",
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        })
        
        # Create Under selection
        selections.append({
            "id": f"pp-under-{i}",
            "player": player['name'],
            "stat": stat_type,
            "line": round(base_line, 1),
            "type": "Under",
            "odds": "-110",
            "confidence": "low",
            "bookmaker": "PrizePicks",
            "projection": round(base_line * 0.95, 1),  # 5% under line
            "team": player['team'],
            "sport": "NBA",
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        })
    
    return {
        "success": True,
        "message": "PrizePicks selections",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "selections": selections,
        "count": len(selections),
        "sport": "NBA"
    }

# Create analytics data
def create_prizepicks_analytics():
    return {
        "success": True,
        "message": "PrizePicks analytics",
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "analytics": [
            {
                "id": "1",
                "metric": "win_rate",
                "value": "62.5%",
                "trend": "up",
                "description": "Overall win rate"
            },
            {
                "id": "2",
                "metric": "avg_edge",
                "value": "+3.2%",
                "trend": "stable",
                "description": "Average projection edge"
            },
            {
                "id": "3",
                "metric": "best_sport",
                "value": "NBA",
                "trend": "up",
                "description": "Most profitable sport"
            },
            {
                "id": "4",
                "metric": "roi",
                "value": "+18.7%",
                "trend": "up",
                "description": "Return on investment"
            }
        ],
        "count": 4
    }

# Save the data
prizepicks_selections = create_prizepicks_selections()
with open('prizepicks_selections.json', 'w') as f:
    json.dump(prizepicks_selections, f, indent=2)

prizepicks_analytics = create_prizepicks_analytics()
with open('prizepicks_analytics.json', 'w') as f:
    json.dump(prizepicks_analytics, f, indent=2)

print(f"✅ Created PrizePicks selections: {prizepicks_selections['count']} selections")
print(f"✅ Created PrizePicks analytics: {prizepicks_analytics['count']} analytics items")
