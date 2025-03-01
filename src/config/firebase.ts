// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCkdR_QvHWBPdLV5D5R3F1LiZvg5LBrpNQ",
  authDomain: "gameon-launch.firebaseapp.com",
  projectId: "gameon-launch",
  storageBucket: "gameon-launch.firebasestorage.app",
  messagingSenderId: "43580306745",
  appId: "1:43580306745:web:fbc4a76b8260ba41bca4e8",
  measurementId: "G-KQ5NYZR5QP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// Add this line for debugging
console.log('Firebase initialized with project:', firebaseConfig.projectId);