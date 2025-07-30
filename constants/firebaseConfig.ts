import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCT1yw36i46F7FqqZQ0pk6N2UmrR22cDqI",
  authDomain: "orientelite-f378f.firebaseapp.com",
  projectId: "orientelite-f378f",
  storageBucket: "orientelite-f378f.appspot.com",
  messagingSenderId: "1062062855792",
  appId: "1:1062062855792:web:486e36aaa914f6f4c3c6b5",
  measurementId: "G-F2WWDLQF1W"
};

// Initialize Firebase only if no apps are initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export const db = getFirestore(app); 