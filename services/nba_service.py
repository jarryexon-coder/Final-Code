# services/nba_service.py - COMPLETE FIXED VERSION
from nba_api.stats.endpoints import playergamelog, commonplayerinfo
from nba_api.stats.static import players
import re
import time
import logging

def clean_player_name_for_lookup(name):
    """Remove special characters and team info for NBA API lookup."""
    # Common patterns in projection data
    patterns_to_remove = [
        r'\s*\([^)]*\)',  # Remove (DEN), (NYK) etc
        r'\s*\-.*$',      # Remove - DEN, - LAL
        r'\s*\[.*\]',     # Remove [GTD], [OUT]
        r'[^a-zA-Z\s\.\-\']',  # Keep only letters, spaces, dots, hyphens, apostrophes
    ]
    
    cleaned = name
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned)
    
    return cleaned.strip()

def find_player_id_robust(player_name):
    """Find NBA player ID with multiple fallback strategies."""
    cleaned_name = clean_player_name_for_lookup(player_name)
    
    # Get all NBA players once
    all_players = players.get_players()
    
    # Strategy 1: Exact match on cleaned name
    for player in all_players:
        if cleaned_name.lower() == player['full_name'].lower():
            return player['id']
    
    # Strategy 2: Handle special characters (like Dončić -> Doncic)
    simplified_name = cleaned_name.replace('č', 'c').replace('ć', 'c').replace('š', 's').replace('ž', 'z')
    for player in all_players:
        if simplified_name.lower() == player['full_name'].lower():
            return player['id']
    
    # Strategy 3: Partial match on last name
    name_parts = cleaned_name.split()
    if len(name_parts) >= 2:
        last_name = name_parts[-1]
        for player in all_players:
            if last_name.lower() in player['last_name'].lower():
                # Additional check: first initial should match
                if name_parts[0][0].lower() == player['first_name'][0].lower():
                    return player['id']
    
    # Strategy 4: Common nickname mapping
    nickname_map = {
        'tim hardaway jr': 'tim hardaway jr.',
        'lebron james': 'lebron james',
        'karl-anthony towns': 'karl-anthony towns',
        'og anunoby': 'og anunoby'
    }
    
    if cleaned_name.lower() in nickname_map:
        lookup_name = nickname_map[cleaned_name.lower()]
        for player in all_players:
            if lookup_name == player['full_name'].lower():
                return player['id']
    
    logging.warning(f"Player not found after all strategies: {player_name} -> {cleaned_name}")
    return None

def get_player_stats_safe(player_name):
    """Safe wrapper with error handling and rate limiting."""
    try:
        player_id = find_player_id_robust(player_name)
        
        if not player_id:
            return {
                'player_name': player_name,
                'found': False,
                'error': 'Player ID not found'
            }
        
        # Get player info with rate limiting
        player_info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        df_info = player_info.get_data_frames()[0]
        time.sleep(0.6)  # Critical: NBA API rate limit
        
        # Get recent games (current season)
        gamelog = playergamelog.PlayerGameLog(player_id=player_id, season='2024-25')
        df_games = gamelog.get_data_frames()[0]
        time.sleep(0.6)
        
        # Calculate stats
        recent_stats = {}
        if not df_games.empty:
            last_5 = df_games.head(5)
            recent_stats = {
                'ppg_last_5': float(last_5['PTS'].mean()),
                'rpg_last_5': float(last_5['REB'].mean()),
                'apg_last_5': float(last_5['AST'].mean()),
                'fg_pct': float(last_5['FG_PCT'].mean()),
                'games_count': len(df_games)
            }
        
        return {
            'player_id': player_id,
            'player_name': df_info['DISPLAY_FIRST_LAST'].iloc[0],
            'team': df_info['TEAM_NAME'].iloc[0],
            'position': df_info['POSITION'].iloc[0],
            'recent_form': recent_stats,
            'found': True
        }
        
    except Exception as e:
        logging.error(f"NBA API error for {player_name}: {str(e)}")
        return {
            'player_name': player_name,
            'found': False,
            'error': str(e)
        }
