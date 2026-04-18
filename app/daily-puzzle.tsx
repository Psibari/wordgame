import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { getDailyWord, WORD_POOL, shuffleArray } from '@/constants/words';
import { useXP } from '@/hooks/useXP';
import { useAudio } from '@/hooks/useAudio';
import { useDailyPuzzle } from '@/hooks/useDailyPuzzle';
import { useMastery } from '@/hooks/useMastery';
import { useAchievements } from '@/hooks/useAchievements';
import { useShareReward } from '@/hooks/useShareReward';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';
import { XPPopup } from '@/components/game/XPPopup';
import { ConfettiOverlay } from '@/components/ConfettiOverlay';
import { AchievementToast } from '@/components/AchievementToast';

const DAILY_XP = 50;
const SHARE_BONUS_XP = 50;
const MAX_ATTEMPTS = 3;

function buildShareText(
  word: string,
  attemptsUsed: number,
  completed: boolean,
  date: string,
  elapsedSeconds?: number,
): string {
  const attempt = completed ? attemptsUsed : 'X';
  const emoji = completed ? '🏆' : '💔';
  const bars = Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
    if (i < attemptsUsed - (completed ? 0 : 0)) return completed && i === attemptsUsed - 1 ? '🟩' : '🟥';
    return '⬜';
  }).join('');

  const timeStr = elapsedSeconds !== undefined && completed
    ? `\n⏱️ Solved in ${elapsedSeconds}s`
    : '';

  return `POLYPLEX Daily #${date}\n${emoji} ${attempt}/${MAX_ATTEMPTS}${timeStr}\n\n${bars}\n\n"${word}" — a polysemous word\n\nPlay at Polyplex!`;
}

function buildChallengeShareText(
  elapsedSeconds: number,
): string {
  return `I solved today's Polyplex in ${elapsedSeconds} seconds! Can you beat me? 🧠🏆\n\nPlay at Polyplex!`;
}

function getMCQOptions(correctWord: string): string[] {
  const others = WORD_POOL.filter((w) => w.word !== correctWord);
  const decoys = shuffleArray(others).slice(0, 3).map((w) => w.word);
  return shuffleArray([correctWord, ...decoys]);
}

export default function DailyPuzzleScreen() {
  const insets = useSafeAreaInsets();
  const { addXP, didLevelUp, clearLevelUp } = useXP();
  const { play } = useAudio();
  const { state, canPlay, attemptsRemaining, recordAttempt } = useDailyPuzzle();
  const { discoverWord, recordCorrect, justMastered, clearJustMastered } = useMastery();
  const { recordDailyCompletion, checkMasteryAchievements, justUnlocked, clearJustUnlocked } = useAchievements();
  const mastery = useMastery();
  const { hasClaimedToday, claimDailyShareReward } = useShareReward();
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareBonusXP, setShareBonusXP] = useState<number | null>(null);

  const dailyWord = getDailyWord();
  const [input, setInput] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastXP, setLastXP] = useState<number | null>(null);
  const [phase, setPhase] = useState<'playing' | 'result'>(() =>
    !canPlay ? 'result' : 'playing',
  );
  const [mcqMode, setMCQMode] = useState(false);
  const [mcqOptions] = useState(() => getMCQOptions(dailyWord.word));
  const [mcqSelected, setMCQSelected] = useState<string | null>(null);

  // Timer tracking
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number | undefined>(undefined);

  const shakeTx = useSharedValue(0);
  const bounceScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTy = useSharedValue(30);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    cardTy.value = withSpring(0, { damping: 16, stiffness: 150 });
    // Discover the daily word
    discoverWord(dailyWord.id);
  }, [cardOpacity, cardTy, dailyWord.id, discoverWord]);

  useEffect(() => {
    if (!canPlay) setPhase('result');
  }, [canPlay]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTy.value }, { translateX: shakeTx.value }, { scale: bounceScale.value }],
  }));

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

  const handleSubmitText = useCallback(() => {
    if (!input.trim() || feedbackState !== 'idle') return;
    const answer = input.trim().toLowerCase();
    const correct = dailyWord.word.toLowerCase();

    if (answer === correct) {
      const seconds = Math.round((Date.now() - startTime) / 1000);
      setElapsedSeconds(seconds);
      bounceScale.value = withSequence(
        withSpring(1.08, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 6 }),
      );
      setFeedbackState('correct');
      recordAttempt(true, DAILY_XP);
      addXP(DAILY_XP);
      setLastXP(DAILY_XP);
      // Track mastery & daily streak
      recordCorrect(dailyWord.id);
      recordDailyCompletion(state.date);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      play('daily_win');
      setTimeout(() => setPhase('result'), 1500);
    } else {
      shakeTx.value = withSequence(
        withTiming(-14, { duration: 60 }),
        withTiming(14, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      setFeedbackState('wrong');
      const next = recordAttempt(false, 0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      play('wrong');

      if (!next.failed) {
        setTimeout(() => {
          setFeedbackState('idle');
          setInput('');
        }, 1200);
      } else {
        setTimeout(() => setPhase('result'), 1500);
      }
    }
  }, [input, feedbackState, dailyWord.word, dailyWord.id, recordAttempt, addXP, play, shakeTx, bounceScale, recordCorrect, recordDailyCompletion, state.date]);

  const handleMCQSelect = useCallback(
    (option: string) => {
      if (feedbackState !== 'idle' || mcqSelected) return;
      setMCQSelected(option);
      const isCorrect = option === dailyWord.word;
      if (isCorrect) {
        const seconds = Math.round((Date.now() - startTime) / 1000);
        setElapsedSeconds(seconds);
        bounceScale.value = withSequence(
          withSpring(1.06, { damping: 5, stiffness: 300 }),
          withSpring(1, { damping: 7 }),
        );
        setFeedbackState('correct');
        recordAttempt(true, DAILY_XP);
        addXP(DAILY_XP);
        setLastXP(DAILY_XP);
        // Track mastery & daily streak
        recordCorrect(dailyWord.id);
        recordDailyCompletion(state.date);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        play('daily_win');
        setTimeout(() => setPhase('result'), 1500);
      } else {
        shakeTx.value = withSequence(
          withTiming(-12, { duration: 60 }),
          withTiming(12, { duration: 60 }),
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        setFeedbackState('wrong');
        const next = recordAttempt(false, 0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        play('wrong');

        if (!next.failed) {
          setTimeout(() => {
            setFeedbackState('idle');
            setMCQSelected(null);
          }, 1200);
        } else {
          setTimeout(() => setPhase('result'), 1500);
        }
      }
    },
    [feedbackState, mcqSelected, dailyWord.word, dailyWord.id, recordAttempt, addXP, play, shakeTx, bounceScale, recordCorrect, recordDailyCompletion, state.date],
  );

  const handleShare = async () => {
    // Award 50 Lex-Points for first daily share
    if (!hasClaimedToday) {
      const reward = claimDailyShareReward();
      if (reward > 0) {
        addXP(reward);
        setShareBonusXP(reward);
      }
    }

    const text = buildShareText(
      dailyWord.word,
      state.attemptsUsed,
      state.completed,
      state.date,
      elapsedSeconds,
    );
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const handleChallengeShare = async () => {
    // Award 50 Lex-Points for first daily share
    if (!hasClaimedToday) {
      const reward = claimDailyShareReward();
      if (reward > 0) {
        addXP(reward);
        setShareBonusXP(reward);
      }
    }

    const text = buildChallengeShareText(elapsedSeconds ?? 0);
    try {
      await Share.share({ message: text });
    } catch {}
  };

  // Result screen
  if (phase === 'result') {
    const success = state.completed;
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <LinearGradient
          colors={success ? ['#0D2E1A', Colors.bg] : ['#2A0D0D', Colors.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnResult} hitSlop={8}>
          <Text style={[styles.backText, { color: Colors.gold }]}>‹ Back</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScrollContent}>
          <Text style={styles.resultEmoji}>{success ? '🏆' : '💔'}</Text>
          <Text style={[styles.resultTitle, success ? styles.resultTitleSuccess : styles.resultTitleFail]}>
            {success ? 'Puzzle Solved!' : 'Puzzle Failed'}
          </Text>

          <View style={styles.dailyDateChip}>
            <Text style={styles.dailyDateText}>📅 {state.date}</Text>
          </View>

          <View style={styles.resultWordReveal}>
            <Text style={styles.resultWordLabel}>{"Today's Word"}</Text>
            <Text style={styles.resultWordBig}>{dailyWord.word}</Text>
            <DifficultyBadge difficulty={dailyWord.difficulty} />
          </View>

          <View style={styles.resultMeanings}>
            <Text style={styles.meaningsLabel}>Meanings</Text>
            {dailyWord.meanings.map((m, i) => (
              <View key={i} style={styles.meaningRow}>
                <View style={styles.dot} />
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}
          </View>

          <View style={styles.attemptsDisplay}>
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.attemptDot,
                  i < state.attemptsUsed - (success ? 1 : 0) && styles.attemptDotFail,
                  i === state.attemptsUsed - 1 && success && styles.attemptDotSuccess,
                ]}
              />
            ))}
          </View>

          {success && (
            <View style={styles.xpEarned}>
              <Text style={styles.xpEarnedText}>+{DAILY_XP} XP Earned!</Text>
            </View>
          )}

          <Text style={styles.attemptsUsedText}>
            Solved in {state.attemptsUsed}/{MAX_ATTEMPTS} attempt{state.attemptsUsed !== 1 ? 's' : ''}
          </Text>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.gold, Colors.goldLight]}
              style={styles.shareBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.shareBtnText}>🔗 Share Result</Text>
            </LinearGradient>
          </TouchableOpacity>

          {success && elapsedSeconds !== undefined && (
            <TouchableOpacity style={styles.challengeShareBtn} onPress={handleChallengeShare} activeOpacity={0.8}>
              <Text style={styles.challengeShareText}>
                🏆 Share Challenge: {`"I solved it in ${elapsedSeconds}s!"`}
              </Text>
            </TouchableOpacity>
          )}

          {!hasClaimedToday && (
            <View style={styles.shareRewardHint}>
              <Text style={styles.shareRewardHintText}>✨ Share to earn +{SHARE_BONUS_XP} Lex-Points today!</Text>
            </View>
          )}

          {shareBonusXP !== null && (
            <View style={styles.shareRewardEarned}>
              <Text style={styles.shareRewardEarnedText}>🎉 +{shareBonusXP} Lex-Points earned for sharing!</Text>
            </View>
          )}

          <Text style={styles.nextPuzzleText}>Next puzzle in 24 hours 🌅</Text>

          <TouchableOpacity style={styles.backToHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backToHomeBtnText}>← Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Playing screen
  const attemptsBarColors = Array.from({ length: MAX_ATTEMPTS }).map((_, i) =>
    i < MAX_ATTEMPTS - attemptsRemaining ? Colors.error : Colors.bgCardBorder,
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#2D1A08', Colors.bg]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Daily Puzzle</Text>
            <Text style={styles.headerSub}>📅 {state.date}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>+{DAILY_XP} XP</Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
          {/* Attempts tracker */}
          <View style={styles.attemptsRow}>
            <Text style={styles.attemptsLabel}>Attempts remaining:</Text>
            <View style={styles.attemptsDots}>
              {attemptsBarColors.map((color, i) => (
                <View key={i} style={[styles.attemptsDot, { backgroundColor: color === Colors.error ? Colors.error : Colors.borderLight }]} />
              ))}
            </View>
            <Text style={styles.attemptsCount}>{attemptsRemaining}/{MAX_ATTEMPTS}</Text>
          </View>

          {/* Word Card */}
          <Animated.View style={[styles.wordCard, cardStyle]}>
            <LinearGradient
              colors={['#1E1206', '#0D1128']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardTopRow}>
              <View style={styles.dailyBadge}>
                <Text style={styles.dailyBadgeText}>🌟 DAILY WORD</Text>
              </View>
              <DifficultyBadge difficulty={dailyWord.difficulty} size="sm" />
            </View>

            <Text style={styles.clueLabel}>This word means...</Text>
            {dailyWord.meanings.map((m, i) => (
              <View key={i} style={styles.meaningRow}>
                <View style={[styles.dot, { backgroundColor: Colors.gold }]} />
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}

            {!hintUsed && (
              <TouchableOpacity
                style={styles.hintBtn}
                onPress={() => {
                  setHintUsed(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.hintBtnText}>💡 Reveal First Letter</Text>
              </TouchableOpacity>
            )}

            {hintUsed && (
              <View style={styles.hintReveal}>
                <Text style={styles.hintRevealLabel}>💡 First letter: </Text>
                <Text style={styles.hintRevealLetter}>{dailyWord.word[0].toUpperCase()}</Text>
              </View>
            )}

            {feedbackState !== 'idle' && (
              <View style={[styles.feedbackBanner, feedbackState === 'correct' ? styles.fbCorrect : styles.fbWrong]}>
                <Text style={styles.fbText}>
                  {feedbackState === 'correct'
                    ? `✓ Correct! "${dailyWord.word}"`
                    : `✗ Not quite! ${attemptsRemaining - 1 > 0 ? `${attemptsRemaining - 1} attempt${attemptsRemaining - 1 !== 1 ? 's' : ''} left` : 'No attempts left'}`}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Toggle mode */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, !mcqMode && styles.modeBtnActive]}
              onPress={() => setMCQMode(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeBtnText, !mcqMode && styles.modeBtnTextActive]}>📝 Type Answer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mcqMode && styles.modeBtnActive]}
              onPress={() => setMCQMode(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeBtnText, mcqMode && styles.modeBtnTextActive]}>🎯 Multiple Choice</Text>
            </TouchableOpacity>
          </View>

          {!mcqMode ? (
            <View style={styles.inputSection}>
              <TextInput
                style={[styles.textInput, feedbackState === 'correct' && styles.inputCorrect, feedbackState === 'wrong' && styles.inputWrong]}
                value={input}
                onChangeText={setInput}
                placeholder="Type your answer..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                editable={feedbackState === 'idle'}
                onSubmitEditing={handleSubmitText}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
                onPress={handleSubmitText}
                disabled={!input.trim() || feedbackState !== 'idle'}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[Colors.gold, Colors.goldLight]} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.submitText}>Submit Answer →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {mcqOptions.map((opt, i) => {
                const isSelected = mcqSelected === opt;
                const isCorrect = isSelected && opt === dailyWord.word;
                const isWrong = isSelected && opt !== dailyWord.word;
                const isReveal = !isSelected && opt === dailyWord.word && feedbackState === 'wrong';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.optionBtn,
                      isCorrect && styles.optionCorrect,
                      isWrong && styles.optionWrong,
                      isReveal && styles.optionReveal,
                    ]}
                    onPress={() => handleMCQSelect(opt)}
                    disabled={feedbackState !== 'idle'}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.optionText, isCorrect && styles.optionTextGold, isReveal && styles.optionTextGold, isWrong && styles.optionTextRed]}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                    {isCorrect && <Text style={{ color: Colors.gold, fontWeight: '900' }}>✓</Text>}
                    {isWrong && <Text style={{ color: Colors.error, fontWeight: '900' }}>✗</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {lastXP !== null && <XPPopup amount={lastXP} onDone={() => setLastXP(null)} />}

        <ConfettiOverlay visible={showConfetti} onDone={() => setShowConfetti(false)} />
        <AchievementToast achievementId={justUnlocked} onDone={clearJustUnlocked} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { paddingRight: 16 },
  backBtnResult: { paddingHorizontal: 20, paddingTop: 10 },
  backText: { color: Colors.gold, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  xpBadge: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  xpBadgeText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  attemptsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 12 },
  attemptsLabel: { color: Colors.textSub, fontSize: Fonts.sizes.sm, flex: 1 },
  attemptsDots: { flexDirection: 'row', gap: 6 },
  attemptsDot: { width: 14, height: 14, borderRadius: 7 },
  attemptsCount: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm, minWidth: 30, textAlign: 'right' },
  wordCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.xl, padding: 22, borderWidth: 1.5, borderColor: Colors.gold + '40', marginBottom: 16, overflow: 'hidden', ...Shadows.gold },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dailyBadge: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  dailyBadgeText: { color: Colors.gold, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.black, letterSpacing: 1 },
  clueLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  meaningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  meaningText: { color: Colors.text, fontSize: Fonts.sizes.base, lineHeight: 24, flex: 1 },
  hintBtn: { marginTop: 12, backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  hintBtnText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  hintReveal: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  hintRevealLabel: { color: Colors.gold, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium },
  hintRevealLetter: { color: Colors.gold, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black },
  feedbackBanner: { marginTop: 14, borderRadius: Radii.lg, padding: 12, alignItems: 'center' },
  fbCorrect: { backgroundColor: Colors.successDim, borderWidth: 1, borderColor: Colors.success },
  fbWrong: { backgroundColor: Colors.errorDim, borderWidth: 1, borderColor: Colors.error },
  fbText: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  modeToggle: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 4, marginBottom: 16, gap: 4 },
  modeBtn: { flex: 1, borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold },
  modeBtnText: { color: Colors.textSub, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold },
  modeBtnTextActive: { color: Colors.gold },
  inputSection: { gap: 12 },
  textInput: { backgroundColor: Colors.bgCardAlt, borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 16, color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold },
  inputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successDim },
  inputWrong: { borderColor: Colors.error, backgroundColor: Colors.errorDim },
  submitBtn: { borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.gold },
  submitBtnDisabled: { opacity: 0.5 },
  submitGradient: { paddingVertical: 15, alignItems: 'center' },
  submitText: { color: Colors.bg, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  optionsContainer: { gap: 10 },
  optionBtn: { backgroundColor: Colors.bgCardAlt, borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionCorrect: { borderColor: Colors.gold, backgroundColor: Colors.goldDim },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.errorDim },
  optionReveal: { borderColor: Colors.gold + '80', backgroundColor: Colors.goldDim + '60' },
  optionText: { color: Colors.text, fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.semibold },
  optionTextGold: { color: Colors.gold },
  optionTextRed: { color: Colors.error },
  resultScrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, alignItems: 'center' },
  resultEmoji: { fontSize: 80, marginBottom: 12, marginTop: 16 },
  resultTitle: { fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.black, marginBottom: 12, textAlign: 'center' },
  resultTitleSuccess: { color: Colors.gold },
  resultTitleFail: { color: Colors.error },
  dailyDateChip: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 24 },
  dailyDateText: { color: Colors.textSub, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.medium },
  resultWordReveal: { backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.gold + '60', borderRadius: Radii.xl, padding: 24, alignItems: 'center', width: '100%', marginBottom: 20, gap: 8 },
  resultWordLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, letterSpacing: 2, textTransform: 'uppercase' },
  resultWordBig: { color: Colors.gold, fontSize: 44, fontWeight: Fonts.weights.black, letterSpacing: -1 },
  resultMeanings: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 18, width: '100%', marginBottom: 20 },
  meaningsLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  attemptsDisplay: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  attemptDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.borderLight },
  attemptDotFail: { backgroundColor: Colors.error },
  attemptDotSuccess: { backgroundColor: Colors.success },
  xpEarned: { backgroundColor: Colors.goldDim, borderWidth: 1.5, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8, marginBottom: 4, ...Shadows.gold },
  xpEarnedText: { color: Colors.gold, fontWeight: Fonts.weights.black, fontSize: Fonts.sizes.lg },
  attemptsUsedText: { color: Colors.textSub, fontSize: Fonts.sizes.sm, marginBottom: 24 },
  shareBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', marginBottom: 12, ...Shadows.gold },
  shareBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  shareBtnText: { color: Colors.bg, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  challengeShareBtn: { width: '100%', borderRadius: Radii.xl, borderWidth: 1.5, borderColor: Colors.accent + '50', backgroundColor: Colors.accentDim, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  challengeShareText: { color: Colors.accent, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  shareRewardHint: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold + '50', borderRadius: Radii.lg, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
  shareRewardHintText: { color: Colors.gold, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, textAlign: 'center' },
  shareRewardEarned: { backgroundColor: Colors.successDim, borderWidth: 1, borderColor: Colors.success + '50', borderRadius: Radii.lg, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
  shareRewardEarnedText: { color: Colors.success, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.bold, textAlign: 'center' },
  nextPuzzleText: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: 16, textAlign: 'center' },
  backToHomeBtn: { paddingVertical: 10 },
  backToHomeBtnText: { color: Colors.gold, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.base },
});
