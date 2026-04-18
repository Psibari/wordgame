import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { useMastery } from '@/hooks/useMastery';
import { WORD_POOL, WordEntry } from '@/constants/words';
import { WORD_PACKS, PackDomain, PACK_DOMAIN_COLORS } from '@/constants/packs';
import { useTextGeneration } from '@fastshot/ai';
import { PollyForgeReaction } from '@/components/polly/PollyForgeReaction';
import { HapticManager } from '@/utils/haptics';

const W = Colors.workspace;

type ToneId = 'academic' | 'legal' | 'executive' | 'poetic';

interface ToneOption {
  id: ToneId;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const TONE_OPTIONS: ToneOption[] = [
  { id: 'academic', label: 'Academic', icon: '🎓', color: W.tonalAcademic, description: 'Scholarly & precise' },
  { id: 'legal', label: 'Legal', icon: '⚖️', color: W.tonalLegal, description: 'Formal & authoritative' },
  { id: 'executive', label: 'Executive', icon: '💼', color: W.tonalExecutive, description: 'Concise & commanding' },
  { id: 'poetic', label: 'Poetic', icon: '🪶', color: W.tonalPoetic, description: 'Elegant & evocative' },
];

// Animated word chip that pulses when tapped/inserted
function WordChip({
  word,
  onPress,
  delay,
}: {
  word: WordEntry;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(0.8);
  const inkPulse = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [delay, scale]);

  const handlePress = () => {
    // Ink pulse animation
    inkPulse.value = 0;
    inkPulse.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 400 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: inkPulse.value * 0.4,
    transform: [{ scale: 1 + inkPulse.value * 0.3 }],
  }));

  return (
    <Animated.View style={chipStyle}>
      <TouchableOpacity
        style={styles.wordChip}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.wordChipPulse, pulseStyle]} />
        <Text style={styles.wordChipText}>{word.word}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Tone selector button
function ToneButton({
  tone,
  isActive,
  onPress,
}: {
  tone: ToneOption;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.toneBtn,
          isActive && {
            backgroundColor: tone.color + '20',
            borderColor: tone.color + '60',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.toneBtnIcon}>{tone.icon}</Text>
        <Text style={[styles.toneBtnLabel, isActive && { color: tone.color }]}>
          {tone.label}
        </Text>
        {isActive && (
          <View style={[styles.toneBtnDot, { backgroundColor: tone.color }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Ink bleed animation for text transformation
function InkBleedText({ text, isNew }: { text: string; isNew: boolean }) {
  const opacity = useSharedValue(0);
  const bleedProgress = useSharedValue(0);

  useEffect(() => {
    if (isNew && text) {
      opacity.value = 0;
      bleedProgress.value = 0;
      opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      bleedProgress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    }
  }, [text, isNew, opacity, bleedProgress]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={textStyle}>
      <Text style={styles.rewrittenText}>{text}</Text>
    </Animated.View>
  );
}

export default function ForgeScreen() {
  const insets = useSafeAreaInsets();
  const mastery = useMastery();
  const [inputText, setInputText] = useState('');
  const [selectedTone, setSelectedTone] = useState<ToneId>('academic');
  const [rewrittenText, setRewrittenText] = useState('');
  const [isNewRewrite, setIsNewRewrite] = useState(false);
  const [rewriteSuccess, setRewriteSuccess] = useState(false);
  const [activeAura, setActiveAura] = useState<PackDomain | 'all'>('all');
  const inputRef = useRef<TextInput>(null);

  const { generateText, isLoading: isRewriting, error: rewriteError } = useTextGeneration({
    onSuccess: (result) => {
      setRewrittenText(result);
      setIsNewRewrite(true);
      setRewriteSuccess(true);
      setTimeout(() => setRewriteSuccess(false), 2000);
      HapticManager.heartbeat();
    },
    onError: () => {
      HapticManager.dullThud();
    },
  });

  // Get mastered words for the poly-bar
  const masteredWords = useMemo(() => {
    return WORD_POOL.filter((w) => {
      const status = mastery.getWordStatus(w.id);
      return status.status === 'mastered';
    });
  }, [mastery]);

  // Filter mastered words by aura/domain
  const filteredMasteredWords = useMemo(() => {
    if (activeAura === 'all') return masteredWords;
    const pack = WORD_PACKS.find((p) => p.id === activeAura);
    if (!pack) return masteredWords;
    return masteredWords.filter((w) => pack.wordIds.includes(w.id));
  }, [masteredWords, activeAura]);

  // Header animations
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  // Handle typing haptic with mechanical clicks for Forge
  const handleTextChange = (text: string) => {
    // Check if a mastered word was just typed
    const lastWord = text.split(/\s/).pop()?.toLowerCase() || '';
    const isMasteredWord = masteredWords.some(
      (w) => w.word.toLowerCase() === lastWord,
    );
    if (isMasteredWord && text.length > inputText.length) {
      HapticManager.heartbeat();
    } else if (text.length > inputText.length) {
      // Mechanical click for each character typed in the Forge
      HapticManager.mechanicalClick();
    }
    setInputText(text);
    setIsNewRewrite(false);
  };

  // Insert word from poly-bar
  const handleInsertWord = (word: WordEntry) => {
    const separator = inputText.length > 0 && !inputText.endsWith(' ') ? ' ' : '';
    setInputText((prev) => prev + separator + word.word.toLowerCase());
    setIsNewRewrite(false);
  };

  // Smart Rewriter
  const handleRewrite = useCallback(async () => {
    if (!inputText.trim() || isRewriting) return;

    const tone = TONE_OPTIONS.find((t) => t.id === selectedTone)!;
    const masteredWordsList = masteredWords.map((w) => w.word).join(', ');

    const prompt = `You are a master wordsmith. Rewrite the following sentence in a ${tone.label.toLowerCase()} tone. ${
      masteredWordsList
        ? `Try to naturally incorporate some of these vocabulary words where appropriate: ${masteredWordsList}.`
        : ''
    } Keep the core meaning intact but elevate the language. Only return the rewritten sentence, nothing else.

Sentence: "${inputText.trim()}"`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generateText(prompt);
  }, [inputText, selectedTone, masteredWords, isRewriting, generateText]);

  const currentTone = TONE_OPTIONS.find((t) => t.id === selectedTone)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[W.charcoal, W.charcoal, '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={[styles.header, headerStyle]}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>⚒️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>LEXICAL FORGE</Text>
                <Text style={styles.headerSubtitle}>Craft sentences with mastered words</Text>
              </View>
              <PollyForgeReaction
                selectedTone={selectedTone}
                isRewriting={isRewriting}
                rewriteSuccess={rewriteSuccess}
              />
            </View>
          </Animated.View>

          {/* Tone Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT TONE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toneRow}
            >
              {TONE_OPTIONS.map((tone) => (
                <ToneButton
                  key={tone.id}
                  tone={tone}
                  isActive={selectedTone === tone.id}
                  onPress={() => setSelectedTone(tone.id)}
                />
              ))}
            </ScrollView>
            <Text style={[styles.toneDescription, { color: currentTone.color }]}>
              {currentTone.icon} {currentTone.description}
            </Text>
          </View>

          {/* Writing Area - Paper Texture */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DRAFT YOUR SENTENCE</Text>
            <View style={styles.paperContainer}>
              {/* Paper texture lines */}
              <View style={styles.paperLines}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <View key={i} style={styles.paperLine} />
                ))}
              </View>
              <TextInput
                ref={inputRef}
                style={styles.paperInput}
                multiline
                placeholder="Begin writing here..."
                placeholderTextColor={W.textTertiary}
                value={inputText}
                onChangeText={handleTextChange}
                textAlignVertical="top"
                selectionColor={W.inkBlueGlow}
              />
              {/* Character count */}
              <View style={styles.paperFooter}>
                <Text style={styles.charCount}>{inputText.length} characters</Text>
                {inputText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { setInputText(''); setRewrittenText(''); }}
                    hitSlop={8}
                  >
                    <Text style={styles.clearBtn}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Rewrite Button */}
          <TouchableOpacity
            style={[
              styles.rewriteBtn,
              (!inputText.trim() || isRewriting) && styles.rewriteBtnDisabled,
            ]}
            onPress={handleRewrite}
            disabled={!inputText.trim() || isRewriting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                inputText.trim() && !isRewriting
                  ? [W.inkBlue, W.inkBlueDim]
                  : [W.zenSurface, W.zenSurface]
              }
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {isRewriting ? (
              <View style={styles.rewriteBtnContent}>
                <ActivityIndicator size="small" color={W.paper} />
                <Text style={styles.rewriteBtnText}>Forging...</Text>
              </View>
            ) : (
              <View style={styles.rewriteBtnContent}>
                <Text style={styles.rewriteBtnIcon}>✦</Text>
                <Text style={styles.rewriteBtnText}>Smart Rewrite</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rewritten Output */}
          {(rewrittenText || rewriteError) && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.section}
            >
              <Text style={styles.sectionLabel}>
                {rewriteError ? 'ERROR' : '✦ FORGED RESULT'}
              </Text>
              {rewriteError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    Could not rewrite. Please try again.
                  </Text>
                </View>
              ) : (
                <View style={styles.resultContainer}>
                  <View style={[styles.resultToneBadge, { backgroundColor: currentTone.color + '20', borderColor: currentTone.color + '40' }]}>
                    <Text style={[styles.resultToneText, { color: currentTone.color }]}>
                      {currentTone.icon} {currentTone.label}
                    </Text>
                  </View>
                  <InkBleedText text={rewrittenText} isNew={isNewRewrite} />
                </View>
              )}
            </Animated.View>
          )}

          {/* Poly-Bar: Mastered Words */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              POLY-BAR · {filteredMasteredWords.length} MASTERED WORDS
            </Text>

            {/* Aura filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.auraFilterRow}
            >
              <TouchableOpacity
                style={[
                  styles.auraFilterBtn,
                  activeAura === 'all' && styles.auraFilterBtnActive,
                ]}
                onPress={() => setActiveAura('all')}
              >
                <Text
                  style={[
                    styles.auraFilterText,
                    activeAura === 'all' && styles.auraFilterTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {WORD_PACKS.map((pack) => {
                const colors = PACK_DOMAIN_COLORS[pack.id];
                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.auraFilterBtn,
                      activeAura === pack.id && {
                        backgroundColor: colors.dim,
                        borderColor: colors.color + '60',
                      },
                    ]}
                    onPress={() => setActiveAura(pack.id)}
                  >
                    <Text style={styles.auraFilterIcon}>{pack.icon}</Text>
                    <Text
                      style={[
                        styles.auraFilterText,
                        activeAura === pack.id && { color: colors.light },
                      ]}
                    >
                      {pack.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Word chips */}
            {filteredMasteredWords.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.polyBarScroll}
              >
                {filteredMasteredWords.map((word, i) => (
                  <WordChip
                    key={word.id}
                    word={word}
                    onPress={() => handleInsertWord(word)}
                    delay={i * 30}
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyPolyBar}>
                <Text style={styles.emptyPolyBarIcon}>📖</Text>
                <Text style={styles.emptyPolyBarText}>
                  Master words in game modes to unlock them here
                </Text>
              </View>
            )}
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>✦ Forge Tips</Text>
            <Text style={styles.tipsText}>
              • Tap words in the Poly-Bar to insert them{'\n'}
              • The AI rewriter will weave your mastered vocabulary into elegant prose{'\n'}
              • Different tones shape the voice and register of your writing
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: W.charcoal,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    marginTop: 2,
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
  // Tone selector
  toneRow: {
    gap: 10,
    paddingRight: 10,
  },
  toneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: W.zenSurface + 'CC',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF12',
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  toneBtnIcon: {
    fontSize: 20,
  },
  toneBtnLabel: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  toneBtnDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  toneDescription: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    marginTop: 8,
  },
  // Paper writing area
  paperContainer: {
    backgroundColor: W.zenSurface + 'DD',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#FFFFFF12',
    overflow: 'hidden',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  paperLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 36,
  },
  paperLine: {
    height: 1,
    backgroundColor: W.zenBorder,
    marginBottom: 27,
    marginHorizontal: 16,
    opacity: 0.4,
  },
  paperInput: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
    color: W.paper,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.regular,
    lineHeight: 28,
    minHeight: 130,
  },
  paperFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  charCount: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  clearBtn: {
    color: Colors.error,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  // Rewrite button
  rewriteBtn: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginBottom: 20,
  },
  rewriteBtnDisabled: {
    opacity: 0.5,
  },
  rewriteBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  rewriteBtnIcon: {
    color: W.paper,
    fontSize: 18,
  },
  rewriteBtnText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  // Result area
  resultContainer: {
    backgroundColor: W.zenSurface + 'DD',
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: W.inkBlue + '30',
    padding: 18,
    shadowColor: W.inkBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  resultToneBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  resultToneText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  rewrittenText: {
    color: W.paper,
    fontSize: Fonts.sizes.base,
    lineHeight: 26,
    fontWeight: Fonts.weights.regular,
  },
  errorBox: {
    backgroundColor: Colors.errorDim,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    padding: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
  },
  // Poly-bar
  auraFilterRow: {
    gap: 8,
    marginBottom: 12,
  },
  auraFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  auraFilterBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlue + '60',
  },
  auraFilterIcon: {
    fontSize: 14,
  },
  auraFilterText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  auraFilterTextActive: {
    color: W.inkBlueLight,
  },
  polyBarScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  wordChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: W.inkBlueDim,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: W.inkBlue + '40',
    overflow: 'hidden',
    position: 'relative',
  },
  wordChipPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: W.inkBlueGlow,
    borderRadius: Radii.full,
  },
  wordChipText: {
    color: W.paper,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
  emptyPolyBar: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyPolyBarIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  emptyPolyBarText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Tips
  tipsContainer: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
    marginBottom: 8,
  },
  tipsText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    lineHeight: 22,
  },
});
