import React, { useState, useEffect, useCallback } from 'react';
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
  withSequence,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticManager } from '@/utils/haptics';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { PackDomain, PACK_DOMAIN_COLORS } from '@/constants/packs';
import { WORD_POOL, shuffleArray } from '@/constants/words';
import { FUN_FACTS } from '@/constants/facts';
import { useXP } from '@/hooks/useXP';
import { useAudio } from '@/hooks/useAudio';
import { useMastery } from '@/hooks/useMastery';
import { useAchievements } from '@/hooks/useAchievements';
import { ComboTracker } from '@/components/game/ComboTracker';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';
import { XPPopup } from '@/components/game/XPPopup';
import { FunFactOverlay } from '@/components/game/FunFactOverlay';
import { BonusRoundModal } from '@/components/game/BonusRoundModal';
import { ConfettiOverlay } from '@/components/ConfettiOverlay';
import { AchievementToast } from '@/components/AchievementToast';
import { buildScaledWordQueue, buildPackWordQueue, getSmartDistractors } from '@/utils/difficultyScaling';

const BASE_XP = 10;
const TOTAL_QUESTIONS = 15;

type OptionState = 'idle' | 'correct' | 'wrong' | 'reveal';

interface MCQOption {
  word: string;
  state: OptionState;
}

function buildOptions(wordQueue: typeof WORD_POOL, currentIndex: number, playerLevel: number): MCQOption[] {
  const correct = wordQueue[currentIndex % wordQueue.length];
  const decoys = getSmartDistractors(correct, playerLevel);
  const options = shuffleArray([correct.word, ...decoys]);
  return options.map((w) => ({ word: w, state: 'idle' }));
}

export default function MultipleChoiceScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ domain?: string }>();
  const focusDomain = (params.domain as PackDomain) || null;
  const domainTheme = focusDomain ? PACK_DOMAIN_COLORS[focusDomain] : null;
  const themeAccent = domainTheme?.color ?? Colors.success;
  const themeAccentLight = domainTheme?.light ?? Colors.success;
  const themeAccentDim = domainTheme?.dim ?? Colors.successDim;

  const { addXP, didLevelUp, clearLevelUp, level } = useXP();
  const { play } = useAudio();
  const { discoverWord, recordCorrect, justMastered, clearJustMastered } = useMastery();
  const { checkMasteryAchievements, recordPerfectRound, recordExpertGame, justUnlocked, clearJustUnlocked } = useAchievements();
  const mastery = useMastery();

  const [wordQueue] = useState(() =>
    focusDomain ? buildPackWordQueue(level, focusDomain) : buildScaledWordQueue(level),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [options, setOptions] = useState<MCQOption[]>(() => buildOptions(shuffleArray(WORD_POOL), 0, level));
  const [showConfetti, setShowConfetti] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastXP, setLastXP] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [bonusTriggerCount, setBonusTriggerCount] = useState(0);
  const [showFunFact, setShowFunFact] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factCount, setFactCount] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusType, setBonusType] = useState<'slang' | 'phrase'>('slang');

  const cardOpacity = useSharedValue(0);
  const cardTy = useSharedValue(30);
  const shakeTx = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  const currentWord = wordQueue[currentIndex % wordQueue.length];

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
    cardTy.value = withSpring(0, { damping: 16, stiffness: 150 });
    setOptions(buildOptions(wordQueue, currentIndex, level));
    setSelectedIndex(null);
    setFeedbackState('idle');
    // Discover word when it's shown
    const word = wordQueue[currentIndex % wordQueue.length];
    if (word) discoverWord(word.id);
  }, [currentIndex, wordQueue, cardOpacity, cardTy, level, discoverWord]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTy.value },
      { translateX: shakeTx.value },
      { scale: bounceScale.value },
    ],
  }));

  const advanceToNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= TOTAL_QUESTIONS || next >= wordQueue.length) {
      setIsGameOver(true);
      return;
    }
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentIndex)(next);
    });
    cardTy.value = withTiming(20, { duration: 200 });
  }, [currentIndex, wordQueue.length, cardOpacity, cardTy]);

  const triggerFunFactOrNext = useCallback(
    (newTotal: number) => {
      if (newTotal > 0 && newTotal % 5 === 0) {
        const factIdx = Math.floor(newTotal / 5) % FUN_FACTS.length;
        setCurrentFactIndex(factIdx);
        setFactCount((p) => p + 1);
        setShowFunFact(true);
      } else {
        advanceToNext();
      }
    },
    [advanceToNext],
  );

  const handleOptionPress = useCallback(
    (index: number) => {
      if (feedbackState !== 'idle' || selectedIndex !== null) return;

      const chosen = options[index].word;
      const correct = currentWord.word;
      const isCorrect = chosen === correct;

      setSelectedIndex(index);

      const newOptions = options.map((opt, i) => ({
        ...opt,
        state:
          i === index
            ? isCorrect
              ? 'correct'
              : 'wrong'
            : opt.word === correct
              ? 'reveal'
              : 'idle',
      })) as MCQOption[];

      setOptions(newOptions);
      const newTotal = totalQuestions + 1;
      setTotalQuestions(newTotal);

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        let xp = BASE_XP;
        if (newStreak >= 5) xp = Math.round(BASE_XP * 2) + 40;
        else if (newStreak >= 3) xp = Math.round(BASE_XP * 1.5) + 30;

        const newCorrect = correctCount + 1;
        setCorrectCount(newCorrect);
        setGameScore((p) => p + xp);
        addXP(xp);
        setLastXP(xp);
        setFeedbackState('correct');

        // Track mastery
        recordCorrect(currentWord.id);

        bounceScale.value = withSequence(
          withSpring(1.05, { damping: 5, stiffness: 300 }),
          withSpring(1, { damping: 7 }),
        );
        HapticManager.heartbeat();

        // Play combo sounds for streak milestones, otherwise correct sound
        if (newStreak === 5) {
          play('combo_5');
        } else if (newStreak === 3) {
          play('combo_3');
        } else {
          play('correct');
        }

        const newBonus = bonusTriggerCount + 1;
        setBonusTriggerCount(newBonus);

        if (newBonus % 3 === 0) {
          const type: 'slang' | 'phrase' = newBonus % 6 === 0 ? 'phrase' : 'slang';
          setBonusType(type);
          setTimeout(() => setShowBonus(true), 700);
        } else {
          setTimeout(() => triggerFunFactOrNext(newTotal), 900);
        }
      } else {
        setStreak(0);
        setHadMistake(true);
        setFeedbackState('wrong');
        shakeTx.value = withSequence(
          withTiming(-12, { duration: 60 }),
          withTiming(12, { duration: 60 }),
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        HapticManager.dullThud();
        play('wrong');
        setTimeout(() => triggerFunFactOrNext(newTotal), 1100);
      }
    },
    [
      options,
      currentWord,
      feedbackState,
      selectedIndex,
      totalQuestions,
      streak,
      correctCount,
      bonusTriggerCount,
      addXP,
      play,
      bounceScale,
      shakeTx,
      triggerFunFactOrNext,
      recordCorrect,
    ],
  );

  // Level-up sound trigger
  useEffect(() => {
    if (didLevelUp) {
      play('level_up');
      clearLevelUp();
    }
  }, [didLevelUp, play, clearLevelUp]);

  // Word mastery celebration
  useEffect(() => {
    if (justMastered) {
      setShowConfetti(true);
      clearJustMastered();
      // Check mastery-related achievements
      checkMasteryAchievements(mastery.state.words);
    }
  }, [justMastered, clearJustMastered, checkMasteryAchievements, mastery.state.words]);

  // Check for perfect round + expert navigator when game ends
  useEffect(() => {
    if (isGameOver) {
      if (correctCount === totalQuestions && totalQuestions > 0) {
        recordPerfectRound();
      }
      // Check if all questions were Expert difficulty without mistakes
      const allExpert = wordQueue.slice(0, totalQuestions).every(w => w.difficulty === 'Expert');
      if (allExpert && !hadMistake) {
        recordExpertGame(false);
      } else if (allExpert && hadMistake) {
        recordExpertGame(true);
      }
    }
  }, [isGameOver, correctCount, totalQuestions, wordQueue, hadMistake, recordPerfectRound, recordExpertGame]);

  const handleBonusComplete = useCallback(
    (success: boolean, xpEarned: number) => {
      setShowBonus(false);
      if (success && xpEarned > 0) {
        addXP(xpEarned);
        setLastXP(xpEarned);
        setGameScore((p) => p + xpEarned);
      }
      setTimeout(() => triggerFunFactOrNext(totalQuestions), 400);
    },
    [addXP, triggerFunFactOrNext, totalQuestions],
  );

  if (isGameOver) {
    return <GameOverScreen score={gameScore} correct={correctCount} total={totalQuestions} insets={insets} onRestart={() => router.replace('/multiple-choice' as any)} />;
  }

  const bonusWord =
    (bonusType === 'slang' && currentWord.slangInfo) ||
    (bonusType === 'phrase' && currentWord.phraseInfo)
      ? currentWord
      : wordQueue.find((w) => (bonusType === 'slang' ? w.slangInfo : w.phraseInfo)) ?? currentWord;

  const optionColors: Record<OptionState, { border: string; bg: string; text: string }> = {
    idle: { border: Colors.borderLight, bg: Colors.bgCardAlt, text: Colors.text },
    correct: { border: Colors.success, bg: Colors.successDim, text: Colors.success },
    wrong: { border: Colors.error, bg: Colors.errorDim, text: Colors.error },
    reveal: { border: Colors.success + '80', bg: Colors.successDim + '60', text: Colors.success },
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[focusDomain ? themeAccentDim : '#081E14', Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={[styles.backText, focusDomain && { color: themeAccentLight }]}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{focusDomain ? 'Focused Session' : 'Multiple Choice'}</Text>
          <Text style={styles.headerSub}>{totalQuestions + 1}/{TOTAL_QUESTIONS} · {gameScore} XP</Text>
        </View>
        <ComboTracker streak={streak} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.topRow}>
          <DifficultyBadge difficulty={currentWord.difficulty} size="sm" />
          <Text style={[styles.categoryBadge, focusDomain && { color: themeAccentLight, backgroundColor: themeAccentDim }]}>{currentWord.category}</Text>
        </View>

        {/* Question Card */}
        <Animated.View style={[styles.questionCard, cardStyle]}>
          <LinearGradient
            colors={['#091E14', '#0D1128']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.questionLabel}>Which word matches all these meanings?</Text>
          {currentWord.meanings.map((meaning, i) => (
            <View key={i} style={styles.meaningRow}>
              <View style={[styles.meaningBullet, { backgroundColor: themeAccent }]} />
              <Text style={styles.meaningText}>{meaning}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${((totalQuestions) / TOTAL_QUESTIONS) * 100}%` }]} />
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((opt, i) => {
            const colorSet = optionColors[opt.state];
            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionBtn, { borderColor: colorSet.border, backgroundColor: colorSet.bg }]}
                onPress={() => handleOptionPress(i)}
                activeOpacity={0.75}
                disabled={feedbackState !== 'idle'}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIndex, { borderColor: colorSet.border }]}>
                    <Text style={[styles.optionIndexText, { color: colorSet.border }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: colorSet.text }]}>{opt.word}</Text>
                </View>
                {opt.state === 'correct' && <Text style={styles.optionIcon}>✓</Text>}
                {opt.state === 'wrong' && <Text style={styles.optionIconWrong}>✗</Text>}
                {opt.state === 'reveal' && <Text style={styles.optionIconReveal}>↑</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {streak >= 3 && (
          <View style={styles.streakBanner}>
            <Text style={styles.streakText}>🔥 {streak}x Combo! {streak >= 5 ? '2x XP +40!' : '1.5x XP +30!'}</Text>
          </View>
        )}
      </ScrollView>

      {lastXP !== null && <XPPopup amount={lastXP} onDone={() => setLastXP(null)} />}

      <FunFactOverlay
        fact={FUN_FACTS[currentFactIndex]}
        visible={showFunFact}
        onDismiss={() => { setShowFunFact(false); advanceToNext(); }}
        factNumber={factCount}
      />

      <BonusRoundModal
        visible={showBonus}
        type={bonusType}
        slangInfo={bonusWord.slangInfo}
        phraseInfo={bonusWord.phraseInfo}
        onComplete={handleBonusComplete}
      />

      <ConfettiOverlay visible={showConfetti} onDone={() => setShowConfetti(false)} />
      <AchievementToast achievementId={justUnlocked} onDone={clearJustUnlocked} />
    </View>
  );
}

function GameOverScreen({ score, correct, total, insets, onRestart }: { score: number; correct: number; total: number; insets: { top: number; bottom: number }; onRestart: () => void }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  useEffect(() => { opacity.value = withTiming(1, { duration: 500 }); scale.value = withSpring(1, { damping: 14 }); }, [opacity, scale]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <LinearGradient colors={['#081E14', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
      <Animated.View style={[styles.gameOverContent, style]}>
        <Text style={styles.gameOverEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}</Text>
        <Text style={styles.gameOverTitle}>Round Complete!</Text>
        <View style={styles.gameOverStats}>
          <View style={styles.statBox}><Text style={styles.statValue}>{score}</Text><Text style={styles.statLabel}>Total XP</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{correct}/{total}</Text><Text style={styles.statLabel}>Correct</Text></View>
          <View style={styles.statBox}><Text style={styles.statValue}>{accuracy}%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
        </View>
        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.8}>
          <LinearGradient colors={[Colors.success, '#08EDB0']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.btnText}>Play Again 🔄</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { paddingRight: 16 },
  backText: { color: Colors.success, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  categoryBadge: { color: Colors.success, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, backgroundColor: Colors.successDim, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3 },
  questionCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.xl, padding: 22, borderWidth: 1.5, borderColor: Colors.borderLight, marginBottom: 16, overflow: 'hidden', ...Shadows.card },
  questionLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 },
  meaningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  meaningBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  meaningText: { color: Colors.text, fontSize: Fonts.sizes.base, lineHeight: 24, flex: 1 },
  progressTrack: { height: 4, backgroundColor: Colors.bgCardBorder, borderRadius: Radii.full, overflow: 'hidden', marginBottom: 20 },
  progressBar: { height: '100%', backgroundColor: Colors.success, borderRadius: Radii.full },
  optionsContainer: { gap: 10 },
  optionBtn: { borderWidth: 1.5, borderRadius: Radii.lg, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  optionIndex: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionIndexText: { fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold },
  optionText: { fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold, flex: 1 },
  optionIcon: { color: Colors.success, fontSize: 20, fontWeight: Fonts.weights.bold },
  optionIconWrong: { color: Colors.error, fontSize: 20, fontWeight: Fonts.weights.bold },
  optionIconReveal: { color: Colors.success, fontSize: 16 },
  streakBanner: { marginTop: 16, backgroundColor: Colors.flameDim, borderWidth: 1.5, borderColor: Colors.flame, borderRadius: Radii.lg, padding: 12, alignItems: 'center' },
  streakText: { color: Colors.flame, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  gameOverContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  gameOverEmoji: { fontSize: 80, marginBottom: 16 },
  gameOverTitle: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, marginBottom: 32, letterSpacing: -0.5 },
  gameOverStats: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center' },
  statValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  restartBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', marginBottom: 14 },
  btnGradient: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  homeBtn: { paddingVertical: 12 },
  homeBtnText: { color: Colors.success, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.base },
});
