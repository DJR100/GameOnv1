import { useRouter } from 'expo-router';
import { submitScore } from '../utils/scores';
import { Alert } from 'react-native';

export default function YourGameComponent() {
  const router = useRouter();

  const handleSubmitScore = async (score: number) => {
    try {
      console.log('Attempting to submit score:', score); // Debug log
      const result = await submitScore(score);
      console.log('Submit result:', result); // Debug log

      if (result.requiresAuth) {
        console.log('Auth required, redirecting...'); // Debug log
        Alert.alert(
          'Authentication Required',
          'Please create an account or log in to submit your score.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/profile')
            }
          ]
        );
      } else if (result.success) {
        Alert.alert('Success', 'Score submitted!');
      }
    } catch (error) {
      console.error('Error in handleSubmitScore:', error); // Debug log
      Alert.alert(
        'Error',
        'Unable to submit score. Please try again.'
      );
    }
  };

  // ... rest of your component code
} 