import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 