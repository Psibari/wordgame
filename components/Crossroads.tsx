
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { WORD_POOL, WordEntry, shuffleArray } from '@/constants/words';

const ROUND_TIME = 15;
const WORDS_PER_GAME = 10;

function buildBlitzQueue(count: number): WordEntry[] {
  return shuffleArray(WORD_POOL).slice(0, count);
}

function buildChoices(word: WordEntry): { text: string; correct: boolean }[] {
  const correct = word.meanings.map(m => ({ text: m, correct: true }));
  const decoys = shuffleArray(word.mcqDecoys)
    .slice(0, Math.max(2, 4 - correct.length))
    .map(d => ({ text: d, correct: false }));
  return shuffleArray([...correct, ...decoys]);
}

export default function Blitz({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const [queue] = useState(() => buildBlitzQueue(WORDS_PER_GAME));
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState(() => buildChoices(queue[0]));
  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const timerAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;

  const currentWord = queue[index];

  // Animate card in
  useEffect(() => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      damping: 16,
      stiffness: 160,
      useNativeDriver: true,
    }).start();
  }, [index]);

  // Timer
  useEffect(() => {
    if (revealed || isGameOver) return;
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: ROUND_TIME * 1000,
      useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [index, revealed, isGameOver]);

  const handleTap = useCallback((i: number) => {
    if (revealed || selected.includes(i)) return;
    const choice = choices[i];
    const newSelected = [...selected, i];
    setSelected(newSelected);

    if (choice.correct) {
      const correctTapped = newSelected.filter(idx => choices[idx].correct).length;
      const totalCorrect = choices.filter(c => c.correct).length;
      const xp = 50 + timeLeft * 5;
      setScore(s => s + xp);
      if (correctTapped === totalCorrect) {
        // Got all correct meanings!
        clearInterval(timerRef.current!);
        setCorrectCount(c => c + 1);
        setRevealed(true);
      }
    } else {
      // Wrong tap — penalty
      setTimeLeft(t => Math.max(0, t - 3));
      setRevealed(true);
      clearInterval(timerRef.current!);
    }
  }, [revealed, selected, choices, timeLeft]);

  const handleNext = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setIsGameOver(true);
      return;
    }
    setIndex(nextIndex);
    setChoices(buildChoices(queue[nextIndex]));
    setSelected([]);
    setRevealed(false);
    setTimeLeft(ROUND_TIME);
  }, [index, queue]);

  if (isGameOver) {
    const accuracy = Math.round((correctCount / WORDS_PER_GAME) * 100);
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.gameOver}>
          <Text style={styles.gameOverEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '⚡'}</Text>
          <Text style={styles.gameOverTitle}>Blitz Complete!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{correctCount}/{WORDS_PER_GAME}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
            <LinearGradient colors={['#FF6B35', '#FF3E6C']} style={styles.exitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.exitBtnText}>← Back to Modes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const timerColor = timerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [Colors.error, Colors.gold, '#FF6B35'],
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚡ Blitz</Text>
          <Text style={styles.headerSub}>Word {index + 1} of {WORDS_PER_GAME} · {score} XP</Text>
        </View>
        <View style={styles.timerBubble}>
          <Text style={[styles.timerText, timeLeft <= 5 && { color: Colors.error }]}>{timeLeft}s</Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerFill, { width: timerWidth, backgroundColor: timerColor as any }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Word card */}
        <Animated.View style={[styles.wordCard, {
          opacity: cardAnim,
          transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
        }]}>
          <LinearGradient colors={['#0D1128', '#111630']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={[styles.wordCardBorder, { borderColor: '#FF6B3540' }]} />
          <View style={styles.wordCardInner}>
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyText}>{currentWord.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.wordText}>{currentWord.word}</Text>
            <Text style={styles.wordCategory}>{currentWord.category}</Text>
            <Text style={styles.instruction}>
              Tap <Text style={{ color: '#FF6B35', fontWeight: Fonts.weights.bold }}>ALL</Text> correct meanings
            </Text>
          </View>
        </Animated.View>

        {/* Choices */}
        <View style={styles.choicesGrid}>
          {choices.map((choice, i) => {
            const isTapped = selected.includes(i);
            const isCorrect = choice.correct;
            let bg: [string, string] = ['#0D1128', '#111630'];
            let border = Colors.borderLight;

            if (revealed && isCorrect) {
              bg = ['#063D2E', '#0A5240'];
              border = Colors.success;
            } else if (revealed && isTapped && !isCorrect) {
              bg = ['#3D0F1F', '#5A1728'];
              border = Colors.error;
            } else if (isTapped && isCorrect) {
              bg = ['#063D2E', '#0A5240'];
              border = Colors.success;
            }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.choiceCard, { borderColor: border }]}
                onPress={() => handleTap(i)}
                activeOpacity={revealed ? 1 : 0.75}
                disabled={revealed && !isTapped}
              >
                <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={styles.choiceText}>{choice.text}</Text>
                {revealed && isCorrect && <Text style={styles.choiceTick}>✓</Text>}
                {revealed && isTapped && !isCorrect && <Text style={styles.choiceCross}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next button (shown after reveal) */}
        {revealed && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient colors={['#FF6B35', '#FF3E6C']} style={styles.nextBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.nextBtnText}>
                {index + 1 >= queue.length ? 'See Results 🏆' : 'Next Word →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backText: { color: '#FF6B35', fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  timerBubble: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  timerText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  timerTrack: { height: 4, backgroundColor: Colors.bgCard, width: '100%' },
  timerFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  wordCard: { borderRadius: Radii.xl, overflow: 'hidden', marginBottom: 4, ...Shadows.card },
  wordCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  wordCardInner: { padding: 20 },
  difficultyPill: { alignSelf: 'flex-start', backgroundColor: '#FF6B3525', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  difficultyText: { color: '#FF6B35', fontSize: 10, fontWeight: Fonts.weights.bold, letterSpacing: 1.5 },
  wordText: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, letterSpacing: -1, marginBottom: 4 },
  wordCategory: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: 12 },
  instruction: { color: Colors.textSub, fontSize: Fonts.sizes.sm },
  choicesGrid: { gap: 10 },
  choiceCard: { borderRadius: Radii.lg, borderWidth: 1.5, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...Shadows.card },
  choiceText: { color: Colors.text, fontSize: Fonts.sizes.base, fontWeight: Fonts.weights.medium, flex: 1, lineHeight: 22 },
  choiceTick: { color: Colors.success, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, marginLeft: 8 },
  choiceCross: { color: Colors.error, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold, marginLeft: 8 },
  nextBtn: { borderRadius: Radii.xl, overflow: 'hidden', marginTop: 4, ...Shadows.accent },
  nextBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  gameOver: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  gameOverEmoji: { fontSize: 72, marginBottom: 16 },
  gameOverTitle: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center', ...Shadows.card },
  statValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  exitBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.accent },
  exitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  exitBtnText: { color: '#fff', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
