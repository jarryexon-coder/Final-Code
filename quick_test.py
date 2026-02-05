import requests
import json

def test_api(port=3002):
    base_url = f"http://localhost:{port}"
    
    print(f"Testing API on port {port}...\n")
    
    endpoints = [
        "/api/health",
        "/api/players",
        "/api/fantasy/teams"
    ]
    
    for endpoint in endpoints:
        url = base_url + endpoint
        print(f"Testing {endpoint}...")
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Status: {response.status_code}")
                if endpoint == "/api/players":
                    print(f"  📊 Players: {data.get('count', 0)}")
                elif endpoint == "/api/fantasy/teams":
                    print(f"  🏀 Teams: {data.get('count', 0)}")
                else:
                    print(f"  📍 Response: {data.get('status', 'OK')}")
            else:
                print(f"  ❌ Status: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
        print()

if __name__ == "__main__":
    # Try multiple ports
    ports_to_try = [3002, 5000, 5001, 8888]
    
    for port in ports_to_try:
        print(f"=" * 40)
        print(f"Trying port {port}")
        print(f"=" * 40)
        test_api(port)
