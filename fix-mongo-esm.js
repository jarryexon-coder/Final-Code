import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const content = readFileSync('server.js', 'utf8');

// Check if mongoose is already imported
if (!content.includes("import mongoose from 'mongoose'")) {
  // Find the import section and add mongoose
  const importIndex = content.indexOf("import express from 'express'");
  if (importIndex !== -1) {
    const beforeImport = content.substring(0, importIndex);
    const afterImport = content.substring(importIndex);
    const fixedContent = beforeImport + "import mongoose from 'mongoose';\n" + afterImport;
    writeFileSync('server.js', fixedContent);
    console.log('✅ Added mongoose import');
  }
}

// Now let's check and fix MongoDB connection
let updatedContent = readFileSync('server.js', 'utf8');

// Look for the existing MongoDB connection code (around line 290-300)
if (!updatedContent.includes('mongoose.connection.on')) {
  // Find a good place to add connection listeners
  const connectMatch = updatedContent.match(/await mongoose\.connect\([^)]+\);/);
  if (connectMatch) {
    const connectLine = connectMatch[0];
    const insertIndex = updatedContent.indexOf(connectLine) + connectLine.length;
    
    const connectionListeners = `
    
// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  global.isMongoConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  global.isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  global.isMongoConnected = false;
});
`;
    
    updatedContent = updatedContent.slice(0, insertIndex) + connectionListeners + updatedContent.slice(insertIndex);
    writeFileSync('server.js', updatedContent);
    console.log('✅ Added MongoDB connection listeners');
  }
}

// Now let's add global.isMongoConnected initialization
if (!updatedContent.includes('global.isMongoConnected')) {
  // Add after imports but before any code
  const afterImports = updatedContent.indexOf('\n\n');
  if (afterImports !== -1) {
    updatedContent = updatedContent.slice(0, afterImports) + '\n// Global MongoDB connection state\nglobal.isMongoConnected = false;\n' + updatedContent.slice(afterImports);
    writeFileSync('server.js', updatedContent);
    console.log('✅ Added global MongoDB connection state');
  }
}

console.log('🎉 ES Module fix applied');
