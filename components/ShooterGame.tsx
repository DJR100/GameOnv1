import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Animated,
  Vibration,
  SafeAreaView,
  Image,
  Platform,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Svg, { Circle } from "react-native-svg";
import ScoreSubmissionModal from "./ScoreSubmissionModal";
import HomeOverlay from "@/components/HomeOverlay";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import { updateUserGameStats } from "../app/utils/gameStats";
import { auth } from "@/firebase/config";

const { width, height } = Dimensions.get("window");

// Game constants
const PLAYER_RADIUS = 50;
const SPAWN_RADIUS = Math.min(width, height) * 0.4;
const ENEMY_SIZE = 30;
const BULLET_SPEED = 15;
const BULLET_SIZE = 5;

// Spawn manager constants
const INITIAL_SPAWN_INTERVAL = 1000;
const MIN_SPAWN_INTERVAL = 300;
const SPAWN_INTERVAL_DECREASE_RATE = 100;
const DIFFICULTY_INCREASE_INTERVAL = 15000;
const MAX_ENEMIES_INITIAL = 15;
const MAX_ENEMIES_INCREASE_RATE = 5;
const RELOAD_TIME = 1000;

// Game object interfaces
interface Enemy {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
  hits: number;
  speed: number;
  scale: Animated.Value;
  isNew: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  distance: number;
}

type GameState = "ready" | "playing" | "paused" | "game_over";

export default function ShooterGame() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showHomeOverlay, setShowHomeOverlay] = useState(true);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [practiceMode, setPracticeMode] = useState(true);
  const [practiceAttemptsLeft, setPracticeAttemptsLeft] = useState(3);

  // Game objects
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [playerAngle, setPlayerAngle] = useState(0);
  const [canShoot, setCanShoot] = useState(true);
  const [maxEnemies, setMaxEnemies] = useState(MAX_ENEMIES_INITIAL);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);

  // Animation and game loop
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const difficultyTimerRef = useRef<NodeJS.Timeout>();
  const enemySpawnTimerRef = useRef<NodeJS.Timeout>();
  const reloadTimerRef = useRef<NodeJS.Timeout>();
  const frameRef = useRef<number>(0);

  // Touch handling
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const panResponder = usePanResponder();

  // Initialize game
  useEffect(() => {
    loadHighScore();
    return () => cleanup();
  }, []);

  // Game loop effect
  useEffect(() => {
    if (gameState === "playing") {
      startGameLoop();
      startEnemySpawner();
      startDifficultyTimer();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [gameState]);

  // Load high score from storage
  const loadHighScore = async () => {
    try {
      const savedScore = await AsyncStorage.getItem("highScore");
      if (savedScore) {
        setHighScore(parseInt(savedScore));
      }
    } catch (error) {
      console.error("Error loading high score:", error);
    }
  };

  // Clean up timers and animations
  const cleanup = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (difficultyTimerRef.current) clearInterval(difficultyTimerRef.current);
    if (enemySpawnTimerRef.current) clearInterval(enemySpawnTimerRef.current);
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    cancelAnimationFrame(frameRef.current);
  };

  // Pan responder setup for touch controls
  function usePanResponder() {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touch = evt.nativeEvent;
        lastTouchRef.current = { x: touch.pageX, y: touch.pageY };
        handleTouch(touch.pageX, touch.pageY);
      },
      onPanResponderMove: (evt) => {
        const touch = evt.nativeEvent;
        lastTouchRef.current = { x: touch.pageX, y: touch.pageY };
        handleTouch(touch.pageX, touch.pageY);
      },
    });
  }

  // Handle touch input
  const handleTouch = (touchX: number, touchY: number) => {
    if (gameState !== "playing") return;

    const centerX = width / 2;
    const centerY = height / 2;
    const angle = Math.atan2(touchY - centerY, touchX - centerX);
    setPlayerAngle(angle);

    if (canShoot) {
      shoot(angle);
      setCanShoot(false);
      Vibration.vibrate(50);

      reloadTimerRef.current = setTimeout(() => {
        setCanShoot(true);
      }, RELOAD_TIME);
    }
  };

  // Game logic functions
  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setEnemies([]);
    setBullets([]);
    setMaxEnemies(MAX_ENEMIES_INITIAL);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setShowHomeOverlay(false);
  };

  const shoot = (angle: number) => {
    const dx = Math.cos(angle) * BULLET_SPEED;
    const dy = Math.sin(angle) * BULLET_SPEED;

    setBullets((prev) => [
      ...prev,
      {
        id: Date.now(),
        x: width / 2,
        y: height / 2,
        dx,
        dy,
        distance: 0,
      },
    ]);
  };

  const spawnEnemy = () => {
    if (enemies.length >= maxEnemies) return;

    const angle = Math.random() * Math.PI * 2;
    const x = width / 2 + Math.cos(angle) * SPAWN_RADIUS;
    const y = height / 2 + Math.sin(angle) * SPAWN_RADIUS;

    const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
    const newEnemy: Enemy = {
      id: Date.now(),
      x,
      y,
      angle: Math.atan2(height / 2 - y, width / 2 - x),
      color: colors[Math.floor(Math.random() * colors.length)],
      hits: 0,
      speed: 1 + Math.random(),
      scale: new Animated.Value(0),
      isNew: true,
    };

    setEnemies((prev) => [...prev, newEnemy]);

    // Animate enemy spawn
    Animated.spring(newEnemy.scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 5,
    }).start(() => {
      setEnemies((prev) =>
        prev.map((e) => (e.id === newEnemy.id ? { ...e, isNew: false } : e))
      );
    });
  };

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      updateGame();
    }, 16); // ~60 FPS
  };

  const startEnemySpawner = () => {
    enemySpawnTimerRef.current = setInterval(spawnEnemy, spawnInterval);
  };

  const startDifficultyTimer = () => {
    difficultyTimerRef.current = setInterval(() => {
      setSpawnInterval((prev) =>
        Math.max(MIN_SPAWN_INTERVAL, prev - SPAWN_INTERVAL_DECREASE_RATE)
      );
      setMaxEnemies((prev) => prev + MAX_ENEMIES_INCREASE_RATE);
    }, DIFFICULTY_INCREASE_INTERVAL);
  };

  const updateGame = () => {
    updateBullets();
    updateEnemies();
    checkCollisions();
    checkGameOver();
  };

  const updateBullets = () => {
    setBullets((prev) =>
      prev
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.dx,
          y: bullet.y + bullet.dy,
          distance:
            bullet.distance +
            Math.sqrt(bullet.dx * bullet.dx + bullet.dy * bullet.dy),
        }))
        .filter((bullet) => bullet.distance < Math.max(width, height))
    );
  };

  const updateEnemies = () => {
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.isNew) return enemy;

        const dx = width / 2 - enemy.x;
        const dy = height / 2 - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return enemy;

        const speed = enemy.speed * (1 + enemy.hits * 0.2);
        return {
          ...enemy,
          x: enemy.x + (dx / distance) * speed,
          y: enemy.y + (dy / distance) * speed,
          angle: Math.atan2(dy, dx),
        };
      })
    );
  };

  const checkCollisions = () => {
    let updatedEnemies = [...enemies];
    let updatedBullets = [...bullets];
    let scoreIncrease = 0;

    // Check bullet-enemy collisions
    bullets.forEach((bullet) => {
      enemies.forEach((enemy) => {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ENEMY_SIZE / 2) {
          updatedEnemies = updatedEnemies.filter((e) => e.id !== enemy.id);
          updatedBullets = updatedBullets.filter((b) => b.id !== bullet.id);
          scoreIncrease += 10 * (enemy.hits + 1);
        }
      });
    });

    setBullets(updatedBullets);
    setEnemies(updatedEnemies);
    setScore((prev) => prev + scoreIncrease);
  };

  const checkGameOver = () => {
    enemies.forEach((enemy) => {
      const dx = width / 2 - enemy.x;
      const dy = height / 2 - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < PLAYER_RADIUS) {
        handleGameOver();
      }
    });
  };

  const handleGameOver = async () => {
    setGameState("game_over");

    if (score > highScore) {
      setHighScore(score);
      await AsyncStorage.setItem("highScore", score.toString());
    }

    if (!practiceMode) {
      setAttemptsLeft((prev) => prev - 1);
      if (attemptsLeft <= 1) {
        setShowScoreModal(true);
      }
    } else {
      setPracticeAttemptsLeft((prev) => prev - 1);
    }
  };

  // Render functions
  const renderPlayer = () => (
    <View style={styles.playerContainer}>
      <Svg width={PLAYER_RADIUS * 2} height={PLAYER_RADIUS * 2}>
        <Circle
          cx={PLAYER_RADIUS}
          cy={PLAYER_RADIUS}
          r={PLAYER_RADIUS - 5}
          stroke={colors.primary}
          strokeWidth="2"
          fill="transparent"
        />
      </Svg>
      <View
        style={[
          styles.playerBarrel,
          {
            transform: [{ rotate: `${playerAngle}rad` }],
            backgroundColor: canShoot ? colors.primary : colors.border,
          },
        ]}
      />
    </View>
  );

  const renderBullets = () =>
    bullets.map((bullet) => (
      <View
        key={bullet.id}
        style={[
          styles.bullet,
          {
            left: bullet.x - BULLET_SIZE / 2,
            top: bullet.y - BULLET_SIZE / 2,
            width: BULLET_SIZE,
            height: BULLET_SIZE,
            backgroundColor: colors.primary,
          },
        ]}
      />
    ));

  const renderEnemies = () =>
    enemies.map((enemy) => (
      <Animated.View
        key={enemy.id}
        style={[
          styles.enemy,
          {
            left: enemy.x - ENEMY_SIZE / 2,
            top: enemy.y - ENEMY_SIZE / 2,
            width: ENEMY_SIZE,
            height: ENEMY_SIZE,
            backgroundColor: enemy.color,
            transform: [
              { rotate: `${enemy.angle}rad` },
              { scale: enemy.scale },
            ],
          },
        ]}
      />
    ));

  const renderScore = () => (
    <View style={styles.scoreContainer}>
      <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
      <ThemedText style={styles.highScoreText}>Best: {highScore}</ThemedText>
    </View>
  );

  const renderGameOverScreen = () => (
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>
          Game Over!
        </Text>
        <Text style={[styles.scoreText, { color: colors.text }]}>
          Score: {score}
        </Text>
        <Text style={[styles.highScoreText, { color: colors.text }]}>
          Best: {highScore}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: "#4CAF50", marginBottom: 15 },
          ]}
          onPress={() => setShowScoreModal(true)}
        >
          <Text style={styles.buttonText}>SUBMIT SCORE</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "#FF4B4B" }]}
            onPress={startGame}
          >
            <Ionicons name="reload" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "#FF4B4B" }]}
            onPress={() => router.back()}
          >
            <Ionicons name="home" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.gameContainer} {...panResponder.panHandlers}>
        {renderPlayer()}
        {renderBullets()}
        {renderEnemies()}
        {renderScore()}

        {gameState === "game_over" && renderGameOverScreen()}

        {showHomeOverlay && (
          <HomeOverlay onClose={() => setShowHomeOverlay(false)} />
        )}
      </View>

      <ScoreSubmissionModal
        visible={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        score={score}
        gameType="shoot"
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gameContainer: {
    flex: 1,
  },
  playerContainer: {
    position: "absolute",
    left: width / 2 - PLAYER_RADIUS,
    top: height / 2 - PLAYER_RADIUS,
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playerBarrel: {
    position: "absolute",
    width: 4,
    height: PLAYER_RADIUS,
    borderRadius: 2,
  },
  bullet: {
    position: "absolute",
    borderRadius: BULLET_SIZE / 2,
  },
  enemy: {
    position: "absolute",
    borderRadius: ENEMY_SIZE / 2,
  },
  scoreContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  highScoreText: {
    fontSize: 16,
    color: "#888",
  },
  modalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
