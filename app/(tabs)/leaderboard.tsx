import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define types for our data
interface Player {
  id: string;
  name: string;
  score: number;
}

// Mock data for the leaderboard
const MOCK_LEADERBOARD: Player[] = [
  { id: '1', name: 'Player1', score: 950 },
  { id: '2', name: 'Player2', score: 875 },
  { id: '3', name: 'Player3', score: 820 },
  { id: '4', name: 'Player4', score: 750 },
  { id: '5', name: 'Player5', score: 720 },
  { id: '6', name: 'Player6', score: 690 },
  { id: '7', name: 'Player7', score: 650 },
  { id: '8', name: 'Player8', score: 600 },
  { id: '9', name: 'Player9', score: 580 },
  { id: '10', name: 'Player10', score: 550 },
];

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [leaderboard, setLeaderboard] = useState<Player[]>(MOCK_LEADERBOARD);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  
  const handleSubmitName = () => {
    if (playerName.trim() === '') return;
    
    // Check if name already exists
    if (leaderboard.some(player => player.name === playerName)) {
      alert('This name is already taken. Please choose another one.');
      return;
    }
    
    // In a real app, this would submit the score to a backend
    // For now, we'll just add a mock entry
    const newPlayer: Player = {
      id: (leaderboard.length + 1).toString(),
      name: playerName,
      score: Math.floor(Math.random() * 500) + 500, // Random score between 500-1000
    };
    
    const newLeaderboard = [...leaderboard, newPlayer].sort((a, b) => b.score - a.score);
    setLeaderboard(newLeaderboard);
    setShowNameInput(false);
    setPlayerName('');
  };

  const renderLeaderboardItem = ({ item, index }: { item: Player; index: number }) => {
    // Determine if this player is in the top 3 (prize winner)
    const isPrizeWinner = index < 3;
    
    return (
      <ThemedView 
        style={[
          styles.leaderboardItem, 
          { backgroundColor: isPrizeWinner ? colors.card : 'transparent' }
        ]}
      >
        <View style={[styles.rankContainer, { backgroundColor: getMedalColor(index) }]}>
          <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
        </View>
        
        <ThemedText style={styles.playerName}>{item.name}</ThemedText>
        
        <ThemedText style={styles.scoreText}>{item.score}</ThemedText>
        
        {isPrizeWinner && (
          <View style={styles.prizeIndicator}>
            <ThemedText style={styles.prizeText}>$</ThemedText>
          </View>
        )}
      </ThemedView>
    );
  };
  
  // Helper function to get medal colors
  const getMedalColor = (index: number): string => {
    switch (index) {
      case 0: return '#FFD700'; // Gold
      case 1: return '#C0C0C0'; // Silver
      case 2: return '#CD7F32'; // Bronze
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Leaderboard</ThemedText>
        
        <ThemedView style={styles.leaderboardCard}>
          <ThemedText style={styles.subtitle}>Today's Top Players</ThemedText>
          
          <FlatList
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.leaderboardList}
          />
          
          {showNameInput ? (
            <View style={styles.nameInputContainer}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.icon}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={15}
              />
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmitName}
              >
                <ThemedText style={styles.buttonText}>Submit</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.addScoreButton, { backgroundColor: colors.accent }]}
              onPress={() => setShowNameInput(true)}
            >
              <ThemedText style={styles.buttonText}>Add Your Score</ThemedText>
            </TouchableOpacity>
          )}
          
          <ThemedText style={styles.prizeNote}>
            Top 3 players win cash prizes daily!
          </ThemedText>
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  leaderboardCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  leaderboardList: {
    paddingVertical: 10,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontWeight: 'bold',
    color: '#000',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  prizeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeText: {
    fontWeight: 'bold',
    color: '#000',
  },
  nameInputContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  nameInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  submitButton: {
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addScoreButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  prizeNote: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    opacity: 0.7,
  },
}); 