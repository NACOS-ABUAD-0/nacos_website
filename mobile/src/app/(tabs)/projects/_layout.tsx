import { Stack } from 'expo-router';

export default function ProjectsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/requests" />
      <Stack.Screen name="my-projects" />
      <Stack.Screen name="liked" />
      <Stack.Screen name="my-collaborations" />
    </Stack>
  );
}
