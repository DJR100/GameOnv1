import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { auth, db } from "@/firebase/config";
import { updateUserGameStatsFirebase } from "@/app/utils/gameStats";
import { Colors } from "@/constants/Colors";
import { submitScore } from "@/services/scoreService";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

interface WebViewGameProps {
  url: string;
  gameType: string;
}

interface AttemptScore {
  type: "attemptScore";
  attemptNumber: number; // 1, 2, or 3
  score: number; // The score for this attempt
  attemptsLeft: number; // How many attempts remain
  allScores: number[]; // Array of all scores so far
  isHighScore: boolean; // Whether this score beat the overall high score
}

interface FinalScores {
  level: number;
  totalFruit: number;
  timestamp: string;
}

interface GameStatus {
  practiceGamesLeft: number;
  realGamesLeft: number;
  lastPlayedDate: string | null;
}

type GameMessage = AttemptScore | FinalScores;

export default function WebViewGame({ url, gameType }: WebViewGameProps) {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionHighScore, setSessionHighScore] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    practiceGamesLeft: 3,
    realGamesLeft: 3,
    lastPlayedDate: null
  });
  const [currentMode, setCurrentMode] = useState<'practice' | 'real'>('practice');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const navigation = useNavigation();
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [totalFruit, setTotalFruit] = useState<number>(0);

  const handleAttemptScore = (data: AttemptScore) => {
    console.log(`Attempt ${data.attemptNumber} completed:`, {
      score: data.score,
      attemptsLeft: data.attemptsLeft,
      allScores: data.allScores,
      isHighScore: data.isHighScore,
    });

    // Update attempts array with the new score
    setAttempts(data.allScores);

    // Update session high score if this is a new high score
    if (data.isHighScore) {
      setSessionHighScore(data.score);
    }
  };

  const handleFinalScores = async (data: FinalScores, uid: string) => {
    if (!checkGameAvailability()) {
      return;
    }

    try {
      // Validate and ensure data has default values
      const validatedData = {
        level: data.level || 1,
        totalFruit: data.totalFruit || 0,
        timestamp: new Date().toISOString(),
        isComplete: true,
        gameType: gameType // Add gameType to the data
      };
      
      console.log("Data being sent to Firebase:", JSON.stringify(validatedData));
      
      await updateUserGameStatsFirebase(uid, gameType, validatedData);
      
      // Only submit score for real games
      if (currentMode === 'real') {
        try {
          const user = auth.currentUser;
          if (user) {
            // Get user document to check for additional name sources
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            
            // Try multiple sources for the player name in order of preference
            const playerName = user.displayName || // First try Firebase Auth displayName
                             userData?.displayName || // Then try Firestore displayName
                             userData?.username || // Then try Firestore username
                             user.email?.split('@')[0] || // Then try email prefix
                             'Anonymous'; // Last resort

            await submitScore({
              score: validatedData.totalFruit,
              gameType: gameType,
              playerName: playerName,
              timestamp: new Date(),
              level: validatedData.level
            });
            console.log("Score submitted to leaderboard:", validatedData.totalFruit, "Level:", validatedData.level, "Player:", playerName);
          }
        } catch (leaderboardError) {
          console.error("Error submitting to leaderboard:", leaderboardError);
        }
      }

      // Update game attempts
      await updateGameStatus(currentMode);
      
      console.log("Firebase update completed");
      setIsComplete(true);
      console.log("Game session saved successfully");

    } catch (error) {
      console.error("Error saving game session:", error);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Received message from game:", data);

      if (data.type === 'FINAL_SCORES' && auth.currentUser) {
        // Validate the scores object structure
        const scores = data.scores;
        if (!scores || typeof scores.level !== 'number' || typeof scores.totalFruit !== 'number') {
          console.error("Invalid score data received:", scores);
          return;
        }
        
        // Ensure timestamp is valid
        const timestamp = scores.timestamp || new Date().toISOString();
        if (!Date.parse(timestamp)) {
          console.error("Invalid timestamp received:", timestamp);
          return;
        }

        handleFinalScores({
          level: Math.max(1, Math.floor(scores.level)), // Ensure level is a positive integer
          totalFruit: Math.max(0, Math.floor(scores.totalFruit)), // Ensure score is non-negative
          timestamp: timestamp
        }, auth.currentUser.uid);
      } else if (data.type === 'UPDATE_LEVEL') {
        setCurrentLevel(Math.max(1, Math.floor(data.level)));
      } else if (data.type === 'UPDATE_FRUIT') {
        setTotalFruit(Math.max(0, Math.floor(data.totalFruit)));
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  const handleReload = () => {
    if (webViewRef.current) {
      setLoading(true);
      setError(null);
      webViewRef.current.reload();
    }
  };

  // This handles initial loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.dark.primary} />
      <Text style={styles.loadingText}>Loading game...</Text>
    </View>
  );

  // This handles error state
  const renderError = (errorMessage: string) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorText}>{errorMessage}</Text>
      <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
        <Text style={styles.reloadButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Check if user has already played
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (!auth.currentUser) {
        console.log("No authenticated user found");
        setLoading(false);
        return;
      }
      
      try {
        const uid = auth.currentUser.uid;
        console.log(`Checking play status for user ${uid} and game ${gameType}`);
        
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data:", userData);
          
          // Check if gameStatus exists and has the game type
          if (userData.gameStatus && userData.gameStatus[gameType]) {
            const gameStatus = userData.gameStatus[gameType];
            console.log(`Game status for ${gameType}:`, gameStatus);
            
            if (gameStatus.hasPlayed && gameStatus.attemptsUsed >= 3) {
              console.log("User has already played this game");
              setHasPlayed(true);
            } else {
              console.log("User has not completed all attempts for this game");
              setHasPlayed(false);
            }
          } else {
            console.log(`No game status found for ${gameType}`);
            setHasPlayed(false);
          }
        } else {
          console.log("User document does not exist in Firestore");
          setHasPlayed(false);
        }
      } catch (error) {
        console.error("Error checking play status:", error);
        setHasPlayed(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkPlayStatus();
  }, [gameType]);

  // Render locked screen if already played
  if (hasPlayed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          {/* GameOn Logo Image */}
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          
          <Text style={styles.lockedTitle}>Game Already Played</Text>
          <Text style={styles.lockedMessage}>
            Tune in tomorrow to play the next game!
          </Text>
          <Text style={styles.lockedMessage}>
            Invite 3 friends for another round
          </Text>
          
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => {
              // This will be implemented later
              console.log("Invite friends button pressed");
            }}
          >
            <Text style={styles.buttonText}>🤝 Invite Friends for Extra Turn 🤝</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.leaderboardButton, { marginTop: 12 }]}
            onPress={() => navigation.navigate('leaderboard' as never)}
          >
            <Text style={styles.buttonText}>
              🏅 View Leaderboard 🏅
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const loadGameStatus = async () => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (userData?.gameStatus) {
      setGameStatus(userData.gameStatus);
    } else {
      // Initialize game status if it doesn't exist
      await updateDoc(userRef, {
        gameStatus: {
          practiceGamesLeft: 3,
          realGamesLeft: 3,
          lastPlayedDate: null
        }
      });
    }
  };

  const updateGameStatus = async (mode: 'practice' | 'real') => {
    if (!auth.currentUser) return;

    const newStatus = {
      ...gameStatus,
      [mode === 'practice' ? 'practiceGamesLeft' : 'realGamesLeft']: 
        mode === 'practice' ? gameStatus.practiceGamesLeft - 1 : gameStatus.realGamesLeft - 1,
      lastPlayedDate: new Date().toISOString()
    };

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      gameStatus: newStatus
    });

    setGameStatus(newStatus);
  };

  const checkGameAvailability = () => {
    if (currentMode === 'practice' && gameStatus.practiceGamesLeft <= 0) {
      Alert.alert('No Practice Games Left', 'You have used all your practice attempts.');
      return false;
    }
    if (currentMode === 'real' && gameStatus.realGamesLeft <= 0) {
      Alert.alert('No Real Games Left', 'You have used all your real game attempts.');
      return false;
    }
    return true;
  };

  if (!checkGameAvailability()) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          You have used all your {currentMode} game attempts.
          {currentMode === 'practice' ? 
            ' Try a real game!' : 
            ' Come back tomorrow for more attempts!'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        renderError(error)
      ) : (
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            onMessage={handleMessage}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => {
              setLoading(false);
              console.log("WebView loaded successfully");
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error("WebView error:", nativeEvent);
              setError(
                `Failed to connect to the game server. Error: ${nativeEvent.description || "Unknown error"}`
              );
              setLoading(false);
            }}
            renderLoading={renderLoading}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={true}
            originWhitelist={["*"]}
            allowsInlineMediaPlayback={true}
            incognito={false} // Set to true if you want each load to be fresh
            injectedJavaScript={`
              window.ReactNativeWebView = window.ReactNativeWebView || {};
              true;
            `}
            style={styles.webview}
          />
          {loading && renderLoading()}
          <View style={styles.modeSelector}>
            <Text style={styles.modeText}>
              Mode: {currentMode} ({currentMode === 'practice' ? 
                `${gameStatus.practiceGamesLeft} practice games left` : 
                `${gameStatus.realGamesLeft} real games left`})
            </Text>
            <Text style={styles.switchMode} onPress={() => {
              setCurrentMode(current => current === 'practice' ? 'real' : 'practice');
            }}>
              Switch to {currentMode === 'practice' ? 'Real' : 'Practice'} Mode
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: Colors.dark.primary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  reloadButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  reloadButtonText: {
    color: '#fff',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  logoImage: {
    width: 230,
    height: 230,
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  lockedMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  inviteButton: {
    backgroundColor: '#4CAF50', // Green color for invite button
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  leaderboardButton: {
    backgroundColor: '#FF3333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modeSelector: {
    padding: 10,
    backgroundColor: '#1A1A1A',
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  switchMode: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    textDecorationLine: 'underline',
  }
});
