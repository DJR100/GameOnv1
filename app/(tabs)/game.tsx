import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
  Text,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import WebViewGame from "@/components/WebViewGame";
import ShooterGame from "@/components/ShooterGame";
import PongGame from "../historical/pong";
import HomeOverlay from "@/components/HomeOverlay";

type GameState = "menu" | "shooter" | "pong" | "scoreGenerator";

export default function GameScreen() {
  const colors = Colors["dark"];
  const [currentGame, setCurrentGame] = useState<GameState>("shooter");
  const [showHomeOverlay, setShowHomeOverlay] = useState(true);

  const renderGameMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.titleContainer}>
        <ThemedText style={styles.titleText}>GAME <Text style={{color: '#FF3333'}}>ON</Text></ThemedText>
        <ThemedText style={styles.subtitle}>Play Daily. Win Big.</ThemedText>
      </View>

      <View style={styles.howToPlayContainer}>
        <ThemedText style={styles.howToPlayTitle}>HOW TO PLAY</ThemedText>
        
        <View style={styles.instructionRow}>
          <View style={[styles.numberBubble, {backgroundColor: '#FF3333'}]}>
            <Text style={styles.numberText}>1</Text>
          </View>
          <ThemedText style={styles.instructionText}>3 Attempts to practice</ThemedText>
        </View>
        
        <View style={styles.instructionRow}>
          <View style={[styles.numberBubble, {backgroundColor: '#4CAF50'}]}>
            <Text style={styles.numberText}>2</Text>
          </View>
          <ThemedText style={styles.instructionText}>3 Attempts to set your high score</ThemedText>
        </View>
        
        <View style={styles.instructionRow}>
          <View style={[styles.numberBubble, {backgroundColor: '#2196F3'}]}>
            <Text style={styles.numberText}>3</Text>
          </View>
          <ThemedText style={styles.instructionText}>New game every 24 hours</ThemedText>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => setCurrentGame("scoreGenerator")}
      >
        <ThemedText style={styles.prizeText}>Top 3 players win Prizes Daily</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => {
    switch (currentGame) {
      case "shooter":
        return <ShooterGame onShowMenu={() => setCurrentGame("menu")} />;
      case "pong":
        return <PongGame />;
      case "scoreGenerator":
        return <WebViewGame 
          url="https://finalgame.fly.dev/" 
          gameType="levelup" 
        />;
      default:
        return renderGameMenu();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style="light" />
      <View style={styles.gameContainer}>
        {renderGame()}
      </View>
      {showHomeOverlay && currentGame === "shooter" && (
        <HomeOverlay 
          onClose={() => {
            setShowHomeOverlay(false);
            setCurrentGame("menu");
          }} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gameContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  menuContainer: {
    flex: 1,
    justifyContent: "space-between", 
    alignItems: "center",
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  titleContainer: {
    alignItems: "center",
    width: '100%',
    marginTop: 40,
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 5,
  },
  howToPlayContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF3333',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  howToPlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  numberBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 16,
    flex: 1,
  },
  playButton: {
    width: '100%',
    backgroundColor: '#FFEB3B',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  prizeText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerContainer: {
    position: "absolute",
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 10,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "white",
    marginBottom: 5,
  },
});
