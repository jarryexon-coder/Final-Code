// debug-app.js
console.log('Current working directory:', process.cwd());
console.log('__dirname (if CommonJS):', __dirname);
console.log('Environment variables with APP:', Object.keys(process.env).filter(k => k.includes('APP')));

// Try to load dotenv if you have it
try {
  import('dotenv').then(dotenv => {
    dotenv.config();
    console.log('Dotenv loaded');
  });
} catch (e) {
  console.log('Dotenv not available');
}

// Check if we can find the model file
import { existsSync } from 'fs';
console.log('models/user.js exists:', existsSync('./models/user.js'));
console.log('middleware/auth.js exists:', existsSync('./middleware/auth.js'));
