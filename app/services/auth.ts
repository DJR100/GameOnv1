import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import * as Google from 'expo-auth-session/providers/google';

export const authService = {
  // Google Auth
  useGoogleAuth() {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
      clientId: 'YOUR_WEB_CLIENT_ID', // Add your Web client ID
      iosClientId: 'com.googleusercontent.apps.397096414574-c6vo7gut9mm58pi818bleht0ovakn36l',
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
        message: this.getErrorMessage(error.code),
      };
    }
  },

  // Helper function to get user-friendly error messages
  getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please try logging in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Please choose a stronger password (at least 6 characters).';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please create an account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}; 