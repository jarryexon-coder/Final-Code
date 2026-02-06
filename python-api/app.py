from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import requests
from datetime import datetime, timedelta
from functools import lru_cache
import time

from dotenv import load_dotenv
load_dotenv() 

app = Flask(__name__)
CORS(app)

# Configuration
THE_ODDS_API_KEY = os.environ.get('THE_ODDS_API_KEY')
SPORTSDATA_API_KEY = os.environ.get('SPORTSDATA_API_KEY')
ODDS_API_CACHE_MINUTES = 5  # Cache odds for 5 minutes

print("🚀 Loading Fantasy API with Odds API integration...")

# Load local data
try:
    with open('players_data.json', 'r') as f:
        PLAYERS_DATA = json.load(f)
    print(f"✅ Loaded {PLAYERS_DATA.get('count', 0)} players from database")
except Exception as e:
    print(f"❌ Error loading players: {e}")
    PLAYERS_DATA = {"success": False, "players": [], "count": 0}

try:
    with open('fantasy_teams_data.json', 'r') as f:
        TEAMS_DATA = json.load(f)
    print(f"✅ Loaded {TEAMS_DATA.get('count', 0)} fantasy teams")
except Exception as e:
    print(f"❌ Error loading teams: {e}")
    TEAMS_DATA = {"success": False, "teams": [], "count": 0}

# Cache for odds data
odds_cache = {
    'data': None,
    'timestamp': None,
    'sport': None
}

def get_cache_key(sport, region, markets):
    """Generate cache key for odds data"""
    return f"{sport}|{region}|{markets}"

def is_cache_valid(cache_time):
    """Check if cache is still valid"""
    if not cache_time:
        return False
    cache_age = time.time() - cache_time
    return cache_age < (ODDS_API_CACHE_MINUTES * 60)

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "players": PLAYERS_DATA.get('count', 0),
        "teams": TEAMS_DATA.get('count', 0),
        "odds_api_configured": bool(THE_ODDS_API_KEY),
        "sportsdata_configured": bool(SPORTSDATA_API_KEY),
        "message": "Fantasy API with real data + Odds API"
    })

@app.route('/api/players')
def players():
    """Get player data from local database"""
    return jsonify(PLAYERS_DATA)

@app.route('/api/fantasy/teams')
def fantasy_teams():
    """Get fantasy teams data"""
    return jsonify(TEAMS_DATA)

@app.route('/api/odds/games')
def get_odds_games():
    """
    Get today's games from The Odds API
    Query params: sport, region, markets
    """
    try:
        # Get query parameters
        sport = request.args.get('sport', 'upcoming')
        region = request.args.get('region', 'us')
        markets = request.args.get('markets', 'h2h,spreads,totals')
        
        # Check cache first
        cache_key = get_cache_key(sport, region, markets)
        if (odds_cache['data'] and 
            odds_cache['sport'] == cache_key and 
            is_cache_valid(odds_cache['timestamp'])):
            print(f"✅ Serving {sport} odds from cache")
            return jsonify(odds_cache['data'])
        
        print(f"🔄 Fetching fresh odds data for sport: {sport}")
        
        if not THE_ODDS_API_KEY:
            print("⚠️ THE_ODDS_API_KEY not configured, using SportsData.io fallback")
            return get_sportsdata_fallback(sport)
        
        # Call The Odds API
        url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
        params = {
            'apiKey': THE_ODDS_API_KEY,
            'regions': region,
            'markets': markets,
            'oddsFormat': 'american',
            'dateFormat': 'iso'
        }
        
        print(f"📡 Calling The Odds API: {url}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        games = response.json()
        
        # Filter for today's games
        today = datetime.utcnow().date()
        today_games = []
        
        for game in games:
            try:
                # Parse commence_time (handle both with and without Z)
                commence_time = game['commence_time']
                if 'Z' in commence_time:
                    game_date = datetime.fromisoformat(commence_time.replace('Z', '+00:00')).date()
                else:
                    game_date = datetime.fromisoformat(commence_time).date()
                
                if game_date == today:
                    # Add game ID if not present
                    if 'id' not in game:
                        game['id'] = f"{game['sport_key']}-{game['home_team']}-{game['away_team']}"
                    today_games.append(game)
            except Exception as e:
                print(f"⚠️ Error parsing game date: {e}")
                continue
        
        # Transform to our format
        transformed_games = []
        for game in today_games:
            transformed_game = {
                'id': game.get('id'),
                'sport_key': game.get('sport_key'),
                'sport_title': game.get('sport_title', game.get('sport_key', '').replace('_', ' ').title()),
                'commence_time': game.get('commence_time'),
                'home_team': game.get('home_team'),
                'away_team': game.get('away_team'),
                'bookmakers': []
            }
            
            # Process bookmakers
            for bookmaker in game.get('bookmakers', []):
                transformed_bookmaker = {
                    'key': bookmaker.get('key'),
                    'title': bookmaker.get('title', bookmaker.get('key', '').title()),
                    'last_update': bookmaker.get('last_update'),
                    'markets': []
                }
                
                # Process markets
                for market in bookmaker.get('markets', []):
                    transformed_market = {
                        'key': market.get('key'),
                        'last_update': market.get('last_update'),
                        'outcomes': []
                    }
                    
                    # Process outcomes
                    for outcome in market.get('outcomes', []):
                        transformed_outcome = {
                            'name': outcome.get('name'),
                            'price': outcome.get('price'),
                            'point': outcome.get('point')
                        }
                        transformed_market['outcomes'].append(transformed_outcome)
                    
                    transformed_bookmaker['markets'].append(transformed_market)
                
                transformed_game['bookmakers'].append(transformed_bookmaker)
            
            transformed_games.append(transformed_game)
        
        response_data = {
            'success': True,
            'games': transformed_games,
            'count': len(transformed_games),
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'the-odds-api',
            'sport': sport
        }
        
        # Update cache
        odds_cache['data'] = response_data
        odds_cache['timestamp'] = time.time()
        odds_cache['sport'] = cache_key
        
        print(f"✅ Fetched {len(transformed_games)} games from The Odds API")
        return jsonify(response_data)
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching from The Odds API: {e}")
        return get_sportsdata_fallback(sport)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'games': [],
            'source': 'error',
            'count': 0
        })

@app.route('/api/player/props')
def get_player_props():
    """
    Get player props - try SportsData.io first, fallback to local database
    """
    try:
        sport = request.args.get('sport', 'NBA')
        date = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
        
        print(f"📡 Fetching player props for {sport} on {date}")
        
        # Try SportsData.io first if API key is available
        if SPORTSDATA_API_KEY and sport.upper() == 'NBA':
            try:
                url = f"https://api.sportsdata.io/v3/nba/projections/json/PlayerGameProjectionStatsByDate/{date}"
                headers = {'Ocp-Apim-Subscription-Key': SPORTSDATA_API_KEY}
                
                print(f"🔗 Calling SportsData.io API")
                response = requests.get(url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    props_data = response.json()
                    processed_props = process_player_props(props_data)
                    
                    return jsonify({
                        'success': True,
                        'props': processed_props,
                        'count': len(processed_props),
                        'source': 'sportsdata',
                        'sport': sport,
                        'timestamp': datetime.utcnow().isoformat()
                    })
                else:
                    print(f"⚠️ SportsData.io returned {response.status_code}, using fallback")
            except Exception as e:
                print(f"⚠️ SportsData.io error: {e}, using fallback")
        
        # Fallback to local player database
        print("🔄 Falling back to local player database")
        local_props = get_local_player_props(sport)
        
        return jsonify({
            'success': True,
            'props': local_props,
            'count': len(local_props),
            'source': 'local-database',
            'sport': sport,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error getting player props: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'props': [],
            'source': 'error',
            'count': 0
        })

@app.route('/api/parlay/suggestions')
def parlay_suggestions():
    """
    Generate parlay suggestions based on today's games and player props
    """
    try:
        sport = request.args.get('sport', 'all')
        num_suggestions = int(request.args.get('limit', 4))
        
        print(f"🎯 Generating {num_suggestions} parlay suggestions for {sport}")
        
        # Get today's games
        games_response = get_odds_games()
        games_data = games_response.get_json()
        
        if not games_data.get('success') or not games_data.get('games'):
            print("⚠️ No games available for parlay suggestions")
            return jsonify({
                'success': True,
                'suggestions': [],
                'count': 0,
                'message': 'No games available today'
            })
        
        # Get player props
        props_response = get_player_props()
        props_data = props_response.get_json()
        
        # Generate suggestions
        suggestions = generate_parlay_suggestions(
            games_data['games'],
            props_data.get('props', []),
            sport,
            num_suggestions
        )
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'count': len(suggestions),
            'timestamp': datetime.utcnow().isoformat(),
            'sport': sport,
            'message': 'Parlay suggestions generated from live data'
        })
        
    except Exception as e:
        print(f"❌ Error generating parlay suggestions: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'suggestions': [],
            'count': 0
        })

def get_sportsdata_fallback(sport):
    """Fallback to SportsData.io when The Odds API fails"""
    try:
        if not SPORTSDATA_API_KEY:
            print("⚠️ SPORTSDATA_API_KEY not configured, returning empty games")
            return jsonify({
                'success': True,
                'games': [],
                'source': 'none',
                'count': 0,
                'message': 'No API keys configured'
            })
        
        sport_map = {
            'basketball_nba': 'nba',
            'americanfootball_nfl': 'nfl',
            'icehockey_nhl': 'nhl',
            'baseball_mlb': 'mlb',
            'upcoming': 'nba'  # Default to NBA
        }
        
        api_sport = sport_map.get(sport, 'nba')
        today = datetime.utcnow().strftime('%Y-%m-%d')
        
        print(f"🔄 Using SportsData.io fallback for {api_sport}")
        url = f"https://api.sportsdata.io/v3/{api_sport}/odds/json/GameOddsByDate/{today}"
        headers = {'Ocp-Apim-Subscription-Key': SPORTSDATA_API_KEY}
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            games = response.json()
            transformed = transform_sportsdata_games(games, api_sport)
            
            return jsonify({
                'success': True,
                'games': transformed,
                'source': 'sportsdata',
                'count': len(transformed),
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            print(f"⚠️ SportsData.io returned {response.status_code}")
            
    except Exception as e:
        print(f"❌ SportsData.io fallback error: {e}")
    
    # Ultimate fallback - return empty but don't crash
    return jsonify({
        'success': True,
        'games': [],
        'source': 'none',
        'count': 0,
        'message': 'All API fallbacks failed'
    })

def transform_sportsdata_games(games, sport):
    """Transform SportsData.io games to our format"""
    transformed = []
    
    for game in games[:20]:  # Limit to 20 games
        try:
            # Extract team names
            if sport == 'nba':
                home_team = game.get('HomeTeam')
                away_team = game.get('AwayTeam')
            elif sport == 'nfl':
                home_team = game.get('HomeTeamName')
                away_team = game.get('AwayTeamName')
            else:
                home_team = game.get('HomeTeam', 'Home')
                away_team = game.get('AwayTeam', 'Away')
            
            transformed_game = {
                'id': f"{sport}-{game.get('GameID', 'unknown')}",
                'sport_key': f"{sport}",
                'sport_title': sport.upper(),
                'commence_time': game.get('DateTime', datetime.utcnow().isoformat()),
                'home_team': home_team,
                'away_team': away_team,
                'bookmakers': []
            }
            
            # Add DraftKings as a mock bookmaker
            if game.get('AwayTeamMoneyLine'):
                bookmaker = {
                    'key': 'draftkings',
                    'title': 'DraftKings',
                    'last_update': datetime.utcnow().isoformat(),
                    'markets': []
                }
                
                # Moneyline market
                moneyline_market = {
                    'key': 'h2h',
                    'last_update': datetime.utcnow().isoformat(),
                    'outcomes': []
                }
                
                if game.get('HomeTeamMoneyLine'):
                    moneyline_market['outcomes'].append({
                        'name': home_team,
                        'price': game['HomeTeamMoneyLine']
                    })
                
                if game.get('AwayTeamMoneyLine'):
                    moneyline_market['outcomes'].append({
                        'name': away_team,
                        'price': game['AwayTeamMoneyLine']
                    })
                
                if moneyline_market['outcomes']:
                    bookmaker['markets'].append(moneyline_market)
                
                # Point spread market
                if game.get('PointSpread') and game.get('AwayPointSpread'):
                    spread_market = {
                        'key': 'spreads',
                        'last_update': datetime.utcnow().isoformat(),
                        'outcomes': []
                    }
                    
                    spread_market['outcomes'].append({
                        'name': away_team,
                        'price': game.get('AwayPointSpreadPayout', -110),
                        'point': game.get('AwayPointSpread')
                    })
                    
                    spread_market['outcomes'].append({
                        'name': home_team,
                        'price': game.get('HomePointSpreadPayout', -110),
                        'point': game.get('PointSpread')
                    })
                    
                    bookmaker['markets'].append(spread_market)
                
                if bookmaker['markets']:
                    transformed_game['bookmakers'].append(bookmaker)
            
            transformed.append(transformed_game)
            
        except Exception as e:
            print(f"⚠️ Error transforming game: {e}")
            continue
    
    return transformed

def process_player_props(props_data):
    """Process SportsData.io player props"""
    processed = []
    
    for player in props_data[:50]:  # Limit to 50 players
        try:
            prop = {
                'player_id': player.get('PlayerID'),
                'name': player.get('Name'),
                'team': player.get('Team'),
                'position': player.get('Position'),
                'opponent': player.get('Opponent'),
                'projections': {
                    'points': player.get('Points', 0),
                    'rebounds': player.get('Rebounds', 0),
                    'assists': player.get('Assists', 0),
                    'fantasy_points': player.get('FantasyPoints', 0)
                },
                'odds': {
                    'points_over': -110,
                    'points_under': -110,
                    'rebounds_over': -110,
                    'rebounds_under': -110,
                    'assists_over': -110,
                    'assists_under': -110
                }
            }
            processed.append(prop)
        except Exception as e:
            print(f"⚠️ Error processing player prop: {e}")
            continue
    
    return processed

def get_local_player_props(sport):
    """Get player props from local database"""
    props = []
    
    if PLAYERS_DATA.get('success') and PLAYERS_DATA.get('players'):
        players = PLAYERS_DATA['players']
        
        # Filter by sport if needed
        for player in players[:30]:  # Limit to 30 players
            try:
                # Create prop based on player data
                prop = {
                    'player_id': player.get('id'),
                    'name': player.get('name', player.get('playerName', 'Unknown')),
                    'team': player.get('team', player.get('teamAbbrev', 'UNK')),
                    'position': player.get('position', player.get('pos', 'N/A')),
                    'opponent': 'TBD',
                    'projections': {
                        'points': player.get('points', player.get('pts', 0)),
                        'rebounds': player.get('rebounds', player.get('reb', 0)),
                        'assists': player.get('assists', player.get('ast', 0)),
                        'fantasy_points': player.get('fantasyScore', player.get('fp', 0))
                    },
                    'odds': {
                        'points_over': -110,
                        'points_under': -110,
                        'rebounds_over': -110,
                        'rebounds_under': -110,
                        'assists_over': -110,
                        'assists_under': -110
                    },
                    'confidence': player.get('confidence', 70),
                    'source': 'local-database'
                }
                props.append(prop)
            except Exception as e:
                print(f"⚠️ Error creating local prop: {e}")
                continue
    
    return props

def generate_parlay_suggestions(games, player_props, sport_filter, num_suggestions):
    """Generate parlay suggestions from games and props"""
    suggestions = []
    
    # Filter games by sport if needed
    filtered_games = games
    if sport_filter != 'all':
        filtered_games = [g for g in games if g.get('sport_key', '').startswith(sport_filter)]
    
    if not filtered_games:
        print(f"⚠️ No games available for sport filter: {sport_filter}")
        return []
    
    # Generate different types of parlays
    parlay_types = [
        ('Moneyline Mix', 'h2h'),
        ('Spread Special', 'spreads'),
        ('Over/Under Parlay', 'totals'),
        ('Player Props', 'player')
    ]
    
    for i in range(min(num_suggestions, len(parlay_types))):
        parlay_type, market_type = parlay_types[i]
        
        try:
            if market_type == 'player' and player_props:
                # Player props parlay
                suggestion = generate_player_prop_parlay(player_props, i)
            else:
                # Game-based parlay
                suggestion = generate_game_parlay(filtered_games, market_type, i)
            
            if suggestion:
                suggestions.append(suggestion)
                
        except Exception as e:
            print(f"⚠️ Error generating parlay {i}: {e}")
            continue
    
    return suggestions

def generate_game_parlay(games, market_type, index):
    """Generate a game-based parlay"""
    if len(games) < 2:
        return None
    
    # Select 2-3 games for the parlay
    selected_games = games[:min(3, len(games))]
    
    legs = []
    total_confidence = 0
    
    for i, game in enumerate(selected_games):
        if game.get('bookmakers'):
            bookmaker = game['bookmakers'][0]
            market = next((m for m in bookmaker.get('markets', []) if m.get('key') == market_type), None)
            
            if market and market.get('outcomes'):
                outcome = market['outcomes'][0]  # Take first outcome
                
                leg = {
                    'id': f"leg-{index}-{i}",
                    'gameId': game['id'],
                    'description': f"{game['away_team']} @ {game['home_team']}",
                    'odds': f"{outcome.get('price', -110)}",
                    'confidence': 65 + (i * 5),  # Increasing confidence
                    'sport': game['sport_title'],
                    'market': market_type,
                    'outcome': outcome.get('name', '')
                }
                legs.append(leg)
                total_confidence += leg['confidence']
    
    if not legs:
        return None
    
    # Calculate total odds (simplified)
    total_odds = '+450' if len(legs) == 3 else '+280'
    
    return {
        'id': f'parlay-{index + 1}',
        'name': f'Game Parlay {index + 1}',
        'sport': 'Mixed' if len(set(leg['sport'] for leg in legs)) > 1 else legs[0]['sport'],
        'type': market_type.title(),
        'legs': legs,
        'totalOdds': total_odds,
        'confidence': int(total_confidence / len(legs)),
        'analysis': f'Generated from {len(legs)} games with {market_type} markets.',
        'timestamp': datetime.utcnow().isoformat(),
        'isGenerated': True,
        'isToday': True
    }

def generate_player_prop_parlay(player_props, index):
    """Generate a player props parlay"""
    if len(player_props) < 2:
        return None
    
    # Select 2-3 player props
    selected_props = player_props[:min(3, len(player_props))]
    
    legs = []
    total_confidence = 0
    
    for i, prop in enumerate(selected_props):
        prop_types = ['points', 'rebounds', 'assists']
        prop_type = prop_types[i % len(prop_types)]
        
        leg = {
            'id': f"player-leg-{index}-{i}",
            'gameId': f"player-{prop['player_id']}",
            'description': f"{prop['name']} Over {prop['projections'][prop_type]:.1f} {prop_type}",
            'odds': "-110",
            'confidence': prop.get('confidence', 70),
            'sport': 'NBA',  # Assuming NBA for player props
            'market': 'player_props',
            'outcome': 'over'
        }
        legs.append(leg)
        total_confidence += leg['confidence']
    
    if not legs:
        return None
    
    return {
        'id': f'player-parlay-{index + 1}',
        'name': f'Player Props Parlay {index + 1}',
        'sport': 'NBA',
        'type': 'Player Props',
        'legs': legs,
        'totalOdds': '+600',
        'confidence': int(total_confidence / len(legs)),
        'analysis': 'AI-generated player props parlay based on player projections.',
        'timestamp': datetime.utcnow().isoformat(),
        'isGenerated': True,
        'isToday': True
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚀 Starting Fantasy API with Odds API on port {port}")
    print(f"📊 The Odds API configured: {'✅' if THE_ODDS_API_KEY else '❌'}")
    print(f"📊 SportsData.io configured: {'✅' if SPORTSDATA_API_KEY else '❌'}")
    app.run(host='0.0.0.0', port=port)
