import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useXP } from '@/hooks/useXP';
import { useMastery } from '@/hooks/useMastery';
import { MASTERY_TIER_CONFIG, MasteryTier } from '@/constants/mastery';
import { buildLeaderboard, LeaderboardEntry } from '@/constants/ghostPlayers';

const TIER_COLORS: Record<MasteryTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#F0B429',
  amethyst: '#A855F7',
};

function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(40);

  useEffect(() => {
    opacity.value = withDelay(
      80 + index * 70,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    translateX.value = withDelay(
      80 + index * 70,
      withSpring(0, { damping: 16, stiffness: 140 }),
    );
  }, [opacity, translateX, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const isUser = !entry.isGhost;
  const tierColor = TIER_COLORS[entry.tier];
  const isTop3 = entry.rank <= 3;

  const rankEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <Animated.View style={animStyle}>
      <View
        style={[
          styles.leaderboardRow,
          isUser && styles.leaderboardRowUser,
          isUser && { borderColor: Colors.accent + '60' },
          isTop3 && !isUser && { borderColor: tierColor + '30' },
        ]}
      >
        <LinearGradient
          colors={
            isUser
              ? [Colors.accentDim + '80', Colors.bgCard]
              : [Colors.bgCard, Colors.bgCard]
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Rank */}
        <View style={[styles.rankColumn, isTop3 && { backgroundColor: tierColor + '15' }]}>
          {isTop3 ? (
            <Text style={styles.rankEmoji}>{rankEmojis[entry.rank]}</Text>
          ) : (
            <Text style={[styles.rankNumber, isUser && { color: Colors.accent }]}>
              {entry.rank}
            </Text>
          )}
        </View>

        {/* Avatar & Name */}
        <View style={styles.playerInfo}>
          <View style={[styles.avatarSmall, { backgroundColor: tierColor + '20', borderColor: tierColor + '40' }]}>
            <Text style={styles.avatarSmallText}>{entry.avatar}</Text>
          </View>
          <View style={styles.nameColumn}>
            <View style={styles.nameRow}>
              <Text style={[styles.playerName, isUser && { color: Colors.accent, fontWeight: Fonts.weights.black }]}>
                {entry.name}
              </Text>
              {isUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
              {entry.isGhost && (
                <View style={styles.ghostBadge}>
                  <Text style={styles.ghostBadgeText}>👻</Text>
                </View>
              )}
            </View>
            <Text style={styles.playerMeta}>
              LVL {entry.level} · {entry.wordsMastered} words
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreColumn}>
          <Text style={[styles.scoreValue, { color: tierColor }]}>{entry.xp.toLocaleString()}</Text>
          <Text style={styles.scoreLabel}>LP</Text>
        </View>

        {/* Tier Badge */}
        <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
      </View>
    </Animated.View>
  );
}

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const { totalXP, level } = useXP();
  const mastery = useMastery();
  const tier = mastery.tier;
  const tierConfig = MASTERY_TIER_CONFIG[tier];

  const headerOpacity = useSharedValue(0);
  const crownBounce = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    crownBounce.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [headerOpacity, crownBounce]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const crownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: crownBounce.value }],
  }));

  const leaderboard = useMemo(() => {
    return buildLeaderboard(totalXP, level, mastery.state.totalMastered, tier);
  }, [totalXP, level, mastery.state.totalMastered, tier]);

  const userEntry = leaderboard.find((e) => !e.isGhost);
  const userRank = userEntry?.rank ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#1A0D30', Colors.bg, Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Animated.View style={crownStyle}>
            <Text style={styles.headerCrown}>👑</Text>
          </Animated.View>
          <Text style={styles.headerTitle}>RANKINGS</Text>
          <Text style={styles.headerSubtitle}>Lex-Point Leaderboard</Text>
        </Animated.View>

        {/* User Rank Card */}
        <View style={[styles.userRankCard, { borderColor: tierConfig.color + '50' }]}>
          <LinearGradient
            colors={[tierConfig.colorDim, Colors.bgCard]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.userRankContent}>
            <View style={styles.userRankLeft}>
              <Text style={styles.userRankLabel}>YOUR RANK</Text>
              <View style={styles.userRankRow}>
                <Text style={[styles.userRankNumber, { color: tierConfig.color }]}>
                  #{userRank}
                </Text>
                <Text style={styles.userRankOf}>of {leaderboard.length}</Text>
              </View>
            </View>
            <View style={styles.userRankRight}>
              <Text style={[styles.userRankXP, { color: Colors.gold }]}>{totalXP.toLocaleString()}</Text>
              <Text style={styles.userRankXPLabel}>Lex-Points</Text>
            </View>
          </View>
          <View style={styles.userRankTierRow}>
            <View style={[styles.userRankTierPill, { backgroundColor: tierConfig.color + '20', borderColor: tierConfig.color + '50' }]}>
              <Text style={[styles.userRankTierText, { color: tierConfig.color }]}>
                {tierConfig.icon} {tierConfig.label} Tier
              </Text>
            </View>
            <Text style={styles.userRankWords}>{mastery.state.totalMastered} words mastered</Text>
          </View>
        </View>

        {/* Leaderboard List */}
        <View style={styles.leaderboardHeader}>
          <Text style={styles.leaderboardTitle}>LEADERBOARD</Text>
          <Text style={styles.leaderboardWeek}>Updates weekly</Text>
        </View>

        <View style={styles.leaderboardList}>
          {leaderboard.map((entry, index) => (
            <LeaderboardRow key={entry.id} entry={entry} index={index} />
          ))}
        </View>

        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimerText}>
            👻 Ghost players are AI personas that simulate competitive ranking
          </Text>
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
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerCrown: {
    fontSize: 40,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: 3,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    marginTop: 2,
  },
  // User Rank Card
  userRankCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    padding: 20,
    marginBottom: 24,
    ...Shadows.card,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userRankLeft: {
    gap: 4,
  },
  userRankLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  userRankRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  userRankNumber: {
    fontSize: 42,
    fontWeight: Fonts.weights.black,
    letterSpacing: -1,
  },
  userRankOf: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
  },
  userRankRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  userRankXP: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
  },
  userRankXPLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
  userRankTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRankTierPill: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  userRankTierText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  userRankWords: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  // Leaderboard
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  leaderboardTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  leaderboardWeek: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  leaderboardList: {
    gap: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    overflow: 'hidden',
    padding: 12,
    position: 'relative',
  },
  leaderboardRowUser: {
    borderWidth: 1.5,
  },
  rankColumn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.black,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 16,
  },
  nameColumn: {
    flex: 1,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    color: Colors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  youBadge: {
    backgroundColor: Colors.accent + '25',
    borderWidth: 1,
    borderColor: Colors.accent + '60',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youBadgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  ghostBadge: {
    opacity: 0.5,
  },
  ghostBadgeText: {
    fontSize: 10,
  },
  playerMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.medium,
  },
  scoreColumn: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 1,
  },
  scoreValue: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.black,
  },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  disclaimerRow: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disclaimerText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
