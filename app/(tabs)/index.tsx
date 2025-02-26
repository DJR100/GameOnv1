import { StyleSheet, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ThemedView style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <ThemedText style={styles.logoText}>GameOn</ThemedText>
          <ThemedText style={styles.tagline}>Play Daily. Win Big.</ThemedText>
        </View>

        {/* Game Rules */}
        <ThemedView style={styles.rulesCard}>
          <ThemedText style={styles.rulesTitle}>HOW TO PLAY</ThemedText>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.bulletText}>1</ThemedText>
            </View>
            <ThemedText style={styles.ruleText}>3 Attempts to practice</ThemedText>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.secondary }]}>
              <ThemedText style={styles.bulletText}>2</ThemedText>
            </View>
            <ThemedText style={styles.ruleText}>3 Attempts to set your high score</ThemedText>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.accent }]}>
              <ThemedText style={styles.bulletText}>3</ThemedText>
            </View>
            <ThemedText style={styles.ruleText}>New game every 24 hours</ThemedText>
          </View>
        </ThemedView>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <ThemedText style={styles.ctaText}>
            Top 3 players win cash prizes daily!
          </ThemedText>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: Colors.dark.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  tagline: {
    fontSize: 18,
    marginTop: 10,
    opacity: 0.8,
  },
  rulesCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  rulesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ruleBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  bulletText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ruleText: {
    fontSize: 16,
    flex: 1,
  },
  ctaContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.dark.highlight,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
});
