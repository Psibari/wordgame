import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import Blitz from '../../components/Blitz'; // we'll make this next

export default function Play() {
  const [mode, setMode] = useState<'select' | 'blitz'>('select');

  if (mode === 'blitz') return <Blitz onExit={() => setMode('select')} />

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Choose Your Brain Pain</Text>
      <Pressable onPress={() => setMode('blitz')} style={{ padding: 20, backgroundColor: '#eee', marginBottom: 10 }}>
        <Text>⚡ Blitz — Speed</Text>
      </Pressable>
      <Pressable disabled style={{ padding: 20, backgroundColor: '#ddd', opacity: 0.5 }}>
        <Text>🔀 Crossroads — Coming Soon</Text>
      </Pressable>
    </View>
  );
}
