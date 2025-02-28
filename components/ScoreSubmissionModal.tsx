import React, { useState, useEffect } from 'react';
import { Modal, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitScore } from '@/services/scoreService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ScoreSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  score: number;
  gameType: string;
}

const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({ 
  visible, 
  onClose, 
  score, 
  gameType 
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Load saved player name when modal opens
  useEffect(() => {
    if (visible) {
      loadPlayerName();
    }
  }, [visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsSuccess(false);
    }
  }, [visible]);

  const loadPlayerName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('playerName');
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (error) {
      console.error('Error loading player name:', error);
    }
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Save player name for future use
      await AsyncStorage.setItem('playerName', playerName);
      // Submit score to Firebase
      await submitScore({
        playerName: playerName.trim(),
        score,
        gameType,
        timestamp: new Date()
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {isSuccess ? (
            <View style={styles.successContainer}>
              <Text style={[styles.successText, { color: colors.text }]}>
                Score Submitted!
              </Text>
              <Text style={{ color: colors.text, marginVertical: 10, textAlign: 'center' }}>
                Your score of {score} has been added to the leaderboard.
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Submit Your Score</Text>
              <Text style={[styles.scoreText, { color: colors.text }]}>
                Score: {score}
              </Text>
              
              <TextInput
                style={[
                  styles.input,
                  { 
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background
                  }
                ]}
                placeholder="Enter your name"
                placeholderTextColor={colors.text + '80'}
                value={playerName}
                onChangeText={setPlayerName}
                maxLength={15}
                autoFocus
              />
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.secondary }]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button, 
                    { 
                      backgroundColor: playerName.trim() ? colors.primary : colors.primary + '80',
                      opacity: isSubmitting ? 0.7 : 1
                    }
                  ]}
                  onPress={handleSubmit}
                  disabled={!playerName.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 18,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successContainer: {
    padding: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ScoreSubmissionModal;
