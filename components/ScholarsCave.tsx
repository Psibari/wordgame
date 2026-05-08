import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

export default function ScholarsCave({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
      <View style={styles.inner}>
        <Text style={styles.icon}>📚</Text>
        <Text style={styles.title}>Scholar's Cave</Text>
        <Text style={styles.sub}>Coming soon — knowledge mode</Text>
        <TouchableOpacity style={styles.btn} onPress={onExit} activeOpacity={0.8}>
          <LinearGradient colors={['#F0B429', '#FFD166']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>← Back to Modes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.black, marginBottom: 8 },
  sub: { color: Colors.textMuted, fontSize: Fonts.sizes.base, marginBottom: 40 },
  btn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.gold },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.bg, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
