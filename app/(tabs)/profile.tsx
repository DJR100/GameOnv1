import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAuth, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [user, setUser] = useState<User | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowAuthForm(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.profileCircle, { backgroundColor: colors.border }]}>
          <Ionicons name="person" size={75} color={colors.text} />
        </View>

        <Text style={[styles.emailText, { color: colors.text }]}>
          {user.email}
        </Text>

        <Text style={[styles.memberText, { color: colors.text }]}>
          Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
        </Text>

        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.floor((Date.now() - new Date(user.metadata.creationTime || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Days as Member</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.primary }]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
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
            style={[styles.authButton, { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 8,
            }]}
            onPress={() => {
              setIsLogin(true);
              setShowAuthForm(true);
            }}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Log In</Text>
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
    backgroundColor: '#fff',
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
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
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
  profileCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memberText: {
    fontSize: 14,
    marginBottom: 30,
    opacity: 0.8,
  },
  statsContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  signOutButton: {
    width: '90%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
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