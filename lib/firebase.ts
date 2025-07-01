import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeYRi4gv2SqWxaXHIRnUDLNA6V_YezTpw",
  authDomain: "orientelite-94a12.firebaseapp.com",
  projectId: "orientelite-94a12",
  storageBucket: "orientelite-94a12.firebasestorage.app",
  messagingSenderId: "323741730616",
  appId: "1:323741730616:web:47170e27ffe2fb9903e3cd",
  measurementId: "G-7YQWB4C82D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // For React Native, we need to use initializeAuth with persistence
  const { getReactNativePersistence } = require('firebase/auth');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };