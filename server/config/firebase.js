const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getStorage, connectStorageEmulator } = require('firebase/storage');
const { getAuth, connectAuthEmulator } = require('firebase/auth');

// Firebase configuration - Updated to match frontend
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyARjm7SEIhd3aJUK7uqunX6pwUw25IO2PQ",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fisha-3bd1e.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "fisha-3bd1e",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fisha-3bd1e.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "892167111455",
  appId: process.env.FIREBASE_APP_ID || "1:892167111455:web:99569e259a1791a144262a",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-656XY74CM8"
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
