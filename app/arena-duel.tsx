import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Fonts, Radii } from '@/constants/theme';
import {
  ArenaColors,
  ARENA_RIVALS,
  DUEL_QUESTIONS,
  DuelRoundResult,
  DuelResult,
  calculateEloChange,
  DuelQuestion,
} from '@/constants/arena';
import { useArena } from '@/hooks/useArena';
import { PolyStrikeEffect } from '@/components/arena/PolyStrikeEffect';
import { VictoryFlares } from '@/components/arena/VictoryFlares';
import { shuffleArray } from '@/constants/words';
import { PollyArenaCoach } from '@/components/polly/PollyArenaCoach';
import { HapticManager } from '@/utils/haptics';

const TOTAL_ROUNDS = 7;
const ROUND_TIME_LIMIT = 8000; // 8 seconds per round
const POLY_STRIKE_THRESHOLD = 2000; // <2s triggers poly-strike

export default function ArenaDuelScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rivalId: string }>();
  const { elo, simulateRivalAnswer } = useArena();

  const rival = ARENA_RIVALS.find((r) => r.id === params.rivalId) ?? ARENA_RIVALS[0];

  // Duel state
  const [questions] = useState<DuelQuestion[]>(() => shuffleArray([...DUEL_QUESTIONS]).slice(0, TOTAL_ROUNDS));
  const [currentRound, setCurrentRound] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [roundResults, setRoundResults] = useState<DuelRoundResult[]>([]);
  const [roundTimer, setRoundTimer] = useState(ROUND_TIME_LIMIT);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showPolyStrike, setShowPolyStrike] = useState(false);
  const [polyStrikeType, setPolyStrikeType] = useState<'blur' | 'inkblot'>('blur');
  const [showVictory, setShowVictory] = useState(false);
  const [countdownPhase, setCountdownPhase] = useState<3 | 2 | 1 | 0>(3);
  const [duelStarted, setDuelStarted] = useState(false);
  const [pollyStrikeFlag, setPollyStrikeFlag] = useState(false);
  const [pollyCorrectFlag, setPollyCorrectFlag] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Animations
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const timerWidth = useSharedValue(1);
  const countdownScale = useSharedValue(1);
  const countdownOpacity = useSharedValue(1);
  const scorePulseLeft = useSharedValue(1);
  const scorePulseRight = useSharedValue(1);
  const rivalIndicator = useSharedValue(0);
  const neonPulse = useSharedValue(0.3);
  // Screen shake for Impact Frames
  const screenShakeX = useSharedValue(0);
  const screenShakeY = useSharedValue(0);
  const impactFlash = useSharedValue(0);

  const question = questions[currentRound];

  // Neon pulse effect
  useEffect(() => {
    neonPulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [neonPulse]);

  // Countdown phase
  useEffect(() => {
    if (countdownPhase === 0) {
      setDuelStarted(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    countdownScale.value = 0.5;
    countdownOpacity.value = 1;
    countdownScale.value = withSpring(1.2, { damping: 6, stiffness: 200 });

    const timer = setTimeout(() => {
      countdownOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        setCountdownPhase((prev) => (prev - 1) as 3 | 2 | 1 | 0);
      }, 250);
    }, 800);

    return () => clearTimeout(timer);
  }, [countdownPhase, countdownScale, countdownOpacity]);

  // Start round
  useEffect(() => {
    if (!duelStarted || currentRound >= TOTAL_ROUNDS) return;

    startTimeRef.current = Date.now();
    setRoundTimer(ROUND_TIME_LIMIT);
    setIsAnswered(false);
    setSelectedOption(null);
    // Reset for new round

    // Animate card entrance (slam effect)
    cardScale.value = 0.5;
    cardOpacity.value = 0;
    cardScale.value = withSpring(1, { damping: 8, stiffness: 250 });
    cardOpacity.value = withTiming(1, { duration: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Timer animation
    timerWidth.value = 1;
    timerWidth.value = withTiming(0, {
      duration: ROUND_TIME_LIMIT,
      easing: Easing.linear,
    });

    // Simulate rival answer
    const { correct: rivalCorrect, time: rTime } = simulateRivalAnswer(rival.accuracy, rival.avgResponseTime);

    // Show rival answered indicator after their response time
    if (rivalCorrect && rTime > 0) {
      setTimeout(() => {
        rivalIndicator.value = withSequence(
          withSpring(1, { damping: 8, stiffness: 200 }),
          withDelay(500, withSpring(0)),
        );
        // Rival answered in rTime ms
      }, rTime);
    }

    // Timer countdown
    timerRef.current = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 100) {
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duelStarted, currentRound, cardScale, cardOpacity, timerWidth, rival, simulateRivalAnswer, rivalIndicator]);

  // Handle timer expiry
  useEffect(() => {
    if (roundTimer <= 0 && duelStarted && !isAnswered) {
      handleTimeout();
    }
  }, [roundTimer, duelStarted, isAnswered]);

  const handleTimeout = useCallback(() => {
    if (isAnswered) return;
    setIsAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    const { correct: rivalCorrect, time: rTime } = simulateRivalAnswer(rival.accuracy, rival.avgResponseTime);

    const result: DuelRoundResult = {
      questionId: question.id,
      word: question.word,
      userTime: -1,
      rivalTime: rivalCorrect ? rTime : -1,
      userCorrect: false,
      rivalCorrect,
      polyStrike: false,
    };

    setRoundResults((prev) => [...prev, result]);
    if (rivalCorrect) {
      setRivalScore((prev) => prev + 1);
      scorePulseRight.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 300 }),
        withSpring(1, { damping: 7 }),
      );
    }

    setTimeout(() => advanceRound(), 1500);
  }, [isAnswered, question, rival, simulateRivalAnswer, scorePulseRight]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (isAnswered || !duelStarted) return;

    const elapsed = Date.now() - startTimeRef.current;
    setIsAnswered(true);
    setSelectedOption(optionIndex);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = optionIndex === question.correctIndex;
    const userTime = isCorrect ? elapsed : -1;

    // Get rival answer
    const { correct: rivalCorrect, time: rTime } = simulateRivalAnswer(rival.accuracy, rival.avgResponseTime);
    const rTimeActual = rivalCorrect ? rTime : -1;

    const isPolyStrike = isCorrect && elapsed < POLY_STRIKE_THRESHOLD;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUserScore((prev) => prev + 1);
      scorePulseLeft.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 300 }),
        withSpring(1, { damping: 7 }),
      );

      // Polly coach reaction
      setPollyCorrectFlag(true);
      setTimeout(() => setPollyCorrectFlag(null), 1500);

      // Poly-Strike! with Impact Frame screen shake
      if (isPolyStrike) {
        HapticManager.impactFrame();
        setPolyStrikeType(Math.random() > 0.5 ? 'blur' : 'inkblot');
        setTimeout(() => setShowPolyStrike(true), 500);
        setPollyStrikeFlag(true);
        setTimeout(() => setPollyStrikeFlag(false), 2000);

        // Screen shake Impact Frame
        impactFlash.value = withSequence(
          withTiming(0.5, { duration: 50 }),
          withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }),
        );
        screenShakeX.value = withSequence(
          withTiming(8, { duration: 30 }),
          withTiming(-10, { duration: 30 }),
          withTiming(6, { duration: 30 }),
          withTiming(-4, { duration: 30 }),
          withTiming(2, { duration: 30 }),
          withTiming(0, { duration: 30 }),
        );
        screenShakeY.value = withSequence(
          withTiming(-6, { duration: 30 }),
          withTiming(8, { duration: 30 }),
          withTiming(-4, { duration: 30 }),
          withTiming(2, { duration: 30 }),
          withTiming(0, { duration: 30 }),
        );
      }
    } else {
      HapticManager.dullThud();
      setPollyCorrectFlag(false);
      setTimeout(() => setPollyCorrectFlag(null), 1500);
      // Shake card + mild screen shake
      cardScale.value = withSequence(
        withTiming(0.97, { duration: 40 }),
        withTiming(1.03, { duration: 40 }),
        withTiming(0.99, { duration: 40 }),
        withTiming(1, { duration: 40 }),
      );
      screenShakeX.value = withSequence(
        withTiming(4, { duration: 30 }),
        withTiming(-4, { duration: 30 }),
        withTiming(2, { duration: 30 }),
        withTiming(0, { duration: 30 }),
      );
    }

    if (rivalCorrect) {
      setRivalScore((prev) => prev + 1);
      scorePulseRight.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 300 }),
        withSpring(1, { damping: 7 }),
      );
    }

    const result: DuelRoundResult = {
      questionId: question.id,
      word: question.word,
      userTime,
      rivalTime: rTimeActual,
      userCorrect: isCorrect,
      rivalCorrect,
      polyStrike: isPolyStrike,
    };

    setRoundResults((prev) => [...prev, result]);
    setTimeout(() => advanceRound(), isPolyStrike ? 3000 : 1500);
  }, [isAnswered, duelStarted, question, rival, simulateRivalAnswer, scorePulseLeft, scorePulseRight, cardScale]);

  const advanceRound = useCallback(() => {
    const nextRound = currentRound + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      // Duel over
      finishDuel(nextRound);
      return;
    }
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentRound)(nextRound);
    });
  }, [currentRound, cardOpacity]);

  const finishDuel = useCallback((totalRounds: number) => {
    const finalUserScore = roundResults.reduce((acc, r) => acc + (r.userCorrect ? 1 : 0), 0) + (selectedOption === question?.correctIndex ? 1 : 0);
    const finalRivalScore = roundResults.reduce((acc, r) => acc + (r.rivalCorrect ? 1 : 0), 0);
    const won = finalUserScore > finalRivalScore;
    const eloChange = calculateEloChange(elo, rival.elo, won);

    if (won) {
      setShowVictory(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const duelResult: DuelResult = {
      rivalId: rival.id,
      rivalName: rival.name,
      rivalAvatar: rival.avatar,
      rounds: roundResults,
      userScore: finalUserScore,
      rivalScore: finalRivalScore,
      userWon: won,
      eloChange,
      userElo: elo + eloChange,
      newLeague: null,
    };

    setTimeout(() => {
      router.replace({
        pathname: '/arena-post-match',
        params: {
          result: JSON.stringify(duelResult),
        },
      } as any);
    }, won ? 2500 : 1500);
  }, [roundResults, elo, rival, question, selectedOption]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerWidth.value * 100}%`,
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
    opacity: countdownOpacity.value,
  }));

  const scorePulseLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulseLeft.value }],
  }));

  const scorePulseRightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scorePulseRight.value }],
  }));

  const rivalIndicatorStyle = useAnimatedStyle(() => ({
    opacity: rivalIndicator.value,
    transform: [{ scale: rivalIndicator.value }],
  }));

  const neonStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 215, 0, ${neonPulse.value})`,
  }));

  // Screen shake animated container
  const screenShakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: screenShakeX.value },
      { translateY: screenShakeY.value },
    ],
  }));

  // Impact flash overlay
  const impactFlashStyle = useAnimatedStyle(() => ({
    opacity: impactFlash.value,
  }));

  // Countdown overlay
  if (countdownPhase > 0) {
    return (
      <View style={[styles.root, styles.countdownContainer]}>
        <LinearGradient
          colors={[ArenaColors.bgDeep, ArenaColors.bg]}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={countdownStyle}>
          <Text style={styles.countdownText}>
            {countdownPhase === 3 ? 'READY' : countdownPhase === 2 ? 'SET' : '⚔️'}
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (!question) return null;

  const timerColor = roundTimer > 4000 ? ArenaColors.neonGreen : roundTimer > 2000 ? ArenaColors.gold : ArenaColors.rivalRed;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[ArenaColors.bgDeep, ArenaColors.bg, ArenaColors.bgDeep]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Impact flash overlay */}
      <Animated.View
        style={[styles.impactFlashOverlay, impactFlashStyle]}
        pointerEvents="none"
      />

      {/* Poly-Strike effect */}
      <PolyStrikeEffect
        visible={showPolyStrike}
        type={polyStrikeType}
        onDone={() => setShowPolyStrike(false)}
      />

      {/* Victory Flares */}
      <VictoryFlares visible={showVictory} />

      {/* Screen shake container */}
      <Animated.View style={[{ flex: 1 }, screenShakeStyle]}>

      {/* Score Bar */}
      <View style={styles.scoreBar}>
        <Animated.View style={[styles.scoreLeft, scorePulseLeftStyle]}>
          <PollyArenaCoach
            userScore={userScore}
            rivalScore={rivalScore}
            isPolyStrike={pollyStrikeFlag}
            isCorrect={pollyCorrectFlag}
            isRoundActive={!isAnswered}
          />
          <Text style={[styles.scoreNum, { color: ArenaColors.neonCyan }]}>{userScore}</Text>
        </Animated.View>

        <View style={styles.roundInfo}>
          <Text style={styles.roundLabel}>ROUND</Text>
          <Text style={styles.roundNum}>{currentRound + 1}/{TOTAL_ROUNDS}</Text>
        </View>

        <Animated.View style={[styles.scoreRight, scorePulseRightStyle]}>
          <Text style={[styles.scoreNum, { color: ArenaColors.rivalRed }]}>{rivalScore}</Text>
          <Text style={styles.scoreAvatar}>{rival.avatar}</Text>
        </Animated.View>

        {/* Rival answered indicator */}
        <Animated.View style={[styles.rivalAnsweredBadge, rivalIndicatorStyle]}>
          <Text style={styles.rivalAnsweredText}>⚡ {rival.name} answered!</Text>
        </Animated.View>
      </View>

      {/* Timer */}
      <View style={styles.timerTrack}>
        <Animated.View style={timerStyle}>
          <LinearGradient
            colors={[timerColor, timerColor + '80']}
            style={styles.timerBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>

      {/* Question Card */}
      <View style={styles.contentArea}>
        <Animated.View style={[styles.questionCard, cardStyle, neonStyle]}>
          <LinearGradient
            colors={[ArenaColors.bgCardAlt, ArenaColors.bgCard]}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.questionLabel}>IDENTIFY THE WORD</Text>
          <Text style={styles.questionDefinition}>{question.definition}</Text>

          {/* Speed indicator */}
          {!isAnswered && (
            <View style={styles.speedIndicator}>
              <Text style={styles.speedText}>
                {roundTimer > 6000 ? '⚡ POLY-STRIKE ZONE' : roundTimer > 4000 ? '⏱️ Quick!' : '⏰ Hurry!'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {question.options.map((option, i) => {
            let optionBg = ArenaColors.bgCard;
            let optionBorder = ArenaColors.border;
            let optionText = ArenaColors.text;

            if (isAnswered) {
              if (i === question.correctIndex) {
                optionBg = '#063D2E';
                optionBorder = ArenaColors.neonGreen;
                optionText = ArenaColors.neonGreen;
              } else if (i === selectedOption && i !== question.correctIndex) {
                optionBg = ArenaColors.rivalRedDim;
                optionBorder = ArenaColors.rivalRed;
                optionText = ArenaColors.rivalRed;
              }
            }

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionBtn,
                  { backgroundColor: optionBg, borderColor: optionBorder },
                ]}
                onPress={() => handleAnswer(i)}
                activeOpacity={0.75}
                disabled={isAnswered}
              >
                <Text style={[styles.optionLabel, { color: optionBorder }]}>
                  {String.fromCharCode(65 + i)}
                </Text>
                <Text style={[styles.optionText, { color: optionText }]}>{option}</Text>
                {isAnswered && i === question.correctIndex && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
                {isAnswered && i === selectedOption && i !== question.correctIndex && (
                  <Text style={styles.crossMark}>✗</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Poly-Strike banner */}
        {isAnswered && selectedOption === question.correctIndex && (Date.now() - startTimeRef.current) < POLY_STRIKE_THRESHOLD && (
          <View style={styles.polyStrikeBanner}>
            <LinearGradient
              colors={[ArenaColors.rivalRed, ArenaColors.gold]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.polyStrikeText}>⚡ POLY-STRIKE! ⚡</Text>
          </View>
        )}
      </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ArenaColors.bgDeep,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: ArenaColors.gold,
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: ArenaColors.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  // Score Bar
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreAvatar: {
    fontSize: 24,
  },
  scoreNum: {
    fontSize: 28,
    fontWeight: '900',
  },
  roundInfo: {
    alignItems: 'center',
  },
  roundLabel: {
    color: ArenaColors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  roundNum: {
    color: ArenaColors.gold,
    fontSize: Fonts.sizes.md,
    fontWeight: '900',
  },
  rivalAnsweredBadge: {
    position: 'absolute',
    bottom: -8,
    right: 20,
    backgroundColor: ArenaColors.rivalRedDim,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: ArenaColors.rivalRed + '50',
  },
  rivalAnsweredText: {
    color: ArenaColors.rivalRed,
    fontSize: 10,
    fontWeight: '700',
  },
  // Timer
  timerTrack: {
    height: 4,
    backgroundColor: ArenaColors.border,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 2,
  },
  // Content
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  questionCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    padding: 22,
    overflow: 'hidden',
  },
  questionLabel: {
    color: ArenaColors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 12,
  },
  questionDefinition: {
    color: ArenaColors.text,
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    lineHeight: 28,
  },
  speedIndicator: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: ArenaColors.goldDim + '40',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speedText: {
    color: ArenaColors.gold,
    fontSize: 10,
    fontWeight: '700',
  },
  // Options
  optionsGrid: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    textAlign: 'center',
    lineHeight: 26,
    fontSize: Fonts.sizes.sm,
    fontWeight: '800',
    overflow: 'hidden',
  },
  optionText: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
  },
  checkMark: {
    color: ArenaColors.neonGreen,
    fontSize: 20,
    fontWeight: '900',
  },
  crossMark: {
    color: ArenaColors.rivalRed,
    fontSize: 20,
    fontWeight: '900',
  },
  // Poly-Strike banner
  polyStrikeBanner: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    padding: 14,
    alignItems: 'center',
  },
  polyStrikeText: {
    color: '#fff',
    fontSize: Fonts.sizes.lg,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  impactFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
});
