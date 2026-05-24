import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app;
let db;
let firebaseReady = false;

// Only initialize if the user has actually filled in their real config
const hasRealConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (hasRealConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } catch (error) {
    console.warn("Firebase initialization failed:", error.message);
    firebaseReady = false;
  }
} else {
  console.info("Firebase is not configured. Using localStorage. To enable cloud sync, update src/firebase.js with your Firebase config.");
}

export { db, firebaseReady };
