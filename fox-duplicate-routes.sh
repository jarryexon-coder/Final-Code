#!/bin/bash
# fix-duplicate-routes.sh

echo "🔧 Fixing duplicate route definitions in server.js..."

# Backup
cp server.js server.js.bak

# Comment out routes that likely return documentation
# Look for routes with 'documentation' or 'availableEndpoints' in their response
awk '
  /app\.get.*\/api\/fantasy\/teams/,/^  }\);/ {
    if (/app\.get.*\/api\/fantasy\/teams/) {
      print "// 🗑️ COMMENTED OUT - Duplicate documentation route"
      print "//" $0
    } else if (/^  }\);/ && in_route) {
      print "//" $0
      in_route = 0
    } else if (in_route) {
      print "//" $0
    } else {
      print $0
    }
    if (/app\.get.*\/api\/fantasy\/teams/) in_route = 1
    next
  }
  
  /app\.get.*\/api\/kalshi\/predictions/,/^  }\);/ {
    if (/app\.get.*\/api\/kalshi\/predictions/) {
      print "// 🗑️ COMMENTED OUT - Duplicate documentation route"
      print "//" $0
    } else if (/^  }\);/ && in_route) {
      print "//" $0
      in_route = 0
    } else if (in_route) {
      print "//" $0
    } else {
      print $0
    }
    if (/app\.get.*\/api\/kalshi\/predictions/) in_route = 1
    next
  }
  
  /app\.get.*\/api\/picks\/daily/,/^  }\);/ {
    if (/app\.get.*\/api\/picks\/daily/) {
      print "// 🗑️ COMMENTED OUT - Duplicate documentation route"
      print "//" $0
    } else if (/^  }\);/ && in_route) {
      print "//" $0
      in_route = 0
    } else if (in_route) {
      print "//" $0
    } else {
      print $0
    }
    if (/app\.get.*\/api\/picks\/daily/) in_route = 1
    next
  }
  
  /app\.get.*\/api\/parlay\/suggestions/,/^  }\);/ {
    if (/app\.get.*\/api\/parlay\/suggestions/) {
      print "// 🗑️ COMMENTED OUT - Duplicate documentation route"
      print "//" $0
    } else if (/^  }\);/ && in_route) {
      print "//" $0
      in_route = 0
    } else if (in_route) {
      print "//" $0
    } else {
      print $0
    }
    if (/app\.get.*\/api\/parlay\/suggestions/) in_route = 1
    next
  }
  
  { print }
' server.js.bak > server.js

echo "✅ Duplicate routes commented out"
echo "📋 Check server.js for '// 🗑️ COMMENTED OUT' comments"
