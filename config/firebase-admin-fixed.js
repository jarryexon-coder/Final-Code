// config/firebase-admin-fixed.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp = null;

try {
  if (!admin.apps.length) {
    // Load directly from JSON file
    const serviceAccountPath = join(__dirname, '..', 'firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'ai-fantasy-assistant-aa2f6.appspot.com' // Add your bucket name
    });
    
    console.log('✅ Firebase Admin initialized from JSON file');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  console.error('Full error:', error);
  firebaseApp = null;
}

export const firebaseAdmin = admin;
export const firebaseAuth = firebaseApp ? admin.auth() : null;
export const firebaseStorage = firebaseApp ? admin.storage() : null;
export const firebaseFirestore = firebaseApp ? admin.firestore() : null;
export const firebaseMessaging = firebaseApp ? admin.messaging() : null;

export default {
  firebaseAdmin,
  firebaseAuth,
  firebaseStorage,
  firebaseFirestore,
  firebaseMessaging,
  isInitialized: () => !!firebaseApp
};
