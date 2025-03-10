import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { AnonymousUser } from '../types/user';
import '@types/uuid';
import { getFirestore } from 'firebase/firestore';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface UserContextType {
  user: AnonymousUser | null;
  isLoading: boolean;
  updateLastActive: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createAnonymousUser = async () => {
    const newUser: AnonymousUser = {
      id: uuidv4(),
      createdAt: new Date(),
      lastActive: new Date(),
      streakData: {
        currentStreak: 0,
        lastLoginDate: new Date(),
        highestStreak: 0,
        totalLogins: 1,
      },
    };

    // Save locally
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    // Save to Firebase
    try {
      await setDoc(doc(db, 'anonymous_users', newUser.id), {
        ...newUser,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        streakData: {
          ...newUser.streakData,
          lastLoginDate: serverTimestamp(),
        }
      });
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }

    setUser(newUser);
  };

  const updateLastActive = async () => {
    if (user) {
      const updatedUser = {
        ...user,
        lastActive: new Date(),
      };

      // Update locally
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update Firebase
      try {
        await setDoc(doc(db, 'anonymous_users', user.id), {
          lastActive: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error('Error updating Firebase:', error);
      }

      setUser(updatedUser);
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Convert stored date strings back to Date objects
          parsedUser.createdAt = new Date(parsedUser.createdAt);
          parsedUser.lastActive = new Date(parsedUser.lastActive);
          parsedUser.streakData.lastLoginDate = new Date(parsedUser.streakData.lastLoginDate);
          
          // Verify/sync with Firebase
          const userDoc = await getDoc(doc(db, 'anonymous_users', parsedUser.id));
          if (!userDoc.exists()) {
            // If user exists locally but not in Firebase, recreate in Firebase
            await setDoc(doc(db, 'anonymous_users', parsedUser.id), {
              ...parsedUser,
              lastActive: serverTimestamp(),
            });
          }
          
          setUser(parsedUser);
        } else {
          await createAnonymousUser();
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        await createAnonymousUser();
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, updateLastActive }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 