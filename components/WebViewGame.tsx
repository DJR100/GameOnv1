import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface WebViewGameProps {
  url: string;
}

export default function WebViewGame({ url }: WebViewGameProps) {
  return (
    <View style={styles.webviewContainer}>
      <WebView source={{ uri: url }} style={styles.webview} />
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
