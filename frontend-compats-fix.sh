#!/bin/bash
# frontend-compatibility-fix.sh

echo "🔄 Updating frontend to handle current backend object responses..."
echo ""

# Function to update file with compatibility logic
update_file_compatibility() {
    local file=$1
    local endpoint_type=$2  # "standings" or "analytics"
    local data_key=$3       # "standings" or "analytics"
    
    echo "📄 Updating $file for $endpoint_type..."
    
    if [ ! -f "$file" ]; then
        echo "   ⚠️  File not found"
        return
    fi
    
    # Create backup
    cp "$file" "${file}.backup-$(date +%Y%m%d)"
    
    # Different update logic based on endpoint type
    case "$endpoint_type" in
        "standings")
            # Fix for standings objects (afc/nfc or eastern/western)
            if grep -q "data\.$data_key\.map" "$file"; then
                echo "   🔧 Fixing array access for standings..."
                # Replace .map() with compatibility logic
                sed -i "s/data\.$data_key\.map/processStandingsData(data.$data_key)\.map/g" "$file"
                
                # Add helper function at the top of the component if not exists
                if ! grep -q "const processStandingsData" "$file"; then
                    # Find where to insert the helper function (after imports)
                    if grep -q "import React" "$file"; then
                        line_num=$(grep -n "import React" "$file" | tail -1 | cut -d: -f1)
                        insert_line=$((line_num + 1))
                        
                        # Create temp file with helper function
                        cat > /tmp/helper_function.txt << 'EOF'

// Helper function to handle both array and object standings formats
const processStandingsData = (standingsData: any) => {
  if (!standingsData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(standingsData)) {
    return standingsData;
  }
  
  // If it's an object with conference/division data
  const result = [];
  
  // Handle NFL format { afc: [...], nfc: [...] }
  if (standingsData.afc && Array.isArray(standingsData.afc)) {
    result.push(...standingsData.afc);
  }
  if (standingsData.nfc && Array.isArray(standingsData.nfc)) {
    result.push(...standingsData.nfc);
  }
  
  // Handle NHL format { eastern: [...], western: [...] }
  if (standingsData.eastern && Array.isArray(standingsData.eastern)) {
    result.push(...standingsData.eastern);
  }
  if (standingsData.western && Array.isArray(standingsData.western)) {
    result.push(...standingsData.western);
  }
  
  // Handle division format (teams array inside division)
  if (standingsData.afc && Array.isArray(standingsData.afc)) {
    standingsData.afc.forEach((division: any) => {
      if (division.teams && Array.isArray(division.teams)) {
        result.push(...division.teams.map((team: any) => ({
          ...team,
          conference: 'AFC',
          division: division.division
        })));
      }
    });
  }
  
  if (standingsData.nfc && Array.isArray(standingsData.nfc)) {
    standingsData.nfc.forEach((division: any) => {
      if (division.teams && Array.isArray(division.teams)) {
        result.push(...division.teams.map((team: any) => ({
          ...team,
          conference: 'NFC',
          division: division.division
        })));
      }
    });
  }
  
  if (standingsData.eastern && Array.isArray(standingsData.eastern)) {
    standingsData.eastern.forEach((division: any) => {
      if (division.teams && Array.isArray(division.teams)) {
        result.push(...division.teams.map((team: any) => ({
          ...team,
          conference: 'Eastern',
          division: division.division
        })));
      }
    });
  }
  
  if (standingsData.western && Array.isArray(standingsData.western)) {
    standingsData.western.forEach((division: any) => {
      if (division.teams && Array.isArray(division.teams)) {
        result.push(...division.teams.map((team: any) => ({
          ...team,
          conference: 'Western',
          division: division.division
        })));
      }
    });
  }
  
  return result.length > 0 ? result : [];
};

EOF
                        # Insert helper function
                        ed -s "$file" << EOF
${insert_line}r /tmp/helper_function.txt
w
EOF
                    fi
                fi
                echo "   ✅ Added compatibility for standings object format"
            else
                echo "   ℹ️  No direct .map() call found for $data_key"
            fi
            ;;
            
        "analytics")
            # Fix for analytics objects
            if grep -q "data\.$data_key\.map" "$file"; then
                echo "   🔧 Fixing array access for analytics..."
                # Replace .map() with compatibility logic
                sed -i "s/data\.$data_key\.map/processAnalyticsData(data.$data_key)\.map/g" "$file"
                
                # Add helper function at the top of the component if not exists
                if ! grep -q "const processAnalyticsData" "$file"; then
                    # Find where to insert the helper function (after imports)
                    if grep -q "import React" "$file"; then
                        line_num=$(grep -n "import React" "$file" | tail -1 | cut -d: -f1)
                        insert_line=$((line_num + 1))
                        
                        # Create temp file with helper function
                        cat > /tmp/analytics_helper.txt << 'EOF'

// Helper function to handle both array and object analytics formats
const processAnalyticsData = (analyticsData: any) => {
  if (!analyticsData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(analyticsData)) {
    return analyticsData;
  }
  
  // If it's an object with nested data
  const result = [];
  
  // Handle PrizePicks analytics format
  if (analyticsData.bySport && Array.isArray(analyticsData.bySport)) {
    result.push(...analyticsData.bySport.map((sport: any) => ({
      type: 'sport_performance',
      ...sport
    })));
  }
  
  if (analyticsData.topPerformers && Array.isArray(analyticsData.topPerformers)) {
    result.push(...analyticsData.topPerformers.map((performer: any) => ({
      type: 'top_performer',
      ...performer
    })));
  }
  
  if (analyticsData.byPickType && Array.isArray(analyticsData.byPickType)) {
    result.push(...analyticsData.byPickType.map((pickType: any) => ({
      type: 'pick_type',
      ...pickType
    })));
  }
  
  // If we have performance data but no arrays, create a summary item
  if (analyticsData.performance && result.length === 0) {
    result.push({
      type: 'performance_summary',
      ...analyticsData.performance,
      totalPicks: analyticsData.performance.totalPicks || 0,
      winRate: analyticsData.performance.winRate || '0%',
      roi: analyticsData.performance.roi || '0%'
    });
  }
  
  return result.length > 0 ? result : [];
};

EOF
                        # Insert helper function
                        ed -s "$file" << EOF
${insert_line}r /tmp/analytics_helper.txt
w
EOF
                    fi
                fi
                echo "   ✅ Added compatibility for analytics object format"
            else
                echo "   ℹ️  No direct .map() call found for $data_key"
            fi
            ;;
    esac
}

# Update files that need fixes
echo "🎯 FIXING SPECIFIC FILES:"
echo "========================="

# 1. NFLAnalyticsScreen.tsx - Needs standings compatibility
update_file_compatibility "src/pages/NFLAnalyticsScreen.tsx" "standings" "standings"

# 2. NHLTrendsScreen.tsx - Might need standings compatibility
if [ -f "src/pages/NHLTrendsScreen.tsx" ]; then
    update_file_compatibility "src/pages/NHLTrendsScreen.tsx" "standings" "standings"
else
    echo "📄 NHLTrendsScreen.tsx not found, skipping"
fi

# 3. PrizePicksScreen.tsx - Needs analytics compatibility
update_file_compatibility "src/pages/PrizePicksScreen.tsx" "analytics" "analytics"

echo ""
echo "✅ Frontend compatibility updates complete!"
echo ""
echo "📋 Summary of changes:"
echo "   1. Added helper functions to handle object/array responses"
echo "   2. Updated .map() calls to use compatibility functions"
echo "   3. Created backups of original files"
echo ""
echo "🎯 Files updated:"
echo "   • NFLAnalyticsScreen.tsx - Now handles {afc: [...], nfc: [...]} format"
echo "   • NHLTrendsScreen.tsx - Now handles {eastern: [...], western: [...]} format"
echo "   • PrizePicksScreen.tsx - Now handles analytics object format"
echo ""
echo "🔧 For backend fix (recommended long-term solution):"
echo "   1. Update routes/nflRoutes.js to return standings: [] (array)"
echo "   2. Update routes/nhlRoutes.js to return standings: [] (array)"
echo "   3. Update routes/prizepicksAnalyticsRoutes.js to return analytics: [] (array)"
echo ""
echo "🚀 Quick test to verify frontend works:"
echo "   Open your app and check these screens:"
echo "   - NFL Analytics Screen"
echo "   - NHL Trends Screen"
echo "   - PrizePicks Screen"
