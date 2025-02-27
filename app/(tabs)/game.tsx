// App.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Text,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { GameLoop } from 'react-native-game-engine';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define types for our game objects
interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

interface Paddle {
  x: number;
  width: number;
  height: number;
}

// Define game states
type GameState = 'ready' | 'playing' | 'attempt_end' | 'game_over';

// Add a new state to track if the ball is in play
type BallState = 'on_paddle' | 'in_play';

// Define collision side type
type CollisionSide = 'left' | 'right' | 'top' | 'bottom' | null;

// Define attempt result type
interface AttemptResult {
  score: number;
  time: number;
  success: boolean;
}

// Define tutorial steps
type TutorialStep = 
  | 'welcome'
  | 'controls'
  | 'gameplay'
  | 'ready';

const GameScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('ready');
  const [ballState, setBallState] = useState<BallState>('on_paddle');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [attemptResults, setAttemptResults] = useState<AttemptResult[]>([]);
  const [currentAttemptResult, setCurrentAttemptResult] = useState<AttemptResult | null>(null);
  
  const [ball, setBall] = useState<Ball>({
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - 100,
    dx: 10,
    dy: -10,
    radius: 10,
  });
  
  const [paddle, setPaddle] = useState<Paddle>({
    x: SCREEN_WIDTH / 2 - 50,
    width: 100,
    height: 20,
  });
  
  const [blocks, setBlocks] = useState<Block[]>(
    Array.from({ length: 20 }, (_, i) => ({
      x: (i % 5) * 80 + 20,
      y: Math.floor(i / 5) * 40 + 50,
      width: 60,
      height: 30,
      active: true,
    }))
  );
  
  const [score, setScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<any>(null);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>('welcome');
  const [paddleMoved, setPaddleMoved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize or reset the game
  const initializeGame = () => {
    // Initialize paddle first
    const paddleWidth = 100;
    const paddleX = SCREEN_WIDTH / 2 - paddleWidth / 2;
    
    setPaddle({
      x: paddleX,
      width: paddleWidth,
      height: 30,
    });
    
    // Calculate paddle position
    const paddleY = SCREEN_HEIGHT - (Platform.OS === 'ios' ? 170 : 90);
    
    // Place ball on paddle - position just above the paddle
    setBall({
      x: SCREEN_WIDTH / 2,
      y: paddleY - 10, // Position right above the paddle
      dx: 0, // No initial movement
      dy: 0, // No initial movement
      radius: 10,
    });
    
    // Adjust brick positioning to ensure all are visible on screen
    const brickWidth = 60;
    const brickHeight = 30;
    const bricksPerRow = 5;
    const rowCount = 4;
    const horizontalPadding = 10;
    const verticalPadding = 50;
    
    // Calculate the total width needed for all bricks in a row
    const totalBrickWidth = bricksPerRow * brickWidth;
    // Calculate the horizontal spacing between bricks
    const horizontalSpacing = (SCREEN_WIDTH - (2 * horizontalPadding) - totalBrickWidth) / (bricksPerRow - 1);
    
    setBlocks(
      Array.from({ length: bricksPerRow * rowCount }, (_, i) => {
        const row = Math.floor(i / bricksPerRow);
        const col = i % bricksPerRow;
        return {
          x: horizontalPadding + col * (brickWidth + horizontalSpacing),
          y: verticalPadding + row * (brickHeight + 10),
          width: brickWidth,
          height: brickHeight,
          active: true,
        };
      })
    );
    
    setScore(0);
    setTimer(0);
    setIsTimerRunning(false);
    setGameState('ready');
    setBallState('on_paddle');
  };

  // Start a new attempt
  const startAttempt = () => {
    initializeGame();
    setGameState('playing');
    // Timer starts when ball is launched, not when game starts
  };

  // Launch the ball from the paddle
  const launchBall = () => {
    if (gameState === 'playing' && ballState === 'on_paddle') {
      setBall(prev => ({
        ...prev,
        dx: 7.5,
        dy: -7.5,
      }));
      setBallState('in_play');
      setIsTimerRunning(true); // Start timer when ball is launched
    }
  };

  // End the current attempt
  const endAttempt = (success: boolean) => {
    setIsTimerRunning(false);
    
    // Save the attempt result
    const result: AttemptResult = {
      score,
      time: timer,
      success,
    };
    
    setCurrentAttemptResult(result);
    setAttemptResults(prev => [...prev, result]);
    
    // Calculate the new attempts left value
    const newAttemptsLeft = attemptsLeft - 1;
    
    // Update attempts left
    setAttemptsLeft(newAttemptsLeft);
    
    // Set game state based on the new attempts left value
    if (newAttemptsLeft <= 0) {
      setGameState('game_over');
    } else {
      setGameState('attempt_end');
    }
  };

  // Move to the next attempt
  const nextAttempt = () => {
    setCurrentAttempt(prev => prev + 1);
    startAttempt();
  };

  // Reset the game completely
  const resetGame = () => {
    setGameState('ready');
    setAttemptsLeft(3);
    setCurrentAttempt(1);
    setAttemptResults([]);
    setBallState('on_paddle');
    initializeGame();
  };

  // Return to home screen
  const goToHome = () => {
    // Reset game state to ensure modal is closed
    resetGame();
    
    // Navigate to home page
    router.navigate('/');
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Move to the next tutorial step
  const nextTutorialStep = () => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change step
      switch (tutorialStep) {
        case 'welcome':
          setTutorialStep('controls');
          break;
        case 'controls':
          // Allow manual progression even if paddle hasn't been moved
          setPaddleMoved(true); // Mark as moved when Next is clicked
          setTutorialStep('gameplay');
          break;
        case 'gameplay':
          setTutorialStep('ready');
          break;
        case 'ready':
          setShowTutorial(false);
          break;
      }
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Skip tutorial
  const skipTutorial = () => {
    setShowTutorial(false);
  };

  // Effect to fade in the tutorial on first render
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Paddle movement
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      // Allow paddle movement during tutorial or when game is playing
      if (gameState === 'playing' || showTutorial) {
        setPaddle(prev => {
          const newX = Math.max(0, Math.min(SCREEN_WIDTH - prev.width, gesture.moveX - prev.width / 2));
          
          // If ball is on paddle, move it with the paddle
          if (ballState === 'on_paddle' && gameState === 'playing') {
            setBall(prevBall => ({
              ...prevBall,
              x: newX + prev.width / 2, // Center ball on paddle
              y: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 170 : 90) - 10, // Keep ball above paddle
            }));
          }
          
          // For tutorial - detect paddle movement
          if (showTutorial && tutorialStep === 'controls' && !paddleMoved) {
            if (Math.abs(newX - prev.x) > 20) { // Reduced from 50px to 20px for easier detection
              setPaddleMoved(true);
              setTimeout(nextTutorialStep, 500); // Move to next step after a short delay
            }
          }
          
          return {
        ...prev,
            x: newX,
          };
        });
      }
    },
    onPanResponderRelease: () => {
      // Launch ball when player releases touch if ball is still on paddle
      if (gameState === 'playing' && ballState === 'on_paddle') {
        launchBall();
      }
    },
  });

  // Helper function to determine collision side
  const getCollisionSide = (ball: Ball, block: Block): CollisionSide => {
    // Calculate the center of the ball and block
    const ballCenterX = ball.x;
    const ballCenterY = ball.y;
    const blockCenterX = block.x + block.width / 2;
    const blockCenterY = block.y + block.height / 2;
    
    // Calculate the distance between centers
    const dx = ballCenterX - blockCenterX;
    const dy = ballCenterY - blockCenterY;
    
    // Calculate the minimum distance to separate along each axis
    const minDistanceX = ball.radius + block.width / 2;
    const minDistanceY = ball.radius + block.height / 2;
    
    // Calculate the depth of penetration for each axis
    const depthX = minDistanceX - Math.abs(dx);
    const depthY = minDistanceY - Math.abs(dy);
    
    // Determine collision side based on penetration depth
    if (depthX < depthY) {
      // Horizontal collision (left or right)
      return dx > 0 ? 'right' : 'left';
    } else {
      // Vertical collision (top or bottom)
      return dy > 0 ? 'bottom' : 'top';
    }
  };

  // Check if all blocks are destroyed
  const areAllBlocksDestroyed = (): boolean => {
    return blocks.every(block => !block.active);
  };

  // Game loop
  const updateHandler = () => {
    if (gameState !== 'playing') return;
    
    // If ball is on paddle, don't update its position in the game loop
    if (ballState === 'on_paddle') return;
    
    setBall(prev => {
      let newX = prev.x + prev.dx;
      let newY = prev.y + prev.dy;
      let newDx = prev.dx;
      let newDy = prev.dy;

      // Wall collisions
      if (newX <= prev.radius || newX >= SCREEN_WIDTH - prev.radius) {
        newDx = -newDx;
      }
      if (newY <= prev.radius) {
        newDy = -newDy;
      }

      // Paddle collision
      if (
        newY + prev.radius >= SCREEN_HEIGHT - (Platform.OS === 'ios' ? 170 : 90) &&
        newY + prev.radius <= SCREEN_HEIGHT - (Platform.OS === 'ios' ? 140 : 60) &&
        newX >= paddle.x &&
        newX <= paddle.x + paddle.width
      ) {
        // Improved paddle physics - mirror the angle of attack
        // Calculate where on the paddle the ball hit (0 to 1)
        const hitPosition = (newX - paddle.x) / paddle.width;
        
        // Base reflection - mirror the incoming angle
        newDy = -newDy;
        
        // Apply a slight horizontal adjustment based on where the ball hit the paddle
        // This gives the player some control while maintaining realistic physics
        const paddleInfluence = 5; // How much the paddle position affects horizontal velocity
        const hitPositionNormalized = hitPosition * 2 - 1; // Convert from 0-1 to -1 to 1
        
        // Adjust horizontal velocity based on hit position while preserving speed
        const currentSpeed = Math.sqrt(newDx * newDx + newDy * newDy);
        newDx += hitPositionNormalized * paddleInfluence;
        
        // Normalize to maintain consistent speed
        const newSpeed = Math.sqrt(newDx * newDx + newDy * newDy);
        newDx = (newDx / newSpeed) * currentSpeed;
        newDy = (newDy / newSpeed) * currentSpeed;
      }

      // Block collisions
      let collisionOccurred = false;
      let collisionBlock: Block | null = null;
      let collisionSide: CollisionSide = null;

      // First, detect if there's a collision with any block
      blocks.forEach(block => {
          if (
            block.active &&
            newX + prev.radius >= block.x &&
            newX - prev.radius <= block.x + block.width &&
            newY + prev.radius >= block.y &&
            newY - prev.radius <= block.y + block.height
          ) {
          collisionOccurred = true;
          collisionBlock = block;
          collisionSide = getCollisionSide(
            { x: newX, y: newY, radius: prev.radius, dx: newDx, dy: newDy },
            block
          );
        }
      });

      // If a collision occurred, handle it
      if (collisionOccurred && collisionBlock && collisionSide) {
        // Adjust ball trajectory based on collision side
        if (collisionSide === 'left' || collisionSide === 'right') {
          newDx = -newDx; // Reverse horizontal direction
        } else if (collisionSide === 'top' || collisionSide === 'bottom') {
          newDy = -newDy; // Reverse vertical direction
        }

        // Now remove the block after calculating the new trajectory
        setBlocks(prevBlocks => {
          const updatedBlocks = prevBlocks.map(block => {
            if (block === collisionBlock) {
            block.active = false;
            setScore(s => s + 10);
          }
          return block;
        });
          
          // Check if all blocks are destroyed after this collision
          if (updatedBlocks.every(block => !block.active)) {
            // All blocks destroyed - end the attempt with success
            setTimeout(() => endAttempt(true), 0);
          }
        
        return updatedBlocks;
      });
      }

      // Game over check - ball fell below the paddle
      if (newY >= SCREEN_HEIGHT) {
        // End the attempt with failure
        setTimeout(() => endAttempt(false), 0);
        
        // Return the current ball position to avoid further updates
        return prev;
      }

      return {
        ...prev,
        x: newX,
        y: newY,
        dx: newDx,
        dy: newDy,
      };
    });
  };

  // Get the best score and time from all attempts
  const getBestResults = () => {
    if (attemptResults.length === 0) return { bestScore: 0, bestTime: 0 };
    
    const bestScore = Math.max(...attemptResults.map(result => result.score));
    
    // Find the fastest successful attempt, or the fastest attempt if none were successful
    const successfulAttempts = attemptResults.filter(result => result.success);
    const fastestAttempt = successfulAttempts.length > 0
      ? Math.min(...successfulAttempts.map(result => result.time))
      : Math.min(...attemptResults.map(result => result.time));
    
    return { bestScore, bestTime: fastestAttempt };
  };

  // Initialize the game on first render
  useEffect(() => {
    // Reset all game state
    setAttemptsLeft(3);
    setCurrentAttempt(1);
    setAttemptResults([]);
    initializeGame();
  }, []);

  // Render tutorial content based on current step
  const renderTutorialContent = () => {
    switch (tutorialStep) {
      case 'welcome':
        return (
          <>
            <Text style={[styles.tutorialTitle, { color: colors.text }]}>Welcome to Pong!</Text>
            <Text style={[styles.tutorialText, { color: colors.text }]}>
              Break all the bricks to win! You have 3 attempts.
            </Text>
          </>
        );
      case 'controls':
        return (
          <>
            <Text style={[styles.tutorialTitle, { color: colors.text }]}>Controls</Text>
            <Text style={[styles.tutorialText, { color: colors.text }]}>
              Drag to move the paddle. Release to launch the ball.
              {paddleMoved ? '\n\nGreat job!' : '\n\nTry moving the paddle now!'}
            </Text>
          </>
        );
      case 'gameplay':
        return (
          <>
            <Text style={[styles.tutorialTitle, { color: colors.text }]}>Gameplay</Text>
            <Text style={[styles.tutorialText, { color: colors.text }]}>
              • Break bricks to score points (10 each)
              {'\n'}• Keep the ball in play
              {'\n'}• Timer tracks your speed
              {'\n'}• Complete in 3 attempts
            </Text>
          </>
        );
      case 'ready':
        return (
          <>
            <Text style={[styles.tutorialTitle, { color: colors.text }]}>Ready?</Text>
            <Text style={[styles.tutorialText, { color: colors.text }]}>
              Click "Start Game" to play!
            </Text>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GameLoop ref={gameLoopRef} style={styles.game} onUpdate={updateHandler}>
        {/* Header with Score, Attempts, and Timer */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={styles.headerItem}>
            <Text style={[styles.headerText, { color: colors.text }]}>Score: {score}</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={[styles.headerText, { color: colors.text }]}>Attempt: {currentAttempt}/3</Text>
          </View>
          <View style={styles.headerItem}>
            <Text style={[styles.headerText, { color: colors.text }]}>Time: {formatTime(timer)}</Text>
          </View>
        </View>

        {/* Blocks */}
        {blocks.map((block, index) => 
          block.active && (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          )
        )}

        {/* Ball - show when playing */}
        {gameState === 'playing' && (
        <View
          style={{
            position: 'absolute',
            left: ball.x - ball.radius,
            top: ball.y - ball.radius,
            width: ball.radius * 2,
            height: ball.radius * 2,
            borderRadius: ball.radius,
              backgroundColor: colors.accent,
          }}
        />
        )}

        {/* Paddle */}
        <View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            left: paddle.x,
            top: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 170 : 90),
            width: paddle.width,
            height: paddle.height,
            backgroundColor: colors.secondary,
            zIndex: 5, // Ensure paddle is above other elements but below tutorial
          }}
        />

        {/* Tutorial Modal */}
        {showTutorial && (
          <View style={styles.tutorialContainer}>
            <Animated.View 
              style={[
                styles.tutorialContent, 
                { 
                  backgroundColor: colors.card,
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })}]
                }
              ]}
            >
              {renderTutorialContent()}
              
              <View style={styles.tutorialButtonRow}>
                <TouchableOpacity
                  style={[styles.tutorialButton, { backgroundColor: colors.primary }]}
                  onPress={skipTutorial}
                >
                  <Text style={styles.buttonText}>Skip</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.tutorialButton, { backgroundColor: colors.secondary }]}
                  onPress={nextTutorialStep}
                >
                  <Text style={styles.buttonText}>
                    {tutorialStep === 'ready' ? 'Start Game' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Start Game Button - only show in ready state and when tutorial is complete */}
        {gameState === 'ready' && !showTutorial && (
          <View style={[styles.startButtonContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary }]}
              onPress={startAttempt}
            >
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Launch Ball Instructions - show when ball is on paddle */}
        {gameState === 'playing' && ballState === 'on_paddle' && (
          <View style={styles.instructionsContainer}>
            <Text style={[styles.instructionsText, { 
              color: colors.text,
              backgroundColor: `${colorScheme === 'dark' ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.7)'}`
            }]}>
              Move paddle and release to launch ball
            </Text>
          </View>
        )}

        {/* Attempt End Modal */}
        <Modal
          visible={gameState === 'attempt_end'}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {currentAttemptResult?.success ? 'Great Job!' : 'Attempt Ended'}
              </Text>
              <Text style={[styles.modalText, { color: colors.text }]}>Score: {currentAttemptResult?.score}</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>Time: {formatTime(currentAttemptResult?.time || 0)}</Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.secondary }]}
                onPress={nextAttempt}
              >
                <Text style={styles.buttonText}>Next Attempt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over Modal */}
        <Modal
          visible={gameState === 'game_over'}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Game Over</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>Best Score: {getBestResults().bestScore}</Text>
              <Text style={[styles.modalText, { color: colors.text }]}>Best Time: {formatTime(getBestResults().bestTime)}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSmall, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    resetGame();
                    startAttempt();
                  }}
                >
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSmall, { backgroundColor: colors.primary }]}
                  onPress={goToHome}
                >
                  <Text style={styles.buttonText}>Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </GameLoop>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  game: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  headerItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  buttonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    minWidth: 250,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
  instructionsContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 3,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tutorialContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  tutorialContent: {
    width: '85%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  tutorialSuccess: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tutorialButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  tutorialButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    minWidth: 100,
    alignItems: 'center',
  },
});

export default GameScreen;