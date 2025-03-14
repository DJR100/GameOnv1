import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { getTopScores, ScoreDataWithId } from '@/services/scoreService';
import { Ionicons } from '@expo/vector-icons';

export default function LeaderboardScreen() {
  const colors = Colors['dark']; // Force dark theme
  
  const [leaderboard, setLeaderboard] = useState<ScoreDataWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hardcode the game type to Chroma Snake
  const gameType = 'chromasnake';

  // Fetch leaderboard data when component mounts
  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching scores for Chroma Snake`);
      // Get scores specifically for chromasnake
      const scores = await getTopScores(gameType, 50);
      
      // Transform the data
      const transformedScores = scores.map(score => ({
        ...score,
        timestamp: new Date(score.timestamp),
        playerName: score.playerName || 'Anonymous',
        score: Number(score.score)
      }));
      
      console.log('Received scores:', transformedScores);
      setLeaderboard(transformedScores);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: ScoreDataWithId, index: number }) => {
    const isTopThree = index < 3;
    
    // Define medal colors for top 3 positions
    const getPositionColor = (position: number) => {
      switch (position) {
        case 0: return { background: '#FFD700AA', text: '#FFFFFF' }; // Gold
        case 1: return { background: '#E8E8E8AA', text: '#FFFFFF' }; // Silver
        case 2: return { background: '#CD853FAA', text: '#FFFFFF' }; // Bronze
        default: return { background: '#333333', text: '#FFFFFF' };
      }
    };
    
    const positionColors = getPositionColor(index);
    
    // Get rank display (medals for top 3, numbers for others)
    const getRankDisplay = (position: number) => {
      switch (position) {
        case 0: return "🥇";
        case 1: return "🥈";
        case 2: return "🥉";
        default: return `${position + 1}`;
      }
    };
    
    return (
      <View style={[
        styles.leaderboardItem, 
        { backgroundColor: positionColors.background }
      ]}>
        <View style={styles.rankContainer}>
          <ThemedText style={[
            styles.rankText, 
            { color: positionColors.text }
          ]}>
            {getRankDisplay(index)}
          </ThemedText>
        </View>
        
        <View style={styles.playerInfo}>
          <ThemedText style={[
            styles.playerName,
            { color: positionColors.text }
          ]}>
            {item.playerName}
          </ThemedText>
        </View>
        
        <View style={styles.scoreContainer}>
          <ThemedText style={[
            styles.scoreText,
            { color: positionColors.text }
          ]}>
            {item.score}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <ThemedText style={styles.subtitle}>Leaderboard</ThemedText>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchLeaderboardData}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3333" />
          <ThemedText style={styles.loadingText}>Loading leaderboard...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboardData}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No scores yet. Be the first to play today's game!</ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 16,
  },
  headerLogo: {
    width: 100,
    height: 50,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 10,
    backgroundColor: '#FF3333',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 16,
    color: '#FF3333',
    textAlign: 'center',
  },
  retryButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF3333',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  leaderboardItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    minHeight: 50,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLogo: {
    width: 120,
    height: 60,
    marginBottom: 16,
  },
}); 