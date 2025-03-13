import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { auth } from '@/firebase/config';
import { updateUserGameStatsFirebase } from '@/app/utils/gameStats';

interface WebViewGameProps {
  url: string;
  gameType: string;
}

interface AttemptScore {
  type: 'attemptScore';
  attemptNumber: number;     // 1, 2, or 3
  score: number;            // The score for this attempt
  attemptsLeft: number;     // How many attempts remain
  allScores: number[];      // Array of all scores so far
  isHighScore: boolean;     // Whether this score beat the overall high score
}

interface FinalScores {
  type: 'finalScores';
  scores: number[];         // Array of all three scores
  isComplete: true;
  highestScore: number;     // Highest score from all three attempts
  attemptScores: {
    attempt1: number;
    attempt2: number;
    attempt3: number;
  };
  allHighScores: {
    sessionHighScore: number;  // Highest score from this session
    overallHighScore: number;  // All-time high score
  };
}

type GameMessage = AttemptScore | FinalScores;

export default function WebViewGame({ url, gameType }: WebViewGameProps) {
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionHighScore, setSessionHighScore] = useState<number | null>(null);

  const handleAttemptScore = (data: AttemptScore) => {
    console.log(`Attempt ${data.attemptNumber} completed:`, {
      score: data.score,
      attemptsLeft: data.attemptsLeft,
      allScores: data.allScores,
      isHighScore: data.isHighScore
    });
    
    // Update attempts array with the new score
    setAttempts(data.allScores);
    
    // Update session high score if this is a new high score
    if (data.isHighScore) {
      setSessionHighScore(data.score);
    }
  };

  const handleFinalScores = async (data: FinalScores, uid: string) => {
    console.log('Processing final game scores:', {
      attempts: data.attemptScores,
      highestScore: data.highestScore,
      sessionHighScore: data.allHighScores.sessionHighScore,
      overallHighScore: data.allHighScores.overallHighScore
    });

    // Verify data integrity
    if (!data.scores || data.scores.length !== 3) {
      console.error('Invalid scores array:', data.scores);
      return;
    }

    // Verify highest score calculation
    const calculatedMax = Math.max(...data.scores);
    if (calculatedMax !== data.highestScore) {
      console.warn('Highest score mismatch. Using calculated value:', calculatedMax);
    }

    // Save complete game session to Firebase
    await updateUserGameStatsFirebase(uid, gameType, {
      allScores: data.scores,
      attemptDetails: data.attemptScores,
      highestScore: calculatedMax,
      sessionHighScore: data.allHighScores.sessionHighScore,
      overallHighScore: data.allHighScores.overallHighScore,
      timestamp: new Date().toISOString(),
      isComplete: true
    });

    // Reset state after successful save
    setAttempts([]);
    setIsComplete(true);
    setSessionHighScore(null);
    console.log('Game session saved successfully');
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as GameMessage;
      const uid = auth.currentUser?.uid;

      if (!uid) {
        console.error('No user ID available - cannot process game data');
        return;
      }

      console.log('Received WebView message:', data);

      switch (data.type) {
        case 'attemptScore':
          handleAttemptScore(data);
          break;

        case 'finalScores':
          if (data.isComplete) {
            await handleFinalScores(data, uid);
          }
          break;

        default:
          console.log('Unknown message type:', data);
      }
    } catch (error) {
      console.error('Error processing game message:', error);
    }
  };

  return (
    <View style={styles.webviewContainer}>
      <WebView
        source={{ uri: url }}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          console.warn('WebView error:', syntheticEvent.nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('WebView loaded successfully');
        }}
        javaScriptEnabled={true}
        injectedJavaScript={`
          window.ReactNativeWebView = window.ReactNativeWebView || {};
          true;
        `}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webviewContainer: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});
