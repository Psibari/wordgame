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
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTextGeneration } from '@fastshot/ai';

import { Fonts, Radii } from '@/constants/theme';
import {
  ArenaColors,
  DuelResult,
  DuelRoundResult,
  LEAGUE_TIERS,
  getMatchedRival,
  getLeagueTier,
} from '@/constants/arena';
import { useArena } from '@/hooks/useArena';
import { VictoryFlares } from '@/components/arena/VictoryFlares';
import { LeagueBadge } from '@/components/arena/LeagueBadge';
import { PollyPostMatchCommentary } from '@/components/polly/PollyArenaCoach';
import { ParallaxParticles } from '@/components/ParallaxParticles';
import { HapticManager } from '@/utils/haptics';

export default function ArenaPostMatchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ result: string }>();
  const { saveDuelResult, elo } = useArena();
  const { generateText, data: aiSummary } = useTextGeneration();

  const [duelResult, setDuelResult] = useState<DuelResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [matchSummary, setMatchSummary] = useState<string | null>(null);

  // Animations
  const headerOpacity = useSharedValue(0);
  const resultsOpacity = useSharedValue(0);
  const roundsOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const eloChangeScale = useSharedValue(0);

  useEffect(() => {
    try {
      if (params.result) {
        const parsed = JSON.parse(params.result) as DuelResult;
        setDuelResult(parsed);
      }
    } catch {
      // Error parsing, go back
      router.back();
    }
  }, [params.result]);

  // Save duel result
  useEffect(() => {
    if (!duelResult || saved) return;
    saveDuelResult(duelResult);
    setSaved(true);

    if (duelResult.userWon) {
      setShowVictory(true);
      HapticManager.victoryCascade();
    } else {
      HapticManager.dullThud();
    }

    // Animations
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    resultsOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    eloChangeScale.value = withDelay(600, withSpring(1, { damping: 6, stiffness: 200 }));
    roundsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    buttonsOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    // Generate AI match summary
    const fastestUser = duelResult.rounds
      .filter(r => r.userCorrect && r.userTime > 0)
      .sort((a, b) => a.userTime - b.userTime)[0];

    generateText(
      `You are a dramatic sports commentator for a vocabulary duel game. The player ${duelResult.userWon ? 'won' : 'lost'} against ${duelResult.rivalName}. Score: ${duelResult.userScore}-${duelResult.rivalScore}. ${fastestUser ? `Fastest answer: "${fastestUser.word}" in ${(fastestUser.userTime / 1000).toFixed(1)}s.` : ''} Write a 1-2 sentence dramatic post-match commentary. Keep it under 25 words. Don't use quotes.`
    );
  }, [duelResult, saved, saveDuelResult, headerOpacity, resultsOpacity, eloChangeScale, roundsOpacity, buttonsOpacity]);

  useEffect(() => {
    if (aiSummary) {
      setMatchSummary(aiSummary);
    }
  }, [aiSummary]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const resultsStyle = useAnimatedStyle(() => ({ opacity: resultsOpacity.value }));
  const eloStyle = useAnimatedStyle(() => ({ transform: [{ scale: eloChangeScale.value }] }));
  const roundsStyle = useAnimatedStyle(() => ({ opacity: roundsOpacity.value }));
  const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));

  const handleRematch = useCallback(() => {
    if (!duelResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.replace({
      pathname: '/arena-vs',
      params: { rivalId: duelResult.rivalId },
    } as any);
  }, [duelResult]);

  const handleNewOpponent = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newRival = getMatchedRival(elo);
    router.replace({
      pathname: '/arena-vs',
      params: { rivalId: newRival.id },
    } as any);
  }, [elo]);

  const handleBack = useCallback(() => {
    router.dismiss();
  }, []);

  if (!duelResult) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[ArenaColors.bgDeep, ArenaColors.bg]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </View>
    );
  }

  const isWin = duelResult.userWon;
  const eloChangeSign = duelResult.eloChange >= 0 ? '+' : '';
  const newLeague = getLeagueTier(duelResult.userElo);
  const leagueConfig = LEAGUE_TIERS[newLeague];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[
          isWin ? '#0A2A1A' : '#2A0A0A',
          ArenaColors.bg,
          ArenaColors.bgDeep,
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />

      <VictoryFlares
        visible={showVictory}
        onDone={() => setShowVictory(false)}
        color={ArenaColors.gold}
      />

      {/* Parallax particle effect for winners */}
      <ParallaxParticles
        visible={isWin}
        color="gold"
        count={25}
        speed="slow"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.headerEmoji}>{isWin ? '🏆' : '⚔️'}</Text>
          <Text
            style={[
              styles.headerTitle,
              { color: isWin ? ArenaColors.gold : ArenaColors.rivalRed },
            ]}
          >
            {isWin ? 'VICTORY!' : 'DEFEAT'}
          </Text>
          <Text style={styles.headerSub}>
            vs {duelResult.rivalName} {duelResult.rivalAvatar}
          </Text>
          {matchSummary && (
            <Text style={styles.aiSummary}>{matchSummary}</Text>
          )}
        </Animated.View>

        {/* Polly's Post-Match Commentary */}
        <PollyPostMatchCommentary
          won={isWin}
          userScore={duelResult.userScore}
          rivalScore={duelResult.rivalScore}
          rivalName={duelResult.rivalName}
        />

        {/* Score Summary */}
        <Animated.View style={[styles.scoreCard, resultsStyle]}>
          <LinearGradient
            colors={[ArenaColors.bgCard, ArenaColors.bgCardAlt]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scoreSummary}>
            <View style={styles.scorePlayerCol}>
              <Text style={styles.scorePlayerAvatar}>⭐</Text>
              <Text style={styles.scorePlayerName}>You</Text>
              <Text
                style={[
                  styles.scoreBig,
                  { color: ArenaColors.neonCyan },
                ]}
              >
                {duelResult.userScore}
              </Text>
            </View>

            <View style={styles.scoreDivider}>
              <Text style={styles.scoreDividerText}>—</Text>
            </View>

            <View style={styles.scorePlayerCol}>
              <Text style={styles.scorePlayerAvatar}>{duelResult.rivalAvatar}</Text>
              <Text style={styles.scorePlayerName}>{duelResult.rivalName}</Text>
              <Text
                style={[
                  styles.scoreBig,
                  { color: ArenaColors.rivalRed },
                ]}
              >
                {duelResult.rivalScore}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Elo Change */}
        <Animated.View style={[styles.eloCard, eloStyle]}>
          <LinearGradient
            colors={[
              isWin ? '#0A2A1A' : '#2A0A0A',
              ArenaColors.bgCard,
            ]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.eloRow}>
            <View style={styles.eloLeft}>
              <Text style={styles.eloLabel}>ELO CHANGE</Text>
              <Text
                style={[
                  styles.eloChange,
                  {
                    color: duelResult.eloChange >= 0
                      ? ArenaColors.neonGreen
                      : ArenaColors.rivalRed,
                  },
                ]}
              >
                {eloChangeSign}{duelResult.eloChange}
              </Text>
            </View>
            <View style={styles.eloRight}>
              <Text style={styles.eloLabel}>NEW RATING</Text>
              <Text style={[styles.eloNew, { color: leagueConfig.color }]}>
                {duelResult.userElo}
              </Text>
            </View>
            <LeagueBadge league={newLeague} size="sm" showLabel={false} />
          </View>
        </Animated.View>

        {/* Round-by-round breakdown */}
        <Animated.View style={roundsStyle}>
          <Text style={styles.sectionTitle}>ROUND BREAKDOWN</Text>
          <View style={styles.roundsList}>
            {duelResult.rounds.map((round, i) => (
              <RoundRow key={round.questionId} round={round} index={i} />
            ))}
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsStyle]}>
          <TouchableOpacity
            style={styles.rematchBtn}
            onPress={handleRematch}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ArenaColors.rivalRed, '#FF2020']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>⚔️ REMATCH</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newOpponentBtn}
            onPress={handleNewOpponent}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[ArenaColors.violet, ArenaColors.violetLight]}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>🎯 NEW OPPONENT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← Return to Arena</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Round Row Component ─────────────────────────────────────────────────────
function RoundRow({ round, index }: { round: DuelRoundResult; index: number }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(index * 80, withSpring(0, { damping: 14 }));
  }, [opacity, translateX, index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const userWon = round.userCorrect && (!round.rivalCorrect || (round.userTime > 0 && round.userTime < (round.rivalTime || 99999)));
  const rivalWon = round.rivalCorrect && (!round.userCorrect || (round.rivalTime > 0 && round.rivalTime < (round.userTime || 99999)));

  return (
    <Animated.View style={[styles.roundRow, style]}>
      <View style={styles.roundIndex}>
        <Text style={styles.roundIndexText}>{index + 1}</Text>
      </View>

      <View style={styles.roundWord}>
        <Text style={styles.roundWordText}>{round.word}</Text>
        {round.polyStrike && (
          <View style={styles.polyStrikePill}>
            <Text style={styles.polyStrikePillText}>⚡ STRIKE</Text>
          </View>
        )}
      </View>

      <View style={styles.roundTimes}>
        {/* User time */}
        <View style={[styles.timePill, {
          backgroundColor: round.userCorrect ? '#063D2E' : ArenaColors.rivalRedDim,
          borderColor: round.userCorrect ? ArenaColors.neonGreen + '50' : ArenaColors.rivalRed + '50',
        }]}>
          <Text style={[styles.timeText, {
            color: round.userCorrect ? ArenaColors.neonGreen : ArenaColors.rivalRed,
          }]}>
            {round.userCorrect ? `${(round.userTime / 1000).toFixed(1)}s` : '✗'}
          </Text>
        </View>

        {/* vs */}
        <Text style={styles.roundVs}>vs</Text>

        {/* Rival time */}
        <View style={[styles.timePill, {
          backgroundColor: round.rivalCorrect ? '#063D2E' : ArenaColors.rivalRedDim,
          borderColor: round.rivalCorrect ? ArenaColors.neonGreen + '50' : ArenaColors.rivalRed + '50',
        }]}>
          <Text style={[styles.timeText, {
            color: round.rivalCorrect ? ArenaColors.neonGreen : ArenaColors.rivalRed,
          }]}>
            {round.rivalCorrect ? `${((round.rivalTime || 0) / 1000).toFixed(1)}s` : '✗'}
          </Text>
        </View>
      </View>

      {/* Winner indicator */}
      <View style={[styles.roundWinner, {
        backgroundColor: userWon ? ArenaColors.neonCyanDim : rivalWon ? ArenaColors.rivalRedDim : ArenaColors.bgCardAlt,
      }]}>
        <Text style={[styles.roundWinnerText, {
          color: userWon ? ArenaColors.neonCyan : rivalWon ? ArenaColors.rivalRed : ArenaColors.textMuted,
        }]}>
          {userWon ? '⭐' : rivalWon ? '👤' : '—'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ArenaColors.bgDeep,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: ArenaColors.textMuted,
    fontSize: Fonts.sizes.md,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    gap: 6,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#FFD70060',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  headerSub: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  aiSummary: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
    lineHeight: 20,
  },
  // Score Card
  scoreCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#FFFFFF18',
    overflow: 'hidden',
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  scoreSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePlayerCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  scorePlayerAvatar: {
    fontSize: 28,
  },
  scorePlayerName: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: '700',
  },
  scoreBig: {
    fontSize: 42,
    fontWeight: '900',
  },
  scoreDivider: {
    paddingHorizontal: 16,
  },
  scoreDividerText: {
    color: ArenaColors.textMuted,
    fontSize: 24,
    fontWeight: '900',
  },
  // Elo Card
  eloCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#FFFFFF18',
    overflow: 'hidden',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  eloLeft: {
    flex: 1,
    gap: 2,
  },
  eloRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  eloLabel: {
    color: ArenaColors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  eloChange: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '900',
  },
  eloNew: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '900',
  },
  // Rounds
  sectionTitle: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  roundsList: {
    gap: 6,
    marginBottom: 24,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ArenaColors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: ArenaColors.border,
    padding: 10,
    gap: 8,
  },
  roundIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ArenaColors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundIndexText: {
    color: ArenaColors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  roundWord: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roundWordText: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
  },
  polyStrikePill: {
    backgroundColor: ArenaColors.rivalRedDim,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: ArenaColors.rivalRed + '40',
  },
  polyStrikePillText: {
    color: ArenaColors.rivalRed,
    fontSize: 8,
    fontWeight: '800',
  },
  roundTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timePill: {
    borderRadius: Radii.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 42,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roundVs: {
    color: ArenaColors.textMuted,
    fontSize: 9,
    fontWeight: '600',
  },
  roundWinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundWinnerText: {
    fontSize: 12,
  },
  // Buttons
  buttonsContainer: {
    gap: 10,
  },
  rematchBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  newOpponentBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: Fonts.sizes.md,
    fontWeight: '900',
    letterSpacing: 2,
  },
  backBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: {
    color: ArenaColors.textSub,
    fontSize: Fonts.sizes.base,
    fontWeight: '600',
  },
});
