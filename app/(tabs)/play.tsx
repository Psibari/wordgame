import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import ModeSelect, { ModeKey } from '@/components/ModeSelect';
import Blitz from '@/components/Blitz';
import Crossroads from '@/components/Crossroads';
import ScholarsCave from '@/components/ScholarsCave';
import EchoCanyon from '@/components/EchoCanyon';

export default function PlayScreen() {
  const [activeMode, setActiveMode] = useState<ModeKey | null>(null);

  const handleExit = () => setActiveMode(null);

  const renderMode = () => {
    switch (activeMode) {
      case 'blitz':
        return <Blitz onExit={handleExit} />;
      case 'crossroads':
        return <Crossroads onExit={handleExit} />;
      case 'scholarsCave':
        return <ScholarsCave onExit={handleExit} />;
      case 'echoCanyon':
        return <EchoCanyon onExit={handleExit} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      {activeMode === null ? (
        <ModeSelect onSelectMode={setActiveMode} />
      ) : (
        renderMode()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
