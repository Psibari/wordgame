import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'ios_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="guess-the-word" />
          <Stack.Screen name="multiple-choice" />
         
         
          <Stack.Screen name="lexicon" />
          <Stack.Screen name="store" />
          <Stack.Screen name="mastery-card" options={{ animation: 'fade_from_bottom' }} />
        
    
        
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
