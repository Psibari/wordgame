import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { useMastery } from '@/hooks/useMastery';
import { useStability, WordStability } from '@/hooks/useStability';
import { WORD_POOL } from '@/constants/words';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { PollyGardenHelper } from '@/components/polly/PollyGardenHelper';
import { HapticManager } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const W = Colors.workspace;

const PHASE_CONFIG = {
  seed: { icon: '◇', label: 'Seed', color: W.gardenSeed, description: 'Needs nurturing' },
  sprout: { icon: '◈', label: 'Sprout', color: W.gardenSprout, description: 'Growing steadily' },
  bloom: { icon: '❖', label: 'Bloom', color: W.gardenBloom, description: 'Nearly crystallized' },
  crystal: { icon: '✦', label: 'Crystal', color: W.gardenCrystal, description: 'Fully retained' },
} as const;

function getStabilityColor(stability: number): string {
  if (stability >= 90) return W.stability100;
  if (stability >= 60) return W.stability75;
  if (stability >= 40) return W.stability50;
  if (stability >= 20) return W.stability25;
  return W.stability0;
}

// Crystal / Seed visual component for each word
function GardenWordCrystal({
  wordStability,
  wordLabel,
  index,
  onPress,
}: {
  wordStability: WordStability;
  wordLabel: string;
  index: number;
  onPress: () => void;
}) {
  const phase = PHASE_CONFIG[wordStability.phase];
  const stabilityColor = getStabilityColor(wordStability.stability);

  const scale = useSharedValue(0);
  const bloomPulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  // Floating animation - subtle levitation effect
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 40,
      withSpring(1, { damping: 12, stiffness: 100 }),
    );

    // Subtle floating animation - different phases & offsets per crystal
    const floatDuration = 2500 + (index % 4) * 500;
    const floatAmplitude = 2 + (index % 3);
    const floatXAmp = 1 + (index % 2);
    const floatDelay = (index % 5) * 300;

    floatY.value = withDelay(
      floatDelay,
      withRepeat(
        withSequence(
          withTiming(-floatAmplitude, { duration: floatDuration, easing: Easing.inOut(Easing.sin) }),
          withTiming(floatAmplitude, { duration: floatDuration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    floatX.value = withDelay(
      floatDelay + 400,
      withRepeat(
        withSequence(
          withTiming(floatXAmp, { duration: floatDuration * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(-floatXAmp, { duration: floatDuration * 1.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );

    // Crystal bloom animation - continuous gentle pulse for high-stability words
    if (wordStability.phase === 'crystal') {
      bloomPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }

    // Gentle rotation for bloom phase
    if (wordStability.phase === 'bloom' || wordStability.phase === 'crystal') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }
  }, [index, scale, bloomPulse, rotation, floatY, floatX, wordStability.phase]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: floatY.value },
      { translateX: floatX.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloomPulse.value, [0, 1], [0.1, 0.4]),
    transform: [{ scale: interpolate(bloomPulse.value, [0, 1], [0.8, 1.15]) }],
  }));

  const isWilting = wordStability.stability < 25;

  const handlePress = () => {
    HapticManager.crystalChime();
    onPress();
  };

  return (
    <Animated.View style={[styles.crystalWrapper, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.crystalCard,
          {
            borderColor: isWilting ? W.gardenWilt + '50' : stabilityColor + '30',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Background glow for crystals */}
        {(wordStability.phase === 'crystal' || wordStability.phase === 'bloom') && (
          <Animated.View
            style={[
              styles.crystalGlow,
              { backgroundColor: phase.color },
              glowStyle,
            ]}
          />
        )}

        {/* Glassmorphism surface */}
        <View style={styles.crystalFrost} />
        {/* Top-edge glass highlight */}
        <LinearGradient
          colors={[`${phase.color}15`, 'transparent']}
          style={styles.crystalTopHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Wilting indicator */}
        {isWilting && (
          <View style={styles.wiltIndicator}>
            <Text style={styles.wiltIcon}>⚠</Text>
          </View>
        )}

        {/* Crystal shape */}
        <Text style={[styles.crystalSymbol, { color: phase.color, textShadowColor: phase.color + '60', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }]}>
          {phase.icon}
        </Text>

        {/* Word label */}
        <Text
          style={[styles.crystalWord, isWilting && { color: W.gardenWilt }]}
          numberOfLines={1}
        >
          {wordLabel}
        </Text>

        {/* Stability bar */}
        <View style={styles.miniStabilityBar}>
          <View
            style={[
              styles.miniStabilityFill,
              {
                width: `${wordStability.stability}%`,
                backgroundColor: stabilityColor,
              },
            ]}
          />
        </View>

        {/* Percentage */}
        <Text style={[styles.crystalPercent, { color: stabilityColor }]}>
          {Math.round(wordStability.stability)}%
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Stats overview cards
function StatsCard({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  delay: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 14 }));
  }, [delay, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.statsCard, animStyle]}>
      <View style={[styles.statsCardIcon, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[styles.statsCardValue, { color }]}>{value}</Text>
      <Text style={styles.statsCardLabel}>{label}</Text>
    </Animated.View>
  );
}

// Word detail modal for garden
function GardenWordDetail({
  word,
  stability,
  visible,
  onClose,
  onReview,
}: {
  word: typeof WORD_POOL[0] | null;
  stability: WordStability | null;
  visible: boolean;
  onClose: () => void;
  onReview: () => void;
}) {
  if (!word || !stability) return null;

  const phase = PHASE_CONFIG[stability.phase];
  const stabColor = getStabilityColor(stability.stability);
  const isWilting = stability.stability < 25;

  const lastReviewed = stability.lastReviewedAt
    ? formatTimeAgo(stability.lastReviewedAt)
    : 'Never';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalCard, { borderColor: phase.color + '60' }]}>
          <LinearGradient
            colors={[phase.color + '15', W.zenSurface]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
          />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalPhaseIcon, { color: phase.color }]}>{phase.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalWord, { color: phase.color }]}>{word.word}</Text>
              <Text style={styles.modalPhaseLabel}>{phase.label} — {phase.description}</Text>
            </View>
          </View>

          {/* Stability gauge */}
          <View style={styles.stabilitySection}>
            <View style={styles.stabilityRow}>
              <Text style={styles.stabilityLabel}>Stability</Text>
              <Text style={[styles.stabilityValue, { color: stabColor }]}>
                {Math.round(stability.stability)}%
              </Text>
            </View>
            <AnimatedProgressBar
              progress={stability.stability / 100}
              colors={[stabColor, stabColor + 'CC'] as [string, string]}
              height={6}
              trackColor={W.zenBorder}
            />
            {isWilting && (
              <Text style={styles.wiltWarning}>⚠ This word is wilting! Review it soon.</Text>
            )}
          </View>

          {/* Stats */}
          <View style={styles.detailStatsRow}>
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{stability.reviewCount}</Text>
              <Text style={styles.detailStatLabel}>Reviews</Text>
            </View>
            <View style={[styles.detailStatDivider, { backgroundColor: W.zenBorder }]} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{stability.consecutiveCorrect}</Text>
              <Text style={styles.detailStatLabel}>Streak</Text>
            </View>
            <View style={[styles.detailStatDivider, { backgroundColor: W.zenBorder }]} />
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{lastReviewed}</Text>
              <Text style={styles.detailStatLabel}>Last Review</Text>
            </View>
          </View>

          {/* Meanings */}
          <View style={styles.meaningsList}>
            <Text style={styles.meaningsTitle}>Meanings</Text>
            {word.meanings.map((m, i) => (
              <View key={i} style={styles.meaningItem}>
                <View style={[styles.meaningDot, { backgroundColor: phase.color }]} />
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Review button */}
          <TouchableOpacity
            style={[styles.reviewBtn, { borderColor: phase.color + '60' }]}
            onPress={onReview}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[phase.color + '30', W.zenSurface]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={[styles.reviewBtnText, { color: phase.color }]}>
              Start Review Session
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const mastery = useMastery();
  const stability = useStability();
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [sortBy, setSortBy] = useState<'stability' | 'phase' | 'alpha'>('stability');

  // Initialize stability for all mastered words
  const initializeWord = stability.initializeWord;
  const stabilityWords = stability.state.words;
  const stabilityIsLoaded = stability.isLoaded;
  useEffect(() => {
    if (mastery.isLoaded && stabilityIsLoaded) {
      Object.values(mastery.state.words).forEach((w) => {
        if (w.status === 'mastered' && !stabilityWords[w.wordId]) {
          initializeWord(w.wordId);
        }
      });
    }
  }, [mastery.isLoaded, mastery.state.words, stabilityIsLoaded, stabilityWords, initializeWord]);

  // Get garden words (mastered words with stability)
  const gardenWords = useMemo(() => {
    const words = stability.allWordsWithStability.map((ws) => {
      const wordEntry = WORD_POOL.find((w) => w.id === ws.wordId);
      return wordEntry ? { wordEntry, stability: ws } : null;
    }).filter(Boolean) as { wordEntry: typeof WORD_POOL[0]; stability: WordStability }[];

    // Sort
    if (sortBy === 'stability') {
      words.sort((a, b) => a.stability.stability - b.stability.stability);
    } else if (sortBy === 'phase') {
      const phaseOrder = { seed: 0, sprout: 1, bloom: 2, crystal: 3 };
      words.sort((a, b) => phaseOrder[a.stability.phase] - phaseOrder[b.stability.phase]);
    } else {
      words.sort((a, b) => a.wordEntry.word.localeCompare(b.wordEntry.word));
    }

    return words;
  }, [stability.allWordsWithStability, sortBy]);

  const selectedWord = selectedWordId ? WORD_POOL.find((w) => w.id === selectedWordId) : null;
  const selectedStability = selectedWordId ? stability.getWordStability(selectedWordId) : null;

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, [headerOpacity]);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const handleWordPress = useCallback((wordId: string) => {
    setSelectedWordId(wordId);
    setShowDetail(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleStartReview = useCallback(() => {
    setShowDetail(false);
    router.push('/garden-review' as any);
  }, []);

  const wiltingCount = stability.stats.wilting;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[W.charcoal, '#0B0B0B', '#080808']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.gardenHeader, headerStyle]}>
          <View style={styles.gardenHeaderRow}>
            <Text style={styles.gardenHeaderIcon}>🌱</Text>
            <View>
              <Text style={styles.gardenHeaderTitle}>MEMORY GARDEN</Text>
              <Text style={styles.gardenHeaderSub}>Nurture your word retention</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <StatsCard
            label="Crystals"
            value={stability.stats.crystals}
            icon="✦"
            color={W.gardenCrystal}
            delay={0}
          />
          <StatsCard
            label="Blooms"
            value={stability.stats.blooms}
            icon="❖"
            color={W.gardenBloom}
            delay={60}
          />
          <StatsCard
            label="Sprouts"
            value={stability.stats.sprouts}
            icon="◈"
            color={W.gardenSprout}
            delay={120}
          />
          <StatsCard
            label="Seeds"
            value={stability.stats.seeds}
            icon="◇"
            color={W.gardenSeed}
            delay={180}
          />
        </View>

        {/* Average stability */}
        <View style={styles.avgStabilityContainer}>
          <View style={styles.avgStabilityHeader}>
            <Text style={styles.avgStabilityLabel}>Garden Health</Text>
            <Text style={[styles.avgStabilityValue, { color: getStabilityColor(stability.stats.avgStability) }]}>
              {Math.round(stability.stats.avgStability)}%
            </Text>
          </View>
          <AnimatedProgressBar
            progress={stability.stats.avgStability / 100}
            colors={[getStabilityColor(stability.stats.avgStability), getStabilityColor(stability.stats.avgStability) + 'CC'] as [string, string]}
            height={6}
            trackColor={W.zenBorder}
          />
        </View>

        {/* Polly Garden Helper - hovers near wilting words */}
        {wiltingCount > 0 && (
          <PollyGardenHelper
            wiltingWords={gardenWords
              .filter((item) => item.stability.stability < 25)
              .map((item) => item.wordEntry.word)
              .slice(0, 5)}
            onReviewPress={() => router.push('/garden-review' as any)}
          />
        )}

        {/* Quick review button */}
        <TouchableOpacity
          style={styles.quickReviewBtn}
          onPress={() => router.push('/garden-review' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[W.inkBlue, W.inkBlueDim]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.quickReviewIcon}>🧠</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quickReviewTitle}>Smart Review Session</Text>
            <Text style={styles.quickReviewSub}>
              {stability.stats.total > 0
                ? `${Math.min(10, stability.stats.total)} words prioritized by decay`
                : 'Master words to start reviewing'}
            </Text>
          </View>
          <Text style={styles.quickReviewArrow}>›</Text>
        </TouchableOpacity>

        {/* Sort controls */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>GARDEN · {gardenWords.length} WORDS</Text>
          <View style={styles.sortBtns}>
            {(['stability', 'phase', 'alpha'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
                onPress={() => setSortBy(s)}
              >
                <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                  {s === 'stability' ? '⬇ Decay' : s === 'phase' ? '◈ Phase' : 'A-Z'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Garden Grid */}
        {gardenWords.length > 0 ? (
          <View style={styles.gardenGrid}>
            {gardenWords.map((item, index) => (
              <GardenWordCrystal
                key={item.wordEntry.id}
                wordStability={item.stability}
                wordLabel={item.wordEntry.word}
                index={index}
                onPress={() => handleWordPress(item.wordEntry.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyGarden}>
            <Text style={styles.emptyGardenIcon}>🌱</Text>
            <Text style={styles.emptyGardenTitle}>Your Garden is Empty</Text>
            <Text style={styles.emptyGardenText}>
              Master words in game modes to plant seeds in your Memory Garden
            </Text>
          </View>
        )}
      </ScrollView>

      <GardenWordDetail
        word={selectedWord ?? null}
        stability={selectedStability}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onReview={handleStartReview}
      />
    </View>
  );
}

const CRYSTAL_SIZE = (SCREEN_WIDTH - 60) / 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: W.charcoal,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  gardenHeader: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  gardenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  gardenHeaderIcon: {
    fontSize: 32,
  },
  gardenHeaderTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  gardenHeaderSub: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    marginTop: 2,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: W.zenSurface + 'CC',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF15',
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  statsCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCardValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
  },
  statsCardLabel: {
    color: W.textTertiary,
    fontSize: 10,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Average stability
  avgStabilityContainer: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  avgStabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgStabilityLabel: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  avgStabilityValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
  },
  // Wilting alert
  wiltAlert: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.gardenWilt + '40',
    overflow: 'hidden',
    marginBottom: 12,
  },
  wiltAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  wiltAlertIcon: {
    fontSize: 24,
  },
  wiltAlertTitle: {
    color: W.gardenWilt,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  wiltAlertSub: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  wiltAlertArrow: {
    color: W.gardenWilt,
    fontSize: 22,
    fontWeight: Fonts.weights.bold,
  },
  // Quick review button
  quickReviewBtn: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickReviewIcon: {
    fontSize: 28,
  },
  quickReviewTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  quickReviewSub: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  quickReviewArrow: {
    color: W.paper,
    fontSize: 22,
    fontWeight: Fonts.weights.bold,
  },
  // Sort
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sortLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
  },
  sortBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  sortBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  sortBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlue + '60',
  },
  sortBtnText: {
    color: W.textTertiary,
    fontSize: 10,
    fontWeight: Fonts.weights.bold,
  },
  sortBtnTextActive: {
    color: W.inkBlueLight,
  },
  // Garden grid
  gardenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  crystalWrapper: {
    width: CRYSTAL_SIZE,
  },
  crystalCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radii.lg,
    borderWidth: 1,
    backgroundColor: W.zenSurface + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    position: 'relative',
    // Glass shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  crystalGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.lg,
  },
  crystalFrost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF05',
    borderRadius: Radii.lg,
  },
  crystalTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  wiltIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  wiltIcon: {
    fontSize: 10,
    color: W.gardenWilt,
  },
  crystalSymbol: {
    fontSize: 24,
    fontWeight: Fonts.weights.bold,
    marginBottom: 4,
  },
  crystalWord: {
    color: W.paper,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    textAlign: 'center',
    marginBottom: 4,
  },
  miniStabilityBar: {
    width: '80%',
    height: 3,
    backgroundColor: W.zenBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniStabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
  crystalPercent: {
    fontSize: 9,
    fontWeight: Fonts.weights.bold,
    marginTop: 3,
  },
  // Empty garden
  emptyGarden: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyGardenIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyGardenTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
  },
  emptyGardenText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: W.zenSurface,
    borderRadius: Radii.xxl,
    borderWidth: 1.5,
    padding: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  modalPhaseIcon: {
    fontSize: 36,
    fontWeight: Fonts.weights.bold,
  },
  modalWord: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
  },
  modalPhaseLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    marginTop: 2,
  },
  stabilitySection: {
    marginBottom: 18,
    gap: 8,
  },
  stabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stabilityLabel: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  stabilityValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
  },
  wiltWarning: {
    color: W.gardenWilt,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    marginTop: 4,
  },
  detailStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingVertical: 12,
    backgroundColor: W.charcoal,
    borderRadius: Radii.lg,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatValue: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.black,
  },
  detailStatLabel: {
    color: W.textTertiary,
    fontSize: 10,
    fontWeight: Fonts.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  detailStatDivider: {
    width: 1,
    height: 24,
  },
  meaningsList: {
    marginBottom: 18,
  },
  meaningsTitle: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  meaningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  meaningDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  meaningText: {
    color: W.paper,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  reviewBtn: {
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewBtnText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: W.charcoal,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  closeBtnText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold,
  },
});
