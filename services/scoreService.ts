import { collection, addDoc, query, orderBy, limit, getDocs, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';

// Interface for score data
export interface ScoreData {
  score: number;
  playerName: string;
  timestamp: Date;
  gameType: string;
  level: number;
  totalFruit?: number;
}

// Interface for score data with ID (for retrieved documents)
export interface ScoreDataWithId extends ScoreData {
  id: string;
}

// Submit a new score
export const submitScore = async (scoreData: ScoreData): Promise<string> => {
  try {
    // Validate the data
    if (typeof scoreData.score !== 'number' || scoreData.score < 0) {
      throw new Error('Invalid score value');
    }
    if (typeof scoreData.level !== 'number' || scoreData.level < 1) {
      throw new Error('Invalid level value');
    }
    if (!scoreData.playerName || scoreData.playerName === 'Anonymous') {
      // Try to get a better player name if one wasn't provided
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        scoreData.playerName = user.displayName || 
                             userData?.displayName ||
                             userData?.username ||
                             user.email?.split('@')[0] ||
                             'Anonymous';
      }
    }

    const docRef = await addDoc(collection(db, 'scores'), {
      ...scoreData,
      totalFruit: scoreData.score,
      timestamp: new Date(),
      gameType: 'levelup',
      userId: auth.currentUser?.uid,
      playerName: scoreData.playerName // Use the potentially updated playerName
    });
    
    console.log('Score submitted with player name:', scoreData.playerName);
    return docRef.id;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
};

// Get top scores with additional filtering options
export const getTopScores = async (
  gameType: string, 
  limitCount = 20,
  minLevel?: number
): Promise<ScoreDataWithId[]> => {
  try {
    const scoresRef = collection(db, 'scores');
    let q = query(
      scoresRef,
      where('gameType', '==', gameType)
    );

    // Add level filter if specified
    if (minLevel) {
      q = query(q, where('level', '>=', minLevel));
    }

    // Always sort by totalFruit descending
    q = query(q, orderBy('totalFruit', 'desc'));
    
    // Add limit
    q = query(q, limit(limitCount));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        playerName: data.playerName || 'Anonymous',
        score: data.totalFruit || 0,
        totalFruit: data.totalFruit || 0,
        gameType: data.gameType,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
        level: data.level || 1
      } as ScoreDataWithId;
    });
  } catch (error) {
    console.error('Error getting top scores:', error);
    throw error;
  }
};
