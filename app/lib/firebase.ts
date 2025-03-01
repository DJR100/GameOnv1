import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, connectAuthEmulator, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import AsyncStorage, { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
  // ... your existing config
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Add Google provider
const googleProvider = new GoogleAuthProvider();

if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export { auth, googleProvider }; 

function getReactNativePersistence(AsyncStorage: AsyncStorageStatic): import("@firebase/auth").Persistence | import("@firebase/auth").Persistence[] | undefined {
    throw new Error('Function not implemented.');
}
