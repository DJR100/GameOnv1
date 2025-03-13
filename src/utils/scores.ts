import { db, auth } from '../../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function submitScore(score: number) {
  try {
    console.log('submitScore called with score:', score);
    console.log('Current auth state:', auth.currentUser); // Debug log

    if (!auth.currentUser) {
      console.log('No user authenticated, storing pending score:', score); // Debug log
      await AsyncStorage.setItem('pendingScore', score.toString());
      return { requiresAuth: true };
    }

    // Force refresh the user to ensure we have the latest data
    await auth.currentUser.reload();
    
    const userId = auth.currentUser.uid;
    const playerName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous';
    console.log('Submitting score for user:', userId, 'with name:', playerName, 'score value:', score); // Debug log

    const scoreRef = doc(db, 'scores', `${userId}_${Date.now()}`);
    await setDoc(scoreRef, {
      score,
      userId,
      playerName,
      timestamp: serverTimestamp(),
      userEmail: auth.currentUser.email,
      gameType: 'shoot'
    });
    
    console.log('Score submitted successfully:', score); // Debug log
    return { success: true };
  } catch (error) {
    console.error('Detailed submit error:', error, 'for score:', score); // Debug log
    throw error;
  }
}