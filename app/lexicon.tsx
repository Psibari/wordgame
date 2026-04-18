import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radii, Shadows } from '@/constants/theme';
import { Difficulty, WordEntry, WORD_POOL } from '@/constants/words';
import { MASTERY_TIER_CONFIG, WordStatus } from '@/constants/mastery';
import { ACHIEVEMENTS, AchievementId, getAchievementById } from '@/constants/achievements';
import { WORD_PACKS, PackDomain, PACK_DOMAIN_COLORS } from '@/constants/packs';
import { useMastery } from '@/hooks/useMastery';
import { useAchievements } from '@/hooks/useAchievements';
import { useWordPacks } from '@/hooks/useWordPacks';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { PackProgressRing } from '@/components/PackProgressRing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type TabId = 'lexicon' | 'achievements';
type FilterMode = 'difficulty' | 'domain';
const DIFFICULTY_TABS: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];

const DIFFICULTY_COLORS: Record<Difficulty, { color: string; dim: string }> = {
  Easy: { color: Colors.easy, dim: Colors.easyDim },
  Medium: { color: Colors.medium, dim: Colors.mediumDim },
  Hard: { color: Colors.hard, dim: Colors.hardDim },
  Expert: { color: Colors.expert, dim: Colors.expertDim },
};

interface WordWithMastery extends WordEntry {
  mastery: {
    wordId: string;
    status: WordStatus;
    correctCount: number;
    firstSeenAt?: number;
    masteredAt?: number;
  };
}

function WordCard({
  word,
  index,
  onPress,
  auraOverride,
}: {
  word: WordWithMastery;
  index: number;
  onPress: () => void;
  auraOverride?: { color: string; dim: string };
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withDelay(
      30 * (index % 12),
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      30 * (index % 12),
      withSpring(1, { damping: 14, stiffness: 120 }),
    );
  }, [opacity, scale, index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const { status, correctCount } = word.mastery;
  const diffColors = auraOverride ?? DIFFICULTY_COLORS[word.difficulty];
  const isLocked = status === 'locked';
  const isMastered = status === 'mastered';

  return (
    <Animated.View style={[styles.wordCardWrapper, animStyle]}>
      <TouchableOpacity
        style={[
          styles.wordCard,
          {
            borderColor: isMastered
              ? diffColors.color + '80'
              : isLocked
                ? Colors.bgCardBorder
                : diffColors.color + '40',
            backgroundColor: isLocked ? Colors.bgCard + 'AA' : Colors.bgCard,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={isLocked}
      >
        {isMastered && (
          <View style={[styles.masteredGlow, { backgroundColor: diffColors.color + '10' }]} />
        )}

        <Text
          style={[
            styles.wordText,
            isLocked && styles.wordTextLocked,
            isMastered && { color: diffColors.color },
          ]}
          numberOfLines={1}
        >
          {isLocked ? '???' : word.word}
        </Text>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    i < correctCount ? diffColors.color : Colors.bgCardBorder,
                },
              ]}
            />
          ))}
        </View>

        {isMastered && <Text style={styles.masteredBadge}>✦</Text>}
        {isLocked && <Text style={styles.lockedIcon}>🔒</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function WordDetailModal({
  word,
  visible,
  onClose,
  auraOverride,
}: {
  word: WordWithMastery | null;
  visible: boolean;
  onClose: () => void;
  auraOverride?: { color: string; dim: string };
}) {
  if (!word) return null;
  const isMastered = word.mastery.status === 'mastered';
  const diffColors = auraOverride ?? DIFFICULTY_COLORS[word.difficulty];

  const handleGenerateMasteryCard = () => {
    onClose();
    setTimeout(() => {
      router.push({ pathname: '/mastery-card', params: { wordId: word.id } } as any);
    }, 300);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalCard, { borderColor: diffColors.color + '60' }]}>
          <LinearGradient
            colors={[diffColors.dim, Colors.bgCard]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
          />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalWord, { color: diffColors.color }]}>{word.word}</Text>
            <View style={[styles.diffBadge, { backgroundColor: diffColors.dim, borderColor: diffColors.color + '60' }]}>
              <Text style={[styles.diffBadgeText, { color: diffColors.color }]}>{word.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.modalCategory}>{word.category}</Text>

          {/* Mastery Progress */}
          <View style={styles.masterySection}>
            <Text style={styles.masteryLabel}>
              {isMastered ? '✦ MASTERED' : `Progress: ${word.mastery.correctCount}/3`}
            </Text>
            <AnimatedProgressBar
              progress={word.mastery.correctCount / 3}
              colors={[diffColors.color, diffColors.color + 'CC'] as [string, string]}
              height={4}
            />
          </View>

          {/* Meanings */}
          <View style={styles.meaningsSection}>
            <Text style={styles.meaningsSectionLabel}>Meanings</Text>
            {word.meanings.map((m, i) => (
              <View key={i} style={styles.meaningRow}>
                <View style={[styles.meaningDot, { backgroundColor: diffColors.color }]} />
                <Text style={styles.meaningText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Bonus facts for mastered words */}
          {isMastered && word.slangInfo && (
            <View style={[styles.bonusSection, { borderColor: diffColors.color + '30' }]}>
              <Text style={styles.bonusLabel}>💬 Slang</Text>
              <Text style={styles.bonusText}>
                &quot;{word.slangInfo.term}&quot; — {word.slangInfo.meaning} ({word.slangInfo.era})
              </Text>
            </View>
          )}

          {isMastered && word.phraseInfo && (
            <View style={[styles.bonusSection, { borderColor: diffColors.color + '30' }]}>
              <Text style={styles.bonusLabel}>📖 Phrase</Text>
              <Text style={styles.bonusText}>
                &quot;{word.phraseInfo.phrase}&quot; — {word.phraseInfo.meaning}
              </Text>
              <Text style={[styles.bonusOrigin, { color: diffColors.color }]}>
                Origin: {word.phraseInfo.origin}
              </Text>
            </View>
          )}

          {/* Generate Mastery Card button for mastered words */}
          {isMastered && (
            <TouchableOpacity
              style={[styles.masteryCardBtn, { borderColor: diffColors.color + '60' }]}
              onPress={handleGenerateMasteryCard}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={[diffColors.dim, Colors.bgCardAlt]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.masteryCardBtnIcon}>🎴</Text>
              <View style={styles.masteryCardBtnText}>
                <Text style={[styles.masteryCardBtnTitle, { color: diffColors.color }]}>Generate Mastery Card</Text>
                <Text style={styles.masteryCardBtnSub}>AI-powered shareable card</Text>
              </View>
              <Text style={[styles.masteryCardBtnArrow, { color: diffColors.color }]}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AchievementCard({ achievementId, progress }: { achievementId: AchievementId; progress: { currentProgress: number; unlocked: boolean } }) {
  const achievement = getAchievementById(achievementId);
  const isUnlocked = progress.unlocked;

  return (
    <View
      style={[
        styles.achievementCard,
        {
          borderColor: isUnlocked ? achievement.glowColor + '60' : Colors.bgCardBorder,
        },
      ]}
    >
      {isUnlocked && (
        <View style={[styles.achievementGlow, { backgroundColor: achievement.glowColor + '08' }]} />
      )}
      <View style={styles.achievementTop}>
        <Text style={[styles.achievementIcon, !isUnlocked && styles.achievementIconLocked]}>
          {achievement.icon}
        </Text>
        {isUnlocked && (
          <View style={[styles.unlockedBadge, { backgroundColor: achievement.glowColor + '20', borderColor: achievement.glowColor + '60' }]}>
            <Text style={[styles.unlockedBadgeText, { color: achievement.glowColor }]}>UNLOCKED</Text>
          </View>
        )}
      </View>
      <Text style={[styles.achievementTitle, isUnlocked && { color: achievement.glowColor }]}>
        {achievement.title}
      </Text>
      <Text style={styles.achievementDesc}>{achievement.description}</Text>
      <AnimatedProgressBar
        progress={progress.currentProgress / achievement.requirement}
        colors={
          isUnlocked
            ? [achievement.glowColor, achievement.glowColor + 'CC'] as [string, string]
            : ['#4A5568', '#4A5568'] as [string, string]
        }
        height={3}
        trackColor={Colors.bgCardBorder}
      />
      <Text style={styles.achievementProgress}>
        {progress.currentProgress}/{achievement.requirement}
      </Text>
    </View>
  );
}

// Domain pack summary card for the filter
function DomainPackCard({
  packId,
  isActive,
  onPress,
}: {
  packId: PackDomain;
  isActive: boolean;
  onPress: () => void;
}) {
  const pack = WORD_PACKS.find((p) => p.id === packId)!;
  const wordPacksHook = useWordPacks();
  const progress = wordPacksHook.getPackProgress(packId);
  const isUnlocked = wordPacksHook.isPackUnlocked(packId);
  const domainColors = PACK_DOMAIN_COLORS[packId];

  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    if (isActive && isUnlocked) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      pulseAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, isUnlocked, pulseAnim]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0, 0.15]),
  }));

  return (
    <TouchableOpacity
      style={[
        styles.domainTab,
        isActive && {
          backgroundColor: domainColors.dim,
          borderColor: domainColors.color + '60',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Active glow */}
      {isActive && (
        <Animated.View
          style={[
            styles.domainTabGlow,
            { backgroundColor: domainColors.color },
            glowStyle,
          ]}
        />
      )}

      <View style={styles.domainTabContent}>
        <Text style={styles.domainTabIcon}>{pack.icon}</Text>
        <View style={styles.domainTabInfo}>
          <Text
            style={[
              styles.domainTabText,
              isActive && { color: domainColors.light },
            ]}
            numberOfLines={1}
          >
            {pack.name.split(' ')[0]}
          </Text>
          <Text style={[styles.domainTabCount, isActive && { color: domainColors.color + 'CC' }]}>
            {progress.mastered}/{progress.total}
          </Text>
        </View>
      </View>

      {/* Mini progress ring */}
      {isActive && (
        <View style={styles.domainTabRing}>
          <PackProgressRing
            progress={progress.ratio}
            size={28}
            strokeWidth={2}
            auraColor={domainColors.color}
            auraColorLight={domainColors.light}
            showLabel={false}
            isUnlocked={isUnlocked}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function LexiconScreen() {
  const insets = useSafeAreaInsets();
  const mastery = useMastery();
  const achievements = useAchievements();
  const wordPacksHook = useWordPacks();
  const [activeTab, setActiveTab] = useState<TabId>('lexicon');
  const [filterMode, setFilterMode] = useState<FilterMode>('difficulty');
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('Easy');
  const [activeDomain, setActiveDomain] = useState<PackDomain>('legal');
  const [selectedWord, setSelectedWord] = useState<WordWithMastery | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  const wordsByDifficulty = mastery.getMasteryByDifficulty();

  // Words filtered by domain pack
  const wordsByDomain = useMemo(() => {
    const pack = WORD_PACKS.find((p) => p.id === activeDomain);
    if (!pack) return [];
    return pack.wordIds.map((id) => {
      const word = WORD_POOL.find((w) => w.id === id);
      if (!word) return null;
      const masteryData = mastery.getWordStatus(word.id);
      return { ...word, mastery: masteryData } as WordWithMastery;
    }).filter(Boolean) as WordWithMastery[];
  }, [activeDomain, mastery]);

  const currentWords = filterMode === 'difficulty'
    ? (wordsByDifficulty[activeDifficulty] as WordWithMastery[])
    : wordsByDomain;

  const tierConfig = MASTERY_TIER_CONFIG[mastery.tier];

  const masteredInDifficulty = useMemo(() => {
    const result: Record<Difficulty, { mastered: number; total: number }> = {
      Easy: { mastered: 0, total: 0 },
      Medium: { mastered: 0, total: 0 },
      Hard: { mastered: 0, total: 0 },
      Expert: { mastered: 0, total: 0 },
    };
    for (const diff of DIFFICULTY_TABS) {
      const words = wordsByDifficulty[diff] ?? [];
      result[diff] = {
        total: words.length,
        mastered: words.filter((w: WordWithMastery) => w.mastery.status === 'mastered').length,
      };
    }
    return result;
  }, [wordsByDifficulty]);

  const handleWordPress = useCallback((word: WordWithMastery) => {
    setSelectedWord(word);
    setShowDetail(true);
  }, []);

  // Get current aura color override for domain mode
  const currentAuraOverride = useMemo(() => {
    if (filterMode === 'domain') {
      const colors = PACK_DOMAIN_COLORS[activeDomain];
      return { color: colors.color, dim: colors.dim };
    }
    return undefined;
  }, [filterMode, activeDomain]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[
          filterMode === 'domain'
            ? PACK_DOMAIN_COLORS[activeDomain].dim
            : tierConfig.colorDim,
          Colors.bg,
          Colors.bg,
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={[styles.backText, { color: filterMode === 'domain' ? PACK_DOMAIN_COLORS[activeDomain].light : tierConfig.color }]}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Poly-Lexicon</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: tierConfig.colorDim, borderColor: tierConfig.color + '60' }]}>
          <Text style={styles.tierIcon}>{tierConfig.icon}</Text>
        </View>
      </Animated.View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: tierConfig.color }]}>{mastery.state.totalDiscovered}</Text>
          <Text style={styles.statLabel}>Discovered</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: Colors.bgCardBorder }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{mastery.state.totalMastered}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: Colors.bgCardBorder }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.textSub }]}>{mastery.totalWords}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Master progress bar */}
      <View style={styles.masterProgressContainer}>
        <AnimatedProgressBar
          progress={mastery.state.totalMastered / mastery.totalWords}
          colors={[tierConfig.color, tierConfig.color + 'CC'] as [string, string]}
          height={5}
        />
        <Text style={[styles.masterProgressLabel, { color: tierConfig.color }]}>
          {Math.round((mastery.state.totalMastered / mastery.totalWords) * 100)}% Mastered
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lexicon' && styles.tabActive]}
          onPress={() => setActiveTab('lexicon')}
        >
          <Text style={[styles.tabText, activeTab === 'lexicon' && styles.tabTextActive]}>
            📖 Lexicon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            🏆 Achievements
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'lexicon' ? (
        <>
          {/* Filter mode toggle */}
          <View style={styles.filterModeRow}>
            <TouchableOpacity
              style={[
                styles.filterModeBtn,
                filterMode === 'difficulty' && styles.filterModeBtnActive,
              ]}
              onPress={() => setFilterMode('difficulty')}
            >
              <Text
                style={[
                  styles.filterModeText,
                  filterMode === 'difficulty' && styles.filterModeTextActive,
                ]}
              >
                By Difficulty
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterModeBtn,
                filterMode === 'domain' && styles.filterModeBtnActive,
              ]}
              onPress={() => setFilterMode('domain')}
            >
              <Text
                style={[
                  styles.filterModeText,
                  filterMode === 'domain' && styles.filterModeTextActive,
                ]}
              >
                By Domain
              </Text>
            </TouchableOpacity>
          </View>

          {filterMode === 'difficulty' ? (
            /* Difficulty tabs */
            <View style={styles.diffTabs}>
              {DIFFICULTY_TABS.map((diff) => {
                const isActive = activeDifficulty === diff;
                const colors = DIFFICULTY_COLORS[diff];
                const stats = masteredInDifficulty[diff];
                return (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.diffTab,
                      isActive && { backgroundColor: colors.dim, borderColor: colors.color + '60' },
                    ]}
                    onPress={() => setActiveDifficulty(diff)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.diffTabText,
                        isActive && { color: colors.color },
                      ]}
                    >
                      {diff}
                    </Text>
                    <Text style={[styles.diffTabCount, isActive && { color: colors.color + 'CC' }]}>
                      {stats.mastered}/{stats.total}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Domain (Aura) tabs */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.domainTabsContainer}
            >
              {WORD_PACKS.map((pack) => (
                <DomainPackCard
                  key={pack.id}
                  packId={pack.id}
                  isActive={activeDomain === pack.id}
                  onPress={() => setActiveDomain(pack.id)}
                />
              ))}
            </ScrollView>
          )}

          {/* Pack progress header for domain mode */}
          {filterMode === 'domain' && (
            <View style={styles.domainProgressHeader}>
              <View style={styles.domainProgressLeft}>
                <PackProgressRing
                  progress={wordPacksHook.getPackProgress(activeDomain).ratio}
                  size={40}
                  strokeWidth={3}
                  auraColor={PACK_DOMAIN_COLORS[activeDomain].color}
                  auraColorLight={PACK_DOMAIN_COLORS[activeDomain].light}
                  isUnlocked={wordPacksHook.isPackUnlocked(activeDomain)}
                />
                <View>
                  <Text style={[styles.domainProgressTitle, { color: PACK_DOMAIN_COLORS[activeDomain].light }]}>
                    {WORD_PACKS.find((p) => p.id === activeDomain)?.name}
                  </Text>
                  <Text style={styles.domainProgressSub}>
                    {wordPacksHook.getPackProgress(activeDomain).mastered} of {wordPacksHook.getPackProgress(activeDomain).total} mastered
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Word Grid */}
          <FlatList
            data={currentWords}
            numColumns={GRID_COLUMNS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 20 }]}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <WordCard
                word={item}
                index={index}
                onPress={() => handleWordPress(item)}
                auraOverride={currentAuraOverride}
              />
            )}
          />
        </>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.achievementsContent, { paddingBottom: insets.bottom + 20 }]}
        >
          <Text style={styles.achievementsSectionTitle}>
            {achievements.getUnlockedCount()}/{ACHIEVEMENTS.length} Unlocked
          </Text>
          {ACHIEVEMENTS.map((a) => (
            <AchievementCard
              key={a.id}
              achievementId={a.id}
              progress={achievements.state.achievements[a.id]}
            />
          ))}
        </ScrollView>
      )}

      <WordDetailModal
        word={selectedWord}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        auraOverride={currentAuraOverride}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  tierBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierIcon: {
    fontSize: 18,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.black,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  masterProgressContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 4,
  },
  masterProgressLabel: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    textAlign: 'right',
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  tabActive: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semibold,
  },
  tabTextActive: {
    color: Colors.text,
  },
  // Filter mode toggle
  filterModeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  filterModeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  filterModeBtnActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent + '50',
  },
  filterModeText: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  filterModeTextActive: {
    color: Colors.accentLight,
  },
  // Difficulty tabs
  diffTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  diffTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    gap: 2,
  },
  diffTabText: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  diffTabCount: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.semibold,
  },
  // Domain (Aura) tabs
  domainTabsContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  domainTab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    minWidth: 110,
    overflow: 'hidden',
    position: 'relative',
  },
  domainTabGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.lg,
  },
  domainTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainTabIcon: {
    fontSize: 18,
  },
  domainTabInfo: {
    gap: 1,
  },
  domainTabText: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  domainTabCount: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Fonts.weights.semibold,
  },
  domainTabRing: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  // Domain progress header
  domainProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
  domainProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  domainProgressTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  domainProgressSub: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
    marginTop: 1,
  },
  // Grid
  gridContent: {
    paddingHorizontal: 20,
  },
  gridRow: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  wordCardWrapper: {
    width: CARD_WIDTH,
  },
  wordCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  masteredGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.lg,
  },
  wordText: {
    color: Colors.text,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  wordTextLocked: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.sm,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  masteredBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 10,
    color: Colors.gold,
  },
  lockedIcon: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xxl,
    borderWidth: 1.5,
    padding: 24,
    overflow: 'hidden',
    ...Shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalWord: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: -0.5,
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  diffBadgeText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  modalCategory: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    marginBottom: 16,
  },
  masterySection: {
    marginBottom: 18,
    gap: 6,
  },
  masteryLabel: {
    color: Colors.gold,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  meaningsSection: {
    marginBottom: 16,
  },
  meaningsSectionLabel: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  meaningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  meaningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
  },
  meaningText: {
    color: Colors.text,
    fontSize: Fonts.sizes.base,
    lineHeight: 22,
    flex: 1,
  },
  bonusSection: {
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  bonusLabel: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bonusText: {
    color: Colors.text,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
  },
  bonusOrigin: {
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.semibold,
    marginTop: 4,
  },
  masteryCardBtn: {
    marginTop: 8,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    position: 'relative',
  },
  masteryCardBtnIcon: {
    fontSize: 24,
  },
  masteryCardBtnText: {
    flex: 1,
    gap: 2,
  },
  masteryCardBtnTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  masteryCardBtnSub: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  masteryCardBtnArrow: {
    fontSize: 22,
    fontWeight: Fonts.weights.bold,
  },
  closeBtn: {
    marginTop: 8,
    backgroundColor: Colors.bgCardAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semibold,
  },
  // Achievement styles
  achievementsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementsSectionTitle: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
    marginBottom: 4,
  },
  achievementCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderRadius: Radii.xl,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  achievementGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.xl,
  },
  achievementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementIconLocked: {
    opacity: 0.4,
  },
  unlockedBadge: {
    borderWidth: 1,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unlockedBadgeText: {
    fontSize: 10,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  achievementTitle: {
    color: Colors.text,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    marginBottom: 4,
  },
  achievementDesc: {
    color: Colors.textSub,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    marginBottom: 10,
  },
  achievementProgress: {
    color: Colors.textMuted,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    textAlign: 'right',
    marginTop: 4,
  },
});
