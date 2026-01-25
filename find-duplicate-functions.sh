#!/bin/bash
# find-duplicate-functions.sh

echo "🔍 Searching for duplicate function names in controller files..."
echo "=============================================================="

# Create a temporary file to store results
TEMP_FILE="/tmp/duplicate_functions.txt"
> "$TEMP_FILE"

# Process each controller file
for file in controllers/*.js; do
    if [ -f "$file" ]; then
        echo "Checking: $file"
        
        # Extract all function names (both exported and non-exported)
        # Look for: export const funcName =, export function funcName, const funcName =, function funcName
        grep -E "(export\s+(const|function)|^const|^function|^\s+(async\s+)?function)" "$file" | \
        sed -E 's/.*(export\s+(const|function)\s+|export\s+function\s+|const\s+|(async\s+)?function\s+)([a-zA-Z_$][a-zA-Z0-9_$]*).*/\4/' | \
        sort | uniq -d > "/tmp/temp_dups.txt"
        
        if [ -s "/tmp/temp_dups.txt" ]; then
            echo "❌ Found duplicate function names in $file:" >> "$TEMP_FILE"
            cat "/tmp/temp_dups.txt" | while read func; do
                echo "   - $func" >> "$TEMP_FILE"
                
                # Show where these functions are defined
                echo "     Locations:" >> "$TEMP_FILE"
                grep -n -E "(export\s+(const|function)\s+|export\s+function\s+|const\s+|(async\s+)?function\s+)$func" "$file" | \
                sed 's/^/       Line /' >> "$TEMP_FILE"
            done
            echo "" >> "$TEMP_FILE"
        fi
    fi
done

# Display results
if [ -s "$TEMP_FILE" ]; then
    echo "❌ DUPLICATE FUNCTIONS FOUND:"
    echo "=============================================================="
    cat "$TEMP_FILE"
else
    echo "✅ No duplicate function names found!"
fi

# Cleanup
rm -f "/tmp/temp_dups.txt"
