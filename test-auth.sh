#!/bin/bash
# test-auth.sh

echo "🔐 Testing Authentication System..."
echo "========================================="

BASE_URL="http://localhost:3002"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#"
TEST_NAME="Test User"

echo "📝 Test Details:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo "   Name: $TEST_NAME"
echo "   Base URL: $BASE_URL"
echo ""

# Test 1: Register a new user
echo "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'",
    "name": "'"$TEST_NAME"'"
  }')

echo "Response:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Registration successful!"
  
  # Extract tokens
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['tokens']['accessToken'])" 2>/dev/null || echo "")
  REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['tokens']['refreshToken'])" 2>/dev/null || echo "")
  
  if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "   Access Token: ${ACCESS_TOKEN:0:30}..."
    
    # Test 2: Get profile with token
    echo ""
    echo "2. Testing protected route (get profile)..."
    PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/profile" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo "Profile Response:"
    echo "$PROFILE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROFILE_RESPONSE"
    
    # Test 3: Login with same credentials
    echo ""
    echo "3. Testing login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'"
      }')
    
    echo "Login Response:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
    
    # Test 4: Refresh token
    echo ""
    echo "4. Testing token refresh..."
    if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
      REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
        -H "Content-Type: application/json" \
        -d '{"refreshToken": "'"$REFRESH_TOKEN"'"}')
      
      echo "Refresh Response:"
      echo "$REFRESH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REFRESH_RESPONSE"
    else
      echo "⚠️  No refresh token to test"
    fi
    
    # Test 5: Logout
    echo ""
    echo "5. Testing logout..."
    LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/logout" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"refreshToken": "'"$REFRESH_TOKEN"'"}')
    
    echo "Logout Response:"
    echo "$LOGOUT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGOUT_RESPONSE"
    
  else
    echo "⚠️  Could not extract access token"
  fi
  
else
  echo "❌ Registration failed"
  
  # Try login with existing user
  echo ""
  echo "Trying login with existing test user..."
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "password123"
    }')
  
  echo "Login Response:"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
fi

# Test 6: Health check
echo ""
echo "6. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/health")

echo "Health Response:"
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"

echo ""
echo "========================================="
echo "🎉 Authentication test completed!"
