import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTextGeneration } from '@fastshot/ai';

import { Fonts, Radii } from '@/constants/theme';
import {
  ArenaColors,
  LEAGUE_TIERS,
  LEAGUE_ORDER,
  WORLD_EVENTS,
  generateEloLeaderboard,
  getMatchedRival,
  EloLeaderboardEntry,
  getNextLeagueTier,
} from '@/constants/arena';
import { useArena } from '@/hooks/useArena';
// XP hook available for future integration
// import { useXP } from '@/hooks/useXP';
import { WorldFeedTicker } from '@/components/arena/WorldFeedTicker';
import { LeagueBadge } from '@/components/arena/LeagueBadge';
import { RankUpAnimation } from '@/components/arena/RankUpAnimation';

// Arena Hub screen

// ─── Elo Leaderboard Row ─────────────────────────────────────────────────────
function EloRow({ entry, index }: { entry: EloLeaderboardEntry; index: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(40);

  useEffect(() => {
    opacity.value = withDelay(
      100 + index * 60,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    translateX.value = withDelay(
      100 + index * 60,
      withSpring(0, { damping: 16, stiffness: 140 }),
    );
  }, [opacity, translateX, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const tierConfig = LEAGUE_TIERS[entry.league];
  const rank = index + 1;

  return (
    <Animated.View style={animStyle}>
      <View
        style={[
          styles.eloRow,
          entry.isUser && { borderColor: ArenaColors.gold + '60', borderWidth: 1.5 },
        ]}
      >
        <LinearGradient
          colors={
            entry.isUser
              ? [ArenaColors.goldDim + '60', ArenaColors.bgCard]
              : [ArenaColors.bgCard, ArenaColors.bgCard]
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View style={[styles.eloRank, rank <= 3 && { backgroundColor: tierConfig.color + '15' }]}>
          {rank <= 3 ? (
            <Text style={styles.eloRankEmoji}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={[styles.eloRankNum, entry.isUser && { color: ArenaColors.gold }]}>
              {rank}
            </Text>
          )}
        </View>
        <View style={[styles.eloAvatar, { borderColor: tierConfig.color + '50' }]}>
          <Text style={styles.eloAvatarText}>{entry.avatar}</Text>
        </View>
        <View style={styles.eloInfo}>
          <View style={styles.eloNameRow}>
            <Text
              style={[
                styles.eloName,
                entry.isUser && { color: ArenaColors.gold, fontWeight: '900' as const },
              ]}
            >
              {entry.name}
            </Text>
            {entry.isUser && (
              <View style={styles.youPill}>
                <Text style={styles.youPillText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={styles.eloMeta}>
            W{entry.wins} · L{entry.losses}
            {entry.winStreak > 0 ? ` · 🔥${entry.winStreak}` : ''}
          </Text>
        </View>
        <View style={styles.eloScoreCol}>
          <Text style={[styles.eloScore, { color: tierConfig.color }]}>{entry.elo}</Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Arena Hub ──────────────────────────────────────────────────────────
export default function ArenaHubScreen() {
  const insets = useSafeAreaInsets();
  const { elo, league, wins, losses, winStreak, rankedUp, clearRankUp } = useArena();
  // XP data available for future integration
  const { generateText, data: eventNarrative, isLoading: narrativeLoading } = useTextGeneration();

  const tierConfig = LEAGUE_TIERS[league];
  const nextLeague = getNextLeagueTier(league);
  const nextTierConfig = nextLeague ? LEAGUE_TIERS[nextLeague] : null;

  // Calculate progress to next league
  const eloInCurrentTier = elo - tierConfig.minElo;
  const tierRange = tierConfig.maxElo - tierConfig.minElo + 1;
  const tierProgress = Math.min(eloInCurrentTier / tierRange, 1);

  const leaderboard = generateEloLeaderboard(elo);
  const userRank = leaderboard.findIndex((e) => e.isUser) + 1;

  // Animations
  const headerOpacity = useSharedValue(0);
  const arenaGlow = useSharedValue(0.3);
  const ctaScale = useSharedValue(1);
  const [eventBriefing, setEventBriefing] = useState<string | null>(null);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    arenaGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    ctaScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [headerOpacity, arenaGlow, ctaScale]);

  // Generate event narrative with AI
  useEffect(() => {
    const event = WORLD_EVENTS[0];
    const progress = Math.round((event.currentPoints / event.targetPoints) * 100);
    generateText(
      `You are a dramatic arena narrator for a vocabulary learning game called POLYPLEX. Write a brief, exciting 1-2 sentence daily briefing for the world event "${event.title}" (${event.theme}). The community has reached ${progress}% of the goal. Make it feel epic and urgent. Keep it under 30 words.`
    );
  }, []);

  useEffect(() => {
    if (eventNarrative) {
      setEventBriefing(eventNarrative);
    }
  }, [eventNarrative]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: arenaGlow.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const handleFindMatch = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const rival = getMatchedRival(elo);
    router.push({
      pathname: '/arena-vs',
      params: { rivalId: rival.id },
    } as any);
  }, [elo]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[ArenaColors.violetDim, ArenaColors.bg, ArenaColors.bgDeep]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 0.5 }}
      />

      {/* Rank-up animation overlay */}
      {rankedUp && (
        <RankUpAnimation
          visible={!!rankedUp}
          fromLeague={rankedUp.from}
          toLeague={rankedUp.to}
          onDismiss={clearRankUp}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.headerLabel}>THE GLOBAL</Text>
          <Text style={styles.headerTitle}>ARENA</Text>
          <View style={styles.headerDivider}>
            <View style={[styles.dividerLine, { backgroundColor: ArenaColors.gold + '40' }]} />
            <Text style={styles.headerSub}>⚔️ Championship Stage ⚔️</Text>
            <View style={[styles.dividerLine, { backgroundColor: ArenaColors.gold + '40' }]} />
          </View>
        </Animated.View>

        {/* Player Card */}
        <Animated.View style={[styles.playerCard, glowStyle, { shadowColor: tierConfig.color }]}>
          <LinearGradient
            colors={[tierConfig.colorDim + 'aa', ArenaColors.bgCard, ArenaColors.bgCard]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.playerCardBorder, { borderColor: tierConfig.color + '30' }]} />

          <View style={styles.playerTop}>
            <LeagueBadge league={league} size="lg" />
            <View style={styles.playerStats}>
              <View style={styles.playerStatRow}>
                <Text style={styles.playerStatLabel}>ELO RATING</Text>
                <Text style={[styles.playerStatValue, { color: tierConfig.color }]}>{elo}</Text>
              </View>
              <View style={styles.playerStatRow}>
                <Text style={styles.playerStatLabel}>GLOBAL RANK</Text>
                <Text style={[styles.playerStatValue, { color: ArenaColors.gold }]}>#{userRank}</Text>
              </View>
              <View style={styles.playerStatRow}>
                <Text style={styles.playerStatLabel}>RECORD</Text>
                <Text style={styles.playerStatValueSmall}>
                  <Text style={{ color: ArenaColors.neonGreen }}>{wins}W</Text>
                  {' · '}
                  <Text style={{ color: ArenaColors.rivalRed }}>{losses}L</Text>
                  {winStreak > 0 ? ` · 🔥${winStreak}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* League Progress */}
          {nextTierConfig && (
            <View style={styles.leagueProgress}>
              <View style={styles.leagueProgressHeader}>
                <Text style={[styles.leagueProgressLabel, { color: tierConfig.color }]}>
                  {tierConfig.icon} {tierConfig.label}
                </Text>
                <Text style={styles.leagueProgressElo}>
                  {elo} / {tierConfig.maxElo + 1}
                </Text>
                <Text style={[styles.leagueProgressLabel, { color: nextTierConfig.color }]}>
                  {nextTierConfig.icon} {nextTierConfig.label}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[tierConfig.color, nextTierConfig.color]}
                  style={[styles.progressBar, { width: `${tierProgress * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Find Match CTA */}
        <Animated.View style={ctaStyle}>
          <TouchableOpacity
            style={styles.matchBtn}
            onPress={handleFindMatch}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ArenaColors.rivalRed, '#FF2020']}
              style={styles.matchBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.matchBtnIcon}>⚔️</Text>
              <View>
                <Text style={styles.matchBtnText}>FIND A DUEL</Text>
                <Text style={styles.matchBtnSub}>1v1 Lexical Combat</Text>
              </View>
            </LinearGradient>
            <View style={styles.matchBtnGlow} />
          </TouchableOpacity>
        </Animated.View>

        {/* League Tiers Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEAGUE TIERS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tiersRow}
          >
            {LEAGUE_ORDER.map((tierId) => {
              const tier = LEAGUE_TIERS[tierId];
              const isActive = tierId === league;
              return (
                <View
                  key={tierId}
                  style={[
                    styles.tierCard,
                    isActive && { borderColor: tier.color + '80', borderWidth: 2 },
                  ]}
                >
                  <LinearGradient
                    colors={[tier.colorDim + '60', ArenaColors.bgCard]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.tierIcon}>{tier.icon}</Text>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.label}</Text>
                  <Text style={styles.tierElo}>{tier.minElo}+</Text>
                  {isActive && (
                    <View style={[styles.activePill, { backgroundColor: tier.color + '20', borderColor: tier.color + '50' }]}>
                      <Text style={[styles.activePillText, { color: tier.color }]}>CURRENT</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* World Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WORLD EVENTS</Text>
          {WORLD_EVENTS.map((event) => {
            const progress = event.currentPoints / event.targetPoints;
            return (
              <View key={event.id} style={[styles.eventCard, { borderColor: event.accentColor + '30' }]}>
                <LinearGradient
                  colors={[event.accentColor + '10', ArenaColors.bgCard]}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                  <View style={styles.eventHeaderText}>
                    <Text style={[styles.eventTitle, { color: event.accentColor }]}>{event.title}</Text>
                    <Text style={styles.eventTheme}>{event.theme}</Text>
                  </View>
                  <View style={[styles.eventBadge, { backgroundColor: event.accentColor + '20' }]}>
                    <Text style={[styles.eventBadgeText, { color: event.accentColor }]}>
                      {Math.round(progress * 100)}%
                    </Text>
                  </View>
                </View>

                {/* AI-generated briefing */}
                {event.id === 'evt_1' && eventBriefing && (
                  <Text style={styles.eventBriefing}>{eventBriefing}</Text>
                )}
                {event.id === 'evt_1' && narrativeLoading && (
                  <Text style={styles.eventBriefingLoading}>Loading briefing...</Text>
                )}
                {event.id !== 'evt_1' && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}

                <View style={styles.eventProgressTrack}>
                  <LinearGradient
                    colors={[event.accentColor, event.accentColor + 'aa']}
                    style={[styles.eventProgressBar, { width: `${progress * 100}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <View style={styles.eventFooter}>
                  <Text style={styles.eventPoints}>
                    {event.currentPoints.toLocaleString()} / {event.targetPoints.toLocaleString()} LP
                  </Text>
                  <Text style={styles.eventReward}>🏆 {event.reward}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Elo Leaderboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ELO RANKINGS</Text>
            <Text style={styles.sectionSub}>Global Standings</Text>
          </View>
          <View style={styles.leaderboardList}>
            {leaderboard.slice(0, 8).map((entry, index) => (
              <EloRow key={entry.id} entry={entry} index={index} />
            ))}
          </View>
        </View>

        {/* Community Tomes Button */}
        <TouchableOpacity
          style={styles.tomesBtn}
          onPress={() => router.push('/arena-tomes' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ArenaColors.violetDim, ArenaColors.bgCard]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.tomesBtnContent}>
            <Text style={styles.tomesBtnIcon}>📚</Text>
            <View style={styles.tomesBtnText}>
              <Text style={styles.tomesBtnTitle}>COMMUNITY TOMES</Text>
              <Text style={styles.tomesBtnSub}>Browse specialized word packs</Text>
            </View>
            <Text style={styles.tomesBtnArrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* World Feed Ticker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WORLD FEED</Text>
          <WorldFeedTicker />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ArenaColors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: {
    color: ArenaColors.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 6,
  },
  headerTitle: {
    color: ArenaColors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginTop: -2,
    textShadowColor: '#FFD70040',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  dividerLine: {
    height: 1,
    width: 40,
  },
  headerSub: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  // Player Card
  playerCard: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 14,
  },
  playerCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  playerStats: {
    flex: 1,
    gap: 8,
  },
  playerStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  playerStatLabel: {
    color: ArenaColors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  playerStatValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '900',
  },
  playerStatValueSmall: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
  },
  leagueProgress: {
    marginTop: 16,
    gap: 6,
  },
  leagueProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueProgressLabel: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '700',
  },
  leagueProgressElo: {
    color: ArenaColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: ArenaColors.border,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Radii.full,
  },
  // Find Match
  matchBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  matchBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 16,
  },
  matchBtnIcon: {
    fontSize: 32,
  },
  matchBtnText: {
    color: '#fff',
    fontSize: Fonts.sizes.lg,
    fontWeight: '900',
    letterSpacing: 2,
  },
  matchBtnSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    marginTop: 1,
  },
  matchBtnGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#FF4B4B40',
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  sectionSub: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
  },
  // League Tiers
  tiersRow: {
    gap: 10,
    paddingRight: 20,
  },
  tierCard: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: ArenaColors.border,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  tierIcon: {
    fontSize: 28,
  },
  tierName: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierElo: {
    color: ArenaColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  activePill: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // World Events
  eventCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  eventIcon: {
    fontSize: 28,
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '800',
  },
  eventTheme: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
    marginTop: 1,
  },
  eventBadge: {
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  eventBadgeText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '900',
  },
  eventBriefing: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 10,
  },
  eventBriefingLoading: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  eventDescription: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    marginBottom: 10,
  },
  eventProgressTrack: {
    height: 6,
    backgroundColor: ArenaColors.border,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  eventProgressBar: {
    height: '100%',
    borderRadius: Radii.full,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPoints: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
  },
  eventReward: {
    color: ArenaColors.gold,
    fontSize: Fonts.sizes.xs,
    fontWeight: '700',
  },
  // Leaderboard
  leaderboardList: {
    gap: 6,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF10',
    overflow: 'hidden',
    padding: 10,
  },
  eloRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eloRankEmoji: {
    fontSize: 16,
  },
  eloRankNum: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: '900',
  },
  eloAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ArenaColors.bgCardAlt,
    marginRight: 8,
  },
  eloAvatarText: {
    fontSize: 14,
  },
  eloInfo: {
    flex: 1,
    gap: 1,
  },
  eloNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eloName: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
  },
  youPill: {
    backgroundColor: ArenaColors.gold + '20',
    borderWidth: 1,
    borderColor: ArenaColors.gold + '50',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  youPillText: {
    color: ArenaColors.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  eloMeta: {
    color: ArenaColors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  eloScoreCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  eloScore: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '900',
  },
  eloLabel: {
    color: ArenaColors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Community Tomes
  tomesBtn: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: ArenaColors.violet + '30',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tomesBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  tomesBtnIcon: {
    fontSize: 28,
  },
  tomesBtnText: {
    flex: 1,
  },
  tomesBtnTitle: {
    color: ArenaColors.violet,
    fontSize: Fonts.sizes.md,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tomesBtnSub: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  tomesBtnArrow: {
    color: ArenaColors.violet,
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
  },
});
