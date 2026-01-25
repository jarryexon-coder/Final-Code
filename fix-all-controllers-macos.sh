#!/bin/bash
# fix-all-controllers-macos.sh

echo "🛠️  Comprehensive fix for ALL controller exports..."
echo "=============================================================="

# Create backup directory
BACKUP_DIR="controller_backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Backing up all controllers to $BACKUP_DIR/"
cp controllers/*.js "$BACKUP_DIR/"

# Function to check and fix a specific controller
fix_controller() {
    local controller="$1"
    local route_files=$(grep -l "from '../controllers/$controller'" routes/*.js 2>/dev/null || echo "")
    
    if [ -n "$route_files" ]; then
        echo "🔍 Processing $controller..."
        
        for route_file in $route_files; do
            echo "   📄 Checking imports in $(basename $route_file)..."
            
            # Get all import lines for this controller
            grep -n "from '../controllers/$controller'" "$route_file" | while read -r import_line; do
                line_num=$(echo "$import_line" | cut -d: -f1)
                full_line=$(echo "$import_line" | cut -d: -f2-)
                
                # Extract function names
                functions=$(echo "$full_line" | grep -o "{.*}" | tr -d '{}' | sed 's/,/ /g')
                
                for func in $functions; do
                    if [ -f "controllers/$controller" ]; then
                        if ! grep -q -E "(export\s+(const|function)\s+$func|export\s+function\s+$func)" "controllers/$controller"; then
                            echo "      ❌ Missing: $func"
                            
                            # Add a stub function
                            stub=$(cat << STUB

// $func - Auto-generated stub
export const $func = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "$func - Implementation pending",
      data: {
        endpoint: "$func",
        params: req.query,
        body: req.body,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("$func error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute $func",
      error: error.message
    });
  }
};
STUB
)
                            
                            # Insert before default export
                            if grep -q "export default {" "controllers/$controller"; then
                                line_num=$(grep -n "export default {" "controllers/$controller" | tail -1 | cut -d: -f1)
                                line_num=$((line_num - 1))
                                awk -v n="$line_num" -v s="$stub" 'NR == n {print s} {print}' "controllers/$controller" > "/tmp/temp_$controller"
                                mv "/tmp/temp_$controller" "controllers/$controller"
                                
                                # Add to default export
                                sed -i '' "s/export default {/export default {\n  $func,/" "controllers/$controller"
                            else
                                # Append at end before any closing
                                echo "$stub" >> "controllers/$controller"
                            fi
                            
                            echo "      ✅ Added stub for $func"
                        fi
                    fi
                done
            done
        done
    fi
}

# Process all controllers
echo ""
echo "📋 Processing all controllers..."
for controller in $(ls controllers/*.js | xargs -n1 basename); do
    fix_controller "$controller"
done

echo ""
echo "=============================================================="
echo "✅ COMPLETED FIXES"
echo "=============================================================="
echo ""
echo "📊 Summary of changes:"
echo "1. All controllers backed up to $BACKUP_DIR/"
echo "2. Missing exports have been added as stub functions"
echo "3. All default exports updated to include new functions"
echo ""
echo "🚀 Next steps:"
echo "1. Run: ./check-all-routes-macos.sh (to verify fixes)"
echo "2. Run: npm start (to test the server)"
echo "3. Implement actual logic for the stub functions as needed"
