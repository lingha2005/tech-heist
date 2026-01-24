// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR COPIED CONFIG HERE (Overwrite this block)
const firebaseConfig = {
  apiKey: "AIzaSyAWJDiyL94zNDRKIa8b-tyOcn2cpGIMA_4",
  authDomain: "tech-heist-dashboard.firebaseapp.com",
  projectId: "tech-heist-dashboard",
  storageBucket: "tech-heist-dashboard.firebasestorage.app",
  messagingSenderId: "823413060985",
  appId: "1:823413060985:web:69f7edf7e6c38c0090eba8"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };