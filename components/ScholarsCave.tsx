import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { WORD_POOL, WordEntry, shuffleArray } from '@/constants/words';
import { useMastery } from '@/hooks/useMastery';
import { useXP } from '@/hooks/useXP';

const WORDS_PER_GAME = 6;

interface Round {
  word: WordEntry;
  allTiles: string[];   // correct meanings + decoys mixed
  correctSet: Set<string>;
}

function buildRound(word: WordEntry): Round {
  const decoys = shuffleArray(word.mcqDecoys).slice(0, 2);
  const allTiles = shuffleArray([...word.meanings, ...decoys]);
  return { word, allTiles, correctSet: new Set(word.meanings) };
}

function buildQueue(count: number): Round[] {
  return shuffleArray(WORD_POOL).slice(0, count).map(buildRound);
}

export default function ScholarsCave({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const { discoverWord, recordCorrect } = useMastery();
  const { addXP } = useXP();

  const [queue] = useState(() => buildQueue(WORDS_PER_GAME));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

  const round = queue[index];

  useEffect(() => {
    cardAnim.setValue(0);
    revealAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, damping: 16, stiffness: 160, useNativeDriver: true }).start();
  }, [index]);

  const handleTile = useCallback((tile: string) => {
    if (revealed) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(tile) ? next.delete(tile) : next.add(tile);
      return next;
    });
  }, [revealed]);

  const handleSubmit = useCallback(() => {
    if (selected.size === 0 || revealed) return;

    const { word, correctSet } = round;
    const selectedArr = Array.from(selected);
    const correctPicked = selectedArr.filter(t => correctSet.has(t)).length;
    const wrongPicked = selectedArr.filter(t => !correctSet.has(t)).length;
    const totalCorrect = correctSet.size;
    const allCorrect = correctPicked === totalCorrect && wrongPicked === 0;

    // XP: 80 base + 20 per correct meaning, minus 15 per wrong
    const xp = Math.max(0, 80 + correctPicked * 20 - wrongPicked * 15);
    setScore(s => s + xp);
    addXP(xp);

    // Mastery
    discoverWord(word.id);
    if (allCorrect) {
      recordCorrect(word.id);
      setCorrectCount(c => c + 1);
    }

    setRevealed(true);
    Animated.spring(revealAnim, { toValue: 1, damping: 14, stiffness: 120, useNativeDriver: true }).start();
  }, [selected, revealed, round, addXP, discoverWord, recordCorrect]);

  const handleNext = useCallback(() => {
    const next = index + 1;
    if (next >= queue.length) { setIsGameOver(true); return; }
    setIndex(next);
    setSelected(new Set());
    setRevealed(false);
  }, [index, queue.length]);

  if (isGameOver) {
    const accuracy = Math.round((correctCount / WORDS_PER_GAME) * 100);
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />
        <View style={styles.gameOver}>
          <Text style={styles.gameOverEmoji}>{accuracy >= 80 ? '🏆' : accuracy >= 60 ? '📚' : '🕯️'}</Text>
          <Text style={styles.gameOverTitle}>Cave Complete!</Text>
          <Text style={styles.gameOverSub}>Words have been added to your Scholar's Lexicon</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{correctCount}/{WORDS_PER_GAME}</Text>
              <Text style={styles.statLabel}>Perfect</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.8}>
            <LinearGradient colors={['#F0B429', '#FFD166']} style={styles.exitBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.exitBtnText, { color: Colors.bg }]}>← Back to Modes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { word, allTiles, correctSet } = round;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#10082E', Colors.bg]} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>📚 Scholar's Cave</Text>
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

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Word card */}
        <Animated.View style={[styles.wordCard, {
          opacity: cardAnim,
          transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
        }]}>
          <LinearGradient colors={['#0D1128', '#111630']} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={[styles.cardBorder, { borderColor: '#F0B42940' }]} />
          <View style={styles.cardInner}>
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyText}>{word.difficulty.toUpperCase()}</Text>
            </View>
            <Text style={styles.wordText}>{word.word}</Text>
            <Text style={styles.wordCategory}>{word.category}</Text>

            {/* Meaning slot indicators */}
            <View style={styles.slotRow}>
              <Text style={styles.slotLabel}>
                This word has{' '}
                <Text style={{ color: Colors.gold, fontWeight: Fonts.weights.bold }}>
                  {word.meanings.length} meaning{word.meanings.length > 1 ? 's' : ''}
                </Text>
              </Text>
            </View>
            <View style={styles.slots}>
              {word.meanings.map((_, i) => {
                const correctPicked = Array.from(selected).filter(t => correctSet.has(t));
                const filled = i < correctPicked.length;
                return (
                  <View
                    key={i}
                    style={[
                      styles.slot,
                      filled && { backgroundColor: Colors.gold + '40', borderColor: Colors.gold },
                    ]}
                  />
                );
              })}
            </View>

            <Text style={styles.instruction}>
              Tap <Text style={{ color: Colors.gold, fontWeight: Fonts.weights.bold }}>all</Text> correct meanings below
            </Text>
          </View>
        </Animated.View>

        {/* Tile grid */}
        <View style={styles.tileGrid}>
          {allTiles.map((tile, i) => {
            const isSel = selected.has(tile);
            const isCorrect = correctSet.has(tile);

            // Colors based on state
            let bg: [string, string] = ['#0D1128', '#111630'];
            let border = Colors.borderLight;
            let textColor = Colors.text;

            if (revealed) {
              if (isCorrect) { bg = ['#063D2E', '#0A5240']; border = Colors.success; textColor = '#7FFFD4'; }
              else if (isSel && !isCorrect) { bg = ['#3D0F1F', '#5A1728']; border = Colors.error; textColor = '#FF9999'; }
            } else if (isSel) {
              bg = ['#2A1F00', '#3D2D00'];
              border = Colors.gold;
              textColor = Colors.gold;
            }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.tile, { borderColor: border }]}
                onPress={() => handleTile(tile)}
                activeOpacity={0.75}
                disabled={revealed}
              >
                <LinearGradient colors={bg} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.tileInner}>
                  {isSel && !revealed && (
                    <View style={styles.checkDot} />
                  )}
                  <Text style={[styles.tileText, { color: textColor }]}>{tile}</Text>
                  {revealed && isCorrect && <Text style={styles.tileTick}>✓</Text>}
                  {revealed && isSel && !isCorrect && <Text style={styles.tileCross}>✗</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit button */}
        {!revealed && (
          <TouchableOpacity
            style={[styles.submitBtn, selected.size === 0 && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={selected.size === 0}
          >
            <LinearGradient
              colors={selected.size > 0 ? ['#F0B429', '#FFD166'] : ['#1A1A2E', '#1A1A2E']}
              style={styles.submitBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.submitBtnText, { color: selected.size > 0 ? Colors.bg : Colors.textMuted }]}>
                {selected.size === 0
                  ? 'Select meanings to submit'
                  : `Submit ${selected.size} meaning${selected.size > 1 ? 's' : ''} →`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Polly reveal */}
        {revealed && (
          <Animated.View style={[styles.pollyCard, {
            opacity: revealAnim,
            transform: [{ translateY: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }]}>
            <LinearGradient
              colors={correctCount > 0 && Array.from(selected).filter(t => correctSet.has(t)).length === correctSet.size && Array.from(selected).filter(t => !correctSet.has(t)).length === 0
                ? ['#063D2E', '#0A5240'] : ['#1A1228', '#221535']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={[styles.pollyBorder, {
              borderColor: Array.from(selected).filter(t => correctSet.has(t)).length === correctSet.size
                ? Colors.success + '60' : Colors.gold + '40'
            }]} />
            <Text style={styles.pollyEmoji}>🦜</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pollyTitle}>
                {Array.from(selected).filter(t => correctSet.has(t)).length === correctSet.size &&
                 Array.from(selected).filter(t => !correctSet.has(t)).length === 0
                  ? "You're getting wise!"
                  : "Here's what you missed:"}
              </Text>
              {word.meanings.map((m, i) => (
                <Text key={i} style={[styles.pollyMeaning, { color: selected.has(m) ? Colors.success : Colors.gold }]}>
                  {selected.has(m) ? '✓' : '○'} {m}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        {revealed && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient colors={['#F0B429', '#FFD166']} style={styles.nextBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={[styles.nextBtnText, { color: Colors.bg }]}>
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
  backText: { color: Colors.gold, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.semibold },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: Fonts.sizes.md, fontWeight: Fonts.weights.bold },
  headerSub: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, marginTop: 1 },
  progressBubble: { backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  progressText: { color: Colors.gold, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.sm },
  progressTrack: { height: 4, backgroundColor: Colors.bgCard },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  wordCard: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.card },
  cardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1.5 },
  cardInner: { padding: 20 },
  difficultyPill: { alignSelf: 'flex-start', backgroundColor: '#F0B42925', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  difficultyText: { color: Colors.gold, fontSize: 10, fontWeight: Fonts.weights.bold, letterSpacing: 1.5 },
  wordText: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, letterSpacing: -1, marginBottom: 4 },
  wordCategory: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, marginBottom: 16 },
  slotRow: { marginBottom: 8 },
  slotLabel: { color: Colors.textSub, fontSize: Fonts.sizes.sm },
  slots: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  slot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight },
  instruction: { color: Colors.textSub, fontSize: Fonts.sizes.sm },
  tileGrid: { gap: 10 },
  tile: { borderRadius: Radii.lg, borderWidth: 1.5, overflow: 'hidden', ...Shadows.card },
  tileInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gold },
  tileText: { flex: 1, fontSize: Fonts.sizes.base, lineHeight: 22 },
  tileTick: { color: Colors.success, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  tileCross: { color: Colors.error, fontSize: Fonts.sizes.lg, fontWeight: Fonts.weights.bold },
  submitBtn: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.gold },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  pollyCard: { borderRadius: Radii.xl, overflow: 'hidden', flexDirection: 'row', padding: 16, gap: 12, ...Shadows.card },
  pollyBorder: { ...StyleSheet.absoluteFillObject, borderRadius: Radii.xl, borderWidth: 1 },
  pollyEmoji: { fontSize: 32, marginTop: 2 },
  pollyTitle: { color: Colors.text, fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.base, marginBottom: 8 },
  pollyMeaning: { fontSize: Fonts.sizes.sm, lineHeight: 22 },
  nextBtn: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.gold },
  nextBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
  gameOver: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  gameOverEmoji: { fontSize: 72, marginBottom: 16 },
  gameOverTitle: { color: Colors.text, fontSize: Fonts.sizes.xxxl, fontWeight: Fonts.weights.black, marginBottom: 8 },
  gameOverSub: { color: Colors.textMuted, fontSize: Fonts.sizes.sm, textAlign: 'center', marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: { flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radii.xl, padding: 16, alignItems: 'center', ...Shadows.card },
  statValue: { color: Colors.text, fontSize: Fonts.sizes.xl, fontWeight: Fonts.weights.black, marginBottom: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Fonts.sizes.xs, fontWeight: Fonts.weights.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  exitBtn: { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.gold },
  exitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  exitBtnText: { fontWeight: Fonts.weights.bold, fontSize: Fonts.sizes.md },
});
