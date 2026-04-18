import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { HapticManager } from '@/utils/haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { useStability, WordStability } from '@/hooks/useStability';
import { useXP } from '@/hooks/useXP';
import { WORD_POOL, WordEntry } from '@/constants/words';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';

const W = Colors.workspace;

const MAX_REVIEW_WORDS = 10;

interface ReviewWord {
  wordEntry: WordEntry;
  stability: WordStability;
}

type ReviewMode = 'meaning-to-word' | 'word-to-meaning';

interface ReviewQuestion {
  word: ReviewWord;
  mode: ReviewMode;
  options: string[];
  correctIndex: number;
}

function generateQuestion(word: ReviewWord, allWords: WordEntry[]): ReviewQuestion {
  const mode: ReviewMode = Math.random() > 0.5 ? 'meaning-to-word' : 'word-to-meaning';

  if (mode === 'meaning-to-word') {
    // Show a meaning, pick the correct word
    const correctAnswer = word.wordEntry.word;

    // Get 3 random decoy words
    const decoys = allWords
      .filter((w) => w.id !== word.wordEntry.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);

    const options = [...decoys, correctAnswer].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      word,
      mode,
      options,
      correctIndex,
    };
  } else {
    // Show the word, pick the correct meaning
    const correctMeaning = word.wordEntry.meanings[0];
    const decoys = word.wordEntry.mcqDecoys.slice(0, 3);
    const options = [...decoys, correctMeaning].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctMeaning);

    return {
      word,
      mode,
      options,
      correctIndex,
    };
  }
}

// Result screen after review
function ReviewResults({
  correct,
  total,
  onDone,
}: {
  correct: number;
  total: number;
  onDone: () => void;
}) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isGood = percentage >= 70;

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.resultsContainer}>
      <Text style={styles.resultsIcon}>{isGood ? '✦' : '◈'}</Text>
      <Text style={styles.resultsTitle}>
        {isGood ? 'Excellent Review!' : 'Keep Practicing'}
      </Text>
      <Text style={styles.resultsScore}>
        {correct}/{total} correct ({percentage}%)
      </Text>

      <View style={styles.resultsBar}>
        <AnimatedProgressBar
          progress={correct / Math.max(total, 1)}
          colors={isGood ? [W.gardenCrystal, W.gardenBloom] : [W.stability50, W.stability25]}
          height={8}
          trackColor={W.zenBorder}
        />
      </View>

      <Text style={styles.resultsXP}>+{correct * 15} XP earned</Text>

      <TouchableOpacity style={styles.resultsDoneBtn} onPress={onDone} activeOpacity={0.8}>
        <LinearGradient
          colors={[W.inkBlue, W.inkBlueDim]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Text style={styles.resultsDoneBtnText}>Return to Garden</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GardenReviewScreen() {
  const insets = useSafeAreaInsets();
  const stability = useStability();
  const { addXP } = useXP();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);

  // Get words that need review (sorted by lowest stability)
  const reviewWords = useMemo((): ReviewWord[] => {
    const wordsNeeding = stability.getWordsNeedingReview(MAX_REVIEW_WORDS);
    return wordsNeeding
      .map((ws) => {
        const wordEntry = WORD_POOL.find((w) => w.id === ws.wordId);
        return wordEntry ? { wordEntry, stability: ws } : null;
      })
      .filter(Boolean) as ReviewWord[];
  }, [stability]);

  // Generate questions for all review words
  const questions = useMemo((): ReviewQuestion[] => {
    return reviewWords.map((rw) => generateQuestion(rw, WORD_POOL));
  }, [reviewWords]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentIndex + (showResult ? 1 : 0)) / totalQuestions : 0;

  // Animations
  const cardScale = useSharedValue(1);

  const handleSelectOption = useCallback((optionIndex: number) => {
    if (showResult || selectedOption !== null) return;

    setSelectedOption(optionIndex);
    setShowResult(true);

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      HapticManager.crystalChime();
      setCorrectCount((prev) => prev + 1);
      stability.recordReview(currentQuestion.word.wordEntry.id, true);
      addXP(15);
    } else {
      HapticManager.dullThud();
      stability.recordReview(currentQuestion.word.wordEntry.id, false);
      cardScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 10 }),
      );
    }
  }, [showResult, selectedOption, currentQuestion, stability, addXP, cardScale]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= totalQuestions) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowResult(false);
    setQuestionKey((prev) => prev + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentIndex, totalQuestions]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  if (totalQuestions === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[W.charcoal, '#0B0B0B']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>No Words to Review</Text>
          <Text style={styles.emptyText}>
            Master more words in game modes to grow your garden
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>← Back to Garden</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[W.charcoal, '#0B0B0B']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>‹ Garden</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Review</Text>
        <Text style={styles.headerProgress}>
          {isFinished ? totalQuestions : currentIndex + 1}/{totalQuestions}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <AnimatedProgressBar
          progress={progress}
          colors={[W.inkBlueGlow, W.inkBlue]}
          height={4}
          trackColor={W.zenBorder}
        />
      </View>

      {isFinished ? (
        <ReviewResults
          correct={correctCount}
          total={totalQuestions}
          onDone={() => router.back()}
        />
      ) : currentQuestion ? (
        <Animated.View
          key={questionKey}
          entering={SlideInRight.duration(300)}
          style={[styles.questionContainer, cardStyle]}
        >
          {/* Stability info */}
          <View style={styles.stabilityInfo}>
            <Text style={styles.stabilityInfoLabel}>
              Current Stability: {Math.round(currentQuestion.word.stability.stability)}%
            </Text>
            <View style={styles.stabilityMiniBar}>
              <View
                style={[
                  styles.stabilityMiniFill,
                  {
                    width: `${currentQuestion.word.stability.stability}%`,
                    backgroundColor:
                      currentQuestion.word.stability.stability < 25
                        ? W.gardenWilt
                        : currentQuestion.word.stability.stability < 50
                          ? W.stability50
                          : W.gardenBloom,
                  },
                ]}
              />
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            {currentQuestion.mode === 'meaning-to-word' ? (
              <>
                <Text style={styles.questionLabel}>WHAT WORD MATCHES THIS MEANING?</Text>
                <Text style={styles.questionText}>
                  &quot;{currentQuestion.word.wordEntry.meanings[0]}&quot;
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.questionLabel}>WHAT DOES THIS WORD MEAN?</Text>
                <Text style={styles.questionWord}>
                  {currentQuestion.word.wordEntry.word}
                </Text>
              </>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              const showCorrect = showResult && isCorrectOption;
              const showWrong = showResult && isSelected && !isCorrectOption;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBtn,
                    showCorrect && styles.optionBtnCorrect,
                    showWrong && styles.optionBtnWrong,
                    isSelected && !showResult && styles.optionBtnSelected,
                  ]}
                  onPress={() => handleSelectOption(index)}
                  disabled={showResult}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      showCorrect && styles.optionTextCorrect,
                      showWrong && styles.optionTextWrong,
                    ]}
                    numberOfLines={2}
                  >
                    {option}
                  </Text>
                  {showCorrect && <Text style={styles.optionIcon}>✓</Text>}
                  {showWrong && <Text style={styles.optionIcon}>✗</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next button */}
          {showResult && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[W.inkBlue, W.inkBlueDim]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.nextBtnText}>
                  {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Word →'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      ) : null}
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
  headerProgress: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  stabilityInfo: {
    marginBottom: 20,
    gap: 6,
  },
  stabilityInfoLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 0.5,
  },
  stabilityMiniBar: {
    height: 3,
    backgroundColor: W.zenBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stabilityMiniFill: {
    height: '100%',
    borderRadius: 2,
  },
  questionCard: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  questionLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  questionText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questionWord: {
    color: W.inkBlueGlow,
    fontSize: Fonts.sizes.xxxl,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  optionBtn: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: W.zenBorder,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionBtnSelected: {
    borderColor: W.inkBlue + '60',
    backgroundColor: W.inkBlueDim + '40',
  },
  optionBtnCorrect: {
    borderColor: W.gardenBloom + '80',
    backgroundColor: W.gardenBloom + '15',
  },
  optionBtnWrong: {
    borderColor: W.gardenWilt + '80',
    backgroundColor: W.gardenWilt + '15',
  },
  optionText: {
    color: W.paper,
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.medium,
    flex: 1,
  },
  optionTextCorrect: {
    color: W.gardenBloom,
  },
  optionTextWrong: {
    color: W.gardenWilt,
  },
  optionIcon: {
    fontSize: 18,
    fontWeight: Fonts.weights.bold,
    marginLeft: 8,
  },
  nextBtn: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  // Results
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  resultsIcon: {
    fontSize: 56,
    color: W.gardenCrystal,
    marginBottom: 16,
  },
  resultsTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    marginBottom: 8,
  },
  resultsScore: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
    marginBottom: 24,
  },
  resultsBar: {
    width: '100%',
    marginBottom: 16,
  },
  resultsXP: {
    color: Colors.gold,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    marginBottom: 32,
  },
  resultsDoneBtn: {
    width: '100%',
    borderRadius: Radii.lg,
    overflow: 'hidden',
    paddingVertical: 16,
    alignItems: 'center',
  },
  resultsDoneBtnText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    marginBottom: 8,
  },
  emptyText: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radii.lg,
    backgroundColor: W.zenSurface,
    borderWidth: 1,
    borderColor: W.zenBorder,
  },
  backBtnText: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
});
