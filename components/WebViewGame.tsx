import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { auth } from '@/firebase/config';
import { updateUserGameStatsFirebase } from '@/app/utils/gameStats';

interface WebViewGameProps {
  url: string;
  gameType: string;  // e.g., "scoreGenerator", "puzzle", etc.
}

export default function WebViewGame({ url, gameType }: WebViewGameProps) {
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const uid = auth.currentUser?.uid;

      console.log('data', data);
      console.log('uid', uid);
      console.log('gameType', gameType);
      console.log('data.score', data.score);
      console.log('auth', auth);
      
      if (data.score !== undefined && uid) {
        // Save score to Firebase
        await updateUserGameStatsFirebase(uid, gameType, {
          score: data.score,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error handling game message:', error);
    }
  };

  return (
    <View style={styles.webviewContainer}>
      <WebView
        source={{ uri: url }}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          console.warn('WebView error:', syntheticEvent.nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('WebView loaded successfully');
        }}
        javaScriptEnabled={true}
        injectedJavaScript={`
          window.ReactNativeWebView = window.ReactNativeWebView || {};
          true;
        `}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webviewContainer: {
    flex: 1,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});
