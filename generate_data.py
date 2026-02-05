import json
import random
from datetime import datetime, timezone

print("Generating player data on Railway...")

def generate_player(player_id, name, team, position, base_salary):
    points = random.uniform(12, 35)
    rebounds = random.uniform(3, 15)
    assists = random.uniform(2, 12)
    fantasy_score = round(points + 1.2*rebounds + 1.5*assists, 1)
    
    return {
        "id": str(player_id),
        "name": name,
        "team": team,
        "teamAbbrev": team.split()[-1][:3].upper(),
        "position": position,
        "salary": int(base_salary * random.uniform(0.8, 1.2)),
        "fantasyScore": fantasy_score,
        "projection": round(fantasy_score * random.uniform(0.95, 1.15), 1),
        "points": round(points, 1),
        "rebounds": round(rebounds, 1),
        "assists": round(assists, 1)
    }

# Generate 398 players
players = []
player_names = [
    "LeBron James", "Stephen Curry", "Nikola Jokic", "Kevin Durant", "Giannis Antetokounmpo",
    "Luka Doncic", "Jayson Tatum", "Joel Embiid", "Anthony Davis", "Damian Lillard"
]

for i in range(398):
    if i < len(player_names):
        name = player_names[i]
    else:
        name = f"Player {i+1}"
    
    teams = ["Lakers", "Warriors", "Nuggets", "Suns", "Bucks", "Mavericks", "Celtics", "76ers"]
    positions = ["PG", "SG", "SF", "PF", "C"]
    
    players.append(generate_player(
        i+1,
        name,
        f"Team {teams[i % len(teams)]}",
        positions[i % len(positions)],
        random.randint(4000, 12000)
    ))

players_data = {
    "success": True,
    "message": "Player data",
    "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    "players": players,
    "count": len(players),
    "sport": "NBA"
}

with open('players_data.json', 'w') as f:
    json.dump(players_data, f, indent=2)

print(f"✅ Generated {len(players)} players")

# Generate fantasy teams
teams = []
for i in range(20):
    team_players = random.sample(players, 8)
    teams.append({
        "id": f"team-{i+1}",
        "name": f"Fantasy Team {i+1}",
        "players": team_players,
        "points": random.randint(1500, 2000)
    })

fantasy_teams_data = {
    "success": True,
    "message": "Fantasy teams",
    "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
    "teams": teams,
    "count": len(teams)
}

with open('fantasy_teams_data.json', 'w') as f:
    json.dump(fantasy_teams_data, f, indent=2)

print(f"✅ Generated {len(teams)} fantasy teams")
