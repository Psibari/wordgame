import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share as RNShare,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { generateText as aiGenerateText, generateImage as aiGenerateImage } from '@fastshot/ai';

import { Colors, Fonts, Radii } from '@/constants/theme';
import { WORD_POOL } from '@/constants/words';
import { useMastery } from '@/hooks/useMastery';
import { useAudio } from '@/hooks/useAudio';
import { MASTERY_TIER_CONFIG, getMasteryTier, MasteryTier } from '@/constants/mastery';
import { getPackForWord, PACK_DOMAIN_COLORS, PackDomain } from '@/constants/packs';
import { HapticManager } from '@/utils/haptics';
import { PollyMascot } from '@/components/polly/PollyMascot';
import { ObsidianLoadingScreen } from '@/components/ShimmerSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_ASPECT = 1.6; // Taller than wide for story format

const MASTERY_TIER_GRADIENTS: Record<MasteryTier, readonly [string, string, string]> = {
  bronze: ['#4A2E14', '#1A1008', '#080604'] as const,
  silver: ['#303038', '#1A1A1E', '#0A0A0E'] as const,
  gold: ['#4A3510', '#1A1408', '#0A0804'] as const,
  amethyst: ['#3A1460', '#180828', '#0A0210'] as const,
};

const HOLOGRAPHIC_COLORS = ['#FF6B6B40', '#4ECDC440', '#45B7D140', '#96CEB440', '#FFEAA740', '#DDA0DD40'];

// Holographic grid watermark
function HolographicWatermark() {
  const rows = 4;
  const cols = 4;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorIdx = (r * cols + c) % HOLOGRAPHIC_COLORS.length;
      cells.push(
        <View
          key={`${r}-${c}`}
          style={[
            styles.holoCell,
            {
              backgroundColor: HOLOGRAPHIC_COLORS[colorIdx],
              width: 8,
              height: 8,
              borderRadius: 1,
            },
          ]}
        />,
      );
    }
  }
  return (
    <View style={styles.holoGrid}>
      <View style={styles.holoLabel}>
        <Text style={styles.holoLabelText}>POLYPLEX</Text>
      </View>
      <View style={styles.holoCells}>{cells}</View>
      <Text style={styles.holoVerified}>VERIFIED ✦</Text>
    </View>
  );
}

// Amethyst abstract pattern background
function AmethystBackground({ imageUrl }: { imageUrl?: string }) {
  const shimmer = useSharedValue(0);
  const inkBleed = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    // Ink bleed effect - slow expanding orbs
    inkBleed.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [shimmer, inkBleed]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.6]),
  }));

  const inkBleedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(inkBleed.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(inkBleed.value, [0, 1], [0.9, 1.2]) }],
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={['#3A1460', '#1A0830', '#0A0210']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {/* High-res ink-bleed orbs for cinematic poster feel */}
      <Animated.View style={[styles.amethystOrb, { top: '5%', left: '10%', backgroundColor: '#A855F740', width: 100, height: 100, borderRadius: 50 }, shimmerStyle]} />
      <Animated.View style={[styles.amethystOrb, { top: '25%', right: '5%', backgroundColor: '#7C5CFC25', width: 140, height: 140, borderRadius: 70 }, inkBleedStyle]} />
      <Animated.View style={[styles.amethystOrb, { bottom: '15%', left: '20%', backgroundColor: '#C084FC20', width: 120, height: 120, borderRadius: 60 }, shimmerStyle]} />
      <Animated.View style={[styles.amethystOrb, { bottom: '35%', right: '15%', backgroundColor: '#A855F71A', width: 80, height: 80, borderRadius: 40 }, inkBleedStyle]} />
      {/* Ink-bleed streaks */}
      <Animated.View style={[{
        position: 'absolute',
        top: '45%',
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#7C5CFC08',
      }, shimmerStyle]} />
    </View>
  );
}

// Camera flash animation overlay
function CameraFlash({ trigger }: { trigger: boolean }) {
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [trigger, flashOpacity]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.flashOverlay, flashStyle]}
      pointerEvents="none"
    />
  );
}

export default function MasteryCardScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ wordId: string }>();
  const mastery = useMastery();
  const { play } = useAudio();
  const cardRef = useRef<View>(null);

  const [isGenerating, setIsGenerating] = useState(true);
  const [etymologySnippet, setEtymologySnippet] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [showFlash, setShowFlash] = useState(false);
  const [amethystBgUrl, setAmethystBgUrl] = useState<string | undefined>();

  // Get word data
  const word = WORD_POOL.find((w) => w.id === params.wordId);
  const totalMastered = mastery.state.totalMastered;
  const tier = getMasteryTier(totalMastered);
  const tierConfig = MASTERY_TIER_CONFIG[tier];
  const packs = word ? getPackForWord(word.id) : [];
  const packInfo = packs.length > 0 ? packs[0] : null;

  // Card animations
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);

  // Generate AI content on mount
  useEffect(() => {
    if (!word) return;
    generateContent();
  }, [word?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateContent = async () => {
    if (!word) return;
    setIsGenerating(true);

    try {
      // Generate etymology snippet
      const etymPrompt = `Give me a single fascinating etymology fact or fun fact about the English word "${word.word}" in under 30 words. Focus on surprising origins or historical usage. Be concise and witty. Do not use quotes around the word.`;
      const etymResult = await aiGenerateText({ prompt: etymPrompt });
      if (etymResult) {
        setEtymologySnippet(typeof etymResult === 'string' ? etymResult : String(etymResult));
      } else {
        setEtymologySnippet(`"${word.word}" — a word of many faces, each meaning a gateway to a different world of thought.`);
      }

      // Generate witty caption
      const captionPrompt = `Write a witty, intellectual social media caption (under 25 words) for someone who just mastered the polysemous word "${word.word}" (meanings: ${word.meanings.join(', ')}). Use a confident, slightly nerdy tone. Include one relevant emoji.`;
      const captionResult = await aiGenerateText({ prompt: captionPrompt });
      if (captionResult) {
        setCaption(typeof captionResult === 'string' ? captionResult : String(captionResult));
      } else {
        setCaption(`Mastered "${word.word}" and all its meanings. The lexicon grows ever deeper. 📚`);
      }

      // For amethyst tier, generate abstract background
      if (tier === 'amethyst') {
        try {
          const imgResult = await aiGenerateImage({
            prompt: `Abstract cosmic amethyst crystal pattern, deep purple and violet, swirling ethereal nebula, dark background, minimal, digital art`,
            width: 512,
            height: 512,
          });
          if (imgResult?.images?.[0]) {
            setAmethystBgUrl(imgResult.images[0]);
          }
        } catch {
          // Use default amethyst pattern
        }
      }
    } catch {
      setEtymologySnippet(`"${word.word}" — a word of many faces, each meaning a gateway to a different world of thought.`);
      setCaption(`Mastered "${word.word}" and all its meanings. The lexicon grows ever deeper. 📚`);
    }

    setIsGenerating(false);

    // Trigger flash animation + sound
    setTimeout(() => {
      setShowFlash(true);
      HapticManager.heartbeat();
      play('level_up');

      // Animate card in
      cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      cardOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    }, 200);
  };

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleCopyCaption = async () => {
    try {
      await RNShare.share({ message: caption });
    } catch {
      // User cancelled
    }
    Haptics.selectionAsync();
  };

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Mastery Card',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch {
      // Try fallback text share
      try {
        await RNShare.share({
          message: `${caption}\n\n🏆 Mastered "${word?.word}" on Polyplex!\n${etymologySnippet}`,
        });
      } catch {
        // User cancelled
      }
    }
  };

  if (!word) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Word not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const tierGradient = MASTERY_TIER_GRADIENTS[tier];
  const difficultyColors: Record<string, string> = {
    Easy: Colors.easy,
    Medium: Colors.medium,
    Hard: Colors.hard,
    Expert: Colors.expert,
  };
  const wordColor = difficultyColors[word.difficulty] ?? Colors.accent;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={[tierGradient[0], Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      <CameraFlash trigger={showFlash} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mastery Card</Text>
        <View style={{ width: 40 }} />
      </View>

      {isGenerating ? (
        <View style={styles.loadingContainer}>
          <ObsidianLoadingScreen
            lines={3}
            showHeader={true}
            showCards={true}
            accentColor={tierConfig.color}
          />
          <View style={styles.loadingTextArea}>
            <Text style={styles.loadingText}>Generating Cinematic Poster...</Text>
            <Text style={styles.loadingSubtext}>Crafting etymology & caption with AI</Text>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* The Mastery Card */}
          <Animated.View style={[styles.cardContainer, cardAnimStyle]}>
            <View
              ref={cardRef}
              collapsable={false}
              style={styles.masteryCard}
            >
              {/* Background */}
              {tier === 'amethyst' ? (
                <AmethystBackground imageUrl={amethystBgUrl} />
              ) : (
                <LinearGradient
                  colors={tierGradient}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
              )}

              {/* Card border glow */}
              <View style={[styles.cardInnerBorder, { borderColor: tierConfig.color + '35' }]} />
              {/* Cinematic top-edge highlight */}
              <LinearGradient
                colors={[`${tierConfig.color}18`, 'transparent']}
                style={styles.cardTopGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                pointerEvents="none"
              />

              {/* Dynamic Polly positioning - cinematic poster style */}
              <View style={styles.pollyPosterPosition}>
                <PollyMascot
                  size={52}
                  bodyColor="#00CED1"
                  accentColor="#00E5FF"
                  eyeColor="#1A1464"
                  mood="celebrating"
                />
              </View>

              {/* Top Badge */}
              <View style={styles.cardTop}>
                <View style={[styles.tierBadgeCard, { backgroundColor: tierConfig.color + '25', borderColor: tierConfig.color + '60' }]}>
                  <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>
                    {tierConfig.icon} {tierConfig.label.toUpperCase()} MASTERY
                  </Text>
                </View>
                <Text style={styles.polyplexWatermark}>POLYPLEX</Text>
              </View>

              {/* Word Display */}
              <View style={styles.cardWordSection}>
                <Text style={[styles.cardWord, { color: wordColor }]}>{word.word}</Text>
                <View style={[styles.cardDiffBadge, { backgroundColor: wordColor + '20', borderColor: wordColor + '50' }]}>
                  <Text style={[styles.cardDiffText, { color: wordColor }]}>{word.difficulty}</Text>
                </View>
              </View>

              {/* Meanings */}
              <View style={styles.cardMeanings}>
                {word.meanings.slice(0, 3).map((m, i) => (
                  <View key={i} style={styles.cardMeaningRow}>
                    <View style={[styles.cardMeaningDot, { backgroundColor: wordColor }]} />
                    <Text style={styles.cardMeaningText} numberOfLines={2}>{m}</Text>
                  </View>
                ))}
              </View>

              {/* Pack Aura */}
              {packInfo && (
                <View style={styles.cardPackRow}>
                  <LinearGradient
                    colors={[
                      (PACK_DOMAIN_COLORS[packInfo.id as PackDomain]?.dim ?? Colors.bgCardAlt) + '80',
                      'transparent',
                    ]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.cardPackIcon}>{packInfo.icon}</Text>
                  <Text style={[styles.cardPackName, { color: PACK_DOMAIN_COLORS[packInfo.id as PackDomain]?.light ?? Colors.textSub }]}>
                    {packInfo.name}
                  </Text>
                </View>
              )}

              {/* Etymology AI Snippet */}
              <View style={styles.cardEtymology}>
                <View style={styles.etymologyHeader}>
                  <Text style={styles.etymologyIcon}>🧬</Text>
                  <Text style={styles.etymologyLabel}>ETYMOLOGY</Text>
                </View>
                <Text style={styles.etymologyText}>{etymologySnippet}</Text>
              </View>

              {/* Holographic Watermark */}
              <View style={styles.cardBottom}>
                <HolographicWatermark />
                <View style={styles.cardDateArea}>
                  <Text style={styles.cardDate}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.cardMasteredLabel}>✦ MASTERED</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Caption Section */}
          <View style={styles.captionSection}>
            <Text style={styles.captionLabel}>📱 SHARE CAPTION</Text>
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCaption} activeOpacity={0.7}>
              <Text style={styles.copyBtnText}>📋 Copy Caption</Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <LinearGradient
              colors={[tierConfig.color, tierConfig.color + 'CC']}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.shareButtonText}>📤 Share Mastery Card</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Regenerate */}
          <TouchableOpacity
            style={styles.regenBtn}
            onPress={() => {
              setIsGenerating(true);
              setShowFlash(false);
              cardScale.value = 0.85;
              cardOpacity.value = 0;
              generateContent();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.regenBtnText}>🔄 Generate New Card</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    color: Colors.gold,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  // Loading
  loadingContainer: {
    flex: 1,
  },
  loadingTextArea: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  loadingText: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  loadingSubtext: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  backLink: {
    color: Colors.accent,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  // Card Container
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
    borderRadius: Radii.xl,
    marginBottom: 20,
  },
  masteryCard: {
    width: CARD_WIDTH,
    aspectRatio: 1 / CARD_ASPECT,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: Radii.xl,
    zIndex: 10,
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    zIndex: 5,
  },
  pollyPosterPosition: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 15,
    opacity: 0.85,
  },
  // Card Top
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadgeCard: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
  },
  polyplexWatermark: {
    color: '#FFFFFF15',
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 3,
  },
  // Word
  cardWordSection: {
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  cardWord: {
    fontSize: 48,
    fontWeight: Fonts.weights.black,
    letterSpacing: -1,
    textAlign: 'center',
    textShadowColor: '#00000080',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  cardDiffBadge: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  cardDiffText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  // Meanings
  cardMeanings: {
    gap: 6,
    paddingHorizontal: 4,
  },
  cardMeaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardMeaningDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    flexShrink: 0,
  },
  cardMeaningText: {
    color: Colors.text + 'DD',
    fontSize: Fonts.sizes.sm,
    lineHeight: 18,
    flex: 1,
  },
  // Pack Aura
  cardPackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPackIcon: {
    fontSize: 16,
  },
  cardPackName: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  // Etymology
  cardEtymology: {
    backgroundColor: '#FFFFFF0A',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  etymologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  etymologyIcon: {
    fontSize: 12,
  },
  etymologyLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  etymologyText: {
    color: Colors.text + 'CC',
    fontSize: Fonts.sizes.xs,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  // Card Bottom
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardDateArea: {
    alignItems: 'flex-end',
    gap: 2,
  },
  cardDate: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.medium,
  },
  cardMasteredLabel: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  // Holographic watermark
  holoGrid: {
    alignItems: 'flex-start',
    gap: 4,
  },
  holoLabel: {
    marginBottom: 2,
  },
  holoLabelText: {
    color: '#FFFFFF20',
    fontSize: 7,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
  },
  holoCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 40,
    gap: 2,
  },
  holoCell: {},
  holoVerified: {
    color: '#FFFFFF20',
    fontSize: 7,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 1,
    marginTop: 2,
  },
  // Amethyst background
  amethystOrb: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  // Flash overlay
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  // Caption Section
  captionSection: {
    width: '100%',
    marginBottom: 16,
  },
  captionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 2,
    marginBottom: 8,
  },
  captionBox: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 8,
  },
  captionText: {
    color: Colors.text,
    fontSize: Fonts.sizes.base,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  copyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyBtnText: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
  // Share Button
  shareButton: {
    width: '100%',
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  shareButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: Fonts.weights.bold,
    fontSize: Fonts.sizes.md,
  },
  // Regen
  regenBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  regenBtnText: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
});
