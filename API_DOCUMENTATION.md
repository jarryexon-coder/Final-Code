cat > API_DOCUMENTATION.md << 'EOF'
# 🏈 Sports Analytics API Documentation

## Base URL
```

https://pleasing-determination-production.up.railway.app/api

```

## Authentication
Currently public API. Rate limit: 100 requests/minute per IP.

## Endpoints

### 🏈 NFL Data
```http
GET /nfl/standings
```

Response:

```json
{
  "success": true,
  "standings": [
    {
      "team": "Buffalo Bills",
      "wins": 11,
      "losses": 6,
      "conference": "AFC",
      "division": "East"
    }
  ]
}
```

🏒 NHL Data

```http
GET /nhl/standings
```

🎯 PrizePicks Analytics

```http
GET /prizepicks/analytics
```

🎮 Games & News

```http
GET /games          # Live games
GET /news           # Sports news
GET /players        # Player data
```

Code Examples

JavaScript/React

```javascript
// Fetch NFL standings
const fetchStandings = async () => {
  const response = await fetch('https://pleasing-determination-production.up.railway.app/api/nfl/standings');
  const data = await response.json();
  return data.standings;
};
```

Python

```python
import requests

response = requests.get('https://pleasing-determination-production.up.railway.app/api/nfl/standings')
standings = response.json()['standings']
```

Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Rate Limits

· Free tier: 100 requests/minute
· Contact for higher limits

Changelog

· v1.0.0 (Current): All 21 endpoints live
· v0.9.0: Fixed array/object response issues
· v0.8.0: Initial release with mock data

Support

· Email: api-support@sportsanalyticsgpt.com
· Issues: GitHub repository
· Status: https://status.sportsanalyticsgpt.com
  EOF

```

**B. Add Swagger/OpenAPI (Already in your backend):**
Your logs show `✅ Swagger documentation loaded`. Access it at:
- `https://pleasing-determination-production.up.railway.app/api-docs`

**C. Create Postman Collection:**
```bash
# Create postman_collection.json
cat > postman_collection.json << 'EOF'
{
  "info": {
    "name": "Sports Analytics API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "NFL Standings",
      "request": {
        "method": "GET",
        "url": "https://pleasing-determination-production.up.railway.app/api/nfl/standings"
      }
    }
  ]
}
EOF
