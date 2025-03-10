import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import WebView from 'react-native-webview';
import { Colors } from '@/constants/Colors';

export default function WebGameScreen() {
  const { url, title } = useLocalSearchParams();
  const colors = Colors['dark']; // Force dark theme

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: title as string,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }} 
      />
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: url as string }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
}); 