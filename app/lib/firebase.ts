import * as WebBrowser from 'expo-web-browser';
import { auth } from '@/firebase/config';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// if (__DEV__) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export { auth };