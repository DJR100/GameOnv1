import { StyleSheet, Image, View, Platform } from 'react-native';
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
          {/* Retro Game Title */}
          <View style={styles.retroTitleContainer}>
            <ThemedText style={styles.retroLogoText}>GAME</ThemedText>
            <ThemedText style={[styles.retroLogoText, { color: colors.primary }]}>ON</ThemedText>
          </View>
          <ThemedText style={styles.retroTagline}>Play Daily. Win Big.</ThemedText>
        </View>

        {/* Game Rules */}
        <ThemedView style={styles.rulesCard}>
          <ThemedText style={styles.retroRulesTitle}>HOW TO PLAY</ThemedText>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.bulletText}>1</ThemedText>
            </View>
            <ThemedText style={styles.retroRuleText}>3 Attempts to practice</ThemedText>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.secondary }]}>
              <ThemedText style={styles.bulletText}>2</ThemedText>
            </View>
            <ThemedText style={styles.retroRuleText}>3 Attempts to set your high score</ThemedText>
          </View>
          
          <View style={styles.ruleItem}>
            <View style={[styles.ruleBullet, { backgroundColor: colors.accent }]}>
              <ThemedText style={styles.bulletText}>3</ThemedText>
            </View>
            <ThemedText style={styles.retroRuleText}>New game every 24 hours</ThemedText>
          </View>
      </ThemedView>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <ThemedText style={styles.retroCtaText}>
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
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    // Added top margin to position the logo where the title used to be
    marginTop: 25,
  },
  retroTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 15,
  },
  retroLogoText: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 2,
    // Create pixelated effect with multiple shadows
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 1,
    // Ensure text is not cut off
    paddingHorizontal: 5,
    paddingVertical: 8,
    // Pixelated font style
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    // Add a border to create a more blocky appearance
    borderWidth: 0,
    borderColor: 'transparent',
    // Ensure the text has enough room
    marginVertical: 10,
    // Ensure the text is not cut off at the top
    includeFontPadding: true,
    textTransform: 'uppercase',
    lineHeight: 50,
  },
  retroTagline: {
    fontSize: 18,
    marginTop: 5,
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
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
    // Add pixelated border
    borderWidth: 4,
    borderColor: Colors.dark.primary,
  },
  retroRulesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ruleBullet: {
    width: 30,
    height: 30,
    borderRadius: 8, // More pixelated look with less rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    // Add pixelated border
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  bulletText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retroRuleText: {
    fontSize: 16,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  ctaContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8, // More pixelated look with less rounded corners
    backgroundColor: Colors.dark.highlight,
    // Add pixelated border
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%',
  },
  retroCtaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
