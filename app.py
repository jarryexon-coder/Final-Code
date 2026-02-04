from flask import Flask, jsonify
from flask_cors import CORS
import time, os
import pandas as pd
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

app = Flask(__name__)
CORS(app)

# ==================== PRIZEPICKS API FETCHER ====================
def get_prizepicks_data():
    """Fetch player projections from PrizePicks API."""
    all_players = []
    
    try:
        # First, get the league ID for NBA (you already found it's "7")
        league_id = "7"  # NBA league ID
        
        # API endpoint with parameters you discovered
        url = "https://api.prizepicks.com/projections"
        
        # Parameters based on your network inspection
        params = {
            'league_id': league_id,
            'per_page': 250,  # Get more projections
            'single_stat': 'true',
            'state_code': 'GA',  # You may need to change this based on location
            'game_mode': 'prizepools'
        }
        
        # Headers to mimic a normal browser/API client
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://app.prizepicks.com/',
            'Origin': 'https://app.prizepicks.com',
        }
        
        print(f"Fetching PrizePicks projections for NBA (league_id: {league_id})...")
        response = requests.get(url, headers=headers, params=params, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        
        # Check if we have the expected structure
        if 'data' in data and isinstance(data['data'], list):
            print(f"API returned {len(data['data'])} projections")
            
            # We also need to get player names from the "included" array
            player_map = {}
            if 'included' in data:
                for item in data['included']:
                    if item['type'] == 'new_player':
                        player_map[item['id']] = item['attributes'].get('name', 'Unknown Player')
            
            for projection in data['data']:
                try:
                    attributes = projection.get('attributes', {})
                    
                    # Get player ID from relationships
                    player_id = None
                    if 'new_player' in projection.get('relationships', {}):
                        player_data = projection['relationships']['new_player'].get('data', {})
                        player_id = player_data.get('id') if player_data else None
                    
                    # Get player name from our map
                    player_name = player_map.get(player_id, 'Unknown Player')
                    
                    # Extract projection data
                    line_score = attributes.get('line_score', 0)
                    stat_type = attributes.get('stat_type', 'Unknown')
                    stat_display = attributes.get('stat_display_name', '')
                    
                    # Determine if this is a team or player projection
                    event_type = attributes.get('event_type', 'player')
                    
                    # Only include player projections (not team projections)
                    if event_type == 'team':
                        continue
                    
                    # Get game info for debugging
                    description = attributes.get('description', '')
                    
                    # Format for your frontend - CRITICAL: match your transformation logic
                    all_players.append({
                        'player': player_name,
                        'player_id': player_id,
                        'projection': float(line_score),
                        'stat_type': stat_type,
                        'stat_display': stat_display,
                        'line': float(line_score),  # Same as projection for your frontend
                        'type': stat_display.lower().replace('+', '_').replace(' ', '_') or 'points',
                        'sport': 'NBA',
                        'status': 'pending',  # Your frontend expects this
                        'confidence': 'medium',  # Your frontend expects this
                        'description': description,
                        'updated_at': attributes.get('updated_at', ''),
                        # Additional fields your frontend might need
                        'team': description,  # Using description as team placeholder
                        'game': '',  # Could extract from game relationship
                        'timestamp': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        'odds': 0,
                        'units': 1,
                    })
                    
                except (KeyError, ValueError, TypeError) as e:
                    print(f"Error parsing projection {projection.get('id', 'unknown')}: {e}")
                    continue
        
        print(f"Successfully parsed {len(all_players)} player projections")
        return all_players
        
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        # Try without state_code parameter
        try:
            print("Trying without state_code parameter...")
            params_without_state = params.copy()
            params_without_state.pop('state_code', None)
            response = requests.get(url, headers=headers, params=params_without_state, timeout=15)
            data = response.json()
            
            # Parse the response similarly
            return parse_api_response(data)
        except:
            return []
    except Exception as e:
        print(f"Unexpected error in PrizePicks API: {e}")
        return []

def parse_api_response(data):
    """Helper function to parse API response."""
    players = []
    if 'data' in data:
        for proj in data['data']:
            attrs = proj.get('attributes', {})
            players.append({
                'player': f"Player_{proj.get('id', '')}",
                'projection': attrs.get('line_score', 0),
                'stat_type': attrs.get('stat_type', 'Unknown'),
                'line': attrs.get('line_score', 0),
                'type': 'points',
                'sport': 'NBA',
                'status': 'pending',
                'confidence': 'medium'
            })
    return players

# ==================== FANDUEL SCRAPER ====================
def get_fanduel_data():
    """Scrapes roster data from FanDuel contest."""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    try:
        # Get credentials
        FANDUEL_USER = os.environ.get('FANDUEL_USER', '')
        FANDUEL_PASS = os.environ.get('FANDUEL_PASS', '')
        
        if not FANDUEL_USER or not FANDUEL_PASS:
            return {"error": "FanDuel credentials not set in environment variables"}
        
        # --- 1. LOGIN ---
        driver.get("https://www.fanduel.com/authentication")
        time.sleep(3)
        
        # Fill credentials
        try:
            email_input = driver.find_element(By.ID, "login-email") or driver.find_element(By.NAME, "email")
            pass_input = driver.find_element(By.ID, "login-password") or driver.find_element(By.NAME, "password")
            
            email_input.send_keys(FANDUEL_USER)
            pass_input.send_keys(FANDUEL_PASS)
            pass_input.send_keys(Keys.RETURN)
            time.sleep(5)
        except:
            print("Could not find standard login form, trying alternative...")
        
        # --- 2. NAVIGATE AND SCRAPE ---
        driver.get("https://www.fanduel.com/games")
        time.sleep(5)
        
        roster_data = []
        # Look for player elements
        player_selectors = [
            'div[data-testid="player-name"]',
            'span.player-name',
            'div.player-info',
            'td.player-name'
        ]
        
        for selector in player_selectors:
            player_elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if player_elements:
                print(f"Found {len(player_elements)} players with selector: {selector}")
                for player_el in player_elements[:10]:  # Limit for testing
                    try:
                        player_name = player_el.text.strip()
                        if player_name:
                            roster_data.append({
                                'player': player_name,
                                'position': '',  # You'll need to find the correct selector
                                'salary': '',
                                'team': ''
                            })
                    except:
                        continue
                break
        
        return roster_data
        
    except Exception as e:
        print(f"FanDuel error: {e}")
        return {"error": str(e)}
    finally:
        driver.quit()

# ==================== API ENDPOINTS ====================
@app.route('/')
def home():
    """Root endpoint - for testing if server is running."""
    return jsonify({
        "status": "active",
        "service": "NBA Scraping API",
        "endpoints": {
            "prizepicks": "/api/scrape/prizepicks",
            "fanduel": "/api/scrape/fanduel",
            "health": "/api/health"
        }
    })

@app.route('/api/scrape/prizepicks', methods=['GET'])
def scrape_prizepicks():
    """API endpoint for PrizePicks data."""
    print("=== PrizePicks endpoint called ===")
    data = get_prizepicks_data()
    
    # Format response for your frontend's transformation logic
    return jsonify({
        "success": bool(data),
        "message": f"Found {len(data)} picks" if data else "No data found",
        "selections": data,  # KEY: Your frontend expects 'selections'
        "count": len(data),
        "source": "prizepicks",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

@app.route('/api/scrape/fanduel', methods=['GET'])
def scrape_fanduel():
    """API endpoint for FanDuel fantasy data."""
    print("=== FanDuel endpoint called ===")
    data = get_fanduel_data()
    
    if isinstance(data, dict) and 'error' in data:
        return jsonify({
            "success": False,
            "error": data['error']
        }), 500
    
    return jsonify({
        "success": True,
        "count": len(data),
        "source": "fanduel",
        "data": data
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "nba-scrapers",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
