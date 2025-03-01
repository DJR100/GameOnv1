import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkdR_QvHWBPdLV5D5R3FTLiZvq5LBrpNQ",
  authDomain: "gameon-launch.firebaseapp.com",
  projectId: "gameon-launch",
  storageBucket: "gameon-launch.firebasestorage.app",
  messagingSenderId: "435803067454",
  appId: "1:435803067454:web:fbc4a76b8260ba41bca4e8",
  measurementId: "G-KQSNVZR5QP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 