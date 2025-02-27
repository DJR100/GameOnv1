import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function GameScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [gameState, setGameState] = useState({
    practiceAttemptsLeft: 3,
    liveAttemptsLeft: 3,
    currentMode: 'practice', // 'practice' or 'live'
    highScore: 0,
  });

  const handleStartGame = () => {
    // This would launch the actual game
    // For now, we'll just simulate a game result
    if (gameState.currentMode === 'practice') {
      if (gameState.practiceAttemptsLeft > 0) {
        setGameState({
          ...gameState,
          practiceAttemptsLeft: gameState.practiceAttemptsLeft - 1,
        });
      }
    } else {
      if (gameState.liveAttemptsLeft > 0) {
        // Simulate a random score between 0 and 1000
        const score = Math.floor(Math.random() * 1000);
        setGameState({
          ...gameState,
          liveAttemptsLeft: gameState.liveAttemptsLeft - 1,
          highScore: Math.max(gameState.highScore, score),
        });
      }
    }
  };

  const toggleMode = () => {
    setGameState({
      ...gameState,
      currentMode: gameState.currentMode === 'practice' ? 'live' : 'practice',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemedView style={styles.content}>
        <ThemedView style={styles.gameCard}>
          <ThemedText style={styles.gameTitle}>Today's Game</ThemedText>
          <ThemedText style={styles.gameDescription}>
            This is where the daily game will be displayed. The actual game implementation will be added later.
          </ThemedText>
          
          <View style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Mode</ThemedText>
              <ThemedText style={[
                styles.statValue, 
                { color: gameState.currentMode === 'practice' ? colors.secondary : colors.primary }
              ]}>
                {gameState.currentMode === 'practice' ? 'PRACTICE' : 'LIVE'}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Attempts Left</ThemedText>
              <ThemedText style={styles.statValue}>
                {gameState.currentMode === 'practice' 
                  ? gameState.practiceAttemptsLeft 
                  : gameState.liveAttemptsLeft}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statCard}>
              <ThemedText style={styles.statLabel}>High Score</ThemedText>
              <ThemedText style={styles.statValue}>{gameState.highScore}</ThemedText>
            </ThemedView>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={toggleMode}
            >
              <ThemedText style={styles.buttonText}>
                Switch to {gameState.currentMode === 'practice' ? 'LIVE' : 'PRACTICE'}
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                { 
                  backgroundColor: 
                    (gameState.currentMode === 'practice' && gameState.practiceAttemptsLeft > 0) ||
                    (gameState.currentMode === 'live' && gameState.liveAttemptsLeft > 0)
                      ? colors.primary
                      : '#888888'
                }
              ]}
              onPress={handleStartGame}
              disabled={
                (gameState.currentMode === 'practice' && gameState.practiceAttemptsLeft === 0) ||
                (gameState.currentMode === 'live' && gameState.liveAttemptsLeft === 0)
              }
            >
              <ThemedText style={styles.buttonText}>
                {gameState.currentMode === 'practice' 
                  ? `Start Practice Game (${gameState.practiceAttemptsLeft} left)` 
                  : `Start Live Game (${gameState.liveAttemptsLeft} left)`}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  gameCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginTop: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    paddingVertical: 5,
  },
  gameDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 