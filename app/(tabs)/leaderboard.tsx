import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getTopScores, ScoreDataWithId } from '@/services/scoreService';
import { Ionicons } from '@expo/vector-icons';

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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.text }]}>
            Game<Text style={{ color: colors.primary, fontSize: 42 }}>On</Text>
          </Text>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.titleContent}>
            <ThemedText style={styles.title}>Leaderboard</ThemedText>
            <ThemedText style={styles.subtitle}>Today's Top Players</ThemedText>
          </View>
          <TouchableOpacity 
            style={[styles.refreshButton, { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 8,
            }]}
            onPress={fetchLeaderboardData}
          >
            <ThemedText style={styles.buttonText}>Refresh</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ThemedView style={[styles.leaderboardCard, { backgroundColor: colors.card }]}>
          <View style={[styles.promoCard, { backgroundColor: colors.primary + '15' }]}>
            <View style={styles.promoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="trophy" size={28} color="#fff" />
              </View>
              <View style={styles.promoTextContainer}>
                <ThemedText style={[styles.promoTextTitle, { color: colors.text }]}>
                  Daily Prizes
                </ThemedText>
                <ThemedText style={[styles.promoTextSubtitle, { color: colors.text + 'CC' }]}>
                  Top 3 players win exclusive rewards!
                </ThemedText>
              </View>
            </View>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="game-controller" size={32} color="#fff" />
              </View>
              <ThemedText style={styles.emptyTitle}>No Scores Yet</ThemedText>
              <ThemedText style={styles.emptyText}>Be the first to play and set a high score!</ThemedText>
            </View>
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
  logoContainer: {
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 50 : 30,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  titleContent: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    includeFontPadding: false,
    paddingTop: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  promoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTextTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  promoTextSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 16,
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
  loader: {
    marginVertical: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginVertical: 20,
  },
}); 