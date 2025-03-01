import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { testFirebaseConnection } from '../utils/testFirebase';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Game!</Text>
      
      <Button
        title="Test Firebase"
        onPress={() => {
          console.log('Button pressed');
          testFirebaseConnection()
            .then(result => {
              console.log('Test result:', result);
            })
            .catch(error => {
              console.error('Test error:', error);
            });
        }}
      />
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginBottom: 20,
  },
});

export default HomeScreen; 