import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { WORD_POOL, WordEntry, shuffleArray } from '@/constants/words';

const WORDS_PER_GAME = 8;

interface CrossroadsRound {
  word: WordEntry;
  sentence: string;
  correctMeaning: string;
  options: string[];
}

// Generate a sentence from a meaning using simple templates
function makeSentence(word: string, meaning: string): string {
  const w = word.toLowerCase();
  const templates = [
    `In this context, "${w}" refers to: ___`,
    `The word "${w}" is being used to mean: ___`,
    `Here, "${w}" means: ___`,
    `Which meaning of "${w}" fits? ___`,
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return t.replace('___', meaning);
}

// Build a sentence-blank from just the word (player picks the meaning)
function makeSentenceBlank(word: string, meaning: string): string {
  const w = word.toLowerCase();
  const contextHints: Record<string, string[]> = {
    bank: [
      `She deposited her savings at the ___ on the high street.`,
      `They sat on the ___ of the river and watched the ducks.`,
      `The pilot had to ___ the aircraft steeply to avoid the storm.`,
    ],
    spring: [
      `The flowers bloomed again as ___ arrived.`,
      `The old mattress had a broken ___ poking through.`,
      `The cat will ___ forward the moment it spots a bird.`,
    ],
    light: [
      `The room was filled with warm ___ from the fireplace.`,
      `She picked up the ___ bag easily with one hand.`,
      `He used a match to ___ the candle.`,
    ],
    pitch: [
      `The football team ran out onto the ___ for the final.`,
      `The singer's ___ was perfectly in tune.`,
      `The salesman gave a convincing ___ to win the deal.`,
    ],
    rock: [
      `She sat on a smooth ___ by the river.`,
      `The band played a set of classic ___ songs.`,
      `She gently began to ___ the baby to sleep.`,
    ],
    fire: [
      `They gathered around the ___ to keep warm.`,
      `The manager had to ___ two employees for misconduct.`,
      `The soldier was ordered to ___ at the target.`,
    ],
    bear: [
      `A large ___ was spotted near the campsite.`,
      `The ___ market caused many investors to sell their shares.`,
      `She could not ___ the sound of his constant whistling.`,
    ],
    match: [
      `He struck a ___ to light the barbecue.`,
      `The ___ ended in a draw after 90 minutes.`,
      `The curtains ___ the colour of the sofa perfectly.`,
    ],
  };

  const hints = contextHints[w];
  if (hints) {
    const idx = Math.floor(Math.random() * hints.length);
    return hints[idx];
  }

  // Fallback: meaning-based sentence
  return `"${word}" — which meaning applies here? → ${meaning.slice(0, 40)}...`;
}

function buildRound(word: WordEntry): CrossroadsRound {
  const correctMeaning = word.meanings[Math.floor(Math.random() * word.meanings.length)];
  const sentence = makeSentenceBlank(word.word, correctMeaning);
  const wrongPool = [
    ...word.meanings.filter(m => m !== correctMeaning),
    ...word.mcqDecoys,
  ];
  const wrongs = shuffleArray(wrongPool).slice(0, 3);
  const options = shuffleArray([correctMeaning, ...wrongs]);
  return { word, sentence, correctMeaning, options };
}

function buildQueue(count: number): CrossroadsRound[] {
  return shuffleArray(WORD_POOL).slice(0, count).map(buildRound);
}

export default function Crossroads({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const [queue] = useState(() => buildQueue(WORDS_PER_GAME));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const round = queue[index];

  useEffect(() => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, damping: 16, stiffness: 160, useNativeDriver: true }).start();
  }, [index]);

  const shake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleSelect = useCallback((option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    if (option === round.correctMeaning) {
      setScore(s => s + 100);
      setCorrectCount(c => c + 1);
    } else {
      shake();
    }
  }, [revealed, round, shake]);

  const handleNext = useCallback(() => {
    const next = index + 1;
    if (next >= queue.length) { setIsGameOver(true); return; }
    setIndex(next);
    setSelected(null);
    setRevealed(false);
  }, [index, queue.length]);

  if (isGameOver) {
    const accuracy = Math.round((correctCount / WORDS_PER_GAME) * 100);
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.gameOver}>
          <Text style={styles.gameOverEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎉' : '🔀'}</Text>
          <Text style={styles.gameOverTitle}>Crossroads Complete!</Text>
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
            <LinearGradient colors={['#7C5CFC', '#A487FF']} style={styles.exitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.exitBtnText}>← Back to Modes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔀 Crossroads</Text>
          <Text style={styles.headerSub}>Word {index + 1} of {WORDS_PER_GAME} · {score} XP</Text>
        </View>
        <View style={styles.progressBubble}>
          <Text style={styles.progressText}>{index + 1}/{WORDS_PER_GAME}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((index + 1) / WORDS_PER_GAME) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Word card */}
        <Animated.View style={[styles.wordCard, {
          opacity: cardAnim,
          transform: [
            { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            { translateX: shakeAnim },
          ],
        }]}>
          <LinearGradient colors={['#0D1128', '#111630']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={[styles.cardBorder, { borderColor: '#7C5CFC40' }]} />
          <View style={styles.cardInner}>
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyText}>{round.word.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.wordText}>{round.word.word}</Text>
            <Text style={styles.wordCategory}>{round.word.category}</Text>
            <View style={styles.sentenceBubble}>
              <Text style={styles.sentenceLabel}>CONTEXT</Text>
              <Text style={styles.sentenceText}>{round.sentence}</Text>
            </View>
            <Text style={styles.instruction}>Which meaning fits this context?</Text>
          </View>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {round.options.map((option, i) => {
            const isSelected = selected === option;
            const isCorrect = option === round.correctMeaning;
            let bg: [string, string] = ['#0D1128', '#111630'];
            let border = Colors.borderLight;

            if (revealed && isCorrect) { bg = ['#063D2E', '#0A5240']; border = Colors.success; }
            else if (revealed && isSelected && !isCorrect) { bg = ['#3D0F1F', '#5A1728']; border = Colors.error; }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionCard, { borderColor: border }]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.75}
                disabled={revealed}
              >
                <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.optionInner}>
                  <View style={[styles.optionLetter, revealed && isCorrect ? { backgroundColor: Colors.success } : revealed && isSelected ? { backgroundColor: Colors.error } : {}]}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                  {revealed && isCorrect && <Text style={styles.tick}>✓</Text>}
                  {revealed && isSelected && !isCorrect && <Text style={styles.cross}>✗</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Polly reaction */}
        {revealed && (
          <View style={styles.pollyReaction}>
            <LinearGradient
              colors={selected === round.correctMeaning ? ['#063D2E', '#0A5240'] : ['#3D0F1F', '#5A1728']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={[styles.pollyBorder, { borderColor: selected === round.correctMeaning ? Colors.success + '60' : Colors.error + '60' }]} />
            <Text style={styles.pollyEmoji}>{selected === round.correctMeaning ? '🦜' : '🤔'}</Text>
            <Text style={styles.pollyText}>
              {selected === round.correctMeaning
                ? `Word Up! "${round.word.word}" fits perfectly here.`
                : `Not quite! The right meaning was: "${round.correctMeaning}"`}
            </Text>
          </View>
        )}

        {revealed && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient colors={['#7C5CFC', '#A487FF']} style={styles.nextBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  backText: { color: '#7C5CFC', fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  progressBubble: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  progressText: { color: '#7C5CFC', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  progressTrack: { height: 4, backgroundColor: Colors.bgCard, width: '100%' },
  progressFill: { height: 4, backgroundColor: '#7C5CFC', borderRadius: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  wordCard: { borderRadius: Radii.xl, overflow: 'hidden', marginBottom: 4, ...Shadows.card },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  cardInner: { padding: 20 },
  difficultyPill: { alignSelf: 'flex-start', backgroundColor: '#7C5CFC25', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  difficultyText: { color: '#7C5CFC', fontSize: 10, fontWeight: Fonts.weights.bold, letterSpacing: 1.5 },
  wordText: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, letterSpacing: -1, marginBottom: 4 },
  wordCategory: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: 14 },
  sentenceBubble: { backgroundColor: '#7C5CFC15', borderWidth: 1, borderColor: '#7C5CFC30', borderRadius: Radii.lg, padding: 14, marginBottom: 12 },
  sentenceLabel: { color: '#7C5CFC', fontSize: 10, fontWeight: Fonts.weights.bold, letterSpacing: 1.5, marginBottom: 6 },
  sentenceText: { color: Colors.text, fontSize: Fonts.sizes.base, lineHeight: 22, fontStyle: 'italic' },
  instruction: { color: Colors.textSub, fontSize: Fonts.sizes.sm },
  optionsGrid: { gap: 10 },
  optionCard: { borderRadius: Radii.lg, borderWidth: 1.5, overflow: 'hidden', ...Shadows.card },
  optionInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  optionLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#7C5CFC25', alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { color: '#7C5CFC', fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  optionText: { color: Colors.text, fontSize: Fonts.sizes.base, flex: 1, lineHeight: 22 },
  tick: { color: Colors.success, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  cross: { color: Colors.error, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  pollyReaction: { borderRadius: Radii.xl, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, ...Shadows.card },
  pollyBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1 },
  pollyEmoji: { fontSize: 28 },
  pollyText: { color: Colors.text, fontSize: Fonts.sizes.sm, flex: 1, lineHeight: 20 },
  nextBtn: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.accent },
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
