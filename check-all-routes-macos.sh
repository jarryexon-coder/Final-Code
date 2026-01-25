#!/bin/bash
# check-all-routes-macos.sh

echo "🔍 Checking ALL route files for missing exports..."
echo "=============================================================="

# Array to store all errors
declare -a ERRORS

# Check every route file
for route_file in routes/*.js; do
    if [ -f "$route_file" ]; then
        filename=$(basename "$route_file")
        echo "📄 Checking $filename..."
        
        # Extract all controller imports
        grep -n "from '../controllers/" "$route_file" | while read -r import_line; do
            line_num=$(echo "$import_line" | cut -d: -f1)
            full_line=$(echo "$import_line" | cut -d: -f2-)
            
            # Extract controller filename
            controller_file=$(echo "$full_line" | grep -o "from '../controllers/[^']*" | sed "s/from '\.\.\/controllers\///")
            
            if [ -n "$controller_file" ]; then
                # Extract function names from this import line
                functions=$(echo "$full_line" | grep -o "{.*}" | tr -d '{}' | sed 's/,/ /g')
                
                # Check each function
                for func in $functions; do
                    if [ -f "controllers/$controller_file" ]; then
                        if ! grep -q -E "(export\s+(const|function)\s+$func|export\s+function\s+$func)" "controllers/$controller_file"; then
                            ERRORS+=("$route_file: Missing export '$func' in controllers/$controller_file (line $line_num)")
                            echo "   ❌ Missing export: $func"
                        fi
                    else
                        ERRORS+=("$route_file: Controller file not found: controllers/$controller_file")
                        echo "   ❌ Controller not found: $controller_file"
                    fi
                done
            fi
        done
    fi
done

echo ""
echo "=============================================================="
echo "📊 SUMMARY OF MISSING EXPORTS:"
echo "=============================================================="

if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✅ All exports are properly defined!"
else
    echo "Found ${#ERRORS[@]} missing exports:"
    printf '%s\n' "${ERRORS[@]}"
fi

# Also check for route files that might be importing from non-existent controllers
echo ""
echo "🔍 Checking for non-existent controller files..."
for route_file in routes/*.js; do
    grep -o "from '../controllers/[^']*" "$route_file" | sed "s/from '\.\.\/controllers\///" | while read -r controller; do
        if [ ! -f "controllers/$controller" ]; then
            echo "❌ Route $route_file imports from non-existent controller: $controller"
        fi
    done
done
