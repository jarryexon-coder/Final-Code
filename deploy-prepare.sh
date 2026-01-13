#!/bin/bash
echo "Preparing for deployment..."

# 1. Clean up
rm -rf node_modules
rm -f package-lock.json

# 2. Create fresh package-lock
npm install --package-lock-only --legacy-peer-deps

# 3. List dependencies to verify
echo "Dependencies:"
npm list --depth=0

# 4. Check for gcp-metadata
echo -e "\ngcp-metadata version:"
npm list gcp-metadata 2>/dev/null || echo "Installing gcp-metadata..."
npm install gcp-metadata@7.0.1 --save --no-package-lock

# 5. Create final package-lock
npm install --legacy-peer-deps

echo -e "\n✅ Ready for deployment!"
echo "Files to commit:"
git status --porcelain
