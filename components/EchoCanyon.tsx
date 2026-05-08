import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { WORD_POOL, WordEntry, shuffleArray } from '@/constants/words';
import { useXP } from '@/hooks/useXP';

interface Pair {
  word: WordEntry;
  meaning: string;
}

type Phase = 'show' | 'recall' | 'result' | 'gameover';

const SHOW_DURATION = 1800; // ms per pair
const MAX_SEQUENCE = 7;

function buildPair(word: WordEntry): Pair {
  const meaning = word.meanings[Math.floor(Math.random() * word.meanings.length)];
  return { word, meaning };
}

function buildSequence(length: number): Pair[] {
  return shuffleArray(WORD_POOL).slice(0, length).map(buildPair);
}

function buildOptions(correct: Pair, allPairs: Pair[]): string[] {
  const wrong = shuffleArray(
    allPairs
      .filter(p => p.word.id !== correct.word.id)
      .map(p => p.meaning)
      .concat(correct.word.mcqDecoys)
  ).slice(0, 3);
  return shuffleArray([correct.meaning, ...wrong]);
}

export default function EchoCanyon({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const { addXP } = useXP();

  const [sequence, setSequence] = useState<Pair[]>(() => buildSequence(2));
  const [phase, setPhase] = useState<Phase>('show');
  const [showIndex, setShowIndex] = useState(0);        // which pair is being shown
  const [recallIndex, setRecallIndex] = useState(0);    // which pair player is recalling
  const [answers, setAnswers] = useState<boolean[]>([]); // correct/wrong per recall step
  const [selected, setSelected] = useState<string | null>(null);
  const [roundsWon, setRoundsWon] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [bestChain, setBestChain] = useState(0);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Show phase: flash each pair ---
  useEffect(() => {
    if (phase !== 'show') return;
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(SHOW_DURATION - 600),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      const next = showIndex + 1;
      if (next >= sequence.length) {
        // All shown — start recall
        setShowIndex(0);
        setRecallIndex(0);
        setAnswers([]);
        setSelected(null);
        setPhase('recall');
      } else {
        setShowIndex(next);
      }
    });
    return () => { /* cleanup handled by Animated */ };
  }, [phase, showIndex, sequence.length]);

  // Animate recall card in
  useEffect(() => {
    if (phase !== 'recall') return;
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, damping: 16, stiffness: 160, useNativeDriver: true }).start();
  }, [recallIndex, phase]);

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleAnswer = useCallback((option: string) => {
    if (selected) return;
    const correct = sequence[recallIndex].meaning;
    const isCorrect = option === correct;
    setSelected(option);

    const newAnswers = [...answers, isCorrect];

    if (!isCorrect) {
      shake();
      // Wrong — short delay then game over
      timerRef.current = setTimeout(() => {
        setBestChain(prev => Math.max(prev, sequence.length - 1));
        setAnswers(newAnswers);
        setPhase('result');
      }, 900);
      return;
    }

    // Correct
    const xp = 40 + sequence.length * 15;
    setTotalScore(s => s + xp);
    addXP(xp);

    timerRef.current = setTimeout(() => {
      const nextRecall = recallIndex + 1;
      if (nextRecall >= sequence.length) {
        // Completed whole sequence!
        setRoundsWon(r => r + 1);
        setBestChain(prev => Math.max(prev, sequence.length));
        setAnswers(newAnswers);
        setPhase('result');
      } else {
        setRecallIndex(nextRecall);
        setSelected(null);
      }
    }, 600);
  }, [selected, sequence, recallIndex, answers, shake, addXP]);

  const handleNextRound = useCallback((keepGoing: boolean) => {
    if (!keepGoing) { setPhase('gameover'); return; }
    const allCorrect = answers.every(Boolean);
    const newLength = allCorrect
      ? Math.min(sequence.length + 1, MAX_SEQUENCE)
      : Math.max(2, sequence.length - 1);
    setSequence(buildSequence(newLength));
    setShowIndex(0);
    setSelected(null);
    setAnswers([]);
    setPhase('show');
  }, [answers, sequence.length]);

  // Cleanup timers
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  if (phase === 'gameover') {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.gameOver}>
          <Text style={styles.gameOverEmoji}>{bestChain >= 5 ? '🏆' : bestChain >= 3 ? '🎉' : '🔊'}</Text>
          <Text style={styles.gameOverTitle}>Echo Complete!</Text>
          <Text style={styles.gameOverSub}>The canyon remembers your voice</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalScore}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{roundsWon}</Text>
              <Text style={styles.statLabel}>Rounds Won</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{bestChain}</Text>
              <Text style={styles.statLabel}>Best Chain</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
            <LinearGradient colors={['#06D6A0', '#00C8F0']} style={styles.exitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.exitBtnText, { color: Colors.bg }]}>← Back to Modes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── SHOW PHASE ───────────────────────────────────────────────────────────
  if (phase === 'show') {
    const pair = sequence[showIndex];
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} hitSlop={8}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🔊 Echo Canyon</Text>
            <Text style={styles.headerSub}>Remember the sequence!</Text>
          </View>
          <View style={styles.chainBubble}>
            <Text style={styles.chainText}>×{sequence.length}</Text>
          </View>
        </View>

        {/* Sequence dots */}
        <View style={styles.dotRow}>
          {sequence.map((_, i) => (
            <View key={i} style={[styles.dot, i === showIndex && styles.dotActive, i < showIndex && styles.dotDone]} />
          ))}
        </View>

        <View style={styles.showCenter}>
          <Text style={styles.showLabel}>MEMORISE</Text>
          <Animated.View style={[styles.showCard, { opacity: flashAnim, transform: [{ scale: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
            <LinearGradient colors={['#031F16', '#052E1F']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={[styles.showCardBorder, { borderColor: '#06D6A040' }]} />
            <Text style={styles.showPairNum}>{showIndex + 1} / {sequence.length}</Text>
            <Text style={styles.showWord}>{pair.word.word}</Text>
            <View style={styles.showArrow}><Text style={styles.showArrowText}>→</Text></View>
            <Text style={styles.showMeaning}>{pair.meaning}</Text>
          </Animated.View>
          <Text style={styles.showHint}>🦜 "Lock it in..."</Text>
        </View>
      </View>
    );
  }

  // ─── RESULT PHASE ─────────────────────────────────────────────────────────
  if (phase === 'result') {
    const allCorrect = answers.every(Boolean);
    const correctCount = answers.filter(Boolean).length;
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>{allCorrect ? '🔊' : '💭'}</Text>
            <Text style={styles.resultTitle}>{allCorrect ? 'Echo Perfect!' : 'Echo Faded...'}</Text>
            <Text style={styles.resultSub}>
              {allCorrect
                ? `All ${sequence.length} pairs recalled!`
                : `${correctCount} of ${sequence.length} recalled`}
            </Text>
          </View>

          {/* Sequence review */}
          {sequence.map((pair, i) => (
            <View key={i} style={[styles.reviewCard, { borderColor: answers[i] ? Colors.success + '60' : Colors.error + '60' }]}>
              <LinearGradient
                colors={answers[i] ? ['#063D2E', '#0A5240'] : ['#3D0F1F', '#5A1728']}
                style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={styles.reviewNum}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewWord}>{pair.word.word}</Text>
                <Text style={styles.reviewMeaning}>{pair.meaning}</Text>
              </View>
              <Text style={styles.reviewIcon}>{answers[i] ? '✓' : '✗'}</Text>
            </View>
          ))}

          <View style={styles.resultBtns}>
            {sequence.length < MAX_SEQUENCE && (
              <TouchableOpacity style={[styles.resultBtn, { flex: 1 }]} onPress={() => handleNextRound(true)} activeOpacity={0.8}>
                <LinearGradient colors={['#06D6A0', '#00C8F0']} style={styles.resultBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.resultBtnText, { color: Colors.bg }]}>
                    {allCorrect ? `Next: ×${Math.min(sequence.length + 1, MAX_SEQUENCE)} →` : 'Try Again →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.resultBtn, { flex: 1 }]} onPress={() => handleNextRound(false)} activeOpacity={0.8}>
              <LinearGradient colors={['#0D1128', '#111630']} style={styles.resultBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.resultBtnText}>Finish Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── RECALL PHASE ─────────────────────────────────────────────────────────
  const currentPair = sequence[recallIndex];
  const options = buildOptions(currentPair, sequence);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔊 Echo Canyon</Text>
          <Text style={styles.headerSub}>Recall {recallIndex + 1} of {sequence.length} · {totalScore} XP</Text>
        </View>
        <View style={styles.chainBubble}>
          <Text style={styles.chainText}>×{sequence.length}</Text>
        </View>
      </View>

      {/* Recall dots */}
      <View style={styles.dotRow}>
        {sequence.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === recallIndex && styles.dotActive,
              i < recallIndex && (answers[i] ? styles.dotCorrect : styles.dotWrong),
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Recall card */}
        <Animated.View style={[styles.recallCard, {
          opacity: cardAnim,
          transform: [
            { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            { translateX: shakeAnim },
          ],
        }]}>
          <LinearGradient colors={['#0D1128', '#111630']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={[styles.cardBorder, { borderColor: '#06D6A040' }]} />
          <View style={styles.cardInner}>
            <Text style={styles.recallPrompt}>What does this mean?</Text>
            <Text style={styles.recallWord}>{currentPair.word.word}</Text>
            <Text style={styles.recallCategory}>{currentPair.word.category}</Text>
          </View>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {options.map((option, i) => {
            const isSelected = selected === option;
            const isCorrect = option === currentPair.meaning;
            let bg: [string, string] = ['#0D1128', '#111630'];
            let border = Colors.borderLight;

            if (selected) {
              if (isCorrect) { bg = ['#063D2E', '#0A5240']; border = Colors.success; }
              else if (isSelected) { bg = ['#3D0F1F', '#5A1728']; border = Colors.error; }
            }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionCard, { borderColor: border }]}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.75}
                disabled={!!selected}
              >
                <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.optionInner}>
                  <View style={[styles.optionLetter, selected && isCorrect ? { backgroundColor: Colors.success } : selected && isSelected ? { backgroundColor: Colors.error } : {}]}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                  {selected && isCorrect && <Text style={styles.tick}>✓</Text>}
                  {selected && isSelected && !isCorrect && <Text style={styles.cross}>✗</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: '#06D6A0', fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  chainBubble: { backgroundColor: '#06D6A020', borderWidth: 1, borderColor: '#06D6A040', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  chainText: { color: '#06D6A0', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20 },
  dot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, maxWidth: 40 },
  dotActive: { backgroundColor: '#06D6A040', borderColor: '#06D6A0' },
  dotDone: { backgroundColor: '#06D6A060', borderColor: '#06D6A0' },
  dotCorrect: { backgroundColor: Colors.success + '60', borderColor: Colors.success },
  dotWrong: { backgroundColor: Colors.error + '60', borderColor: Colors.error },
  showCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  showLabel: { color: '#06D6A0', fontSize: 11, fontWeight: Fonts.weights.bold, letterSpacing: 2, marginBottom: 20 },
  showCard: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', padding: 28, alignItems: 'center', ...Shadows.card },
  showCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  showPairNum: { color: '#06D6A0', fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, letterSpacing: 1.5, marginBottom: 12 },
  showWord: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, letterSpacing: -1, marginBottom: 12 },
  showArrow: { marginBottom: 12 },
  showArrowText: { color: '#06D6A0', fontSize: Fonts.sizes.xl },
  showMeaning: { color: Colors.text, fontSize: Fonts.sizes.md, textAlign: 'center', lineHeight: 24 },
  showHint: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginTop: 24 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  recallCard: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.card },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  cardInner: { padding: 24, alignItems: 'center' },
  recallPrompt: { color: '#06D6A0', fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.bold, letterSpacing: 2, marginBottom: 12 },
  recallWord: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, letterSpacing: -1, marginBottom: 6 },
  recallCategory: { color: Colors.textMuted, fontSize: Fonts.sizes.sm },
  optionsGrid: { gap: 10 },
  optionCard: { borderRadius: Radii.lg, borderWidth: 1.5, overflow: 'hidden', ...Shadows.card },
  optionInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  optionLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#06D6A020', alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { color: '#06D6A0', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  optionText: { color: Colors.text, fontSize: Fonts.sizes.base, flex: 1, lineHeight: 22 },
  tick: { color: Colors.success, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  cross: { color: Colors.error, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  resultHeader: { alignItems: 'center', paddingVertical: 24 },
  resultEmoji: { fontSize: 56, marginBottom: 12 },
  resultTitle: { color: Colors.text, fontSize: Fonts.sizes.xxl, fontWeight: Fonts.weights.black, marginBottom: 6 },
  resultSub: { color: Colors.textMuted, fontSize: Fonts.sizes.base },
  reviewCard: { borderRadius: Radii.lg, borderWidth: 1.5, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 8, ...Shadows.card },
  reviewNum: { color: Colors.textMuted, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm, width: 20, textAlign: 'center' },
  reviewWord: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.base },
  reviewMeaning: { color: Colors.textSub, fontSize: Fonts.sizes.sm, marginTop: 2 },
  reviewIcon: { fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  resultBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  resultBtn: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.card },
  resultBtnGrad: { paddingVertical: 14, alignItems: 'center', paddingHorizontal: 12 },
  resultBtnText: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  gameOver: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  gameOverEmoji: { fontSize: 72, marginBottom: 16 },
  gameOverTitle: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, marginBottom: 8 },
  gameOverSub: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, textAlign: 'center', marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center', ...Shadows.card },
  statValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  exitBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden' },
  exitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  exitBtnText: { fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
