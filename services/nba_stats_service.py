# services/nba_stats_service.py - COMPLETE SOLUTION
from nba_api.stats.endpoints import playergamelog, commonplayerinfo, playerdashboardbygeneralsplits
from nba_api.stats.static import players, teams
import pandas as pd
import time
import re
import logging
from functools import lru_cache

# Enable detailed logging
logging.basicConfig(level=logging.INFO)

@lru_cache(maxsize=1000)
def get_all_players_cached():
    """Cached player list to avoid repeated API calls."""
    return players.get_players()

def normalize_player_name(name):
    """Advanced name normalization for matching."""
    if not name or not isinstance(name, str):
        return ""
    
    # Remove everything in parentheses/brackets
    name = re.sub(r'\([^)]*\)', '', name)
    name = re.sub(r'\[[^\]]*\]', '', name)
    
    # Remove team abbreviations and special markers
    name = re.sub(r'\s*[-–]\s*[A-Z]{2,4}$', '', name)  # - LAL, - DEN
    name = re.sub(r'\s*[A-Z]{2,4}$', '', name)  # LAL, DEN at end
    
    # Special character handling
    name = name.replace('č', 'c').replace('ć', 'c').replace('š', 's').replace('ž', 'z')
    name = re.sub(r'[^a-zA-Z\s\.\-\']', '', name)
    
    # Handle common variations
    variations = {
        'tim hardaway jr': 'tim hardaway jr.',
        'lebron james': 'lebron james',
        'karl-anthony towns': 'karl-anthony towns',
        'og anunoby': 'og anunoby',
        'jrue holiday': 'jrue holiday',
        'c.j. mccollum': 'cj mccollum'
    }
    
    cleaned = name.strip().lower()
    return variations.get(cleaned, cleaned)

def find_player_id_intelligent(player_name):
    """Intelligent player ID lookup with multiple strategies."""
    normalized = normalize_player_name(player_name)
    all_players = get_all_players_cached()
    
    strategies = [
        # Strategy 1: Exact match on full name
        lambda: next((p['id'] for p in all_players 
                     if p['full_name'].lower() == normalized), None),
        
        # Strategy 2: Match on last name + first initial
        lambda: next((p['id'] for p in all_players 
                     if p['last_name'].lower() == normalized.split()[-1] and
                     p['first_name'][0].lower() == normalized[0].lower()), None),
        
        # Strategy 3: Partial match in full name
        lambda: next((p['id'] for p in all_players 
                     if normalized in p['full_name'].lower()), None),
        
        # Strategy 4: Sound-alike matching (simple)
        lambda: next((p['id'] for p in all_players 
                     if p['last_name'].lower().startswith(normalized.split()[-1][:3])), None)
    ]
    
    for strategy in strategies:
        player_id = strategy()
        if player_id:
            logging.info(f"Found {player_name} -> ID: {player_id}")
            return player_id
    
    logging.warning(f"Player not found: {player_name} (normalized: {normalized})")
    return None

def get_player_stats_comprehensive(player_name):
    """Get comprehensive player stats using NBA API."""
    player_id = find_player_id_intelligent(player_name)
    
    if not player_id:
        return {
            'player_name': player_name,
            'found': False,
            'error': 'Player ID not found'
        }
    
    try:
        # Get basic player info
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        info_df = player_info.get_data_frames()[0]
        time.sleep(0.6)
        
        # Get current season game logs
        gamelog = playergamelog.PlayerGameLog(
            player_id=player_id, 
            season='2024-25'
        )
        games_df = gamelog.get_data_frames()[0]
        time.sleep(0.6)
        
        # Get advanced dashboard stats
        dashboard = playerdashboardbygeneralsplits.PlayerDashboardByGeneralSplits(
            player_id=player_id,
            season='2024-25'
        )
        season_stats = dashboard.get_data_frames()[0]
        time.sleep(0.6)
        
        # Calculate comprehensive stats
        stats = {
            'player_id': player_id,
            'player_name': info_df['DISPLAY_FIRST_LAST'].iloc[0],
            'team': info_df['TEAM_NAME'].iloc[0],
            'position': info_df['POSITION'].iloc[0],
            'height': info_df['HEIGHT'].iloc[0],
            'weight': info_df['WEIGHT'].iloc[0],
            'experience': info_df['SEASON_EXP'].iloc[0],
            'found': True
        }
        
        # Add recent performance (last 5 games)
        if not games_df.empty:
            last_5 = games_df.head(5)
            stats['recent_games'] = last_5.to_dict('records')
            stats['recent_avgs'] = {
                'ppg': float(last_5['PTS'].mean()),
                'rpg': float(last_5['REB'].mean()),
                'apg': float(last_5['AST'].mean()),
                'fg_pct': float(last_5['FG_PCT'].mean()),
                'minutes': float(last_5['MIN'].mean())
            }
        
        # Add season averages
        if not season_stats.empty:
            stats['season_avgs'] = {
                'ppg': float(season_stats['PTS'].iloc[0]),
                'rpg': float(season_stats['REB'].iloc[0]),
                'apg': float(season_stats['AST'].iloc[0]),
                'fg_pct': float(season_stats['FG_PCT'].iloc[0]),
                'games_played': int(season_stats['GP'].iloc[0])
            }
        
        return stats
        
    except Exception as e:
        logging.error(f"NBA API error for {player_name}: {str(e)}")
        return {
            'player_name': player_name,
            'found': False,
            'error': str(e)
        }

# Test function
def test_player_lookup():
    """Test the player lookup with problematic names."""
    test_names = [
        "Jonas Valančiūnas",
        "Nikola Jokić",
        "Tim Hardaway Jr.",
        "OG Anunoby",
        "Karl-Anthony Towns"
    ]
    
    for name in test_names:
        print(f"\nTesting: {name}")
        result = get_player_stats_comprehensive(name)
        print(f"  Found: {result.get('found')}")
        if result.get('found'):
            print(f"  ID: {result.get('player_id')}")
            print(f"  Team: {result.get('team')}")
