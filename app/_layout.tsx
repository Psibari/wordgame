import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {/* Tabs group (Crossroads, Library, Polly) */}
      <Stack.Screen name="(tabs)" />

      {/* Standalone game modes */}
      <Stack.Screen name="Blitz" />
      <Stack.Screen name="Scholar" />
      <Stack.Screen name="Echo" />
    </Stack>
  );
}
