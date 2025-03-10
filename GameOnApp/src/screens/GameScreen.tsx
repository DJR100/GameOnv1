import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Svg, { Circle } from 'react-native-svg';
import ScoreSubmissionModal from '@/components/ScoreSubmissionModal';
import HomeOverlay from '@/components/HomeOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { updateUserGameStats } from '../utils/gameStats';
import { auth } from '@/firebase/config';

const { width, height } = Dimensions.get('window');
const PLAYER_RADIUS = 50;
const SPAWN_RADIUS = Math.min(width, height) * 0.4;
const ENEMY_SIZE = 30;
const BULLET_SPEED = 15;
const BULLET_SIZE = 5;

const INITIAL_SPAWN_INTERVAL = 1000;
const MIN_SPAWN_INTERVAL = 300;
const SPAWN_INTERVAL_DECREASE_RATE = 100;
const DIFFICULTY_INCREASE_INTERVAL = 15000;
const MAX_ENEMIES_INITIAL = 15;
const MAX_ENEMIES_INCREASE_RATE = 5;
const RELOAD_TIME = 1000;

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

type GameState = 'ready' | 'playing' | 'paused' | 'game_over';

export default function GameScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors['dark'];
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [rotation, setRotation] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [reloading, setReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showHomeOverlay, setShowHomeOverlay] = useState(true);
  
  // Spawn manager state
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);
  const [maxEnemies, setMaxEnemies] = useState(MAX_ENEMIES_INITIAL);
  
  // Animation refs
  const healthBarWidth = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const reloadAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const reloadAnimValue = useRef(new Animated.Value(0)).current;
  
  // Game timers
  const enemySpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const enemyMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bulletMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ammoRegenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reloadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => gameState === 'playing',
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: (evt) => {
      if (gameState === 'playing') {
        const tapX = evt.nativeEvent.pageX;
        const tapY = evt.nativeEvent.pageY;
        const centerX = width / 2;
        const centerY = height / 2;
        const targetX = tapX - centerX;
        const targetY = tapY - centerY;
        const angleRad = Math.atan2(targetY, targetX);
        const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
        setRotation(angleDeg);
        setTargetPosition({ x: targetX, y: targetY });
        shootBullet(targetX, targetY);
      }
    },
    onPanResponderMove: () => {},
    onPanResponderRelease: () => {},
  });

  const handleCloseHomeOverlay = async () => {
    console.log('Closing overlay...');
    try {
      await AsyncStorage.setItem('hasSeenHomeOverlay', 'true');
      setShowHomeOverlay(false);
      console.log('Overlay closed and state saved');
    } catch (error) {
      console.error('Error saving overlay state:', error);
    }
  };

  const shootBullet = (dirX: number, dirY: number) => {
    if (gameState !== 'playing' || reloading) return;
    
    if (ammo <= 0) {
      startReload();
      return;
    }
    
    setAmmo(prev => prev - 1);
    
    const distance = Math.sqrt(dirX * dirX + dirY * dirY);
    
    if (distance < 0.001) {
      setBullets(prev => [
        ...prev,
        {
          id: Date.now(),
          x: 0,
          y: 0,
          dx: 1,
          dy: 0,
          distance: 0,
        },
      ]);
    } else {
      const normalizedDx = dirX / distance;
      const normalizedDy = dirY / distance;
      
      setBullets(prev => [
        ...prev,
        {
          id: Date.now(),
          x: 0,
          y: 0,
          dx: normalizedDx,
          dy: normalizedDy,
          distance: 0,
        },
      ]);
    }
    
    Vibration.vibrate(50);
  };

  const startReload = () => {
    setReloading(true);
    setReloadProgress(0);
    
    if (reloadAnimation.current) {
      reloadAnimation.current.stop();
    }
    
    reloadAnimValue.setValue(0);
    
    reloadAnimation.current = Animated.timing(reloadAnimValue, {
      toValue: 100,
      duration: RELOAD_TIME,
      useNativeDriver: false,
      easing: Easing.linear,
    });
    
    reloadAnimation.current.start(() => {
      setReloading(false);
      setAmmo(30);
      setReloadProgress(0);
    });
    
    if (reloadIntervalRef.current) {
      clearInterval(reloadIntervalRef.current);
    }
    
    const listener = reloadAnimValue.addListener(({ value }) => {
      setReloadProgress(Math.min(value, 100));
    });
    
    setTimeout(() => {
      reloadAnimValue.removeListener(listener);
      if (reloadIntervalRef.current) {
        clearInterval(reloadIntervalRef.current);
        reloadIntervalRef.current = null;
      }
    }, RELOAD_TIME + 100);
  };

  // Initialize game and clear overlay state
  useEffect(() => {
    const init = async () => {
      try {
        await AsyncStorage.removeItem('hasSeenHomeOverlay');
        console.log('Cleared overlay state');
      } catch (error) {
        console.error('Error clearing overlay state:', error);
      }
    };
    
    init();
    return () => {
      clearAllTimers();
    };
  }, []);

  // Effect for game state changes
  useEffect(() => {
    if (gameState === 'playing') {
      startGameTimers();
    } else {
      clearAllTimers();
    }
  }, [gameState]);

  // Effect for health changes
  useEffect(() => {
    Animated.timing(healthBarWidth, {
      toValue: health,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    if (health <= 0 && gameState === 'playing') {
      setGameState('game_over');
      Vibration.vibrate(500);
      
      if (score > highScore) {
        setHighScore(score);
      }

      const user = auth.currentUser;
      if (user) {
        updateUserGameStats(user.uid, score)
          .catch((error: unknown) => console.error('Error updating game stats:', error));
      }
    }
  }, [health]);

  // Check if we should show the home overlay
  useEffect(() => {
    const checkOverlay = async () => {
      try {
        console.log('Checking overlay state...');
        const hasSeenOverlay = await AsyncStorage.getItem('hasSeenHomeOverlay');
        console.log('hasSeenOverlay value:', hasSeenOverlay);
        setShowHomeOverlay(hasSeenOverlay !== 'true');
      } catch (error) {
        console.error('Error checking overlay state:', error);
      }
    };
    
    checkOverlay();
  }, []);

  // Clear all game timers
  const clearAllTimers = () => {
    if (enemySpawnTimerRef.current) clearInterval(enemySpawnTimerRef.current);
    if (enemyMoveTimerRef.current) clearInterval(enemyMoveTimerRef.current);
    if (bulletMoveTimerRef.current) clearInterval(bulletMoveTimerRef.current);
    if (ammoRegenTimerRef.current) clearInterval(ammoRegenTimerRef.current);
    if (reloadIntervalRef.current) clearInterval(reloadIntervalRef.current);
    if (difficultyTimerRef.current) clearInterval(difficultyTimerRef.current);
    
    if (reloadAnimation.current) {
      reloadAnimation.current.stop();
    }
  };

  // Start all game timers
  const startGameTimers = () => {
    enemySpawnTimerRef.current = setInterval(() => {
      if (enemies.length < maxEnemies) {
        spawnEnemy();
      }
    }, spawnInterval);
    
    enemyMoveTimerRef.current = setInterval(moveEnemies, 50);
    bulletMoveTimerRef.current = setInterval(moveBullets, 20);
    
    ammoRegenTimerRef.current = setInterval(() => {
      if (!reloading && ammo < 30) {
        startReload();
      }
    }, 5000);
    
    difficultyTimerRef.current = setInterval(() => {
      increaseDifficulty();
    }, DIFFICULTY_INCREASE_INTERVAL);
  };

  // Spawn a new enemy
  const spawnEnemy = () => {
    if (gameState !== 'playing') return;
    
    const angle = Math.random() * 360;
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad) * SPAWN_RADIUS;
    const y = Math.sin(angleRad) * SPAWN_RADIUS;
    
    let enemyType = Math.random();
    let color = 'red';
    let hits = 1;
    
    if (enemyType > 0.7) {
      color = 'white';
      hits = 3;
    } else if (enemyType > 0.4) {
      color = 'blue';
      hits = 2;
    }
    
    const baseSpeed = 2;
    let speedMultiplier = color === 'red' ? 1.5 : color === 'blue' ? 1.25 : 1.2;
    
    setEnemies(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        x,
        y,
        angle,
        color,
        hits,
        speed: baseSpeed * speedMultiplier,
        scale: new Animated.Value(0),
        isNew: true,
      },
    ]);
  };

  // Move all enemies
  const moveEnemies = () => {
    if (gameState !== 'playing') return;
    
    setEnemies(prevEnemies =>
      prevEnemies
        .map(enemy => {
          if (enemy.isNew) {
            Animated.timing(enemy.scale, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
            
            return { ...enemy, isNew: false };
          }
          
          const angleRad = (enemy.angle * Math.PI) / 180;
          const newX = enemy.x - Math.cos(angleRad) * enemy.speed;
          const newY = enemy.y - Math.sin(angleRad) * enemy.speed;
          const distanceToCenter = Math.sqrt(newX ** 2 + newY ** 2);

          if (distanceToCenter < PLAYER_RADIUS) {
            const damage = enemy.color === 'white' ? 30 : 
                          enemy.color === 'blue' ? 20 : 10;
            setHealth(prev => Math.max(prev - damage, 0));
            Vibration.vibrate(100);
            return null;
          }
          
          return { ...enemy, x: newX, y: newY };
        })
        .filter(Boolean) as Enemy[]
    );
  };

  // Move all bullets and check collisions
  const moveBullets = () => {
    if (gameState !== 'playing') return;
    
    setBullets(prevBullets =>
      prevBullets
        .map(bullet => {
          const newX = bullet.x + bullet.dx * BULLET_SPEED;
          const newY = bullet.y + bullet.dy * BULLET_SPEED;
          const newDistance = Math.sqrt(newX * newX + newY * newY);
          
          if (newDistance > SPAWN_RADIUS * 1.5) {
            return null;
          }
          
          return {
            ...bullet,
            x: newX,
            y: newY,
            distance: newDistance,
          };
        })
        .filter(Boolean) as Bullet[]
    );
    
    checkBulletCollisions();
  };

  // Check for collisions between bullets and enemies
  const checkBulletCollisions = () => {
    setBullets(prevBullets => {
      const remainingBullets = [...prevBullets];
      
      setEnemies(prevEnemies => {
        let newEnemies = [...prevEnemies];
        let scoreIncrease = 0;
        
        for (let i = remainingBullets.length - 1; i >= 0; i--) {
          const bullet = remainingBullets[i];
          let bulletHit = false;
          
          for (let j = newEnemies.length - 1; j >= 0; j--) {
            const enemy = newEnemies[j];
            const distanceToEnemy = Math.sqrt(
              (enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2
            );
            
            const hitboxSize = ENEMY_SIZE * 0.8;
            if (distanceToEnemy < hitboxSize) {
              bulletHit = true;
              const newHits = enemy.hits - 1;
              
              if (newHits <= 0) {
                newEnemies.splice(j, 1);
                const pointValue = enemy.color === 'white' ? 30 : 
                                  enemy.color === 'blue' ? 20 : 10;
                scoreIncrease += pointValue;
              } else {
                newEnemies[j] = { ...enemy, hits: newHits };
              }
              
              break;
            }
          }
          
          if (bulletHit) {
            remainingBullets.splice(i, 1);
          }
        }
        
        if (scoreIncrease > 0) {
          setScore(prev => prev + scoreIncrease);
        }
        
        return newEnemies;
      });
      
      return remainingBullets;
    });
  };

  // Start a new game
  const startGame = () => {
    setEnemies([]);
    setBullets([]);
    setScore(0);
    setHealth(100);
    setAmmo(30);
    setReloading(false);
    setRotation(0);
    
    setDifficultyLevel(1);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setMaxEnemies(MAX_ENEMIES_INITIAL);
    
    fadeAnim.setValue(0);
    
    setGameState('playing');
  };

  // Pause/resume game
  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  // Return to home screen
  const goToHome = () => {
    clearAllTimers();
    router.navigate('/leaderboard');
  };

  // Increase game difficulty
  const increaseDifficulty = () => {
    if (gameState !== 'playing') return;
    
    setDifficultyLevel(prev => prev + 1);
    setMaxEnemies(prev => prev + MAX_ENEMIES_INCREASE_RATE);
    
    setSpawnInterval(prev => {
      const newInterval = prev - SPAWN_INTERVAL_DECREASE_RATE;
      return Math.max(newInterval, MIN_SPAWN_INTERVAL);
    });
    
    fadeAnim.setValue(0.7);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    Vibration.vibrate(200);
  };

  // Render crosshair
  const renderCrosshair = () => (
    <View style={styles.crosshairContainer}>
      <View style={styles.crosshairHorizontal} />
      <View style={styles.crosshairVertical} />
    </View>
  );

  // Render reload indicator
  const renderReloadIndicator = () => {
    if (!reloading) return null;
    
    const radius = PLAYER_RADIUS / 2;
    const circumference = 2 * Math.PI * radius;
    const fillAmount = (reloadProgress / 100) * circumference;
    const dashArray = `${fillAmount} ${circumference}`;
    
    return (
      <View style={styles.reloadIndicatorContainer}>
        <Svg width={PLAYER_RADIUS} height={PLAYER_RADIUS} viewBox={`0 0 ${PLAYER_RADIUS} ${PLAYER_RADIUS}`}>
          <Circle
            cx={PLAYER_RADIUS / 2}
            cy={PLAYER_RADIUS / 2}
            r={radius}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            fill="transparent"
          />
          
          <Circle
            cx={PLAYER_RADIUS / 2}
            cy={PLAYER_RADIUS / 2}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={3}
            strokeDasharray={dashArray}
            strokeDashoffset={0}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90, ${PLAYER_RADIUS / 2}, ${PLAYER_RADIUS / 2})`}
          />
        </Svg>
        
        <Text style={styles.reloadText}>
          {Math.round(reloadProgress)}%
        </Text>
      </View>
    );
  };

  // Render HUD (Heads Up Display)
  const renderHUD = () => (
    <View style={styles.hudContainer}>
      <View style={styles.scoreContainer}>
        <ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
        <ThemedText style={styles.scoreText}>High Score: {highScore}</ThemedText>
      </View>
      
      <View style={styles.levelContainer}>
        <ThemedText style={styles.levelText}>Level: {difficultyLevel}</ThemedText>
      </View>
      
      <View style={styles.healthBarContainer}>
        <ThemedText style={styles.healthText}>Health</ThemedText>
        <View style={styles.healthBarBackground}>
          <Animated.View 
            style={[
              styles.healthBarFill, 
              { 
                width: healthBarWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%']
                }),
                backgroundColor: healthBarWidth.interpolate({
                  inputRange: [0, 30, 60, 100],
                  outputRange: ['#ff0000', '#ff8800', '#ffff00', '#00ff00']
                })
              }
            ]} 
          />
        </View>
      </View>
      
      <View style={styles.ammoContainer}>
        <ThemedText style={styles.ammoText}>
          {reloading ? 'RELOADING...' : `Ammo: ${ammo}/30`}
        </ThemedText>
      </View>
      
      {gameState === 'playing' && (
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseButtonText}>II</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render game over screen
  const renderGameOver = () => (
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Game Over!</Text>
        <Text style={[styles.modalText, { color: colors.text }]}>Score: {score}</Text>
        <Text style={[styles.modalText, { color: colors.text }]}>High Score: {Math.max(score, highScore)}</Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4CAF50', marginBottom: 15 }]}
          onPress={() => setShowScoreModal(true)}
        >
          <Text style={styles.buttonText}>SUBMIT SCORE</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#FF4B4B' }]}
            onPress={startGame}
          >
            <Ionicons name="reload" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: '#FF4B4B' }]}
            onPress={goToHome}
          >
            <Ionicons name="trophy" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render pause screen
  const renderPauseScreen = () => (
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>Game Paused</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={togglePause}
          >
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary }]}
            onPress={goToHome}
          >
            <Text style={styles.buttonText}>Quit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render start screen
  const renderStartScreen = () => (
    <View style={styles.modalContainer}>
      <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>RETRO SHOOTER</Text>
        <Text style={[styles.modalText, { color: colors.text }]}>
          Tap the screen to shoot enemies
          {'\n'}1s reload time - watch out!
          {'\n\n'}Red - 1 hit
          {'\n'}Blue - 2 hit
          {'\n'}White - 3 hit
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={startGame}
        >
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <View style={styles.gameEnvironment} {...panResponder.panHandlers}>
        {/* Game background - retro grid pattern */}
        <View style={[styles.gameBackground, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f0f0f0' }]}>
          {/* Grid lines */}
          <View style={styles.gridContainer}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View 
                key={`h-${i}`} 
                style={[
                  styles.gridLineHorizontal, 
                  { 
                    top: i * 40, 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                  }
                ]} 
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <View 
                key={`v-${i}`} 
                style={[
                  styles.gridLineVertical, 
                  { 
                    left: i * 40, 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                  }
                ]} 
              />
            ))}
          </View>
        </View>
        
        {/* Level transition flash */}
        <Animated.View 
          style={[
            styles.levelFlash,
            { opacity: fadeAnim, pointerEvents: 'none' }
          ]} 
        />
        
        {/* Player base - visible circle around the crosshair */}
        {gameState === 'playing' && !reloading && (
          <View 
            style={[
              styles.playerBase,
              {
                backgroundColor: 'transparent',
                borderColor: colors.secondary,
              }
            ]}
          />
        )}
        
        {/* Reload indicator - replaces player base during reload */}
        {gameState === 'playing' && reloading && renderReloadIndicator()}
        
        {/* Bullets - pixelated style */}
        {bullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              {
                left: width / 2 + bullet.x - BULLET_SIZE / 2,
                top: height / 2 + bullet.y - BULLET_SIZE / 2,
                backgroundColor: colors.secondary,
                borderWidth: 1,
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              },
            ]}
          />
        ))}
        
        {/* Enemies - pixelated style */}
        {enemies.map((enemy) => (
          <Animated.View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                backgroundColor: enemy.color === 'red' ? '#ff0000' : 
                                enemy.color === 'blue' ? '#0066ff' : 
                                enemy.color === 'white' ? '#ffffff' : '#ff0000',
                left: width / 2 + enemy.x - ENEMY_SIZE / 2,
                top: height / 2 + enemy.y - ENEMY_SIZE / 2,
                transform: [{ scale: enemy.scale }],
                borderWidth: 2,
                borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              },
            ]}
          >
            {/* Pixelated details */}
            <View style={[styles.enemyPixel, { top: 5, left: 5 }]} />
            <View style={[styles.enemyPixel, { top: 5, right: 5 }]} />
            <View style={[styles.enemyPixel, { bottom: 5, left: 5 }]} />
            <View style={[styles.enemyPixel, { bottom: 5, right: 5 }]} />
          </Animated.View>
        ))}
        
        {/* Crosshair - centered */}
        {gameState === 'playing' && renderCrosshair()}
        
        {/* HUD */}
        {(gameState === 'playing' || gameState === 'paused') && renderHUD()}
        
        {/* Game state screens */}
        {gameState === 'ready' && renderStartScreen()}
        {gameState === 'paused' && renderPauseScreen()}
        {gameState === 'game_over' && renderGameOver()}
      </View>
      
      {/* Home Overlay */}
      {showHomeOverlay && (
        <HomeOverlay onClose={handleCloseHomeOverlay} />
      )}

      {/* Score Submission Modal */}
      <ScoreSubmissionModal
        visible={showScoreModal}
        score={score}
        onClose={() => setShowScoreModal(false)}
        gameType="shoot"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameEnvironment: {
    flex: 1,
    overflow: 'hidden',
  },
  gameBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  levelFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    pointerEvents: 'none',
  },
  enemy: {
    position: 'absolute',
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyPixel: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: 0,
  },
  playerBase: {
    position: 'absolute',
    top: height / 2 - PLAYER_RADIUS / 2,
    left: width / 2 - PLAYER_RADIUS / 2,
    width: PLAYER_RADIUS,
    height: PLAYER_RADIUS,
    borderRadius: PLAYER_RADIUS / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  crosshairContainer: {
    position: 'absolute',
    top: height / 2 - 15,
    left: width / 2 - 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  healthBarContainer: {
    marginBottom: 10,
  },
  healthText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  healthBarBackground: {
    height: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 0,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
  },
  ammoContainer: {
    alignItems: 'flex-start',
  },
  ammoText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  pauseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingBottom: 100,
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 0,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginVertical: 5,
    width: '100%',
  },
  iconButton: {
    padding: 8,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    width: 42,
    height: 42,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  reloadIndicatorContainer: {
    position: 'absolute',
    top: height / 2 - PLAYER_RADIUS / 2,
    left: width / 2 - PLAYER_RADIUS / 2,
    width: PLAYER_RADIUS,
    height: PLAYER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  reloadText: {
    position: 'absolute',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  aimIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
}); 