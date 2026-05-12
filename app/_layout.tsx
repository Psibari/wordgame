import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="Blitz" />
      <Stack.Screen name="Scholar" />
      <Stack.Screen name="Echo" />
    </Stack>
  );
}
