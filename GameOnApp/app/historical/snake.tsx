import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, SafeAreaView, GestureResponderEvent, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BLOCK_SIZE = 15; // Keep same block size
const GRID_WIDTH = 20; // Width of grid
const GRID_HEIGHT = 28; // Height of grid (make it taller)
const GAME_AREA_WIDTH = BLOCK_SIZE * GRID_WIDTH;
const GAME_AREA_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;
const NUM_ROWS = GRID_HEIGHT;
const NUM_COLS = GRID_WIDTH;
const GAME_SPEED = 133;

const FOOD_TYPES = {
  SALAD: { type: 0, points: 30, emoji: '🥗' },
  APPLE: { type: 1, points: 20, emoji: '🍎' },
  BURGER: { type: 2, points: 10, emoji: '🍔' },
  PIZZA: { type: 3, points: 5, emoji: '🍕' },
} as const;

type FoodType = typeof FOOD_TYPES[keyof typeof FOOD_TYPES];

interface TouchPosition {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
  foodType: FoodType;
}

type Direction = typeof DIRECTIONS[keyof typeof DIRECTIONS];

// Define directions as constants
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export default function SnakeGameScreen() {
  const colorScheme = useColorScheme() as keyof typeof Colors;
  const colors = Colors[colorScheme];

  const [gameStarted, setGameStarted] = useState(false);
  const [snake, setSnake] = useState([{ x: 5, y: 5 }]);
  const [food, setFood] = useState(generateFood([]));
  const [direction, setDirection] = useState<Direction>(DIRECTIONS.RIGHT);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);

  // Generate random position for food that doesn't overlap with snake
  function generateFood(currentSnake: Array<{ x: number; y: number }>): Food {
    let newFood: Food;
    do {
      const foodTypes = Object.values(FOOD_TYPES);
      const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
      newFood = {
        x: Math.floor(Math.random() * (NUM_COLS - 2)) + 1,
        y: Math.floor(Math.random() * (NUM_ROWS - 2)) + 1,
        foodType: randomType,
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    return newFood;
  }

  // Move snake
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { x: prevSnake[0].x + direction.x, y: prevSnake[0].y + direction.y };

        // Check wall collision
        if (head.x < 0 || head.x >= NUM_COLS || head.y < 0 || head.y >= NUM_ROWS) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          return prevSnake;
        }

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(score + food.foodType.points);
          const newSnake = [head, ...prevSnake]; // Always grow by 1
          setFood(generateFood(newSnake));
          return newSnake;
        }

        return [head, ...prevSnake.slice(0, -1)]; // Move without growing
      });
    }, GAME_SPEED); // Increased speed

    return () => clearInterval(interval);
  }, [direction, gameOver, food, score]);

  // Check if the new direction is valid (90-degree turn)
  const isValidDirectionChange = (currentDir: Direction, newDir: Direction): boolean => {
    // Cannot reverse direction
    if (
      (currentDir === DIRECTIONS.UP && newDir === DIRECTIONS.DOWN) ||
      (currentDir === DIRECTIONS.DOWN && newDir === DIRECTIONS.UP) ||
      (currentDir === DIRECTIONS.LEFT && newDir === DIRECTIONS.RIGHT) ||
      (currentDir === DIRECTIONS.RIGHT && newDir === DIRECTIONS.LEFT)
    ) {
      return false;
    }

    // Must be different direction
    if (currentDir === newDir) {
      return false;
    }

    return true;
  };

  // Handle direction changes
  const handleDirectionChange = (newDirection: Direction) => {
    if (gameOver) return;
    
    if (isValidDirectionChange(direction, newDirection)) {
      setDirection(newDirection);
    }
  };

  // Reset game
  const resetGame = () => {
    const initialSnake = [{ x: 5, y: 5 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection(DIRECTIONS.RIGHT);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
  };

  const startGame = () => {
    setGameStarted(true);
  };

  // Render game over alert
  useEffect(() => {
    if (gameOver) {
      Alert.alert('Game Over', `Score: ${score}\nPress OK to restart`, [
        { text: 'OK', onPress: resetGame },
      ]);
    }
  }, [gameOver, score]);

  // Handle touch controls
  const handleTouchStart = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setTouchStart({ x: locationX, y: locationY });
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    if (!touchStart) return;

    const { locationX, locationY } = event.nativeEvent;
    const deltaX = locationX - touchStart.x;
    const deltaY = locationY - touchStart.y;

    // Minimum swipe distance to trigger direction change
    const minSwipeDistance = 30;

    // Only process swipe if it's long enough
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      // Determine if the swipe is more horizontal or vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          handleDirectionChange(DIRECTIONS.RIGHT);
        } else {
          handleDirectionChange(DIRECTIONS.LEFT);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          handleDirectionChange(DIRECTIONS.DOWN);
        } else {
          handleDirectionChange(DIRECTIONS.UP);
        }
      }
    }

    setTouchStart(null);
  };

  const renderStartScreen = () => (
    <View style={styles.startScreen}>
      <Text style={[styles.title, { color: colors.text }]}>Diet Snake</Text>
      <View style={styles.instructions}>
        <Text style={[styles.instructionText, { color: colors.text }]}>How to Play:</Text>
        <Text style={[styles.instructionText, { color: colors.text }]}>• Swipe to change direction</Text>
        <Text style={[styles.instructionText, { color: colors.text }]}>• Collect healthy food for more points</Text>
        <Text style={[styles.instructionText, { color: colors.text }]}>• Don't hit the walls or yourself</Text>
        <Text style={[styles.instructionText, { color: colors.text }]}>Food Points:</Text>
        <View style={styles.foodPoints}>
          {Object.values(FOOD_TYPES).map((food) => (
            <Text key={food.type} style={[styles.instructionText, { color: colors.text }]}>
              {food.emoji} = {food.points} points
            </Text>
          ))}
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        onPress={startGame}
      >
        <Text style={styles.playButtonText}>Play Game</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => (
    <>
      <View style={[styles.scoreboard, { backgroundColor: colors.card }]}>
        <Text style={[styles.scoreText, { color: colors.text }]}>Score: {score}</Text>
      </View>

      <View style={styles.gameBoardContainer}>
        <View 
          style={[
            styles.gameBoard, 
            { 
              backgroundColor: colors.background,
              width: GAME_AREA_WIDTH,
              height: GAME_AREA_HEIGHT,
              borderWidth: 2,
              borderColor: colors.primary,
            }
          ]}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {snake.map((segment, index) => (
            <View
              key={index}
              style={[
                styles.snakeBlock,
                { left: segment.x * BLOCK_SIZE, top: segment.y * BLOCK_SIZE },
              ]}
            >
              <Text style={styles.emoji}>{index === 0 ? '👀' : ''}</Text>
            </View>
          ))}
          {food && (
            <View
              style={[
                styles.foodBlock,
                { left: food.x * BLOCK_SIZE, top: food.y * BLOCK_SIZE },
              ]}
            >
              <Text style={styles.emoji}>{food.foodType.emoji}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Snake Game',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {!gameStarted ? renderStartScreen() : renderGame()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scoreboard: {
    height: 50, // Slightly reduce scoreboard height
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameBoardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20, // Add some padding at the bottom
  },
  gameBoard: {
    position: 'relative',
  },
  snakeBlock: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodBlock: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    position: 'absolute',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: BLOCK_SIZE - 2,
    lineHeight: BLOCK_SIZE,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  legendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  instructions: {
    width: '100%',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 18,
    marginBottom: 10,
  },
  foodPoints: {
    marginTop: 10,
    marginLeft: 20,
  },
  playButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 