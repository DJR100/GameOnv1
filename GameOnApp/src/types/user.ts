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