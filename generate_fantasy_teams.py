import json
from datetime import datetime, UTC
import random

def generate_fantasy_teams():
    """Return fantasy teams with full player objects"""
    print("🏀 Loading player data for fantasy teams...")
    
    # Load the generated player data
    try:
        with open('players_data.json', 'r') as f:
            players_data = json.load(f)
        
        all_players = players_data.get('players', [])
        print(f"✅ Loaded {len(all_players)} players from players_data.json")
        
    except FileNotFoundError:
        print("❌ players_data.json not found. Please run generate_players.py first")
        # Create minimal player data as fallback
        all_players = [
            {"id": "1", "name": "LeBron James", "position": "SF", "team": "LAL"},
            {"id": "2", "name": "Stephen Curry", "position": "PG", "team": "GSW"},
            {"id": "3", "name": "Nikola Jokic", "position": "C", "team": "DEN"},
        ]
        print(f"⚠️ Using {len(all_players)} sample players as fallback")
    
    # Create fantasy teams
    teams = []
    team_names = [
        "The Dynasty", "Slam Dunk Gang", "Three Point Kings", "Block Party", "Assist Masters",
        "Rebound Royals", "Steal Dealers", "Full Court Press", "Half Court Heroes", "Fast Break Fury",
        "Dunk Dynasty", "Swish Squad", "Defense First", "Run N Gun", "Post Up Pros",
        "Pick N Roll", "Transition Titans", "Perimeter Power", "Paint Protectors", "Bench Mob"
    ]
    
    print(f"🔄 Generating {len(team_names)} fantasy teams...")
    
    for i, team_name in enumerate(team_names, 1):
        # Create a balanced roster for each team (12 players per team)
        roster_size = 12
        team_players = []
        
        # Ensure balanced positions (2-3 of each position)
        position_counts = {"PG": 0, "SG": 0, "SF": 0, "PF": 0, "C": 0}
        target_counts = {"PG": 2, "SG": 2, "SF": 3, "PF": 3, "C": 2}  # Total: 12
        
        # Filter available players not already on a team
        available_players = [p for p in all_players if not any(
            p['id'] in [tp.get('id') for tp in team_players] 
            for team_players_list in [t.get('players', []) for t in teams]
        )]
        
        # If we're running out of unique players, allow duplicates for later teams
        if len(available_players) < roster_size:
            available_players = all_players
        
        # Select players for each position
        for position, target_count in target_counts.items():
            position_players = [p for p in available_players if p.get('position') == position]
            
            if len(position_players) > target_count:
                selected = random.sample(position_players, target_count)
            else:
                selected = position_players
            
            team_players.extend(selected)
            position_counts[position] = len(selected)
        
        # If we still need more players, fill with best available
        if len(team_players) < roster_size:
            remaining_needed = roster_size - len(team_players)
            remaining_players = [p for p in available_players if p['id'] not in [tp['id'] for tp in team_players]]
            if remaining_players:
                additional = random.sample(remaining_players, min(remaining_needed, len(remaining_players)))
                team_players.extend(additional)
        
        # Ensure we have exactly roster_size players
        if len(team_players) > roster_size:
            team_players = team_players[:roster_size]
        
        # Create team data
        total_salary = sum(p.get('salary', 0) for p in team_players)
        total_fantasy = sum(p.get('fantasyScore', 0) for p in team_players)
        total_projection = sum(p.get('projection', 0) for p in team_players)
        
        team_data = {
            "id": f"team-{i}",
            "name": team_name,
            "teamName": team_name,
            "owner": f"Fantasy Owner {i}",
            "user": f"owner{i}",
            "ownerId": f"user-{i}00",
            "sport": "NBA",
            "league": "Elite NBA Fantasy",
            "leagueName": "Elite NBA Fantasy",
            "record": f"{random.randint(8, 14)}-{random.randint(2, 8)}-0",
            "wins": random.randint(8, 14),
            "losses": random.randint(2, 8),
            "ties": 0,
            "points": int(total_fantasy * random.uniform(0.8, 1.2) * 15),  # Simulate 15 games
            "totalPoints": int(total_fantasy * random.uniform(0.8, 1.2) * 15),
            "rank": i,
            "position": i,
            "players": team_players,
            "roster": [{"id": p["id"], "name": p["name"], "position": p["position"], "team": p.get("teamAbbrev", p.get("team", "N/A"))} 
                      for p in team_players],
            "waiverPosition": random.randint(1, 10),
            "waiver": random.randint(1, 10),
            "movesThisWeek": random.randint(0, 5),
            "transactions": random.randint(10, 50),
            "lastUpdated": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            "updatedAt": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            "projectionRank": random.randint(1, len(team_names)),
            "projectedPoints": int(total_projection * random.uniform(0.8, 1.2) * 15),
            "winProbability": round(random.uniform(0.3, 0.9), 2),
            "strengthOfSchedule": round(random.uniform(0.3, 0.8), 2),
            "totalSalary": total_salary,
            "remainingSalary": random.randint(500, 2000),
            "teamValue": int(total_salary * random.uniform(20, 30)),
            "draftPosition": random.randint(1, len(team_names)),
            "playoffStatus": random.choice(["clinched", "in contention", "mathematically eliminated", "fighting"]),
            "nextOpponent": random.choice([tn for tn in team_names if tn != team_name]),
            "nextOpponentRank": random.randint(1, len(team_names)),
            "matchupDifficulty": random.choice(["easy", "medium", "hard"]),
            "rosterStats": {
                "totalPlayers": len(team_players),
                "positionBreakdown": position_counts,
                "avgPlayerSalary": int(total_salary / len(team_players)) if team_players else 0,
                "avgPlayerFantasy": round(total_fantasy / len(team_players), 1) if team_players else 0
            }
        }
        
        teams.append(team_data)
        print(f"   Created team {i}/{len(team_names)}: {team_name} ({len(team_players)} players)")
    
    # Calculate league statistics
    total_teams = len(teams)
    total_league_players = sum(len(t["players"]) for t in teams)
    avg_team_points = int(sum(t["points"] for t in teams) / total_teams) if total_teams > 0 else 0
    
    response = {
        "success": True,
        "message": "Fantasy teams real data",
        "timestamp": datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        "teams": teams,
        "count": total_teams,
        "metadata": {
            "totalTeams": total_teams,
            "leagueName": "Elite NBA Fantasy",
            "averageTeamPoints": avg_team_points,
            "totalPlayersAcrossTeams": total_league_players,
            "uniquePlayersUsed": len(set(p["id"] for t in teams for p in t["players"])),
            "salaryCap": 50000,
            "rosterSize": 12,
            "scoringType": "Points"
        }
    }
    
    # Save to file
    with open("fantasy_teams_data.json", "w") as f:
        json.dump(response, f, indent=2)
    
    print(f"\n🎉 SUCCESS: Generated {total_teams} fantasy teams!")
    print(f"📊 League Statistics:")
    print(f"   • Total teams: {total_teams}")
    print(f"   • Total players across teams: {total_league_players}")
    print(f"   • Average team points: {avg_team_points}")
    print(f"📁 Saved to: fantasy_teams_data.json")
    
    return response

if __name__ == "__main__":
    generate_fantasy_teams()
