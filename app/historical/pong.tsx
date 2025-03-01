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

export default function PongGame() {
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
    const paddleWidth = 100;
    const paddleX = SCREEN_WIDTH / 2 - paddleWidth / 2;
    
    setPaddle({
      x: paddleX,
      width: paddleWidth,
      height: 20,
    });
    
    // Move paddle higher up
    const paddleY = SCREEN_HEIGHT - (Platform.OS === 'ios' ? 300 : 280); // Increased these values
    
    // Place ball on paddle at new height
    setBall({
      x: SCREEN_WIDTH / 2,
      y: paddleY - 10,
      dx: 0,
      dy: 0,
      radius: 10,
    });
    
    // Adjust brick positioning to be closer to header
    const brickWidth = 60;
    const brickHeight = 30;
    const bricksPerRow = 5;
    const rowCount = 4;
    const horizontalPadding = 10;
    const verticalPadding = 20; // Reduced from 50 to bring blocks up
    
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
          y: verticalPadding + row * (brickHeight + 8), // Reduced vertical spacing between blocks
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
      setIsTimerRunning(true);
    }
  };

  // End the current attempt
  const endAttempt = (success: boolean) => {
    setIsTimerRunning(false);
    
    const result: AttemptResult = {
      score,
      time: timer,
      success,
    };
    
    setCurrentAttemptResult(result);
    setAttemptResults(prev => [...prev, result]);
    
    const newAttemptsLeft = attemptsLeft - 1;
    setAttemptsLeft(newAttemptsLeft);
    
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

  // Return to historical games screen
  const goToHistorical = () => {
    resetGame();
    router.back();
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Tutorial navigation
  const nextTutorialStep = () => {
    switch (tutorialStep) {
      case 'welcome':
        setTutorialStep('controls');
        break;
      case 'controls':
        setTutorialStep('gameplay');
        break;
      case 'gameplay':
        setTutorialStep('ready');
        break;
      case 'ready':
        setShowTutorial(false);
        startAttempt();
        break;
    }
  };

  // Skip tutorial
  const skipTutorial = () => {
    setShowTutorial(false);
    startAttempt();
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

  // Pan responder for paddle movement
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (gameState === 'playing' && ballState === 'on_paddle') {
        launchBall();
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (gameState === 'playing') {
        setPaddleMoved(true);
        const newX = paddle.x + gestureState.dx;
        const boundedX = Math.max(
          0,
          Math.min(newX, SCREEN_WIDTH - paddle.width)
        );
        setPaddle(prev => ({ ...prev, x: boundedX }));

        if (ballState === 'on_paddle') {
          setBall(prev => ({ ...prev, x: boundedX + paddle.width / 2 }));
        }
      }
    },
  });

  // Collision detection helper
  const getCollisionSide = (ball: Ball, block: Block): CollisionSide => {
    const ballBottom = ball.y + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballLeft = ball.x - ball.radius;

    const blockBottom = block.y + block.height;
    const blockTop = block.y;
    const blockRight = block.x + block.width;
    const blockLeft = block.x;

    const bottom = ballBottom - blockTop;
    const top = blockBottom - ballTop;
    const right = ballRight - blockLeft;
    const left = blockRight - ballLeft;

    if (Math.min(bottom, top, left, right) === bottom) return 'bottom';
    if (Math.min(bottom, top, left, right) === top) return 'top';
    if (Math.min(bottom, top, left, right) === left) return 'left';
    if (Math.min(bottom, top, left, right) === right) return 'right';
    return null;
  };

  // Check if all blocks are destroyed
  const areAllBlocksDestroyed = (): boolean => {
    return blocks.every(block => !block.active);
  };

  // Game update loop
  const updateHandler = () => {
    if (gameState !== 'playing' || ballState === 'on_paddle') return;

    let newBall = { ...ball };
    newBall.x += ball.dx;
    newBall.y += ball.dy;

    // Use same higher position for collision detection
    const paddleY = SCREEN_HEIGHT - (Platform.OS === 'ios' ? 300 : 280); // Match initialization value
    if (
      newBall.y + ball.radius >= paddleY &&
      newBall.y - ball.radius <= paddleY + paddle.height &&
      newBall.x >= paddle.x &&
      newBall.x <= paddle.x + paddle.width
    ) {
      // Calculate relative position of ball hit on paddle (0 to 1)
      const hitPosition = (newBall.x - paddle.x) / paddle.width;
      
      // Adjust angle based on where the ball hits the paddle
      const maxAngle = Math.PI / 3; // 60 degrees
      const angle = (hitPosition - 0.5) * maxAngle;
      
      // Calculate new velocity components
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      newBall.dx = speed * Math.sin(angle);
      newBall.dy = -speed * Math.cos(angle);
      
      // Ensure the ball doesn't get stuck
      newBall.y = paddleY - ball.radius;
    }

    // Wall collisions
    if (newBall.x - ball.radius <= 0 || newBall.x + ball.radius >= SCREEN_WIDTH) {
      newBall.dx = -ball.dx;
    }
    if (newBall.y - ball.radius <= 0) {
      newBall.dy = -ball.dy;
    }

    // Block collisions
    let collisionOccurred = false;
    setBlocks(prevBlocks =>
      prevBlocks.map(block => {
        if (!block.active) return block;

        if (
          newBall.x + ball.radius >= block.x &&
          newBall.x - ball.radius <= block.x + block.width &&
          newBall.y + ball.radius >= block.y &&
          newBall.y - ball.radius <= block.y + block.height
        ) {
          collisionOccurred = true;
          
          // Determine which side was hit
          const collisionSide = getCollisionSide(newBall, block);
          
          // Reflect ball based on collision side
          if (collisionSide === 'left' || collisionSide === 'right') {
            newBall.dx = -ball.dx;
          }
          if (collisionSide === 'top' || collisionSide === 'bottom') {
            newBall.dy = -ball.dy;
          }

          // Update score
          setScore(prev => prev + 10);

          return { ...block, active: false };
        }
        return block;
      })
    );

    // Check for game over conditions
    if (newBall.y + ball.radius > SCREEN_HEIGHT) {
      endAttempt(false);
      return;
    }

    // Check for victory condition
    if (!collisionOccurred && areAllBlocksDestroyed()) {
      endAttempt(true);
      return;
    }

    // Update ball state
    setBall(newBall);
  };

  // Get best results for display
  const getBestResults = () => {
    if (attemptResults.length === 0) return null;

    const successfulAttempts = attemptResults.filter(result => result.success);
    if (successfulAttempts.length === 0) return null;

    return successfulAttempts.reduce((best, current) => {
      if (!best) return current;
      if (current.score > best.score) return current;
      if (current.score === best.score && current.time < best.time) return current;
      return best;
    });
  };

  // Render tutorial content
  const renderTutorialContent = () => {
    switch (tutorialStep) {
      case 'welcome':
        return (
          <>
            <ThemedText style={styles.tutorialTitle}>Welcome to Pong!</ThemedText>
            <ThemedText style={styles.tutorialText}>
              Break all the blocks to win. You have 3 attempts to achieve your best score.
            </ThemedText>
          </>
        );
      case 'controls':
        return (
          <>
            <ThemedText style={styles.tutorialTitle}>Controls</ThemedText>
            <ThemedText style={styles.tutorialText}>
              Slide your finger to move the paddle.{'\n'}
              Tap anywhere to launch the ball.
            </ThemedText>
          </>
        );
      case 'gameplay':
        return (
          <>
            <ThemedText style={styles.tutorialTitle}>Gameplay</ThemedText>
            <ThemedText style={styles.tutorialText}>
              Hit blocks to score points.{'\n'}
              Don't let the ball fall below the paddle!
            </ThemedText>
          </>
        );
      case 'ready':
        return (
          <>
            <ThemedText style={styles.tutorialTitle}>Ready?</ThemedText>
            <ThemedText style={styles.tutorialText}>
              Let's start your first attempt!
            </ThemedText>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GameLoop style={styles.container} onUpdate={updateHandler}>
        <View style={styles.gameContainer}>
          {/* Score and Timer Display */}
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

          {/* Game Elements */}
          <View style={styles.gameArea} {...panResponder.panHandlers}>
            {/* Blocks */}
            {blocks.map((block, index) =>
              block.active ? (
                <View
                  key={index}
                  style={[
                    styles.block,
                    {
                      left: block.x,
                      top: block.y,
                      width: block.width,
                      height: block.height,
                      backgroundColor: colors.primary,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                />
              ) : null
            )}

            {/* Single Paddle - moved higher up */}
            <View
              style={{
                position: 'absolute',
                left: paddle.x,
                width: paddle.width,
                height: paddle.height,
                backgroundColor: 'green',
                top: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 300 : 280), // Match new height
                borderRadius: 10,
              }}
            />

            {/* Ball */}
            {gameState === 'playing' && (
              <View
                style={[
                  styles.ball,
                  {
                    left: ball.x - ball.radius,
                    top: ball.y - ball.radius,
                    width: ball.radius * 2,
                    height: ball.radius * 2,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Tutorial Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showTutorial}
          onRequestClose={skipTutorial}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {renderTutorialContent()}
              <View style={styles.tutorialButtons}>
                <TouchableOpacity
                  style={[styles.tutorialButton, { backgroundColor: colors.primary }]}
                  onPress={skipTutorial}
                >
                  <Text style={styles.buttonText}>Skip Tutorial</Text>
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
            </View>
          </View>
        </Modal>

        {/* Attempt End Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={gameState === 'attempt_end'}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ThemedText style={styles.modalTitle}>
                {currentAttemptResult?.success ? 'Level Complete!' : 'Attempt Failed'}
              </ThemedText>
              <ThemedText style={styles.modalText}>
                Score: {currentAttemptResult?.score}{'\n'}
                Time: {formatTime(currentAttemptResult?.time || 0)}
              </ThemedText>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={nextAttempt}
              >
                <Text style={styles.buttonText}>Next Attempt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={gameState === 'game_over'}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ThemedText style={styles.modalTitle}>Game Over</ThemedText>
              {getBestResults() ? (
                <ThemedText style={styles.modalText}>
                  Best Score: {getBestResults()?.score}{'\n'}
                  Best Time: {formatTime(getBestResults()?.time || 0)}
                </ThemedText>
              ) : (
                <ThemedText style={styles.modalText}>
                  Keep practicing to improve your score!
                </ThemedText>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={resetGame}
                >
                  <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={goToHistorical}
                >
                  <Text style={styles.buttonText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </GameLoop>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  headerItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ball: {
    position: 'absolute',
    borderRadius: 10,
  },
  block: {
    position: 'absolute',
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tutorialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  tutorialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  tutorialButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
}); 