import socket
import sys

def check_server(host='localhost', port=3002):
    """Check if server is responding on the port"""
    print(f"Checking if server is running on {host}:{port}...")
    
    # Create a socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    
    try:
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"✅ Server IS running on port {port}")
            return True
        else:
            print(f"❌ Server is NOT running on port {port} (error code: {result})")
            return False
    except Exception as e:
        print(f"❌ Error checking port: {e}")
        return False
    finally:
        sock.close()

def test_endpoint(endpoint):
    """Test a specific endpoint"""
    import urllib.request
    import json
    
    url = f"http://localhost:3002{endpoint}"
    print(f"\nTesting {url}...")
    
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = response.read()
            status = response.status
            
            print(f"Status: {status}")
            print(f"Content-Type: {response.headers.get('Content-Type', 'Unknown')}")
            
            # Try to parse as JSON
            if data:
                try:
                    json_data = json.loads(data.decode('utf-8'))
                    print(f"✅ JSON Response (first 500 chars):")
                    print(json.dumps(json_data, indent=2)[:500])
                except json.JSONDecodeError:
                    print(f"❌ Not valid JSON. Raw response:")
                    print(data.decode('utf-8')[:500])
            else:
                print("⚠️ Empty response")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Check if server is running
    if check_server():
        # Test endpoints
        endpoints = ['/api/health', '/api/players', '/api/fantasy/teams']
        for endpoint in endpoints:
            test_endpoint(endpoint)
    else:
        print("\nChecking other common ports...")
        for port in [5000, 5001, 8080, 8888, 3000, 3001]:
            check_server('localhost', port)
