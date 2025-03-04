// Define all user-related interfaces
export interface AnonymousUser {
    id: string;
    createdAt: Date;
    lastActive: Date;
    streakData: {
        currentStreak: number;
        lastLoginDate: Date;
        highestStreak: number;
        totalLogins: number;
    };
}

// Add Firebase User type for better type checking
import { User as FirebaseUser } from 'firebase/auth';
export type User = FirebaseUser;

// Add any other user interfaces you need here 