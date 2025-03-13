import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { auth } from "@/firebase/config";
import { updateUserGameStatsFirebase } from "@/app/utils/gameStats";
import { Colors } from "@/constants/Colors";

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

    // Verify highest score calculation
    const calculatedMax = Math.max(...data.scores);
    if (calculatedMax !== data.highestScore) {
      console.warn(
        "Highest score mismatch. Using calculated value:",
        calculatedMax
      );
    }

    try {
      // Save complete game session to Firebase
      await updateUserGameStatsFirebase(uid, gameType, {
        allScores: data.scores,
        attemptDetails: data.attemptScores,
        highestScore: calculatedMax,
        sessionHighScore: data.allHighScores.sessionHighScore,
        overallHighScore: data.allHighScores.overallHighScore,
        timestamp: new Date().toISOString(),
        isComplete: true,
      });

      // Reset state after successful save
      setAttempts([]);
      setIsComplete(true);
      setSessionHighScore(null);
      console.log("Game session saved successfully");
    } catch (saveError) {
      console.error("Error saving game stats:", saveError);
      setError("Failed to save game progress");
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as GameMessage;
      const uid = auth.currentUser?.uid;

      if (!uid) {
        console.error("No user ID available - cannot process game data");
        return;
      }

      console.log("Received WebView message:", data);

      switch (data.type) {
        case "attemptScore":
          handleAttemptScore(data);
          break;

        case "finalScores":
          if (data.isComplete) {
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
});
