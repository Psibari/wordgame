import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { WORD_POOL, WordEntry } from '@/constants/words';
import { useTextGeneration } from '@fastshot/ai';
import { PollyParrotBack } from '@/components/polly/PollyParrotBack';
import { PollyTappable } from '@/components/polly/PollyTappable';

const W = Colors.workspace;

type AccentId = 'british' | 'american' | 'mid-atlantic';

interface AccentOption {
  id: AccentId;
  label: string;
  icon: string;
  description: string;
}

const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'british', label: 'British', icon: '🇬🇧', description: 'Received Pronunciation' },
  { id: 'american', label: 'American', icon: '🇺🇸', description: 'General American' },
  { id: 'mid-atlantic', label: 'Mid-Atlantic', icon: '🌊', description: 'Transatlantic blend' },
];

function PronunciationGuide({
  word,
  accent,
}: {
  word: WordEntry;
  accent: AccentId;
}) {
  const { generateText, data, isLoading, error, reset } = useTextGeneration();

  const handleGenerate = useCallback(async () => {
    reset();

    const accentLabel =
      accent === 'british'
        ? 'British Received Pronunciation (RP)'
        : accent === 'american'
          ? 'General American English'
          : 'Mid-Atlantic/Transatlantic English';

    const prompt = `For the English word "${word.word}", provide pronunciation guidance in ${accentLabel} accent. Format:

PHONETIC: [IPA transcription]
SYLLABLES: [word broken into syllables with stress marked]
PRONUNCIATION TIP: [1 sentence on how to pronounce it correctly in this accent]
USE-CASE EXAMPLE 1: [a sentence using the word in its first meaning: "${word.meanings[0]}"]
USE-CASE EXAMPLE 2: [a sentence using the word in its second meaning: "${word.meanings[1] || word.meanings[0]}"]
${word.meanings[2] ? `USE-CASE EXAMPLE 3: [a sentence using the word in its third meaning: "${word.meanings[2]}"]` : ''}

Be precise and educational. Use the specific accent pronunciation.`;

    await generateText(prompt);
  }, [word, accent, generateText, reset]);

  // Auto-generate on mount or accent change
  useEffect(() => {
    handleGenerate();
  }, [accent]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.pronunciationContainer}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={W.inkBlueGlow} />
          <Text style={styles.loadingText}>Generating pronunciation guide...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not generate guide. Tap to retry.</Text>
          <TouchableOpacity onPress={handleGenerate} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.pronunciationText}>{data}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function OracleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ wordId?: string }>();
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
  const [selectedAccent, setSelectedAccent] = useState<AccentId>('american');
  const [searchQuery] = useState('');
  const [showParrotBack, setShowParrotBack] = useState(false);

  // Initialize with passed word or first word
  useEffect(() => {
    if (params.wordId) {
      const word = WORD_POOL.find((w) => w.id === params.wordId);
      if (word) setSelectedWord(word);
    }
  }, [params.wordId]);

  // Filter words by search
  const filteredWords = searchQuery
    ? WORD_POOL.filter((w) =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()),
      ).slice(0, 20)
    : WORD_POOL.slice(0, 30);

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, [headerOpacity]);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[W.charcoal, '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Polyplex Oracle</Text>
        <View style={{ width: 50 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Oracle description with Polly */}
        <View style={styles.descSection}>
          <PollyTappable
            size={56}
            bodyColor={W.inkBlueGlow}
            accentColor="#448AFF"
            eyeColor="#001A33"
            mood="idle"
            word={selectedWord?.word}
            showPunOnTap={!!selectedWord}
          />
          <Text style={styles.descTitle}>Audio Pronunciation & Use Cases</Text>
          <Text style={styles.descText}>
            Select a word and accent to get AI-generated pronunciation guides and real-world usage examples.
          </Text>
        </View>

        {/* Accent selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT ACCENT</Text>
          <View style={styles.accentRow}>
            {ACCENT_OPTIONS.map((accent) => (
              <TouchableOpacity
                key={accent.id}
                style={[
                  styles.accentBtn,
                  selectedAccent === accent.id && styles.accentBtnActive,
                ]}
                onPress={() => {
                  setSelectedAccent(accent.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.accentIcon}>{accent.icon}</Text>
                <Text
                  style={[
                    styles.accentLabel,
                    selectedAccent === accent.id && styles.accentLabelActive,
                  ]}
                >
                  {accent.label}
                </Text>
                <Text style={styles.accentDesc}>{accent.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Word browser */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT WORD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wordBrowseRow}
          >
            {filteredWords.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={[
                  styles.wordBrowseBtn,
                  selectedWord?.id === word.id && styles.wordBrowseBtnActive,
                ]}
                onPress={() => {
                  setSelectedWord(word);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text
                  style={[
                    styles.wordBrowseText,
                    selectedWord?.id === word.id && styles.wordBrowseTextActive,
                  ]}
                >
                  {word.word}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pronunciation guide */}
        {selectedWord && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <View style={styles.selectedWordHeader}>
              <Text style={styles.selectedWordIcon}>🔮</Text>
              <View>
                <Text style={styles.selectedWordTitle}>{selectedWord.word}</Text>
                <Text style={styles.selectedWordCategory}>{selectedWord.category}</Text>
              </View>
              <View style={styles.selectedWordAccentBadge}>
                <Text style={styles.selectedWordAccentText}>
                  {ACCENT_OPTIONS.find((a) => a.id === selectedAccent)?.icon}{' '}
                  {ACCENT_OPTIONS.find((a) => a.id === selectedAccent)?.label}
                </Text>
              </View>
            </View>

            {/* Meanings reference */}
            <View style={styles.meaningsRef}>
              {selectedWord.meanings.map((m, i) => (
                <View key={i} style={styles.meaningRefItem}>
                  <View style={styles.meaningRefDot} />
                  <Text style={styles.meaningRefText}>{m}</Text>
                </View>
              ))}
            </View>

            <PronunciationGuide
              key={`${selectedWord.id}-${selectedAccent}`}
              word={selectedWord}
              accent={selectedAccent}
            />

            {/* Parrot-Back Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.parrotBackBtn,
                showParrotBack && styles.parrotBackBtnActive,
              ]}
              onPress={() => {
                setShowParrotBack(!showParrotBack);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.parrotBackIcon}>🦜</Text>
              <Text style={[styles.parrotBackLabel, showParrotBack && styles.parrotBackLabelActive]}>
                {showParrotBack ? 'Hide Parrot-Back' : 'Parrot-Back Mode'}
              </Text>
            </TouchableOpacity>

            {/* Parrot-Back Component */}
            <PollyParrotBack
              word={selectedWord.word}
              isVisible={showParrotBack}
              onClose={() => setShowParrotBack(false)}
            />
          </Animated.View>
        )}

        {/* Voice Challenge CTA */}
        <TouchableOpacity
          style={styles.voiceChallengeBtn}
          onPress={() => router.push('/voice-challenge' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[W.inkBlue, W.inkBlueDim]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.voiceChallengeIcon}>🎙️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceChallengeTitle}>Voice Challenges</Text>
            <Text style={styles.voiceChallengeSub}>
              Hear a definition, say the word — hands-free mode
            </Text>
          </View>
          <Text style={styles.voiceChallengeArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: W.charcoal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: W.zenBorder,
  },
  backText: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
  },
  headerTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  descSection: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  descIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  descTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    textAlign: 'center',
  },
  descText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  // Accent selector
  accentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  accentBtn: {
    flex: 1,
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  accentBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlue + '60',
  },
  accentIcon: {
    fontSize: 24,
  },
  accentLabel: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  accentLabelActive: {
    color: W.inkBlueLight,
  },
  accentDesc: {
    color: W.textTertiary,
    fontSize: 9,
    fontWeight: Fonts.weights.medium,
    textAlign: 'center',
  },
  // Word browser
  wordBrowseRow: {
    gap: 8,
    paddingVertical: 4,
  },
  wordBrowseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  wordBrowseBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlue + '60',
  },
  wordBrowseText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
  wordBrowseTextActive: {
    color: W.inkBlueLight,
  },
  // Selected word
  selectedWordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  selectedWordIcon: {
    fontSize: 28,
  },
  selectedWordTitle: {
    color: W.inkBlueGlow,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
  },
  selectedWordCategory: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  selectedWordAccentBadge: {
    marginLeft: 'auto',
    backgroundColor: W.zenSurface,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: W.zenBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedWordAccentText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  meaningsRef: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 14,
    marginBottom: 14,
    gap: 6,
  },
  meaningRefItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  meaningRefDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: W.inkBlue,
    marginTop: 6,
  },
  meaningRefText: {
    color: W.paper,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    flex: 1,
  },
  // Pronunciation
  pronunciationContainer: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.inkBlue + '30',
    padding: 16,
    minHeight: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.sizes.sm,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  retryBtnText: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  pronunciationText: {
    color: W.paper,
    fontSize: Fonts.sizes.sm,
    lineHeight: 24,
    fontWeight: Fonts.weights.regular,
  },
  // Parrot-Back button
  parrotBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  parrotBackBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlue + '60',
  },
  parrotBackIcon: {
    fontSize: 18,
  },
  parrotBackLabel: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  parrotBackLabelActive: {
    color: W.inkBlueLight,
  },
  // Voice challenge CTA
  voiceChallengeBtn: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
    marginTop: 8,
  },
  voiceChallengeIcon: {
    fontSize: 28,
  },
  voiceChallengeTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  voiceChallengeSub: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  voiceChallengeArrow: {
    color: W.paper,
    fontSize: 22,
    fontWeight: Fonts.weights.bold,
  },
});
