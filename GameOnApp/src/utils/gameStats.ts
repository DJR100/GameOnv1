import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export const updateUserGameStats = async (userId: string, score: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentHighScore = userData.highScore || 0;
      const gamesPlayed = userData.gamesPlayed || 0;
      
      await updateDoc(userRef, {
        highScore: score > currentHighScore ? score : currentHighScore,
        gamesPlayed: gamesPlayed + 1,
        lastPlayed: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating game stats:', error);
  }
}; 