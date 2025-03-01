import {
  signInWithCredential,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import * as Google from 'expo-auth-session/providers/google';

export const authService = {
  // ... your existing methods

  // Set up Google Auth
  useGoogleAuth() {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your client ID
      iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with your iOS client ID
    });

    return {
      request,
      response,
      promptAsync,
    };
  },

  // Sign in with Google
  async signInWithGoogle(idToken: string): Promise<User> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } catch (error: any) {
      throw {
        code: error.code,
        message: error.message,
      };
    }
  },

  // ... rest of your existing code
};