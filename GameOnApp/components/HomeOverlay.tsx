import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

interface HomeOverlayProps {
  onClose: () => void;
}

export default function HomeOverlay({ onClose }: HomeOverlayProps) {
  const colors = Colors['dark'];

  return (
    <View style={styles.overlayContainer}>
      <ThemedView style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {/* Retro Game Title */}
          <View style={styles.retroTitleContainer}>
            <ThemedText style={styles.retroLogoText}>GAME</ThemedText>
            <ThemedText style={[styles.retroLogoText, { color: colors.primary }]}>ON</ThemedText>
          </View>
          <ThemedText style={[styles.retroTagline, styles.retroTaglineBold]}>Play Daily. Win Big.</ThemedText>
        </View>

        {/* Game Rules */}
        <ThemedView style={styles.rulesCard}>
          <ThemedText style={styles.retroRulesTitle}>HOW TO PLAY</ThemedText>
          
          <View style={styles.rulesContainer}>
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
          </View>
        </ThemedView>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <ThemedText style={styles.retroCtaText}>
            Top 3 players win Prizes Daily
          </ThemedText>
        </View>

        {/* Play Button - Moved outside CTA container */}
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.secondary }]}
          onPress={onClose}
        >
          <ThemedText style={styles.playButtonText}>PLAY</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 1000,
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
    marginTop: Platform.OS === 'ios' ? 80 : 50,
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
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 1,
    paddingHorizontal: 5,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    borderWidth: 0,
    borderColor: 'transparent',
    marginVertical: 10,
    includeFontPadding: true,
    textTransform: 'uppercase',
    lineHeight: 50,
  },
  retroTagline: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    opacity: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    color: '#FFFFFF',
  },
  retroTaglineBold: {
    fontWeight: 'bold',
  },
  rulesCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 4,
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.card,
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
  rulesContainer: {
    alignItems: 'center',
    width: '100%',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    justifyContent: 'center',
  },
  ruleBullet: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    textAlign: 'left',
  },
  ctaContainer: {
    alignItems: 'center',
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
    backgroundColor: Colors.dark.highlight,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    marginBottom: 15,
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
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    backgroundColor: Colors.dark.secondary,
  },
  playButtonText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
}); 