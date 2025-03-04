import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import {collection, doc, getDoc, setDoc} from "firebase/firestore";
import DeleteAccountButton from '../components/DeleteAccountButton';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

async function upsertUser(user: User) {
  try {
    if (!user.uid) {
      throw new Error("User ID is required for upsert operation.");
    }

    const userTable = collection(db, "users");
    const userRef = doc(userTable, user.uid); // Ensure user.id is not empty

    // Convert class instance to plain JavaScript object
    const userData = JSON.parse(JSON.stringify(user));

    // Check if user exists in Firestore
    const docSnapshot = await getDoc(userRef);

    if (docSnapshot.exists()) {
      await setDoc(userRef, userData, { merge: true }); // Merge updates
    } else {
      await setDoc(userRef, userData); // Insert new user
    }

    console.log("User upserted successfully");
  } catch (error) {
    console.error("Error upserting user:", error);
  }
}

interface GameStats {
  dailyGames: { [key: string]: number };
  personalBest: {
    currentStreak: number;
    longestStreak: number;
    highestScore: number;
  };
  weeklyGames: number;
  monthlyGames: number;
}

interface UserStats {
  gameStats: GameStats;
  lastPlayed: Date;
}

const getActivityStats = (stats: UserStats | null, tab: string): number => {
  if (!stats?.gameStats) return 0;
  
  switch (tab) {
    case 'Day':
      const today = new Date().toISOString().split('T')[0];
      return stats.gameStats.dailyGames[today] || 0;
    case 'Week':
      return stats.gameStats.weeklyGames || 0;
    case 'Month':
      return stats.gameStats.monthlyGames || 0;
    default:
      return 0;
  }
};

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [user, setUser] = useState<User | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Day');
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Set up Google Auth Request
  const [request, response, promptAsync] = Google
      .useAuthRequest({
        iosClientId: "397096414574-c6vo7gut9mm58pi818bleht0ovakn36l.apps.googleusercontent.com", // Leave this for now
        webClientId: "397096414574-gfgea3ilt36i1c1dhn6b2h008omg50jg.apps.googleusercontent.com", // Update this line with your client ID
        responseType: ResponseType.IdToken,
      });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowAuthForm(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    handleSignInResponse();
  }, [response]);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'Account created successfully!');
      }
      setEmail('');
      setPassword('');
      setShowAuthForm(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Success', 'Signed out successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleSignInResponse = async () => {
    if (response?.type === 'success') {
      setLoading(true);
      const { id_token } = response.params;
      
      try {
        // Create Firebase credential with Google ID token
        const credential = GoogleAuthProvider
            .credential(
                id_token
            );
        // Sign in with credential
        const userCredential = await signInWithCredential(auth, credential);
        setUserInfo(userCredential.user as any); // Type assertion to fix type error

        console.log('User signed in with Google:', userCredential.user);

        // Upsert this user in firestore
        await upsertUser(userCredential.user);

      } catch (error) {
        console.error('Error signing in with Google:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Show auth form when showAuthForm is true
  if (showAuthForm) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { color: colors.text }]}>
              Game<Text style={{ color: colors.primary }}>On</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.authTitle, { color: colors.text }]}>
              {isLogin ? 'Welcome Back!' : 'Join the Game'}
            </Text>
            <Text style={[styles.authSubtitle, { color: colors.text + 'CC' }]}>
              {isLogin 
                ? 'Ready to continue your winning streak?' 
                : 'Get ready for an epic gaming experience!'}
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="mail" size={24} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Email"
                placeholderTextColor={colors.text + '80'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed" size={24} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholder="Password"
                placeholderTextColor={colors.text + '80'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.authButton, { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 8,
              }]}
              onPress={handleAuth}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>
                {isLogin ? 'Log In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowAuthForm(false)}
              style={styles.toggleButton}
            >
              <Text style={[styles.toggleText, { color: colors.primary }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>

          {isLogin ? (
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.text + 'CC' }]}>
                Don't have an account yet?
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(false)}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Create one now!
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.text + 'CC' }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(true)}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Log in here
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Show authenticated user profile
  if (user) {
    return (
      <View style={[styles.container]}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Centered Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: user.photoURL || 'https://example.com/default-profile.jpg' }} 
                style={styles.profileImage} 
              />
            </View>
            <Text style={styles.profileName}>{user.displayName || 'Player'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            {/* Stats Toggle */}
            <View style={styles.tabContainer}>
              {['Day', 'Week', 'Month'].map((tab) => (
                <TouchableOpacity 
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.activeTab
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stats Display */}
            <View style={styles.statsCard}>
              <Text style={styles.statsValue}>
                {getActivityStats(userStats, activeTab)}
              </Text>
              <Text style={styles.statsLabel}>Games Played</Text>
              <Text style={styles.statsSubtext}>
                {activeTab === 'Day' ? 'Today' : 
                 activeTab === 'Week' ? 'Last 7 Days' : 
                 'Last 30 Days'}
              </Text>
            </View>

            {/* Streak and High Score */}
            <View style={styles.achievementsContainer}>
              <View style={styles.achievementCard}>
                <Ionicons name="flame" size={24} color="#FF4B4B" />
                <Text style={styles.achievementValue}>
                  {userStats?.gameStats?.personalBest?.currentStreak || 0}
                </Text>
                <Text style={styles.achievementLabel}>Current Streak</Text>
              </View>
              <View style={styles.achievementCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.achievementValue}>
                  {userStats?.gameStats?.personalBest?.highestScore || 0}
                </Text>
                <Text style={styles.achievementLabel}>High Score</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
          <View style={styles.deleteAccountButton}>
            <DeleteAccountButton />
          </View>
        </View>
      </View>
    );
  }

  // Show promotional content and auth buttons
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, { color: colors.text }]}>
            Game<Text style={{ color: colors.primary }}>On</Text>
          </Text>
        </View>
        
        <View style={styles.promoSection}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            New Here?
          </Text>
          <Text style={[styles.promoTitle, { color: colors.text }]}>
            Create an Account to:
      </Text>

          <View style={[styles.promoCard, { backgroundColor: colors.primary + '15' }]}>
            <View style={styles.promoItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="trending-up" size={28} color="#fff" />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTextTitle, { color: colors.text }]}>
                  Keep Your Streak Alive
                </Text>
                <Text style={[styles.promoTextSubtitle, { color: colors.text + 'CC' }]}>
                  Don't lose your momentum!
                </Text>
              </View>
            </View>

            <View style={[styles.promoItem, { marginTop: 15 }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="people" size={28} color="#fff" />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTextTitle, { color: colors.text }]}>
                  Challenge Your Squad
                </Text>
                <Text style={[styles.promoTextSubtitle, { color: colors.text + 'CC' }]}>
                  Climb the leaderboards together!
                </Text>
              </View>
            </View>

            <View style={[styles.promoItem, { marginTop: 15 }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="trophy" size={28} color="#fff" />
              </View>
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTextTitle, { color: colors.text }]}>
                  Unlock Epic Rewards
                </Text>
                <Text style={[styles.promoTextSubtitle, { color: colors.text + 'CC' }]}>
                  Exclusive loot for registered players!
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.authButton, styles.googleButton, {
              shadowColor: '#4285F4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 8,
            }]}
            onPress={() => promptAsync({showInRecents: true})}
            disabled={loading}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="logo-google" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, { 
              backgroundColor: colors.primary,
              marginTop: 12,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 8,
            }]}
            onPress={() => {
              setIsLogin(false);
              setShowAuthForm(true);
            }}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
  },
  profileImageContainer: {
    padding: 3,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    marginBottom: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#000',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#999',
  },
  statsSection: {
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  statsValue: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
  },
  statsLabel: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  statsSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  achievementCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
  },
  achievementValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  achievementLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonGroup: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  signOutButton: {
    backgroundColor: '#FF4B4B',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteAccountButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  promoSection: {
    width: '90%',
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  promoTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  promoCard: {
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTextTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  promoTextSubtitle: {
    fontSize: 14,
  },
  buttonContainer: {
    width: '90%',
    paddingTop: 10,
  },
  authButton: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  formContainer: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  toggleButton: {
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 