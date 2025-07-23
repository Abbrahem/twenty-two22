const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getStorage, connectStorageEmulator } = require('firebase/storage');
const { getAuth, connectAuthEmulator } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDg3FzR2QQti8ZzvKBtZxTeOUTGhjEiUM4",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "kenzo-store.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "kenzo-store",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "kenzo-store.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "306574791255",
  appId: process.env.FIREBASE_APP_ID || "1:306574791255:web:c7a0324c1be85989780912"
};

// Validate required Firebase config
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field].includes('your-'));

if (missingFields.length > 0) {
  console.warn('⚠️  Firebase configuration incomplete. Missing or placeholder values for:', missingFields.join(', '));
  console.warn('⚠️  Please update your .env file with actual Firebase credentials');
}

// Initialize Firebase
let app;
let db;
let storage;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  
  // Connect to Firebase emulators in development
  if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔧 Connected to Firebase emulators');
    } catch (error) {
      console.log('ℹ️  Firebase emulators not available, using production');
    }
  }
  
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}

module.exports = {
  app,
  db,
  storage,
  auth,
  firebaseConfig
};
