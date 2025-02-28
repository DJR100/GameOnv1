import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getTopScores, ScoreDataWithId } from '@/services/scoreService';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [leaderboard, setLeaderboard] = useState<ScoreDataWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');

  // Fetch leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching scores for game type: shoot');
      // Fetch top scores for the "shoot" game type
      const scores = await getTopScores('shoot', 20);
      console.log('Received scores:', scores);
      setLeaderboard(scores);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitName = () => {
    // This function would be used if you want to add manual score entry from the leaderboard
    // For now, we'll just hide the input
    setShowNameInput(false);
  };

  const renderLeaderboardItem = ({ item, index }: { item: ScoreDataWithId, index: number }) => {
    const isTopThree = index < 3;
    
    // Define softer metallic colors for top 3 positions
    const getPositionColor = (position: number) => {
      switch (position) {
        case 0: return { background: '#FFD700AA', text: '#FFFFFF' }; // Brighter gold (increased opacity)
        case 1: return { background: '#E8E8E8AA', text: '#FFFFFF' }; // Brighter silver
        case 2: return { background: '#CD853FAA', text: '#FFFFFF' }; // Brighter bronze
        default: return { background: colors.card, text: colors.text };
      }
    };
    
    const positionColors = getPositionColor(index);
    
    return (
      <View style={[
        styles.leaderboardItem, 
        { backgroundColor: positionColors.background }
      ]}>
        <View style={styles.rankContainer}>
          <ThemedText style={[
            styles.rankText, 
            isTopThree && { color: positionColors.text }
          ]}>
            {index + 1}
          </ThemedText>
        </View>
        
        <View style={styles.playerInfo}>
          <ThemedText style={[
            styles.playerName,
            isTopThree && { color: positionColors.text }
          ]}>
            {item.playerName}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {new Date(item.timestamp).toLocaleDateString()}
          </ThemedText>
        </View>
        
        <ThemedText style={[
          styles.scoreText,
          isTopThree && { color: positionColors.text }
        ]}>
          {item.score}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemedView style={styles.content}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>Leaderboard</ThemedText>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: colors.secondary }]}
            onPress={fetchLeaderboardData}
          >
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ThemedView style={styles.leaderboardCard}>
          <ThemedText style={styles.subtitle}>Top Players</ThemedText>
          <ThemedText style={styles.prizeNote}>
            Top 3 players win prizes daily!
          </ThemedText>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : leaderboard.length === 0 ? (
            <ThemedText style={styles.emptyText}>No scores yet. Be the first to play!</ThemedText>
          ) : (
            <FlatList
              data={leaderboard}
              renderItem={renderLeaderboardItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.leaderboardList}
            />
          )}
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
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 45,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  leaderboardCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  leaderboardList: {
    paddingBottom: 60,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 1,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    opacity: 1,
  },
  prizeNote: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    opacity: 0.8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  nameInputContainer: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addScoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 16,
  },
}); 