import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Radii } from '@/constants/theme';
import { useXP } from '@/hooks/useXP';
import { useMastery } from '@/hooks/useMastery';
import { useWordPacks } from '@/hooks/useWordPacks';
import { MASTERY_TIER_CONFIG, getPlayerTitle } from '@/constants/mastery';
import { WORD_POOL, WordEntry } from '@/constants/words';
import { getPackForWord } from '@/constants/packs';
import { PACK_MILESTONES } from '@/constants/milestones';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';

const CARD_HEIGHT = 110;

interface MasteredWordInfo {
  word: WordEntry;
  masteredAt: number;
  difficulty: string;
  difficultyOrder: number;
}

function GlassCard({ children, style, borderColor }: {
  children: React.ReactNode;
  style?: object;
  borderColor?: string;
}) {
  return (
    <View style={[styles.glassCard, { borderColor: borderColor || Colors.borderLight + '80' }, style]}>
      <LinearGradient
        colors={[Colors.bgCard + 'E8', Colors.bgCardAlt + 'D0']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glassSheen} />
      {children}
    </View>
  );
}

function AnimatedHallOfFameCard({
  item,
  index,
  rank,
}: {
  item: MasteredWordInfo;
  index: number;
  rank: number;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);

  useEffect(() => {
    opacity.value = withDelay(
      200 + index * 120,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
    );
    translateX.value = withDelay(
      200 + index * 120,
      withSpring(0, { damping: 16, stiffness: 130 }),
    );
  }, [opacity, translateX, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const diffColors: Record<string, string> = {
    Easy: Colors.easy,
    Medium: Colors.medium,
    Hard: Colors.hard,
    Expert: Colors.expert,
  };
  const accentColor = diffColors[item.difficulty] ?? Colors.accent;
  const packs = getPackForWord(item.word.id);
  const packName = packs.length > 0 ? packs[0].name : null;

  const rankEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '✦';

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => Haptics.selectionAsync()}
      >
        <GlassCard borderColor={accentColor + '50'}>
          <View style={styles.hofCardContent}>
            <View style={[styles.hofRankBadge, { backgroundColor: accentColor + '20' }]}>
              <Text style={styles.hofRankEmoji}>{rankEmoji}</Text>
              <Text style={[styles.hofRankText, { color: accentColor }]}>#{rank}</Text>
            </View>
            <View style={styles.hofWordInfo}>
              <Text style={[styles.hofWordText, { color: accentColor }]}>
                {item.word.word}
              </Text>
              <Text style={styles.hofCategory}>{item.word.category}</Text>
              <View style={styles.hofMeta}>
                <View style={[styles.hofDiffBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '50' }]}>
                  <Text style={[styles.hofDiffText, { color: accentColor }]}>{item.difficulty}</Text>
                </View>
                {packName && (
                  <Text style={styles.hofPackText}>{packs[0].icon} {packName}</Text>
                )}
              </View>
            </View>
            <View style={styles.hofMasteredBadge}>
              <Text style={styles.hofMasteredIcon}>✦</Text>
              <Text style={styles.hofMasteredLabel}>MASTERED</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { totalXP, level, progress } = useXP();
  const mastery = useMastery();
  const wordPacks = useWordPacks();
  const tier = mastery.tier;
  const tierConfig = MASTERY_TIER_CONFIG[tier];
  const titleInfo = getPlayerTitle(level);

  // Animations
  const headerScale = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    headerScale.value = withSpring(1, { damping: 14, stiffness: 100 });
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [headerScale, headerOpacity, shimmer]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.05, 0.15]),
  }));

  // Haptic feedback on scroll
  const lastHapticIndex = useRef(-1);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const cardIndex = Math.floor((y - 350) / CARD_HEIGHT);
    if (cardIndex >= 0 && cardIndex !== lastHapticIndex.current) {
      lastHapticIndex.current = cardIndex;
      Haptics.selectionAsync();
    }
  };

  // Top 5 mastered words - sorted by difficulty (hardest first), then recency
  const hallOfFame: MasteredWordInfo[] = useMemo(() => {
    const diffOrder: Record<string, number> = { Expert: 4, Hard: 3, Medium: 2, Easy: 1 };
    const masteredWords: MasteredWordInfo[] = [];

    for (const word of WORD_POOL) {
      const data = mastery.getWordStatus(word.id);
      if (data.status === 'mastered') {
        masteredWords.push({
          word,
          masteredAt: data.masteredAt ?? 0,
          difficulty: word.difficulty,
          difficultyOrder: diffOrder[word.difficulty] ?? 0,
        });
      }
    }

    // Sort: hardest first, then most recently mastered
    masteredWords.sort((a, b) => {
      if (b.difficultyOrder !== a.difficultyOrder) return b.difficultyOrder - a.difficultyOrder;
      return b.masteredAt - a.masteredAt;
    });

    return masteredWords.slice(0, 5);
  }, [mastery]);

  // Pack milestones with completion status
  const packMilestones = useMemo(() => {
    return PACK_MILESTONES.map((milestone) => {
      const progress = wordPacks.getPackProgress(milestone.packId);
      return {
        ...milestone,
        progress,
        completed: progress.ratio >= 1,
      };
    });
  }, [wordPacks]);

  const handleShareMilestone = async (message: string) => {
    try {
      await Share.share({ message });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // User cancelled share
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[tierConfig.colorDim, Colors.bg, Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {/* Profile Header Card */}
        <Animated.View style={headerAnimStyle}>
          <GlassCard borderColor={tierConfig.color + '50'} style={styles.profileHeaderCard}>
            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmerOverlay, shimmerStyle, { backgroundColor: tierConfig.color }]} />

            <View style={styles.profileTop}>
              <View style={[styles.avatarContainer, { borderColor: tierConfig.color }]}>
                <LinearGradient
                  colors={[tierConfig.colorDim, Colors.bgCard]}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.avatarIcon}>{tierConfig.icon}</Text>
              </View>
              <View style={styles.profileTitleArea}>
                <Text style={[styles.profileTitle, { color: tierConfig.color }]}>{titleInfo.title}</Text>
                <View style={[styles.tierPill, { backgroundColor: tierConfig.colorDim, borderColor: tierConfig.color + '60' }]}>
                  <Text style={[styles.tierPillText, { color: tierConfig.color }]}>
                    {tierConfig.icon} {tierConfig.label} Tier
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: Colors.gold }]}>{totalXP}</Text>
                <Text style={styles.statBoxLabel}>LEX-POINTS</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: Colors.accent }]}>{level}</Text>
                <Text style={styles.statBoxLabel}>LEVEL</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: tierConfig.color }]}>{mastery.state.totalMastered}</Text>
                <Text style={styles.statBoxLabel}>MASTERED</Text>
              </View>
            </View>

            {/* XP Progress */}
            <View style={styles.xpProgressRow}>
              <AnimatedProgressBar
                progress={progress}
                colors={[Colors.gold, Colors.goldLight]}
                height={5}
                trackColor={Colors.bgCardBorder}
              />
              <Text style={styles.xpProgressLabel}>{Math.round(progress * 100)}% to LVL {level + 1}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Hall of Fame Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🏛️</Text>
            <View>
              <Text style={styles.sectionTitle}>HALL OF FAME</Text>
              <Text style={styles.sectionSubtitle}>Your Top 5 Mastered Words</Text>
            </View>
          </View>
        </View>

        {hallOfFame.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>No Words Mastered Yet</Text>
              <Text style={styles.emptySubtitle}>
                Master words by answering correctly 3 times across any game mode
              </Text>
            </View>
          </GlassCard>
        ) : (
          <View style={styles.hofList}>
            {hallOfFame.map((item, index) => (
              <AnimatedHallOfFameCard
                key={item.word.id}
                item={item}
                index={index}
                rank={index + 1}
              />
            ))}
          </View>
        )}

        {/* Milestones Section */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🏆</Text>
            <View>
              <Text style={styles.sectionTitle}>MILESTONES</Text>
              <Text style={styles.sectionSubtitle}>Pack completion achievements</Text>
            </View>
          </View>
        </View>

        <View style={styles.milestoneList}>
          {packMilestones.map((milestone) => (
            <GlassCard
              key={milestone.id}
              borderColor={milestone.completed ? milestone.color + '60' : Colors.borderLight}
            >
              <View style={styles.milestoneContent}>
                <View style={styles.milestoneLeft}>
                  <View style={[styles.milestoneIconBox, {
                    backgroundColor: milestone.completed ? milestone.color + '20' : Colors.bgCardBorder + '60',
                  }]}>
                    <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneName, milestone.completed && { color: milestone.color }]}>
                      {milestone.title}
                    </Text>
                    <Text style={styles.milestoneDesc}>{milestone.subtitle}</Text>
                    <View style={styles.milestoneProgress}>
                      <AnimatedProgressBar
                        progress={milestone.progress.ratio}
                        colors={milestone.completed
                          ? [milestone.color, milestone.color + 'CC'] as [string, string]
                          : [Colors.textMuted, Colors.textMuted] as [string, string]
                        }
                        height={3}
                        trackColor={Colors.bgCardBorder}
                      />
                      <Text style={[styles.milestoneProgressText, milestone.completed && { color: milestone.color }]}>
                        {milestone.progress.mastered}/{milestone.progress.total}
                      </Text>
                    </View>
                  </View>
                </View>
                {milestone.completed && (
                  <TouchableOpacity
                    style={[styles.shareBtn, { backgroundColor: milestone.color + '20', borderColor: milestone.color + '50' }]}
                    onPress={() => handleShareMilestone(milestone.shareMessage)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.shareBtnText, { color: milestone.color }]}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Glass Card Base - Premium Glassmorphism
  glassCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  glassSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#FFFFFF08',
  },
  // Profile Header Card
  profileHeaderCard: {
    padding: 24,
    marginBottom: 8,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.xl,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontSize: 36,
  },
  profileTitleArea: {
    flex: 1,
    gap: 6,
  },
  profileTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: -0.5,
  },
  tierPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tierPillText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg + '60',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
  },
  statBoxLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  xpProgressRow: {
    gap: 4,
  },
  xpProgressLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    textAlign: 'right',
  },
  // Section Header
  sectionHeader: {
    marginTop: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    fontSize: 28,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
    marginTop: 1,
  },
  // Hall of Fame
  hofList: {
    gap: 10,
  },
  hofCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  hofRankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hofRankEmoji: {
    fontSize: 18,
  },
  hofRankText: {
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    marginTop: -2,
  },
  hofWordInfo: {
    flex: 1,
    gap: 3,
  },
  hofWordText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
    letterSpacing: -0.3,
  },
  hofCategory: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  hofMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  hofDiffBadge: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hofDiffText: {
    fontSize: 10,
    fontWeight: Fonts.weights.bold,
  },
  hofPackText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.medium,
  },
  hofMasteredBadge: {
    alignItems: 'center',
    gap: 2,
  },
  hofMasteredIcon: {
    color: Colors.gold,
    fontSize: 16,
  },
  hofMasteredLabel: {
    color: Colors.gold,
    fontSize: 8,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  // Empty state
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Milestones
  milestoneList: {
    gap: 10,
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  milestoneIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIcon: {
    fontSize: 22,
  },
  milestoneInfo: {
    flex: 1,
    gap: 3,
  },
  milestoneName: {
    color: Colors.text,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.bold,
  },
  milestoneDesc: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    lineHeight: 16,
  },
  milestoneProgress: {
    marginTop: 4,
    gap: 2,
  },
  milestoneProgressText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.bold,
    textAlign: 'right',
  },
  shareBtn: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  shareBtnText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
});
