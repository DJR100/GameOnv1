import { Stack } from 'expo-router';

export default function HistoricalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="pong"
        options={{
          title: 'Classic Pong',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 