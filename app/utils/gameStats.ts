import { doc, updateDoc, increment, getDoc, collection, query, orderBy, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getDatabase, ref, set } from 'firebase/database';

export interface GameStats {
  totalGames: number;
  personalBest: {
    currentStreak: number;
    currentPosition: number;
    highScore: number;
    lastPlayed: string | null;
  };
}

const getDaysDifference = (date1: Date, date2: Date): number => {
  // Convert both dates to UTC midnight to compare days only
  const d1 = new Date(Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()));
  const d2 = new Date(Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()));
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

async function calculateLeaderboardPosition(score: number): Promise<number> {
  try {
    // Query the scores collection instead of users
    const scoresQuery = query(
      collection(db, "scores"), 
      orderBy("score", "desc")
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    
    let position = 1;
    let foundHigherScore = false;
    
    scoresSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.score > score) {
        position++;
        foundHigherScore = true;
      }
    });
    
    // If no scores are higher, and we have scores, we're in first place
    if (!foundHigherScore && scoresSnapshot.size > 0) {
      position = 1;
    }
    
    return position;
  } catch (error) {
    console.error("Error calculating leaderboard position:", error);
    return 999; // Default high position if calculation fails
  }
}

export const updateUserGameStats = async (userId: string, score: number): Promise<void> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("User not found in Firestore.");
      return;
    }

    const userData = userSnap.data();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get current values
    const lastPlayedStr = userData.gameStats?.personalBest?.lastPlayed || null;
    const currentStreak = userData.gameStats?.personalBest?.currentStreak || 0;
    const currentHighScore = userData.gameStats?.personalBest?.highScore || 0;
    
    // Calculate new streak
    let newStreak: number;
    
    if (!lastPlayedStr) {
      // First time playing
      newStreak = 1;
    } else {
      const lastPlayedDate = new Date(lastPlayedStr);
      const daysDifference = getDaysDifference(lastPlayedDate, today);

      if (daysDifference === 0) {
        // Same day, keep current streak
        newStreak = currentStreak;
      } else if (daysDifference === 1) {
        // Played exactly one day after, increase streak
        newStreak = currentStreak + 1;
      } else {
        // More than one day gap, reset to 1
        newStreak = 1;
      }
    }

    // Prepare update object with basic stats
    const updateData: any = {
      "gameStats.totalGames": increment(1),
      "gameStats.personalBest.currentStreak": newStreak,
      "gameStats.personalBest.lastPlayed": todayStr
    };

    // Only update high score and position if this is a new high score
    if (score > currentHighScore) {
      console.log("New high score achieved! Updating position...");
      const newPosition = await calculateLeaderboardPosition(score);
      
      updateData["gameStats.personalBest.highScore"] = score;
      updateData["gameStats.personalBest.currentPosition"] = newPosition;
      
      console.log(`High score updated: ${score}, New position: ${newPosition}`);
    } else {
      console.log("Score not higher than personal best. Keeping existing high score and position.");
    }

    // Update game stats in a single call
    await updateDoc(userRef, updateData);

    console.log("Game stats updated for user:", userId, 
                "New Streak:", newStreak, 
                "Previous Streak:", currentStreak,
                "Days Difference:", lastPlayedStr ? getDaysDifference(new Date(lastPlayedStr), today) : "First game",
                "Score:", score, 
                "Is High Score:", score > currentHighScore);
  } catch (error) {
    console.error("Error updating game stats:", error);
    throw error;
  }
};

interface GameScoreData {
  allScores: number[];         // Array of all three scores
  attemptDetails: {           // Individual attempt scores
    attempt1: number;
    attempt2: number;
    attempt3: number;
  };
  highestScore: number;       // Highest score from this session
  sessionHighScore: number;   // Highest score from this game session
  overallHighScore: number;   // All-time highest score
  timestamp: string;          // When the game session was completed
  isComplete: boolean;        // Confirmation that all attempts are done
}

export const updateUserGameStatsFirebase = async (uid: string, gameType: string, stats: any) => {
  console.log("updateUserGameStatsFirebase called with stats:", stats);
  
  // Log the scores specifically
  console.log("Scores being saved to Firebase:", stats.allScores);
  
  try {
    console.log('Starting to save game session to Firebase...', { uid, gameType, stats });
    const gameRef = doc(db, "games", gameType, "scores", uid);
    
    // First, check if document exists
    const docSnap = await getDoc(gameRef);
    console.log('Existing document found:', docSnap.exists());
    
    if (!docSnap.exists()) {
      // First time playing - create new document
      console.log('Creating new game session record');
      await setDoc(gameRef, {
        ...stats,
        lastUpdated: new Date().toISOString(),
        attempts: [{
          scores: stats.allScores,
          attemptDetails: stats.attemptDetails,
          highestScore: stats.highestScore,
          timestamp: stats.timestamp
        }],
        stats: {
          gamesPlayed: 1,
          bestScore: stats.highestScore,
          lastPlayed: stats.timestamp
        }
      });
    } else {
      // Existing player - update with new attempt
      const existingData = docSnap.data() as any;
      const currentHighScore = existingData.stats?.bestScore || 0;
      
      // Prepare the new attempt data
      const newAttempt = {
        scores: stats.allScores,
        attemptDetails: stats.attemptDetails,
        highestScore: stats.highestScore,
        timestamp: stats.timestamp
      };

      // Update the document
      await setDoc(gameRef, {
        allScores: stats.allScores,
        attemptDetails: stats.attemptDetails,
        highestScore: stats.highestScore,
        sessionHighScore: stats.sessionHighScore,
        overallHighScore: Math.max(currentHighScore, stats.highestScore),
        lastUpdated: new Date().toISOString(),
        attempts: [...(existingData.attempts || []), newAttempt],
        stats: {
          gamesPlayed: (existingData.stats?.gamesPlayed || 0) + 1,
          bestScore: Math.max(currentHighScore, stats.highestScore),
          lastPlayed: stats.timestamp
        }
      }, { merge: true });

      console.log('Game session updated with new attempt');
    }
    
    console.log('Game session saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving game session:', error);
    throw error;
  }
}; 