import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  console.log('Starting Firebase test...');
  
  try {
    console.log('Creating test document...');
    const testDoc = doc(db, 'anonymous_users', 'test-user-1');
    
    const data = {
      id: 'test-user-1',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      streakData: {
        currentStreak: 0,
        lastLoginDate: new Date().toISOString(),
        highestStreak: 0,
        totalLogins: 1
      }
    };
    
    console.log('Writing data:', data);
    await setDoc(testDoc, data);
    
    console.log('Successfully created test user!');
    return true;
  } catch (error) {
    console.error('Detailed Firebase Error:', error);
    return false;
  }
}; 