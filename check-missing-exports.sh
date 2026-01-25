#!/bin/bash
# check-missing-exports.sh

echo "🔍 Checking for missing exports in route files..."
echo "=============================================================="

# Check fantasyRoutes.js specifically
if [ -f "routes/fantasyRoutes.js" ]; then
    echo "Checking fantasyRoutes.js imports..."
    
    # Extract all imports from fantasyRoutes.js
    grep -o "from '../controllers/[^']*" routes/fantasyRoutes.js | \
    while read -r import_line; do
        controller_file=$(echo "$import_line" | sed "s/from '\.\.\/controllers\///")
        echo "Processing imports from: $controller_file"
        
        # Extract imported functions
        grep -A1 -B1 "from.*$controller_file" routes/fantasyRoutes.js | \
        grep -o "{.*}" | tr -d '{}' | tr ',' '\n' | sed 's/ //g' | \
        while read -r function_name; do
            if [ -n "$function_name" ]; then
                # Check if function exists in controller
                if ! grep -q -E "(export\s+(const|function)\s+$function_name|export\s+function\s+$function_name)" "controllers/$controller_file"; then
                    echo "❌ Missing export '$function_name' in controllers/$controller_file"
                    
                    # Show line where it's imported
                    echo "   Imported in routes/fantasyRoutes.js:"
                    grep -n "from.*$controller_file" routes/fantasyRoutes.js | \
                    while read -r line_info; do
                        echo "   $line_info"
                    done
                    echo ""
                fi
            fi
        done
    done
fi

# Check all other route files
for route_file in routes/*.js; do
    if [ -f "$route_file" ] && [ "$route_file" != "routes/fantasyRoutes.js" ]; then
        echo "Checking $route_file..."
        
        grep -o "from '../controllers/[^']*" "$route_file" | \
        while read -r import_line; do
            controller_file=$(echo "$import_line" | sed "s/from '\.\.\/controllers\///")
            
            # Extract imported functions from this specific import line
            line_number=$(grep -n "$import_line" "$route_file" | cut -d: -f1)
            import_content=$(sed -n "${line_number}p" "$route_file" | grep -o "{.*}" | tr -d '{}')
            
            echo "$import_content" | tr ',' '\n' | sed 's/ //g' | \
            while read -r function_name; do
                if [ -n "$function_name" ] && [ -f "controllers/$controller_file" ]; then
                    if ! grep -q -E "(export\s+(const|function)\s+$function_name|export\s+function\s+$function_name)" "controllers/$controller_file"; then
                        echo "❌ Missing export '$function_name' in controllers/$controller_file"
                        echo "   Imported in $route_file: line $line_number"
                        echo ""
                    fi
                fi
            done
        done
    fi
done
