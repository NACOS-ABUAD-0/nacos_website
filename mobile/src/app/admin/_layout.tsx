import { Stack } from 'expo-router';

export default function AdminStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="checkin" />
      <Stack.Screen name="checkin/[eventId]" />
    </Stack>
  );
}
