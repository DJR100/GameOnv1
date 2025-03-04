import { Alert, Button, TextInput, View, Platform } from "react-native";
import {
  getAuth,
  deleteUser,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { auth } from '@/firebase/config';
import { useState } from 'react';

const DeleteAccountButton = () => {
  console.log("🔄 DeleteAccountButton component rendered");
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const showAlert = (title: string, message: string, buttons: Array<{
    text: string;
    onPress?: () => void;
    style?: 'cancel' | 'default' | 'destructive';
  }>) => {
    if (Platform.OS === 'web') {
      // Use browser's confirm/alert for web
      if (buttons.length === 2) {
        // If we have two buttons, use confirm
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed) {
          buttons.find(b => b.text !== 'Cancel')?.onPress?.();
        } else {
          buttons.find(b => b.text === 'Cancel')?.onPress?.();
        }
      } else {
        // For single button alerts
        window.alert(`${title}\n\n${message}`);
        buttons[0]?.onPress?.();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(title, message, buttons);
    }
  };

  const handleReauthentication = async (user: any) => {
    const providerId = user.providerData[0]?.providerId;
    console.log(`🔍 User signed in with: ${providerId}`);

    try {
      if (providerId === "password") {
        // Show password input dialog for email/password users
        return new Promise((resolve, reject) => {
          setShowPasswordInput(true);
          showAlert(
            "Confirm Deletion",
            "Please enter your password to confirm account deletion",
            [
              {
                text: "Cancel",
                onPress: () => {
                  setShowPasswordInput(false);
                  reject(new Error("Password entry canceled"));
                },
                style: "cancel"
              },
              {
                text: "Confirm",
                onPress: async () => {
                  try {
                    if (!password) {
                      throw new Error("Password is required");
                    }
                    console.log("🔑 Re-authenticating email/password user...");
                    const credential = EmailAuthProvider.credential(user.email!, password);
                    await reauthenticateWithCredential(user, credential);
                    console.log("✅ Re-authentication successful for email/password user");
                    setShowPasswordInput(false);
                    resolve(true);
                  } catch (error) {
                    console.error("❌ Re-authentication failed:", error);
                    reject(error);
                  }
                }
              }
            ]
          );
        });
      } else if (providerId === "google.com") {
        // For Google Sign-In in React Native, we need to handle this differently
        console.log("🔄 Google re-authentication required");
        showAlert(
          "Re-authentication Required",
          "Please sign out and sign in again with Google to delete your account.",
          [{ 
            text: "OK", 
            onPress: async () => {
              console.log("🔄 Initiating sign out for Google re-auth...");
              try {
                await signOut(auth);
                console.log("✅ Sign out successful. Please sign in again with Google.");
              } catch (signOutError: any) {
                console.error("❌ Sign out failed:", signOutError);
                throw signOutError;
              }
            }
          }]
        );
        throw new Error("Google re-authentication required");
      } else {
        throw new Error("Unknown authentication method");
      }
    } catch (error: any) {
      console.error("❌ Re-authentication failed:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    console.log("🚀 deleteAccount function called");

    if (!auth) {
      console.log("❌ Firebase Auth instance not found!");
      return;
    }

    const user = auth.currentUser;
    console.log("🔍 Checking current user...");

    if (!user) {
      console.log("❌ No user detected! Stopping deletion.");
      showAlert(
        "Error",
        "No user detected. Please sign in first.",
        [{ text: "OK", onPress: () => console.log("✅ User acknowledged error") }]
      );
      return;
    }

    console.log("✅ User found:", { 
      uid: user.uid, 
      email: user.email,
      isAnonymous: user.isAnonymous,
      providerId: user.providerData[0]?.providerId
    });

    try {
      // First attempt re-authentication
      await handleReauthentication(user);

      // If re-authentication successful, proceed with deletion
      console.log("🗑 Attempting to delete Firebase Auth user...");
      await deleteUser(user);
      console.log("✅ Account deletion successful!");
      showAlert(
        "Success",
        "Your account has been successfully deleted.",
        [{ text: "OK", onPress: () => console.log("✅ User acknowledged deletion success") }]
      );
    } catch (error: any) {
      console.error("❌ Error during account deletion:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      if (error.message === "Password entry canceled") {
        console.log("❌ User canceled password entry");
        return;
      }

      if (error.code === "auth/wrong-password") {
        showAlert(
          "Error",
          "Incorrect password. Please try again.",
          [{ text: "OK", onPress: () => setPassword("") }]
        );
        return;
      }

      if (error.message === "Google re-authentication required") {
        // This error is handled in the handleReauthentication function
        return;
      }

      showAlert(
        "Error",
        "An error occurred while deleting your account. Please try again.",
        [{ text: "OK", onPress: () => console.log("✅ User acknowledged error") }]
      );
    }
  };

  const handleDeleteAccount = async () => {
    console.log("🚀 Delete account button clicked");
    
    showAlert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log("❌ Account deletion canceled by user")
        },
        { 
          text: "Delete", 
          onPress: () => {
            console.log("✅ User confirmed account deletion");
            console.log("🔄 Initiating account deletion process...");
            deleteAccount();
          }
        },
      ]
    );
  };

  return (
    <View>
      {showPasswordInput && (
        <TextInput
          secureTextEntry
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            marginBottom: 10,
            borderRadius: 5
          }}
        />
      )}
      <Button 
        title="Delete Account" 
        onPress={handleDeleteAccount} 
        color="#FF4B4B"
      />
    </View>
  );
};

export default DeleteAccountButton; 