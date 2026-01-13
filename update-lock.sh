#!/bin/bash
echo "Updating package-lock.json..."
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
echo "Done!"
