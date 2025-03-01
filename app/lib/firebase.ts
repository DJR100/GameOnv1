import { connectAuthEmulator, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { auth } from '@/firebase/config';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const googleProvider = new GoogleAuthProvider();

if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export { auth, googleProvider };