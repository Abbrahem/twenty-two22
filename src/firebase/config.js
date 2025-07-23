import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARjm7SEIhd3aJUK7uqunX6pwUw25IO2PQ",
  authDomain: "fisha-3bd1e.firebaseapp.com",
  projectId: "fisha-3bd1e",
  storageBucket: "fisha-3bd1e.firebasestorage.app",
  messagingSenderId: "892167111455",
  appId: "1:892167111455:web:99569e259a1791a144262a",
  measurementId: "G-656XY74CM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
