#!/bin/bash
echo "🔍 Finding all empty endpoint arrays in server.js..."
echo "=================================================="

# Method 1: Look for routes with empty arrays
line_num=1
while IFS= read -r line; do
  if [[ $line =~ app\.(get|post|put|delete).*\[.*\] ]]; then
    echo "Line $line_num: $line"
    # Show next 3 lines
    tail -n +$((line_num)) server.js | head -4
    echo "---"
  fi
  ((line_num++))
done < server.js

echo ""
echo "📋 List of endpoints to fix:"
grep -n "\[\]" server.js | while read match; do
  line=$(echo $match | cut -d: -f1)
  echo "Line $line: $(sed -n "${line}p" server.js)"
done
