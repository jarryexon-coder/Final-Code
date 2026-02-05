import json
from datetime import datetime, UTC
import random

def generate_player(player_id, name, team, position, base_salary):
    """Generate realistic player data"""
    # Base stats based on position
    position_stats = {
        "PG": {"points_range": (15, 30), "assists_range": (5, 12), "rebounds_range": (3, 7), "threes_range": (2, 5)},
        "SG": {"points_range": (18, 32), "assists_range": (3, 7), "rebounds_range": (4, 8), "threes_range": (2, 6)},
        "SF": {"points_range": (16, 28), "assists_range": (4, 8), "rebounds_range": (5, 10), "threes_range": (1, 4)},
        "PF": {"points_range": (14, 26), "assists_range": (2, 6), "rebounds_range": (7, 12), "threes_range": (0, 3)},
        "C": {"points_range": (12, 24), "assists_range": (2, 5), "rebounds_range": (8, 14), "threes_range": (0, 2)}
    }
    
    stats = position_stats.get(position, position_stats["SF"])
    
    points = random.uniform(*stats["points_range"])
    rebounds = random.uniform(*stats["rebounds_range"])
    assists = random.uniform(*stats["assists_range"])
    threes = random.uniform(*stats["threes_range"])
    steals = random.uniform(0.5, 2.5)
    blocks = random.uniform(0.3, 2.0) if position in ["PF", "C"] else random.uniform(0.1, 1.0)
    
    # Calculate fantasy score (standard formula: pts + 1.2*reb + 1.5*ast + 3*threes + 3*stl + 3*blk)
    fantasy_score = round(points + 1.2*rebounds + 1.5*assists + 3*threes + 3*steals + 3*blocks, 1)
    
    # Projection is fantasy score +/- some variance
    projection = round(fantasy_score + random.uniform(-3, 5), 1)
    
    # Salary variation
    salary_variation = random.uniform(0.8, 1.2)
    salary = int(base_salary * salary_variation)
    
    # Generate team abbreviation
    if len(team.split()) > 1:
        team_abbrev = ''.join([word[0] for word in team.split()])[:3].upper()
    else:
        team_abbrev = team[:3].upper()
    
    return {
        "id": str(player_id),
        "name": name,
        "playerName": name,
        "team": team,
        "teamAbbrev": team_abbrev,
        "position": position,
        "pos": position,
        "fanDuelSalary": salary,
        "fdSalary": salary,
        "draftKingsSalary": int(salary * 0.95),
        "dkSalary": int(salary * 0.95),
        "salary": salary,
        "fantasyScore": fantasy_score,
        "fp": fantasy_score,
        "points": round(points, 1),
        "pts": round(points, 1),
        "rebounds": round(rebounds, 1),
        "reb": round(rebounds, 1),
        "assists": round(assists, 1),
        "ast": round(assists, 1),
        "steals": round(steals, 1),
        "stl": round(steals, 1),
        "blocks": round(blocks, 1),
        "blk": round(blocks, 1),
        "ownership": round(random.uniform(5, 50), 1),
        "own": round(random.uniform(5, 50), 1),
        "threePointers": round(threes, 1),
        "threes": round(threes, 1),
        "projection": projection,
        "proj": projection,
        "projectionEdge": round((projection - fantasy_score) / fantasy_score, 3) if fantasy_score > 0 else 0,
        "projectionConfidence": random.choice(["low", "medium", "high", "very-high"]),
        "valueScore": random.randint(40, 95),
        "projectedFantasyScore": projection,
        "projFP": projection,
        "value": round(fantasy_score / (salary / 1000), 2),
        "trend": random.choice(["up", "down", "stable"]),
        "injuryStatus": random.choice(["healthy", "healthy", "healthy", "day-to-day", "out"]),
        "minutesProjected": random.randint(28, 38),
        "usageRate": round(random.uniform(20, 35), 1),
        "efficiency": round(random.uniform(20, 35), 1),
        "last5Avg": round(fantasy_score + random.uniform(-2, 3), 1),
        "seasonAvg": round(fantasy_score + random.uniform(-1, 2), 1),
        "homeAway": random.choice(["home", "away"]),
        "opponent": random.choice(["LAL", "GSW", "DEN", "BOS", "MIL", "PHI", "PHX", "DAL", "MIA", "ATL", "HOU", "OKC"]),
        "opponentRank": random.randint(1, 30),
        "gameTime": "2024-02-05T19:30:00Z",
        "weatherImpact": "none"
    }

def generate_player_name():
    """Generate a random player name"""
    first_names = ["James", "Michael", "David", "Chris", "Kevin", "Stephen", "LeBron", "Kawhi", 
                   "Anthony", "Damian", "Devin", "Jayson", "Joel", "Luka", "Giannis", "Nikola",
                   "Jalen", "Cade", "Scottie", "Evan", "Paolo", "Franz", "Jabari", "Chet",
                   "Tyrese", "Shai", "De'Aaron", "Donovan", "Zion", "Trae", "Ja", "Brandon"]
    
    last_names = ["James", "Curry", "Durant", "Jokic", "Antetokounmpo", "Doncic", "Tatum", "Embiid",
                  "Davis", "Lillard", "Booker", "Haliburton", "Gilgeous-Alexander", "Mitchell",
                  "Edwards", "Leonard", "George", "Harden", "Young", "Fox", "Sabonis", "Adebayo",
                  "Brunson", "Williamson", "Towns", "Green", "Cunningham", "Barnes", "Mobley",
                  "Wagner", "Banchero", "Smith", "Holmgren", "Morant", "Ingram", "Ball"]
    
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def generate_team_name():
    """Generate a random NBA team name"""
    cities = ["Los Angeles", "Golden State", "Denver", "Boston", "Milwaukee", "Philadelphia", 
              "Phoenix", "Dallas", "Miami", "Atlanta", "Houston", "Oklahoma City", "Memphis",
              "New Orleans", "Minnesota", "Sacramento", "San Antonio", "Utah", "Portland",
              "Chicago", "Cleveland", "Detroit", "Indiana", "Charlotte", "Orlando", "Washington",
              "Toronto", "Brooklyn", "New York", "LA"]
    
    team_names = ["Lakers", "Warriors", "Nuggets", "Celtics", "Bucks", "76ers", "Suns", 
                  "Mavericks", "Heat", "Hawks", "Rockets", "Thunder", "Grizzlies", "Pelicans",
                  "Timberwolves", "Kings", "Spurs", "Jazz", "Trail Blazers", "Bulls", "Cavaliers",
                  "Pistons", "Pacers", "Hornets", "Magic", "Wizards", "Raptors", "Nets", "Knicks", "Clippers"]
    
    return f"{random.choice(cities)} {random.choice(team_names)}"

def main():
    print("🏀 Generating 300+ NBA players with realistic data...")
    
    # Create 300+ players
    players = []
    player_id = 1
    
    # 1. Start with 50 star players (same as before but more)
    star_players = [
        ("LeBron James", "Los Angeles Lakers", "SF", 10500),
        ("Stephen Curry", "Golden State Warriors", "PG", 9800),
        ("Nikola Jokic", "Denver Nuggets", "C", 11200),
        ("Kevin Durant", "Phoenix Suns", "SF", 9500),
        ("Giannis Antetokounmpo", "Milwaukee Bucks", "PF", 10800),
        ("Luka Doncic", "Dallas Mavericks", "PG", 10700),
        ("Jayson Tatum", "Boston Celtics", "SF", 9700),
        ("Joel Embiid", "Philadelphia 76ers", "C", 10600),
        ("Anthony Davis", "Los Angeles Lakers", "PF", 9900),
        ("Damian Lillard", "Milwaukee Bucks", "PG", 9200),
        ("Devin Booker", "Phoenix Suns", "SG", 9400),
        ("Shai Gilgeous-Alexander", "Oklahoma City Thunder", "PG", 10100),
        ("Tyrese Haliburton", "Indiana Pacers", "PG", 8900),
        ("Donovan Mitchell", "Cleveland Cavaliers", "SG", 9100),
        ("Anthony Edwards", "Minnesota Timberwolves", "SG", 9300),
        ("Kawhi Leonard", "LA Clippers", "SF", 8800),
        ("Paul George", "LA Clippers", "SF", 8700),
        ("James Harden", "LA Clippers", "PG", 8500),
        ("Trae Young", "Atlanta Hawks", "PG", 9000),
        ("De'Aaron Fox", "Sacramento Kings", "PG", 9200),
        ("Domantas Sabonis", "Sacramento Kings", "C", 8600),
        ("Bam Adebayo", "Miami Heat", "C", 8300),
        ("Jalen Brunson", "New York Knicks", "PG", 8400),
        ("Zion Williamson", "New Orleans Pelicans", "PF", 8200),
        ("Karl-Anthony Towns", "Minnesota Timberwolves", "C", 8100),
        # Add 25 more star players
        ("Ja Morant", "Memphis Grizzlies", "PG", 8800),
        ("Brandon Ingram", "New Orleans Pelicans", "SF", 8200),
        ("LaMelo Ball", "Charlotte Hornets", "PG", 8500),
        ("Desmond Bane", "Memphis Grizzlies", "SG", 8000),
        ("Jaren Jackson Jr.", "Memphis Grizzlies", "PF", 7900),
        ("Evan Mobley", "Cleveland Cavaliers", "C", 7800),
        ("Darius Garland", "Cleveland Cavaliers", "PG", 8100),
        ("Mikal Bridges", "Brooklyn Nets", "SF", 8300),
        ("CJ McCollum", "New Orleans Pelicans", "PG", 7600),
        ("Jaylen Brown", "Boston Celtics", "SG", 8700),
        ("Kristaps Porzingis", "Boston Celtics", "C", 8000),
        ("Julius Randle", "New York Knicks", "PF", 8200),
        ("Jamal Murray", "Denver Nuggets", "PG", 8400),
        ("Aaron Gordon", "Denver Nuggets", "PF", 7200),
        ("Kyle Kuzma", "Washington Wizards", "PF", 7500),
        ("Jordan Poole", "Washington Wizards", "SG", 7400),
        ("Tyrese Maxey", "Philadelphia 76ers", "PG", 8300),
        ("Tobias Harris", "Philadelphia 76ers", "PF", 7100),
        ("DeMar DeRozan", "Chicago Bulls", "SF", 8100),
        ("Zach LaVine", "Chicago Bulls", "SG", 8000),
        ("Nikola Vucevic", "Chicago Bulls", "C", 7300),
        ("Lauri Markkanen", "Utah Jazz", "PF", 8200),
        ("Jordan Clarkson", "Utah Jazz", "SG", 6900),
    ]
    
    for name, team, position, salary in star_players:
        players.append(generate_player(player_id, name, team, position, salary))
        player_id += 1
    
    print(f"✅ Generated {len(star_players)} star players")
    
    # 2. Generate 150 starter-level players
    starter_count = 150
    print(f"🔄 Generating {starter_count} starter-level players...")
    
    for i in range(starter_count):
        name = generate_player_name()
        team = generate_team_name()
        position = random.choice(["PG", "SG", "SF", "PF", "C"])
        salary = random.randint(5000, 8000)  # Starter salaries
        
        players.append(generate_player(player_id, name, team, position, salary))
        player_id += 1
        
        if (i + 1) % 25 == 0:
            print(f"   Generated {i + 1}/{starter_count} starters")
    
    # 3. Generate 125 role players/bench players
    role_player_count = 125
    print(f"🔄 Generating {role_player_count} role players...")
    
    for i in range(role_player_count):
        name = generate_player_name()
        team = generate_team_name()
        position = random.choice(["PG", "SG", "SF", "PF", "C"])
        salary = random.randint(3000, 6000)  # Role player salaries
        
        players.append(generate_player(player_id, name, team, position, salary))
        player_id += 1
        
        if (i + 1) % 25 == 0:
            print(f"   Generated {i + 1}/{role_player_count} role players")
    
    # 4. Generate 75 rookies/young players
    rookie_count = 75
    print(f"🔄 Generating {rookie_count} rookie/young players...")
    
    for i in range(rookie_count):
        name = generate_player_name()
        team = generate_team_name()
        position = random.choice(["PG", "SG", "SF", "PF", "C"])
        salary = random.randint(2000, 5000)  # Rookie salaries
        
        players.append(generate_player(player_id, name, team, position, salary))
        player_id += 1
        
        if (i + 1) % 25 == 0:
            print(f"   Generated {i + 1}/{rookie_count} rookies")
    
    # Calculate statistics
    total_players = len(players)
    total_salary = sum(p["salary"] for p in players)
    avg_salary = int(total_salary / total_players) if total_players > 0 else 0
    avg_fantasy = round(sum(p["fantasyScore"] for p in players) / total_players, 1) if total_players > 0 else 0
    
    # Get unique positions and teams
    positions = list(set(p["position"] for p in players))
    teams = list(set(p["team"] for p in players))
    
    response = {
        "success": True,
        "message": f"Player data - {total_players} players generated",
        "timestamp": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        "players": players,
        "count": total_players,
        "sport": "NBA",
        "lastUpdated": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        "metadata": {
            "totalPlayers": total_players,
            "positions": positions,
            "teamsCount": len(teams),
            "teams": teams[:20],  # First 20 teams
            "avgSalary": avg_salary,
            "avgFantasyScore": avg_fantasy,
            "totalSalary": total_salary,
            "salaryRange": f"${min(p['salary'] for p in players)} - ${max(p['salary'] for p in players)}",
            "fantasyScoreRange": f"{min(p['fantasyScore'] for p in players):.1f} - {max(p['fantasyScore'] for p in players):.1f}"
        }
    }
    
    # Save to file
    with open("players_data.json", "w") as f:
        json.dump(response, f, indent=2)
    
    print(f"\n🎉 SUCCESS: Generated {total_players} players!")
    print(f"📊 Statistics:")
    print(f"   • Average salary: ${avg_salary}")
    print(f"   • Average fantasy score: {avg_fantasy}")
    print(f"   • Positions: {', '.join(positions)}")
    print(f"   • Teams: {len(teams)} unique teams")
    print(f"📁 Saved to: players_data.json")
    
    return response

if __name__ == "__main__":
    main()
