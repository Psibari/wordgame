import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { HapticManager } from '@/utils/haptics';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { PackDomain, PACK_DOMAIN_COLORS } from '@/constants/packs';
import { WORD_POOL, shuffleArray } from '@/constants/words';
import { useXP } from '@/hooks/useXP';
import { useAudio } from '@/hooks/useAudio';
import { useMastery } from '@/hooks/useMastery';
import { useAchievements } from '@/hooks/useAchievements';
import { ComboTracker } from '@/components/game/ComboTracker';
import { DifficultyBadge } from '@/components/game/DifficultyBadge';
import { TimerBar } from '@/components/game/TimerBar';
import { XPPopup } from '@/components/game/XPPopup';
import { BonusRoundModal } from '@/components/game/BonusRoundModal';
import { ConfettiOverlay } from '@/components/ConfettiOverlay';
import { AchievementToast } from '@/components/AchievementToast';
import { buildScaledWordQueue, buildPackWordQueue, getSmartDistractors } from '@/utils/difficultyScaling';

const TOTAL_TIME = 60;
const SPEED_BONUS_THRESHOLD = 3; // seconds per question
const MCQ_BASE = 10;
const TEXT_BASE = 20;

type QuestionType = 'mcq' | 'text';

interface TimedQuestion {
  wordIndex: number;
  type: QuestionType;
  options?: string[];
  answeredAt?: number;
}

function buildMCQOptions(wordQueue: typeof WORD_POOL, index: number, playerLevel: number): string[] {
  const correct = wordQueue[index];
  const decoys = getSmartDistractors(correct, playerLevel);
  return shuffleArray([correct.word, ...decoys]);
}

const TIMER_WARNING_THRESHOLD = 10; // seconds

export default function TimedChallengeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ domain?: string }>();
  const focusDomain = (params.domain as PackDomain) || null;
  const domainTheme = focusDomain ? PACK_DOMAIN_COLORS[focusDomain] : null;
  const themeAccentDim = domainTheme?.dim ?? Colors.flameDim;
  const themeAccentLight = domainTheme?.light ?? Colors.flame;

  const { addXP, didLevelUp, clearLevelUp, level } = useXP();
  const { play } = useAudio();
  const { discoverWord, recordCorrect, justMastered, clearJustMastered } = useMastery();
  const { recordTimedChallengeComplete, checkMasteryAchievements, justUnlocked, clearJustUnlocked } = useAchievements();
  const mastery = useMastery();
  const [showConfetti, setShowConfetti] = useState(false);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'over'>('intro');
  const [wordQueue] = useState(() =>
    focusDomain ? buildPackWordQueue(level, focusDomain) : buildScaledWordQueue(level),
  );
  const [questions, setQuestions] = useState<TimedQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [input, setInput] = useState('');
  const [mcqSelected, setMcqSelected] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [lastXP, setLastXP] = useState<number | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusType, setBonusType] = useState<'slang' | 'phrase'>('slang');
  const [bonusTrigger, setBonusTrigger] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeTx = useSharedValue(0);
  const bounceScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTy = useSharedValue(0);

  const currentQ = questions[currentQIndex];
  const currentWord = currentQ ? wordQueue[currentQ.wordIndex % wordQueue.length] : null;

  const initQuestions = useCallback(() => {
    const q: TimedQuestion[] = [];
    for (let i = 0; i < 30; i++) {
      q.push({
        wordIndex: i % wordQueue.length,
        type: i % 2 === 0 ? 'mcq' : 'text',
        options: i % 2 === 0 ? buildMCQOptions(wordQueue, i % wordQueue.length, level) : undefined,
      });
    }
    return q;
  }, [wordQueue, level]);

  const startGame = useCallback(() => {
    const q = initQuestions();
    setQuestions(q);
    setCurrentQIndex(0);
    setTimeLeft(TOTAL_TIME);
    setStreak(0);
    setScore(0);
    setCorrect(0);
    setTotal(0);
    setInput('');
    setMcqSelected(null);
    setFeedbackState('idle');
    setLastXP(null);
    setBonusTrigger(0);
    setPhase('playing');
    setQuestionStartTime(Date.now());
  }, [initQuestions]);

  // Timer tick
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase('over');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Timer warning tick sound when < 10 seconds remain
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0 && timeLeft <= TIMER_WARNING_THRESHOLD) {
      play('timer_tick');
    }
  }, [timeLeft, phase, play]);

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

  // Speed demon achievement check when game is over
  useEffect(() => {
    if (phase === 'over' && timeLeft > 10) {
      recordTimedChallengeComplete(timeLeft);
    }
  }, [phase, timeLeft, recordTimedChallengeComplete]);

  const advanceQuestion = useCallback(() => {
    const next = currentQIndex + 1;
    if (next >= questions.length) {
      setPhase('over');
      return;
    }
    cardOpacity.value = withTiming(0, { duration: 180 }, () => {
      runOnJS(() => {
        setCurrentQIndex(next);
        setInput('');
        setMcqSelected(null);
        setFeedbackState('idle');
        setQuestionStartTime(Date.now());
      })();
      cardOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
      cardTy.value = withTiming(20, { duration: 0 });
      cardTy.value = withSpring(0, { damping: 16 });
    });
  }, [currentQIndex, questions.length, cardOpacity, cardTy]);

  const handleAnswer = useCallback(
    (isCorrect: boolean, xpBase: number) => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const speedBonus = elapsed < SPEED_BONUS_THRESHOLD ? 5 : 0;

      setTotal((p) => p + 1);

      // Discover word
      if (currentWord) discoverWord(currentWord.id);

      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        let xp = xpBase + speedBonus;
        if (newStreak >= 5) xp = Math.round(xpBase * 2) + 40 + speedBonus;
        else if (newStreak >= 3) xp = Math.round(xpBase * 1.5) + 30 + speedBonus;

        setCorrect((p) => p + 1);
        setScore((p) => p + xp);
        addXP(xp);
        setLastXP(xp);
        setFeedbackState('correct');

        // Track mastery
        if (currentWord) recordCorrect(currentWord.id);
        bounceScale.value = withSequence(
          withSpring(1.06, { damping: 5, stiffness: 300 }),
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

        const nb = bonusTrigger + 1;
        setBonusTrigger(nb);
        if (nb % 3 === 0) {
          const type: 'slang' | 'phrase' = nb % 6 === 0 ? 'phrase' : 'slang';
          setBonusType(type);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => setShowBonus(true), 700);
        } else {
          setTimeout(() => advanceQuestion(), 700);
        }
      } else {
        setStreak(0);
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
        setTimeout(() => advanceQuestion(), 900);
      }
    },
    [streak, bonusTrigger, questionStartTime, addXP, play, bounceScale, shakeTx, advanceQuestion, currentWord, discoverWord, recordCorrect],
  );

  const handleTextSubmit = useCallback(() => {
    if (!input.trim() || !currentWord || feedbackState !== 'idle') return;
    const answer = input.trim().toLowerCase();
    const correct = currentWord.word.toLowerCase();
    handleAnswer(answer === correct, TEXT_BASE);
  }, [input, currentWord, feedbackState, handleAnswer]);

  const handleMCQSelect = useCallback(
    (option: string) => {
      if (feedbackState !== 'idle' || !currentWord) return;
      setMcqSelected(option);
      handleAnswer(option === currentWord.word, MCQ_BASE);
    },
    [feedbackState, currentWord, handleAnswer],
  );

  const handleBonusComplete = useCallback(
    (success: boolean, xpEarned: number) => {
      setShowBonus(false);
      if (success && xpEarned > 0) {
        addXP(xpEarned);
        setLastXP(xpEarned);
        setScore((p) => p + xpEarned);
      }
      // Resume timer
      setPhase('playing');
      setTimeout(() => advanceQuestion(), 300);
    },
    [addXP, advanceQuestion],
  );

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTy.value }, { translateX: shakeTx.value }, { scale: bounceScale.value }],
  }));

  if (phase === 'intro') {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <LinearGradient colors={[focusDomain ? themeAccentDim : '#2A0D00', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.introContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnIntro} hitSlop={8}>
            <Text style={[styles.backTextFlame, focusDomain && { color: themeAccentLight }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.introEmoji}>⏱️</Text>
          <Text style={styles.introTitle}>{focusDomain ? 'Focused Challenge' : '60-Second Challenge'}</Text>
          <Text style={styles.introSubtitle}>Answer as many questions as possible in 60 seconds. Mix of text and multiple choice. Speed bonuses for quick answers!</Text>
          <View style={styles.introRules}>
            {['⚡ +5 XP speed bonus per fast answer', '🔥 Combo multipliers still apply', '🎁 Bonus rounds pause the timer', '📝 Mix of text & MCQ questions'].map((rule) => (
              <View key={rule} style={styles.ruleRow}>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.flame, '#FF9A5C']} style={styles.startBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.startBtnText}>Start Challenge →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'over') {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <LinearGradient colors={[focusDomain ? themeAccentDim : '#2A0D00', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.introContent}>
          <Text style={styles.introEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '💪'}</Text>
          <Text style={styles.introTitle}>{"Time's Up!"}</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultBox}><Text style={styles.resultValue}>{score}</Text><Text style={styles.resultLabel}>Total XP</Text></View>
            <View style={styles.resultBox}><Text style={styles.resultValue}>{correct}</Text><Text style={styles.resultLabel}>Correct</Text></View>
            <View style={styles.resultBox}><Text style={styles.resultValue}>{total}</Text><Text style={styles.resultLabel}>Attempted</Text></View>
            <View style={styles.resultBox}><Text style={styles.resultValue}>{accuracy}%</Text><Text style={styles.resultLabel}>Accuracy</Text></View>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.flame, '#FF9A5C']} style={styles.startBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.startBtnText}>Try Again 🔄</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.homeBtnText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentWord || !currentQ) return null;

  const bonusWord =
    (bonusType === 'slang' && currentWord.slangInfo) || (bonusType === 'phrase' && currentWord.phraseInfo)
      ? currentWord
      : wordQueue.find((w) => (bonusType === 'slang' ? w.slangInfo : w.phraseInfo)) ?? currentWord;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={[focusDomain ? themeAccentDim : '#2A0D00', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backTextFlame}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <TimerBar duration={TOTAL_TIME} timeLeft={timeLeft} />
          </View>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreText}>{score} XP</Text>
          </View>
        </View>

        <View style={styles.subHeader}>
          <ComboTracker streak={streak} />
          <View style={styles.questionTypeBadge}>
            <Text style={[styles.questionTypeText, { color: currentQ.type === 'mcq' ? Colors.success : Colors.accent }]}>
              {currentQ.type === 'mcq' ? '🎯 MCQ' : '📝 TYPE'}
            </Text>
          </View>
          <DifficultyBadge difficulty={currentWord.difficulty} size="sm" />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
          <Animated.View style={[styles.questionCard, cardStyle]}>
            <LinearGradient
              colors={currentQ.type === 'mcq' ? ['#091E14', '#0D1128'] : ['#13102A', '#0D1128']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.clueLabel}>This word means...</Text>
            {currentWord.meanings.map((m, i) => (
              <View key={i} style={styles.meaningRow}>
                <View style={[styles.dot, { backgroundColor: currentQ.type === 'mcq' ? Colors.success : Colors.accent }]} />
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}
            {feedbackState !== 'idle' && (
              <View style={[styles.feedbackBanner, feedbackState === 'correct' ? styles.fbCorrect : styles.fbWrong]}>
                <Text style={styles.fbText}>{feedbackState === 'correct' ? `✓ Correct! "${currentWord.word}"` : `✗ It was "${currentWord.word}"`}</Text>
              </View>
            )}
          </Animated.View>

          {currentQ.type === 'mcq' ? (
            <View style={styles.optionsContainer}>
              {(currentQ.options ?? []).map((opt, i) => {
                const isSelected = mcqSelected === opt;
                const isCorrect = isSelected && opt === currentWord.word;
                const isWrong = isSelected && opt !== currentWord.word;
                const isReveal = !isSelected && opt === currentWord.word && feedbackState === 'wrong';
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
                    <Text style={[styles.optionText, (isCorrect || isReveal) && styles.optionTextGreen, isWrong && styles.optionTextRed]}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </Text>
                    {isCorrect && <Text style={styles.optionIcon}>✓</Text>}
                    {isWrong && <Text style={styles.optionIconWrong}>✗</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.textInputSection}>
              <TextInput
                style={[styles.textInput, feedbackState === 'correct' && styles.inputCorrect, feedbackState === 'wrong' && styles.inputWrong]}
                value={input}
                onChangeText={setInput}
                placeholder="Type the word..."
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                editable={feedbackState === 'idle'}
                onSubmitEditing={handleTextSubmit}
                returnKeyType="done"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitBtn, !input.trim() && styles.submitBtnDisabled]}
                onPress={handleTextSubmit}
                disabled={!input.trim() || feedbackState !== 'idle'}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[Colors.accent, Colors.accentLight]} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.submitText}>Submit →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {lastXP !== null && <XPPopup amount={lastXP} onDone={() => setLastXP(null)} />}

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  introContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: 20 },
  backBtnIntro: { position: 'absolute', top: 20, left: 20 },
  introEmoji: { fontSize: 72, marginBottom: 16 },
  introTitle: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.black, marginBottom: 12, textAlign: 'center' },
  introSubtitle: { color: Colors.textSub, fontSize: Fonts.sizes.base, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  introRules: { width: '100%', gap: 10, marginBottom: 32 },
  ruleRow: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 14 },
  ruleText: { color: Colors.textSub, fontSize: Fonts.sizes.sm },
  startBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.accent },
  startBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32, width: '100%' },
  resultBox: { flex: 1, minWidth: '40%', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center' },
  resultValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  resultLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  homeBtn: { paddingVertical: 14 },
  homeBtnText: { color: Colors.flame, fontWeight: Fonts.weights.semibold, fontSize: Fonts.sizes.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerCenter: { flex: 1 },
  scoreChip: { backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.gold, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  backTextFlame: { color: Colors.flame, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  questionTypeBadge: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  questionTypeText: { fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  questionCard: { backgroundColor: Colors.bgCard, borderRadius: Radii.xl, padding: 20, borderWidth: 1.5, borderColor: Colors.borderLight, marginBottom: 16, overflow: 'hidden', ...Shadows.card },
  clueLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, fontWeight: Fonts.weights.semibold, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  meaningRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  meaningText: { color: Colors.text, fontSize: Fonts.sizes.base, lineHeight: 22, flex: 1 },
  feedbackBanner: { marginTop: 12, borderRadius: Radii.lg, padding: 10, alignItems: 'center' },
  fbCorrect: { backgroundColor: Colors.successDim, borderWidth: 1, borderColor: Colors.success },
  fbWrong: { backgroundColor: Colors.errorDim, borderWidth: 1, borderColor: Colors.error },
  fbText: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  optionsContainer: { gap: 10 },
  optionBtn: { backgroundColor: Colors.bgCardAlt, borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionCorrect: { borderColor: Colors.success, backgroundColor: Colors.successDim },
  optionWrong: { borderColor: Colors.error, backgroundColor: Colors.errorDim },
  optionReveal: { borderColor: Colors.success + '80', backgroundColor: Colors.successDim + '60' },
  optionText: { color: Colors.text, fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.semibold },
  optionTextGreen: { color: Colors.success },
  optionTextRed: { color: Colors.error },
  optionIcon: { color: Colors.success, fontSize: 18, fontWeight: Fonts.weights.bold },
  optionIconWrong: { color: Colors.error, fontSize: 18 },
  textInputSection: { gap: 12 },
  textInput: { backgroundColor: Colors.bgCardAlt, borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: Radii.lg, padding: 16, color: Colors.text, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.semibold },
  inputCorrect: { borderColor: Colors.success, backgroundColor: Colors.successDim },
  inputWrong: { borderColor: Colors.error, backgroundColor: Colors.errorDim },
  submitBtn: { borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.accent },
  submitBtnDisabled: { opacity: 0.5 },
  submitGradient: { paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
