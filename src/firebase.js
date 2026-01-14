import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIXBV0QCtOsqJXYN8ufqnTEtiyA7Iinas",
  authDomain: "cricbharath2026.firebaseapp.com",
  projectId: "cricbharath2026",
  storageBucket: "cricbharath2026.firebasestorage.app",
  messagingSenderId: "251878135216",
  appId: "1:251878135216:web:a784c2386d1bb1a8ab3275"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL LINE: Must have 'export'
export const db = getFirestore(app);