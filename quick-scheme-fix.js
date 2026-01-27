// quick-schema-fix.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Quick Schema Fix\n');

try {
  const userModelPath = path.join(__dirname, 'models', 'User.js');
  let content = fs.readFileSync(userModelPath, 'utf8');
  
  console.log('📄 Current User model file size:', content.length, 'bytes');
  
  // Make firstName and lastName not required temporarily
  content = content.replace(
    /firstName:\s*{[^}]*required:\s*true[^}]*},/,
    `firstName: {
    type: String,
    trim: true,
    default: function() {
      return this.name?.split(' ')[0] || 'User';
    }
  },`
  );
  
  content = content.replace(
    /lastName:\s*{[^}]*required:\s*true[^}]*},/,
    `lastName: {
    type: String,
    trim: true,
    default: function() {
      const parts = this.name?.split(' ') || [];
      return parts.slice(1).join(' ') || 'User';
    }
  },`
  );
  
  fs.writeFileSync(userModelPath, content);
  console.log('✅ Updated User model - firstName and lastName are now optional with defaults');
  console.log('🚀 Restart your server and try registration again!');
  
} catch (error) {
  console.error('❌ Error fixing schema:', error.message);
}
