import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitScore } from '../utils/scores';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsLoading(false);

      if (user) {
        // When user signs in, submit any cached scores
        try {
          const cachedScores = await AsyncStorage.getItem('pendingScores');
          if (cachedScores) {
            const scores = JSON.parse(cachedScores);
            for (const scoreData of scores) {
              await submitScore(scoreData.score, user.uid);
            }
            await AsyncStorage.removeItem('pendingScores');
          }
        } catch (error) {
          console.error('Error submitting cached scores:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 