import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// Define a type for historical games
interface HistoricalGame {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string | null;
  route: string;
}

// This would normally come from an API or database
const mockHistoricalGames: HistoricalGame[] = [
  // Empty for now - will be populated as games are created
];

export default function HistoricalGamesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const navigateToGame = (game: HistoricalGame) => {
    // Navigate to the selected game
    router.push(game.route as any);
  };

  const renderGameItem = ({ item }: { item: HistoricalGame }) => (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToGame(item)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.gameImage} />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            {item.title.charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.gameInfo}>
        <Text style={[styles.gameTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.gameDate, { color: colors.text }]}>{item.date}</Text>
        <Text style={[styles.gameDescription, { color: colors.text }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Historical Games</ThemedText>
      </ThemedView>

      {mockHistoricalGames.length > 0 ? (
        <FlatList
          data={mockHistoricalGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('@/assets/images/splash-icon.png')} 
            style={styles.emptyImage}
          />
          <ThemedText style={styles.emptyTitle}>No Historical Games Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            As you play daily games, they will appear here for you to replay anytime.
          </ThemedText>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/game' as any)}
          >
            <Text style={styles.playButtonText}>Play Today's Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  gameCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameImage: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  gameInfo: {
    flex: 1,
    padding: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  gameDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 22,
  },
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 