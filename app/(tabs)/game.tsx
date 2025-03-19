import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
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
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.signInText}>Sign-in First to Submit High Score</ThemedText>
      </View>

      <View style={styles.gameButtonsContainer}>
        {/* 
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
        */}

        <TouchableOpacity
          style={[styles.gameButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => setCurrentGame("scoreGenerator")}
        >
          <ThemedText style={[styles.gameButtonText, { color: 'white' }]}>LevelUp</ThemedText>
          <ThemedText style={[styles.clickToPlayText, { color: 'white' }]}>Click Here to Play</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.footerContainer, { backgroundColor: '#FF3333' }]}>
        <ThemedText style={styles.footerText}>$5 Entry Fee</ThemedText>
        <ThemedText style={styles.footerText}>🥇 Winner Takes All</ThemedText>
        <ThemedText style={styles.footerText}>Current Prize Pool: $100</ThemedText>
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
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 0,
    zIndex: 10,
  },
  logo: {
    width: 500,
    height: 220,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    opacity: 0.8,
    marginTop: 10,
  },
  signInText: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    opacity: 0.8,
    marginTop: 10,
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
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  clickToPlayText: {
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 5,
    opacity: 0.8,
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
