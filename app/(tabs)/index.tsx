import React, { useEffect, useState, useMemo } from 'react';
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
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { useXP } from '@/hooks/useXP';
import { useAudio } from '@/hooks/useAudio';
import { useMastery } from '@/hooks/useMastery';
import { AudioSettingsModal } from '@/components/AudioSettingsModal';
import { MasteryBadge } from '@/components/MasteryBadge';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { MASTERY_TIER_CONFIG } from '@/constants/mastery';
import { WORD_POOL } from '@/constants/words';
import { useTextGeneration } from '@fastshot/ai';
import { PollyTappable } from '@/components/polly/PollyTappable';
import { PollySquawkBox } from '@/components/polly/PollySquawkBox';
import { SQUAWK_BOX_PROMPTS } from '@/constants/polly';

const W = Colors.workspace;
const DAILY_BRIEFING_KEY = 'polyplex_daily_briefing';

const GAME_MODES = [
  {
    id: 'guess-the-word',
    icon: '📝',
    title: 'Guess the Word',
    subtitle: 'Type the word from clues',
    xp: '20 XP per answer',
    gradient: ['#2A1F6E', '#1A0E5A', '#0D0830'] as const,
    accentColor: Colors.accent,
    badge: 'CLASSIC',
    badgeColor: Colors.accent,
    description: '3 lives · Letter hints · Free text',
  },
  {
    id: 'multiple-choice',
    icon: '🎯',
    title: 'Multiple Choice',
    subtitle: 'Pick from 4 options',
    xp: '10 XP per answer',
    gradient: ['#0E3D2E', '#082A1E', '#041A12'] as const,
    accentColor: Colors.success,
    badge: 'BEGINNER',
    badgeColor: Colors.success,
    description: 'Casual · Accessible · Fast-paced',
  },
  {
    id: 'timed-challenge',
    icon: '⏱️',
    title: 'Timed Challenge',
    subtitle: '60 seconds of rapid fire',
    xp: 'Speed bonuses!',
    gradient: ['#3D1A08', '#2A1006', '#1A0804'] as const,
    accentColor: Colors.flame,
    badge: 'HOT',
    badgeColor: Colors.flame,
    description: 'Mix of text & MCQ · Time pressure',
  },
  {
    id: 'daily-puzzle',
    icon: '📅',
    title: 'Daily Puzzle',
    subtitle: "Today's unique challenge",
    xp: '50 XP · 3 attempts only',
    gradient: ['#2D1A08', '#1E1206', '#140C04'] as const,
    accentColor: Colors.gold,
    badge: 'DAILY',
    badgeColor: Colors.gold,
    description: 'Limited tries · Social sharing',
  },
];

function AnimatedCard({
  mode,
  index,
  onPress,
}: {
  mode: (typeof GAME_MODES)[0];
  index: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      100 + index * 100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      100 + index * 100,
      withSpring(0, { damping: 16, stiffness: 150 }),
    );
  }, [opacity, translateY, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12 });
  };

  return (
    <Animated.View style={[styles.cardWrapper, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        <LinearGradient
          colors={mode.gradient as unknown as [string, string, ...string[]]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Glassmorphism inner glow border */}
        <View style={[styles.cardBorder, { borderColor: mode.accentColor + '35' }]} />
        {/* Top-edge highlight for glass depth */}
        <LinearGradient
          colors={[mode.accentColor + '18', 'transparent']}
          style={styles.cardTopHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Frosted glass surface */}
        <View style={styles.cardFrost} />

        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: mode.accentColor + '18', borderWidth: 1, borderColor: mode.accentColor + '25' }]}>
            <Text style={styles.cardIcon}>{mode.icon}</Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{mode.title}</Text>
              <View style={[styles.badge, { backgroundColor: mode.badgeColor + '20', borderColor: mode.badgeColor + '50' }]}>
                <Text style={[styles.badgeText, { color: mode.badgeColor }]}>{mode.badge}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{mode.description}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.xpText, { color: mode.accentColor }]}>{mode.xp}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Daily Lexical Meditation component
function DailyBriefing() {
  const mastery = useMastery();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingWords, setBriefingWords] = useState<string[]>([]);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [hasCached, setHasCached] = useState(false);

  const { generateText } = useTextGeneration({
    onSuccess: (result) => {
      setBriefing(result);
      setIsLoadingBriefing(false);
      // Cache with today's date
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem(DAILY_BRIEFING_KEY, JSON.stringify({
        date: today,
        briefing: result,
        words: briefingWords,
      }));
    },
    onError: () => {
      setIsLoadingBriefing(false);
    },
  });

  // Get discovered words for the briefing
  const discoveredWords = useMemo(() => {
    return WORD_POOL.filter((w) => {
      const status = mastery.getWordStatus(w.id);
      return status.status === 'discovered' || status.status === 'mastered';
    });
  }, [mastery]);

  // Check cache or generate new briefing
  useEffect(() => {
    if (discoveredWords.length < 3 || hasCached) return;

    const today = new Date().toISOString().split('T')[0];

    AsyncStorage.getItem(DAILY_BRIEFING_KEY).then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.briefing) {
            setBriefing(parsed.briefing);
            setBriefingWords(parsed.words || []);
            setHasCached(true);
            return;
          }
        } catch {
          // Invalid cache, generate new
        }
      }

      // Generate new briefing
      const shuffled = [...discoveredWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, 3);
      const wordNames = selectedWords.map((w) => w.word);
      setBriefingWords(wordNames);
      setIsLoadingBriefing(true);
      setHasCached(true);

      generateText(
        `Write a vivid, literary 3-sentence micro-story (under 60 words total) that naturally uses these three vocabulary words: "${wordNames[0]}", "${wordNames[1]}", and "${wordNames[2]}". The story should be evocative and memorable, like a prose poem. Only return the story, nothing else.`,
      );
    });
  }, [discoveredWords, hasCached, generateText]);

  if (discoveredWords.length < 3) return null;

  // Get words for Polly's pro-tip
  const tipWords = discoveredWords.slice(0, 5).map((w) => w.word);

  return (
    <View style={styles.briefingContainer}>
      <LinearGradient
        colors={[W.inkBlueDim + '80', W.zenSurface]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[styles.briefingBorder, { borderColor: W.inkBlue + '30' }]} />

      <View style={styles.briefingHeader}>
        <PollyTappable
          size={42}
          bodyColor="#00CED1"
          accentColor="#00E5FF"
          eyeColor="#1A1464"
          mood="idle"
          word={tipWords[0]}
          showPunOnTap
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.briefingTitle}>Daily Lexical Meditation</Text>
          <Text style={styles.briefingSub}>A micro-story with your words</Text>
        </View>
      </View>

      {isLoadingBriefing ? (
        <View style={styles.briefingLoading}>
          <ActivityIndicator size="small" color={W.inkBlueGlow} />
          <Text style={styles.briefingLoadingText}>Composing today&apos;s story...</Text>
        </View>
      ) : briefing ? (
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={styles.briefingText}>{briefing}</Text>
          {briefingWords.length > 0 && (
            <View style={styles.briefingWordsRow}>
              {briefingWords.map((w, i) => (
                <View key={i} style={styles.briefingWordChip}>
                  <Text style={styles.briefingWordText}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Squawk-Box: Polly's AI comment on the story */}
          <View style={styles.squawkBoxContainer}>
            <PollySquawkBox
              prompt={SQUAWK_BOX_PROMPTS.dailyComment(briefing)}
              accentColor="#00CED1"
              compact
            />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// Polly Pro-Tips section
function PollyProTips() {
  const mastery = useMastery();

  const masteredWords = useMemo(() => {
    return WORD_POOL.filter((w) => {
      const status = mastery.getWordStatus(w.id);
      return status.status === 'mastered' || status.status === 'discovered';
    }).map((w) => w.word);
  }, [mastery]);

  if (masteredWords.length < 1) return null;

  const tipWords = masteredWords.slice(0, 5);

  return (
    <View style={styles.proTipContainer}>
      <View style={styles.proTipRow}>
        <PollyTappable
          size={36}
          bodyColor="#00CED1"
          accentColor="#00E5FF"
          eyeColor="#1A1464"
          mood="happy"
          word={tipWords[0]}
          showPunOnTap
        />
        <View style={styles.proTipContent}>
          <Text style={styles.proTipLabel}>POLLY&apos;S PRO-TIP</Text>
          <PollySquawkBox
            prompt={SQUAWK_BOX_PROMPTS.proTip(tipWords)}
            accentColor="#00CED1"
            compact
          />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { totalXP, level, progress } = useXP();
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx, startMusic, isReady } = useAudio();
  const { state: masteryState, tier } = useMastery();
  const [showSettings, setShowSettings] = useState(false);
  const tierConfig = MASTERY_TIER_CONFIG[tier];

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 16, stiffness: 120 });
  }, [headerOpacity, headerY]);

  // Start background music when home screen loads
  useEffect(() => {
    if (isReady && musicEnabled) {
      startMusic();
    }
  }, [isReady, musicEnabled, startMusic]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0D0F20', Colors.bg, Colors.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.appTitle}>POLYWORDS/Text>
              <Text style={styles.appTagline}>Master Words with Multiple Meanings</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => setShowSettings(true)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Text style={styles.settingsBtnIcon}>{musicEnabled || sfxEnabled ? '🔊' : '🔇'}</Text>
              </TouchableOpacity>
              <View style={styles.xpBubble}>
                <Text style={styles.xpBubbleLabel}>LVL</Text>
                <Text style={styles.xpBubbleLevel}>{level}</Text>
              </View>
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpBarContainer}>
            <AnimatedProgressBar
              progress={progress}
              colors={[Colors.gold, Colors.goldLight]}
              height={6}
              trackColor={Colors.bgCardBorder}
            />
            <Text style={styles.xpBarLabel}>{totalXP} XP</Text>
          </View>

          {/* Mastery Badge & Title */}
          <View style={styles.masteryRow}>
            <MasteryBadge tier={tier} level={level} compact />
            <View style={styles.masteryStats}>
              <Text style={[styles.masteryStatText, { color: tierConfig.color }]}>
                {masteryState.totalMastered} words mastered
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Daily Lexical Meditation */}
        <DailyBriefing />

        {/* Polly's Pro-Tips Row */}
        <PollyProTips />

        {/* Quick Access Row */}
        <View style={styles.quickAccessRow}>
          {/* Lexicon Quick Access */}
          <TouchableOpacity
            style={styles.lexiconBtn}
            onPress={() => router.push('/lexicon' as any)}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={[tierConfig.colorDim, Colors.bgCard]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={[styles.lexiconBorder, { borderColor: tierConfig.color + '30' }]} />
            <View style={styles.lexiconLeft}>
              <Text style={styles.lexiconIcon}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lexiconTitle}>Poly-Lexicon</Text>
                <Text style={styles.lexiconSub}>
                  {masteryState.totalDiscovered} discovered · {masteryState.totalMastered} mastered
                </Text>
              </View>
            </View>
            <Text style={[styles.lexiconChevron, { color: tierConfig.color }]}>›</Text>
          </TouchableOpacity>

          {/* Store Quick Access */}
          <TouchableOpacity
            style={styles.storeBtn}
            onPress={() => router.push('/store' as any)}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={[Colors.accentDim, Colors.bgCard]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={[styles.lexiconBorder, { borderColor: Colors.accent + '30' }]} />
            <View style={styles.lexiconLeft}>
              <Text style={styles.lexiconIcon}>📚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.lexiconTitle}>Lex-Store</Text>
                <Text style={styles.lexiconSub}>Word Tomes</Text>
              </View>
            </View>
            <Text style={[styles.lexiconChevron, { color: Colors.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Oracle Quick Access */}
        <TouchableOpacity
          style={styles.oracleBtn}
          onPress={() => router.push('/oracle' as any)}
          activeOpacity={0.75}
        >
          <LinearGradient
            colors={[W.inkBlueDim, Colors.bgCard]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={[styles.lexiconBorder, { borderColor: W.inkBlue + '30' }]} />
          <View style={styles.lexiconLeft}>
            <Text style={styles.lexiconIcon}>🔮</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.lexiconTitle}>Polyplex Oracle</Text>
              <Text style={styles.lexiconSub}>Pronunciation & Voice Challenges</Text>
            </View>
          </View>
          <Text style={[styles.lexiconChevron, { color: W.inkBlueGlow }]}>›</Text>
        </TouchableOpacity>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Your Mode</Text>
          <Text style={styles.sectionSubtitle}>All modes feature combo streaks, bonus rounds & fun facts</Text>
        </View>

        {/* Game Mode Cards */}
        <View style={styles.cardsContainer}>
          {GAME_MODES.map((mode, index) => (
            <AnimatedCard
              key={mode.id}
              mode={mode}
              index={index}
              onPress={() => router.push(`/${mode.id}` as any)}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔥 Combo streaks · 🎁 Bonus rounds · 💡 Power-ups
          </Text>
        </View>
      </ScrollView>

      <AudioSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        musicEnabled={musicEnabled}
        sfxEnabled={sfxEnabled}
        onToggleMusic={toggleMusic}
        onToggleSfx={toggleSfx}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnIcon: {
    fontSize: 20,
  },
  appTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: 4,
    textShadowColor: '#7C5CFC40',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  appTagline: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  xpBubble: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: Radii.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
    ...Shadows.gold,
  },
  xpBubbleLabel: {
    color: Colors.gold,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
  },
  xpBubbleLevel: {
    color: Colors.gold,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
    lineHeight: 28,
  },
  xpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpBarLabel: {
    color: Colors.gold,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
    minWidth: 60,
    textAlign: 'right',
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  masteryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  masteryStatText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
  },
  // Daily Briefing
  briefingContainer: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 18,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  briefingBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: Radii.xl,
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  briefingIcon: {
    fontSize: 20,
    color: W.inkBlueGlow,
  },
  briefingTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  briefingSub: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    marginTop: 1,
  },
  briefingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  briefingLoadingText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
  },
  briefingText: {
    color: W.paper,
    fontSize: Fonts.sizes.base,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  briefingWordsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  briefingWordChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    backgroundColor: W.inkBlueDim,
    borderWidth: 1,
    borderColor: W.inkBlue + '40',
  },
  briefingWordText: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  squawkBoxContainer: {
    marginTop: 10,
  },
  proTipContainer: {
    marginBottom: 12,
    borderRadius: Radii.lg,
    backgroundColor: Colors.bgCard + 'CC',
    borderWidth: 1,
    borderColor: '#00CED1' + '25',
    padding: 12,
    overflow: 'hidden',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  proTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  proTipContent: {
    flex: 1,
    gap: 4,
  },
  proTipLabel: {
    color: '#00CED1',
    fontSize: 9,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  // Quick access
  quickAccessRow: {
    gap: 10,
    marginBottom: 10,
  },
  lexiconBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    ...Shadows.card,
  },
  storeBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    ...Shadows.card,
  },
  oracleBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 16,
    ...Shadows.card,
  },
  lexiconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: Radii.xl,
  },
  lexiconLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lexiconIcon: {
    fontSize: 28,
  },
  lexiconTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  lexiconSub: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    marginTop: 2,
  },
  lexiconChevron: {
    fontSize: 26,
    fontWeight: Fonts.weights.bold,
  },
  sectionHeader: {
    marginBottom: 18,
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: Radii.xl,
  },
  cardTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    zIndex: 1,
  },
  cardFrost: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF06',
    borderRadius: Radii.xl,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    letterSpacing: -0.2,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
    paddingLeft: 8,
  },
  xpText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.2,
    textAlign: 'right',
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 22,
    fontWeight: Fonts.weights.bold,
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
