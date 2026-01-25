#!/bin/bash
# fix-single-export.sh

if [ $# -lt 2 ]; then
    echo "Usage: $0 <controller-file> <function-name>"
    echo "Example: $0 controllers/analytics.controller.js getBumpRiskStats"
    exit 1
fi

CONTROLLER_FILE=$1
FUNCTION_NAME=$2

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Controller file not found: $CONTROLLER_FILE"
    exit 1
fi

echo "🔧 Adding $FUNCTION_NAME to $CONTROLLER_FILE..."

# Create the function
cat >> "$CONTROLLER_FILE" << FUNCTION

// $FUNCTION_NAME
export const $FUNCTION_NAME = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "$FUNCTION_NAME endpoint",
      data: {
        endpoint: "$FUNCTION_NAME",
        params: req.query,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("$FUNCTION_NAME error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute $FUNCTION_NAME",
      error: error.message
    });
  }
};
FUNCTION

# Add to default export
if grep -q "export default {" "$CONTROLLER_FILE"; then
    sed -i '' "s/export default {/export default {\n  $FUNCTION_NAME,/" "$CONTROLLER_FILE"
    echo "✅ Added $FUNCTION_NAME and updated default export"
else
    echo "⚠️  No default export found. Function added but needs manual export setup."
fi
