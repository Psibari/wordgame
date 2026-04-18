import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Radii } from '@/constants/theme';
import { WORD_PACKS, WordPack } from '@/constants/packs';
import { useMastery } from '@/hooks/useMastery';
import { useWordPacks } from '@/hooks/useWordPacks';
import { TomeCard } from '@/components/TomeCard';
import { SealBreakAnimation } from '@/components/SealBreakAnimation';

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const mastery = useMastery();
  const wordPacks = useWordPacks();
  const [breakingPack, setBreakingPack] = useState<WordPack | null>(null);
  const [showSealBreak, setShowSealBreak] = useState(false);

  // Header animation
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-15);
  const titleGlow = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 16, stiffness: 120 });
    titleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [headerOpacity, headerY, titleGlow]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const titleGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(titleGlow.value, [0, 1], [0.1, 0.3]);
    return { opacity };
  });

  const handlePackPress = useCallback((pack: WordPack) => {
    const isUnlocked = wordPacks.isPackUnlocked(pack.id);
    const canUnlock = wordPacks.canUnlockPack(pack.id);

    if (isUnlocked) {
      // Navigate to lexicon with this pack's filter
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/lexicon');
      return;
    }

    if (canUnlock) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setBreakingPack(pack);
      setShowSealBreak(true);
      wordPacks.unlockPack(pack.id);
      return;
    }

    // Can't unlock yet - light feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [wordPacks]);

  const handleSealBreakComplete = useCallback(() => {
    setShowSealBreak(false);
    setBreakingPack(null);
    wordPacks.clearJustUnlocked();
  }, [wordPacks]);

  const unlockedCount = wordPacks.state.unlockedPacks.length;
  const totalPacks = WORD_PACKS.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0F1225', Colors.bg, Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
      />

      {/* Subtle ambient glow */}
      <Animated.View style={[styles.ambientGlow, titleGlowStyle]}>
        <LinearGradient
          colors={[Colors.accent + '15', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>LEX-STORE</Text>
          <Text style={styles.headerSubtitle}>Word Tomes</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.packCountBadge}>
            <Text style={styles.packCountText}>
              {unlockedCount}/{totalPacks}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Mastery requirement banner */}
      <View style={styles.masteryBanner}>
        <View style={styles.masteryBannerLeft}>
          <Text style={styles.masteryBannerIcon}>✦</Text>
          <View>
            <Text style={styles.masteryBannerLabel}>Words Mastered</Text>
            <Text style={styles.masteryBannerValue}>{mastery.state.totalMastered}</Text>
          </View>
        </View>
        <View style={styles.masteryBannerDivider} />
        <View style={styles.masteryBannerRight}>
          <Text style={styles.masteryBannerLabel}>Packs Owned</Text>
          <Text style={[styles.masteryBannerValue, { color: Colors.accent }]}>{unlockedCount}</Text>
        </View>
      </View>

      {/* Tome cards */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
      >
        <Text style={styles.sectionTitle}>Available Tomes</Text>
        <Text style={styles.sectionSubtitle}>
          Master words to break the seal on new collections
        </Text>

        {WORD_PACKS.map((pack, index) => (
          <TomeCard
            key={pack.id}
            pack={pack}
            index={index}
            isUnlocked={wordPacks.isPackUnlocked(pack.id)}
            canUnlock={wordPacks.canUnlockPack(pack.id)}
            progress={wordPacks.getPackProgress(pack.id)}
            onPress={() => handlePackPress(pack)}
          />
        ))}

        {/* Lore footer */}
        <View style={styles.loreFooter}>
          <View style={styles.loreDecoLine} />
          <Text style={styles.loreText}>
            Each Tome contains words from a specialized domain.{'\n'}
            Break the seal to unlock and master them all.
          </Text>
          <View style={styles.loreDecoLine} />
        </View>
      </ScrollView>

      {/* Seal Break Animation */}
      <SealBreakAnimation
        visible={showSealBreak}
        pack={breakingPack}
        onComplete={handleSealBreakComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    color: Colors.accent,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
    letterSpacing: 3,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
    letterSpacing: 1,
    marginTop: 1,
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  packCountBadge: {
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  packCountText: {
    color: Colors.accent,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
  },
  masteryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.xl,
    padding: 16,
  },
  masteryBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  masteryBannerIcon: {
    fontSize: 20,
    color: Colors.gold,
  },
  masteryBannerLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  masteryBannerValue: {
    color: Colors.gold,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
    lineHeight: 28,
  },
  masteryBannerDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  masteryBannerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    marginBottom: 20,
  },
  loreFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loreDecoLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.bgCardBorder,
  },
  loreText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
    opacity: 0.7,
  },
});
