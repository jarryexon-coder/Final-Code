#!/bin/bash

URL="https://pleasing-determination-production.up.railway.app"

echo "Waiting for deployment..."
sleep 120

echo "Testing endpoints..."
echo "1. /health:"
curl -s "$URL/health" | head -3

echo -e "\n2. /api/health:"
curl -s "$URL/api/health" | head -3

echo -e "\n3. /privacy:"
curl -s "$URL/privacy" | head -2

echo -e "\n4. /:"
curl -s "$URL/" | head -3

echo -e "\n✅ If all return 200, your API is fixed!"
