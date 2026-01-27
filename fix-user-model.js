// fix-user-model.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing User Model Schema');
console.log('===========================\n');

const userModelPath = path.join(__dirname, 'models', 'User.js');

try {
  // Read the current User model
  let content = fs.readFileSync(userModelPath, 'utf8');
  
  console.log('📄 Reading User model...');
  
  // Check if firstName/lastName have defaults
  if (!content.includes('default:') && content.includes('firstName')) {
    console.log('❌ FirstName/LastName missing defaults');
  }
  
  // Fix 1: Add defaults to firstName and lastName
  const fixedContent = content.replace(
    /firstName:\s*{[^}]*},/s,
    `firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    default: function() {
      if (this.name) {
        const parts = this.name.trim().split(/\\s+/);
        return parts[0] || 'User';
      }
      return 'User';
    }
  },`
  );
  
  const finalContent = fixedContent.replace(
    /lastName:\s*{[^}]*},/s,
    `lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    default: function() {
      if (this.name) {
        const parts = this.name.trim().split(/\\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : 'User';
      }
      return 'User';
    }
  },`
  );
  
  // Save the fixed model
  fs.writeFileSync(userModelPath, finalContent);
  
  console.log('✅ User model updated with default functions for firstName/lastName');
  console.log('🚀 Restart your server for changes to take effect');
  
  // Show the diff
  console.log('\n📋 Changes made:');
  console.log('- Added default functions to firstName and lastName fields');
  console.log('- Defaults will use the name field if available');
  console.log('- Falls back to "User" if name is not available');
  
} catch (error) {
  console.error('❌ Error fixing user model:', error.message);
  console.error('Stack:', error.stack);
}
