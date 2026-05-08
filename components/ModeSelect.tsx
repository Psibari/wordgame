import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';

export type ModeKey = 'blitz' | 'crossroads' | 'scholarsCave' | 'echoCanyon';

interface Mode {
  key: ModeKey;
  label: string;
  subtitle: string;
  icon: string;
  gradient: [string, string];
  glow: string;
  pillLabel: string;
}

const MODES: Mode[] = [
  {
    key: 'blitz',
    label: 'Blitz',
    subtitle: 'How fast can you think?',
    icon: '⚡',
    gradient: ['#FF6B35', '#FF3E6C'],
    glow: '#FF6B35',
    pillLabel: 'SPEED',
  },
  {
    key: 'crossroads',
    label: 'Crossroads',
    subtitle: 'Which meaning belongs here?',
    icon: '🔀',
    gradient: ['#7C5CFC', '#A487FF'],
    glow: '#7C5CFC',
    pillLabel: 'CONTEXT',
  },
  {
    key: 'scholarsCave',
    label: "Scholar's Cave",
    subtitle: 'What do you truly remember?',
    icon: '📚',
    gradient: ['#F0B429', '#FFD166'],
    glow: '#F0B429',
    pillLabel: 'KNOWLEDGE',
  },
  {
    key: 'echoCanyon',
    label: 'Echo Canyon',
    subtitle: 'Can you remember the sequence?',
    icon: '🔊',
    gradient: ['#06D6A0', '#00C8F0'],
    glow: '#06D6A0',
    pillLabel: 'MEMORY',
  },
];

interface Props {
  onSelectMode: (mode: ModeKey) => void;
}

export default function ModeSelect({ onSelectMode }: Props) {
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef(MODES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(MODES.map(() => new Animated.Value(40))).current;

  useEffect(() => {
    const animations = MODES.map((_, i) =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 400,
          delay: i * 80,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnims[i], {
          toValue: 0,
          delay: i * 80,
          damping: 18,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(80, animations).start();
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <LinearGradient
        colors={['#10082E', Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
      />

      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>POLY WORDS</Text>
        <Text style={styles.headerTitle}>Choose Your Mode</Text>
        <Text style={styles.headerSub}>Each mode trains a different skill</Text>
      </View>

      <View style={styles.grid}>
        {MODES.map((mode, i) => (
          <Animated.View
            key={mode.key}
            style={{
              opacity: fadeAnims[i],
              transform: [{ translateY: slideAnims[i] }],
              flex: 1,
            }}
          >
            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => onSelectMode(mode.key)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#0D1128', '#111630']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={[styles.glowBorder, { borderColor: mode.glow + '40' }]} />
              <View style={styles.cardInner}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.modeIcon}>{mode.icon}</Text>
                  <View style={[styles.pill, { backgroundColor: mode.glow + '25' }]}>
                    <Text style={[styles.pillText, { color: mode.glow }]}>{mode.pillLabel}</Text>
                  </View>
                </View>
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeSub}>{mode.subtitle}</Text>
                <LinearGradient
                  colors={mode.gradient}
                  style={styles.playBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.playBtnText}>Play →</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <View style={styles.streakFooter}>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>Complete all 4 modes for your daily Streak Set</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 16 },
  header: { alignItems: 'center', marginBottom: 20 },
  headerEyebrow: { color: Colors.gold, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, letterSpacing: 3, marginBottom: 4 },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.black, letterSpacing: -0.5, marginBottom: 4 },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  grid: { flex: 1, gap: 12 },
  modeCard: { flex: 1, borderRadius: Radii.xl, overflow: 'hidden', minHeight: 110, ...Shadows.card },
  glowBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  cardInner: { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  modeIcon: { fontSize: 28 },
  pill: { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: Fonts.weights.bold, letterSpacing: 1.5 },
  modeLabel: { color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.black, letterSpacing: -0.3 },
  modeSub: { color: Colors.textSub, fontSize: Fonts.sizes.xs, marginTop: 2, flex: 1 },
  playBtn: { alignSelf: 'flex-end', borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 7, marginTop: 8 },
  playBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  streakFooter: { marginTop: 12, alignItems: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.flameDim, borderWidth: 1, borderColor: Colors.flame + '60', borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8 },
  streakIcon: { fontSize: 16 },
  streakText: { color: Colors.flame, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold },
});
