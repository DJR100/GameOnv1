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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';

// Define a type for historical games
interface HistoricalGame {
  id: string;
  title: string;
  date: string;
  coverImage: {
    url: string | null;
    setBy: string | null;  // Username of the player who set the image
    setAt: string | null;  // Timestamp when the image was set
  };
  route: string;
  firstPlacePlayer: string;
  isWebGame?: boolean;
  webUrl?: string;
}

// This would normally come from an API or database
const mockHistoricalGames: HistoricalGame[] = [
  {
    id: '1',
    title: 'Classic Pong',
    date: '12/20/2023',
    coverImage: {
      url: null,
      setBy: null,
      setAt: null
    },
    route: '/historical/pong',
    firstPlacePlayer: 'JohnDoe',
  },
  {
    id: '2',
    title: 'Snake',
    date: '03/15/2024',
    coverImage: {
      url: null,
      setBy: null,
      setAt: null
    },
    route: '/historical/snake',
    firstPlacePlayer: 'Player',
  },
  {
    id: '3',
    title: 'Minesweeper',
    date: '03/20/2024',
    coverImage: {
      url: null,
      setBy: null,
      setAt: null
    },
    route: '/historical/minesweeper',
    firstPlacePlayer: 'MineExpert',
    isWebGame: true,
    webUrl: 'https://6x37lmo-djr_100-8082.exp.direct/'
  },
];

export default function HistoricalGamesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors['dark']; // Force dark theme

  const navigateToGame = (game: HistoricalGame) => {
    if (game.isWebGame && game.webUrl) {
      router.push({
        pathname: '/webgame',
        params: { url: game.webUrl, title: game.title }
      } as any);
    } else {
      router.push(game.route as any);
    }
  };

  const renderGameItem = ({ item }: { item: HistoricalGame }) => (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: colors.card }]}
      onPress={() => navigateToGame(item)}
    >
      <View style={[styles.gameImageContainer, { backgroundColor: colors.primary + '15' }]}>
        {item.coverImage.url ? (
          <Image source={{ uri: item.coverImage.url }} style={styles.gameImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="game-controller" size={48} color={colors.primary} />
            {item.firstPlacePlayer && (
              <Text style={[styles.placeholderText, { color: colors.primary }]} numberOfLines={2}>
                Waiting for cover image from winner
              </Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.gameInfo}>
        <Text style={[styles.gameTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.gameDate, { color: colors.text + 'CC' }]}>{item.date}</Text>
        <Text style={[styles.gameDescription, { color: colors.text }]} numberOfLines={2}>
          1st Place - {item.firstPlacePlayer}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.text }]}>
            Game<Text style={{ color: colors.primary }}>On</Text>
          </Text>
        </View>

        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>Game History</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Play Previous Games</ThemedText>
          </View>
        </View>

        <View style={[styles.promoCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.promoItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="time" size={28} color="#fff" />
            </View>
            <View style={styles.promoTextContainer}>
              <Text style={[styles.promoTextTitle, { color: colors.text }]}>
                Timeless Classics
              </Text>
              <Text style={[styles.promoTextSubtitle, { color: colors.text + 'CC' }]}>
                Replay your favorite games anytime!
              </Text>
            </View>
          </View>
        </View>

        {mockHistoricalGames.length > 0 ? (
          <FlatList
            data={mockHistoricalGames}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="game-controller" size={32} color="#fff" />
            </View>
            <ThemedText style={styles.emptyTitle}>No Games Yet</ThemedText>
            <ThemedText style={styles.emptyText}>
              Play today's game to unlock historical replays!
            </ThemedText>
            <TouchableOpacity
              style={[styles.playButton, { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8,
              }]}
              onPress={() => router.push('/game' as any)}
            >
              <Text style={styles.playButtonText}>Play Today's Game</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    marginTop: 16,
    zIndex: 1,
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  headerContent: {
    flex: 1,
    paddingRight: 16,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    includeFontPadding: false,
    paddingTop: 8,
    zIndex: 2,
  },
  headerSubtitle: {
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
  listContent: {
    paddingTop: 8,
  },
  gameCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameImageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    marginBottom: 24,
  },
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  imageCredit: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
}); 