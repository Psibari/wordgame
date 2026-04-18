import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import * as Haptics from 'expo-haptics';
import { HapticManager } from '@/utils/haptics';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { PackDomain, PACK_DOMAIN_COLORS } from '@/constants/packs';
import { FUN_FACTS } from '@/constants/facts';
import { useXP } from '@/hooks/useXP';
import { useAudio } from '@/hooks/useAudio';
import { useMastery } from '@/hooks/useMastery';
import { useAchievements } from '@/hooks/useAchievements';
import { LivesDisplay } from '@/components/game/LivesDisplay';
import { ComboTracker } from '@/components/game/ComboTracker';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';
import { XPPopup } from '@/components/game/XPPopup';
import { FunFactOverlay } from '@/components/game/FunFactOverlay';
import { BonusRoundModal } from '@/components/game/BonusRoundModal';
import { ConfettiOverlay } from '@/components/ConfettiOverlay';
import { AchievementToast } from '@/components/AchievementToast';
import { buildScaledWordQueue, buildPackWordQueue } from '@/utils/difficultyScaling';

const BASE_XP = 20;
const MAX_LIVES = 3;
const HINTS_PER_GAME = 2;

export default function GuessTheWordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ domain?: string }>();
  const focusDomain = (params.domain as PackDomain) || null;
  const domainTheme = focusDomain ? PACK_DOMAIN_COLORS[focusDomain] : null;
  const themeAccent = domainTheme?.color ?? Colors.accent;
  const themeAccentLight = domainTheme?.light ?? Colors.accentLight;
  const themeAccentDim = domainTheme?.dim ?? Colors.accentDim;

  const { addXP, didLevelUp, clearLevelUp, level } = useXP();
  const { play } = useAudio();
  const { discoverWord, recordCorrect, justMastered, clearJustMastered } = useMastery();
  const { checkMasteryAchievements, recordExpertGame, justUnlocked, clearJustUnlocked } = useAchievements();
  const mastery = useMastery();

  const [wordQueue] = useState(() =>
    focusDomain ? buildPackWordQueue(level, focusDomain) : buildScaledWordQueue(level),
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_GAME);
  const [input, setInput] = useState('');
  const [hintRevealed, setHintRevealed] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastXP, setLastXP] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // Fun fact state
  const [showFunFact, setShowFunFact] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factCount, setFactCount] = useState(0);

  // Bonus round state
  const [showBonus, setShowBonus] = useState(false);
  const [bonusType, setBonusType] = useState<'slang' | 'phrase'>('slang');
  const [bonusTriggerCount, setBonusTriggerCount] = useState(0);

  const inputRef = useRef<TextInput>(null);

  // Animations
  const cardOpacity = useSharedValue(0);
  const cardTy = useSharedValue(30);
  const shakeTx = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  const currentWord = wordQueue[currentIndex % wordQueue.length];

  // Entry animation + discover word
  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    cardTy.value = withSpring(0, { damping: 16, stiffness: 150 });
    if (currentWord) discoverWord(currentWord.id);
  }, [cardOpacity, cardTy, currentIndex, currentWord, discoverWord]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTy.value },
      { translateX: shakeTx.value },
      { scale: bounceScale.value },
    ],
  }));

  const playShake = useCallback(() => {
    shakeTx.value = withSequence(
      withTiming(-14, { duration: 60 }),
      withTiming(14, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeTx]);

  const playBounce = useCallback(() => {
    bounceScale.value = withSequence(
      withSpring(1.08, { damping: 4, stiffness: 300 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
  }, [bounceScale]);

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= wordQueue.length) {
      setIsGameOver(true);
      return;
    }
    setInput('');
    setHintRevealed(null);
    setFeedbackState('idle');
    cardOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setCurrentIndex)(nextIndex);
    });
    cardTy.value = withTiming(20, { duration: 200 });
  }, [currentIndex, wordQueue.length, cardOpacity, cardTy]);

  const triggerFunFactOrNext = useCallback(
    (newTotalQuestions: number) => {
      if (newTotalQuestions > 0 && newTotalQuestions % 5 === 0) {
        const factIndex = Math.floor(newTotalQuestions / 5) % FUN_FACTS.length;
        setCurrentFactIndex(factIndex);
        setFactCount((p) => p + 1);
        setShowFunFact(true);
      } else {
        advanceToNext();
      }
    },
    [advanceToNext],
  );

  const handleCorrect = useCallback(
    (xp: number, newStreak: number) => {
      const newCorrect = correctCount + 1;
      const newTotal = totalQuestions + 1;
      setCorrectCount(newCorrect);
      setTotalQuestions(newTotal);
      setGameScore((p) => p + xp);
      addXP(xp);
      setLastXP(xp);
      setFeedbackState('correct');

      // Track mastery
      const word = wordQueue[currentIndex % wordQueue.length];
      if (word) recordCorrect(word.id);

      playBounce();
      HapticManager.heartbeat();

      // Play combo sounds for streak milestones, otherwise correct sound
      if (newStreak === 5) {
        play('combo_5');
      } else if (newStreak === 3) {
        play('combo_3');
      } else {
        play('correct');
      }

      // Check bonus every 3 correct
      const newBonusTrigger = bonusTriggerCount + 1;
      setBonusTriggerCount(newBonusTrigger);

      if (newBonusTrigger % 3 === 0) {
        const word = wordQueue[currentIndex % wordQueue.length];
        const hasSlang = !!word.slangInfo;
        const hasPhrase = !!word.phraseInfo;
        let type: 'slang' | 'phrase' = newBonusTrigger % 6 === 0 ? 'phrase' : 'slang';
        if (!hasSlang && hasPhrase) type = 'phrase';
        if (!hasPhrase && hasSlang) type = 'slang';
        if (!hasSlang && !hasPhrase) {
          // find a word with bonus info
          const bonusWord = wordQueue.find((w) => w.slangInfo || w.phraseInfo);
          if (bonusWord) {
            type = bonusWord.slangInfo ? 'slang' : 'phrase';
          }
        }
        setBonusType(type);
        setTimeout(() => {
          setShowBonus(true);
        }, 700);
      } else {
        setTimeout(() => triggerFunFactOrNext(newTotal), 800);
      }
    },
    [
      correctCount,
      totalQuestions,
      bonusTriggerCount,
      wordQueue,
      currentIndex,
      addXP,
      play,
      playBounce,
      triggerFunFactOrNext,
      recordCorrect,
    ],
  );

  const handleWrong = useCallback(() => {
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    setHadMistake(true);
    setFeedbackState('wrong');
    playShake();
    HapticManager.dullThud();
    play('wrong');

    if (newLives <= 0) {
      setTimeout(() => setIsGameOver(true), 800);
    } else {
      const newTotal = totalQuestions + 1;
      setTotalQuestions(newTotal);
      setTimeout(() => triggerFunFactOrNext(newTotal), 1000);
    }
  }, [lives, totalQuestions, playShake, play, triggerFunFactOrNext]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || feedbackState !== 'idle') return;

    const answer = input.trim().toLowerCase();
    const correct = currentWord.word.toLowerCase();

    if (answer === correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);

      let xp = BASE_XP;
      if (newStreak >= 5) {
        xp = Math.round(BASE_XP * 2) + 40;
      } else if (newStreak >= 3) {
        xp = Math.round(BASE_XP * 1.5) + 30;
      }
      handleCorrect(xp, newStreak);
    } else {
      handleWrong();
    }
  }, [input, feedbackState, currentWord, streak, handleCorrect, handleWrong]);

  const handleHint = useCallback(() => {
    if (hintsLeft <= 0 || hintRevealed) return;
    setHintsLeft((p) => p - 1);
    setHintRevealed(currentWord.word[0].toUpperCase());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hintsLeft, hintRevealed, currentWord]);

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
      checkMasteryAchievements(mastery.state.words);
    }
  }, [justMastered, clearJustMastered, checkMasteryAchievements, mastery.state.words]);

  // Expert navigator check when game ends
  useEffect(() => {
    if (isGameOver) {
      const allExpert = wordQueue.slice(0, totalQuestions).every(w => w.difficulty === 'Expert');
      if (allExpert && !hadMistake) {
        recordExpertGame(false);
      } else if (allExpert && hadMistake) {
        recordExpertGame(true);
      }
    }
  }, [isGameOver, wordQueue, totalQuestions, hadMistake, recordExpertGame]);

  const handleBonusComplete = useCallback(
    (success: boolean, xpEarned: number) => {
      setShowBonus(false);
      if (success && xpEarned > 0) {
        addXP(xpEarned);
        setLastXP(xpEarned);
        setGameScore((p) => p + xpEarned);
      }
      setTimeout(() => {
        triggerFunFactOrNext(totalQuestions);
      }, 400);
    },
    [addXP, triggerFunFactOrNext, totalQuestions],
  );

  if (isGameOver) {
    return (
      <GameOverScreen
        score={gameScore}
        correct={correctCount}
        total={totalQuestions}
        insets={insets}
        onRestart={() => {
          setCurrentIndex(0);
          setLives(MAX_LIVES);
          setStreak(0);
          setCorrectCount(0);
          setTotalQuestions(0);
          setHintsLeft(HINTS_PER_GAME);
          setInput('');
          setHintRevealed(null);
          setFeedbackState('idle');
          setLastXP(null);
          setIsGameOver(false);
          setGameScore(0);
          setBonusTriggerCount(0);
        }}
      />
    );
  }

  const borderColor =
    feedbackState === 'correct'
      ? Colors.success
      : feedbackState === 'wrong'
        ? Colors.error
        : Colors.borderLight;

  const hasSlang = !!currentWord.slangInfo;
  const hasPhrase = !!currentWord.phraseInfo;
  const bonusWord =
    bonusType === 'slang' && hasSlang
      ? currentWord
      : bonusType === 'phrase' && hasPhrase
        ? currentWord
        : wordQueue.find(
            (w) => (bonusType === 'slang' ? w.slangInfo : w.phraseInfo),
          ) ?? currentWord;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[focusDomain ? themeAccentDim : '#10082E', Colors.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Text style={[styles.backText, focusDomain && { color: themeAccentLight }]}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {focusDomain ? 'Focused Session' : 'Guess the Word'}
            </Text>
            <Text style={styles.headerSub}>
              Q{totalQuestions + 1} · Score: {gameScore} XP
            </Text>
          </View>
          <LivesDisplay lives={lives} maxLives={MAX_LIVES} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Combo & Stats Row */}
          <View style={styles.statsRow}>
            <ComboTracker streak={streak} />
            <DifficultyBadge difficulty={currentWord.difficulty} size="sm" />
            <View style={styles.hintsLeft}>
              <Text style={styles.hintsIcon}>💡</Text>
              <Text style={styles.hintsText}>{hintsLeft}</Text>
            </View>
          </View>

          {/* Word Card */}
          <Animated.View style={[styles.wordCard, { borderColor }, cardStyle]}>
            <LinearGradient
              colors={focusDomain ? [themeAccentDim + '80', '#0D1128'] : ['#13102A', '#0D1128']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Text style={styles.meaningsLabel}>This word means...</Text>
              <Text style={[styles.categoryBadge, focusDomain && { color: themeAccentLight, backgroundColor: themeAccentDim }]}>
                {currentWord.category}
              </Text>
            </View>

            {currentWord.meanings.map((meaning, i) => (
              <View key={i} style={styles.meaningRow}>
                <View style={[styles.meaningDot, focusDomain && { backgroundColor: themeAccent }]} />
                <Text style={styles.meaningText}>{meaning}</Text>
              </View>
            ))}

            {hintRevealed && (
              <View style={styles.hintBadge}>
                <Text style={styles.hintBadgeLabel}>💡 First letter: </Text>
                <Text style={styles.hintBadgeLetter}>{hintRevealed}</Text>
              </View>
            )}

            {feedbackState !== 'idle' && (
              <View style={[styles.feedbackBanner, feedbackState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackText}>
                  {feedbackState === 'correct' ? `✓ Correct! It's "${currentWord.word}"` : `✗ The word was "${currentWord.word}"`}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Input */}
          <View style={styles.inputSection}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                feedbackState === 'correct' && styles.inputCorrect,
                feedbackState === 'wrong' && styles.inputWrong,
              ]}
              value={input}
              onChangeText={setInput}
              placeholder="Type your answer..."
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              editable={feedbackState === 'idle'}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.hintBtn, hintsLeft <= 0 && styles.hintBtnDisabled]}
                onPress={handleHint}
                disabled={hintsLeft <= 0 || !!hintRevealed}
                activeOpacity={0.7}
              >
                <Text style={styles.hintBtnText}>💡 Hint ({hintsLeft})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled, focusDomain && { shadowColor: themeAccent }]}
                onPress={handleSubmit}
                disabled={!input.trim() || feedbackState !== 'idle'}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[themeAccent, themeAccentLight]}
                  style={styles.submitBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitBtnText}>Submit →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {streak >= 3 && (
              <View style={styles.streakBanner}>
                <Text style={styles.streakBannerText}>
                  🔥 {streak}x Combo! {streak >= 5 ? '2x XP +40 Bonus!' : '1.5x XP +30 Bonus!'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* XP Popup */}
        {lastXP !== null && (
          <XPPopup
            amount={lastXP}
            onDone={() => setLastXP(null)}
          />
        )}

        {/* Fun Fact Overlay */}
        <FunFactOverlay
          fact={FUN_FACTS[currentFactIndex]}
          visible={showFunFact}
          onDismiss={() => {
            setShowFunFact(false);
            advanceToNext();
          }}
          factNumber={factCount}
        />

        {/* Bonus Round */}
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
    </KeyboardAvoidingView>
  );
}

function GameOverScreen({
  score,
  correct,
  total,
  insets,
  onRestart,
}: {
  score: number;
  correct: number;
  total: number;
  insets: { top: number; bottom: number };
  onRestart: () => void;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 14 });
  }, [opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
      <Animated.View style={[styles.gameOverContent, style]}>
        <Text style={styles.gameOverEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}</Text>
        <Text style={styles.gameOverTitle}>Game Over!</Text>
        <View style={styles.gameOverStats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{correct}/{total}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.8}>
          <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.restartBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.restartBtnText}>Play Again 🔄</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { paddingRight: 16 },
  backText: { color: Colors.accentLight, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  hintsLeft: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
  hintsIcon: { fontSize: 14 },
  hintsText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  wordCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 22,
    borderWidth: 1.5,
    marginBottom: 20,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  meaningsLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase' },
  categoryBadge: { color: Colors.accentLight, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, backgroundColor: Colors.accentDim, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  meaningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  meaningDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginTop: 8, flexShrink: 0 },
  meaningText: { color: Colors.text, fontSize: Fonts.sizes.base, lineHeight: 24, flex: 1, letterSpacing: 0.1 },
  hintBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  hintBadgeLabel: { color: Colors.gold, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium },
  hintBadgeLetter: { color: Colors.gold, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  feedbackBanner: { marginTop: 14, borderRadius: Radii.lg, padding: 12, alignItems: 'center' },
  feedbackCorrect: { backgroundColor: Colors.successDim, borderWidth: 1, borderColor: Colors.success },
  feedbackWrong: { backgroundColor: Colors.errorDim, borderWidth: 1, borderColor: Colors.error },
  feedbackText: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.base },
  inputSection: { gap: 12 },
  textInput: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: 16,
    color: Colors.text,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold,
    letterSpacing: 0.5,
  },
  inputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successDim },
  inputWrong: { borderColor: Colors.error, backgroundColor: Colors.errorDim },
  actionRow: { flexDirection: 'row', gap: 12 },
  hintBtn: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBtnDisabled: { opacity: 0.4 },
  hintBtnText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  submitBtn: { flex: 1, borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.accent },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  streakBanner: { backgroundColor: Colors.flameDim, borderWidth: 1.5, borderColor: Colors.flame, borderRadius: Radii.lg, padding: 12, alignItems: 'center' },
  streakBannerText: { color: Colors.flame, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  gameOverContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  gameOverEmoji: { fontSize: 80, marginBottom: 16 },
  gameOverTitle: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, marginBottom: 32, letterSpacing: -0.5 },
  gameOverStats: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center', ...Shadows.card },
  statValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  restartBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', marginBottom: 14, ...Shadows.accent },
  restartBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  restartBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  homeBtn: { paddingVertical: 12 },
  homeBtnText: { color: Colors.accentLight, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.base },
});
