import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
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
        <ThemedText style={styles.title}>GAME ON</ThemedText>
        <ThemedText style={styles.subtitle}>Select your game</ThemedText>
      </View>

      <View style={styles.gameButtonsContainer}>
        <TouchableOpacity
          style={[styles.gameButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentGame("shooter")}
        >
          <ThemedText style={styles.gameButtonText}>Retro Shooter</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameButton, { backgroundColor: colors.secondary }]}
          onPress={() => setCurrentGame("pong")}
        >
          <ThemedText style={styles.gameButtonText}>Pong</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.gameButton, { backgroundColor: colors.accent }]}
          onPress={() => setCurrentGame("scoreGenerator")}
        >
          <ThemedText style={styles.gameButtonText}>Score Generator</ThemedText>
        </TouchableOpacity>
      </View>
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
          url="https://score-generator.fly.dev" 
          gameType="scoreGenerator" 
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
      {renderGame()}
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
  },
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    opacity: 0.8,
  },
  gameButtonsContainer: {
    width: "100%",
    gap: 20,
  },
  gameButton: {
    width: "100%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  gameButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
