import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';

// Interface for score data
export interface ScoreData {
  playerName: string;
  score: number;
  gameType: string;
  timestamp: Date;
  deviceId?: string;
}

// Interface for score data with ID (for retrieved documents)
export interface ScoreDataWithId extends ScoreData {
  id: string;
}

// Submit a new score
export const submitScore = async (scoreData: ScoreData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'scores'), {
      ...scoreData,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
};

// Get top scores for a specific game
export const getTopScores = async (gameType: string, limitCount = 20): Promise<ScoreDataWithId[]> => {
  try {
    const q = query(
      collection(db, 'scores'),
      where('gameType', '==', gameType),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        playerName: data.playerName || 'Anonymous',
        score: data.score || 0,
        gameType: data.gameType,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        deviceId: data.deviceId
      } as ScoreDataWithId;
    });
  } catch (error) {
    console.error('Error getting top scores:', error);
    throw error;
  }
};
