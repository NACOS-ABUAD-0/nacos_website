import { Stack } from 'expo-router';

export default function ResourcesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="submit" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
