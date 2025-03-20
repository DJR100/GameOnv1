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
  const [currentGame, setCurrentGame] = useState<GameState>("menu");
  const [showHomeOverlay, setShowHomeOverlay] = useState(false);

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
        <ThemedText style={styles.footerText}>Daily Tournament</ThemedText>
        <ThemedText style={styles.footerText}>🥇 Top 3 Win Daily Prizes</ThemedText>
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
    justifyContent: "flex-start",
    alignItems: "center",
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  titleContainer: {
    alignItems: "center",
    width: '100%',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  signInText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 5,
  },
  gameButtonsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  gameButton: {
    width: '100%',
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
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "white",
    marginBottom: 5,
  },
});
