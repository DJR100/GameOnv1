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
  type: "finalScores";
  scores: number[]; // Array of all three scores
  isComplete: true;
  highestScore: number; // Highest score from all three attempts
  attemptScores: {
    attempt1: number;
    attempt2: number;
    attempt3: number;
  };
  allHighScores: {
    sessionHighScore: number; // Highest score from this session
    overallHighScore: number; // All-time high score
  };
}

type GameMessage = AttemptScore | FinalScores;

export default function WebViewGame({ url, gameType }: WebViewGameProps) {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionHighScore, setSessionHighScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const navigation = useNavigation();

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
    console.log("Processing final game scores:", {
      attempts: data.attemptScores,
      highestScore: data.highestScore,
      sessionHighScore: data.allHighScores.sessionHighScore,
      overallHighScore: data.allHighScores.overallHighScore,
    });

    // Verify data integrity
    if (!data.scores || data.scores.length !== 3) {
      console.error("Invalid scores array:", data.scores);
      return;
    }

    // Preserve the original scores exactly as received
    const originalScores = [...data.scores];
    console.log("Original scores (unmodified):", originalScores);
    
    // Only sanitize to handle NaN or non-number values, not to cap
    const sanitizedScores = data.scores.map(score => (
      typeof score === 'number' && !isNaN(score) ? score : 0
    ));
    console.log("Sanitized scores (only fixing NaN):", sanitizedScores);
    
    // Verify highest score calculation
    const calculatedMax = Math.max(...sanitizedScores);
    console.log("Calculated max score:", calculatedMax, "type:", typeof calculatedMax);

    try {
      // Create the data object to save, ensuring we don't modify the scores
      const dataToSave = {
        allScores: sanitizedScores,
        attemptDetails: data.attemptScores,
        highestScore: calculatedMax,
        sessionHighScore: data.allHighScores.sessionHighScore,
        overallHighScore: data.allHighScores.overallHighScore,
        timestamp: new Date().toISOString(),
        isComplete: true,
      };
      
      // Log the exact data being sent to Firebase
      console.log("Data being sent to Firebase:", JSON.stringify(dataToSave));
      
      // Save to Firebase game stats
      await updateUserGameStatsFirebase(uid, gameType, dataToSave);
      
      // Also submit the high score to the leaderboard
      try {
        const user = auth.currentUser;
        if (user) {
          await submitScore({
            playerName: user.displayName || 'Anonymous',
            score: calculatedMax,
            gameType: gameType,
            timestamp: new Date(),
            deviceId: uid
          });
          console.log("Score submitted to leaderboard:", calculatedMax);
        }
      } catch (leaderboardError) {
        console.error("Error submitting to leaderboard:", leaderboardError);
        // Don't throw here, we still want to continue even if leaderboard submission fails
      }
      
      // Log after Firebase update
      console.log("Firebase update completed");

      // Reset state after successful save
      setAttempts([]);
      setIsComplete(true);
      setSessionHighScore(null);
      console.log("Game session saved successfully");

      // Mark game as played
      try {
        const userRef = doc(db, "users", uid);
        
        // First check if the document exists
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Update existing document
          await updateDoc(userRef, {
            [`gameStatus.${gameType}.hasPlayed`]: true,
            [`gameStatus.${gameType}.completionDate`]: new Date().toISOString(),
            [`gameStatus.${gameType}.attemptsUsed`]: 3
          });
          console.log(`Successfully marked ${gameType} as played for user ${uid}`);
        } else {
          // Document doesn't exist - create it with setDoc
          await setDoc(userRef, {
            gameStatus: {
              [gameType]: {
                hasPlayed: true,
                completionDate: new Date().toISOString(),
                attemptsUsed: 3
              }
            }
          });
          console.log(`Created new user document and marked ${gameType} as played for user ${uid}`);
        }
        
        // Set local state to reflect the change
        setHasPlayed(true);
        
      } catch (error: any) {
        console.error("Error updating play status:", error);
        // Show an error to the user
        setError(`Failed to update game status: ${error.message || 'Unknown error'}`);
      }
    } catch (saveError) {
      console.error("Error saving game stats:", saveError);
      setError("Failed to save game progress");
    }
  };

  const handleMessage = async (event: any) => {
    console.log("Raw message data:", event.nativeEvent.data);
    
    try {
      // Parse the data without any transformations
      const data = JSON.parse(event.nativeEvent.data) as GameMessage;
      console.log("Parsed data:", data);
      
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error("No user ID available - cannot process game data");
        return;
      }

      switch (data.type) {
        case "attemptScore":
          // Log the raw score to verify no capping is happening
          console.log("Raw attempt score:", data.score, "type:", typeof data.score);
          handleAttemptScore(data);
          break;

        case "finalScores":
          if (data.isComplete) {
            // Log the raw scores array to verify no capping
            console.log("Raw final scores:", data.scores, "types:", data.scores.map(s => typeof s));
            await handleFinalScores(data, uid);
          }
          break;

        default:
          console.log("Unknown message type:", data);
      }
    } catch (error) {
      console.error("Error processing game message:", error);
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webviewContainer: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.dark.background,
  },
  errorTitle: {
    color: Colors.dark.primary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  reloadButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
});
