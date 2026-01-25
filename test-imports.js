// test-imports.js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing imports from:', __dirname);

try {
  // Test importing your model
  console.log('Testing User model import...');
  const UserModule = await import('./models/user.js');
  console.log('✓ User model import successful');
} catch (error) {
  console.error('✗ User model import failed:', error.message);
}

try {
  // Test importing auth middleware
  console.log('Testing auth middleware import...');
  const AuthModule = await import('./middleware/auth.js');
  console.log('✓ Auth middleware import successful');
} catch (error) {
  console.error('✗ Auth middleware import failed:', error.message);
}
