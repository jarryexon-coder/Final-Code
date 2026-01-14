#!/bin/bash

# Read package.json
PACKAGE=$(cat package.json)

# Update start script
UPDATED=$(echo "$PACKAGE" | sed 's/"start": "node server.js"/"start": "PORT=3002 node server.js"/')

echo "$UPDATED" > package.json
echo "✅ Updated package.json"
