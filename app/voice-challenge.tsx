import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { WORD_POOL, WordEntry } from '@/constants/words';
import { useAudioTranscription } from '@fastshot/ai';
import { useXP } from '@/hooks/useXP';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';

const W = Colors.workspace;
const TOTAL_ROUNDS = 5;

interface ChallengeRound {
  word: WordEntry;
  meaningIndex: number;
}

function generateRounds(): ChallengeRound[] {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, TOTAL_ROUNDS).map((word) => ({
    word,
    meaningIndex: Math.floor(Math.random() * word.meanings.length),
  }));
}

// Pulsing microphone animation
function PulsingMic({ isRecording }: { isRecording: boolean }) {
  const pulse = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      ring1.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
      ring2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500 }),
          withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
      ring1.value = withTiming(0, { duration: 300 });
      ring2.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording, pulse, ring1, ring2]);

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [1, 2]) }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 1], [0.3, 0]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [1, 1.8]) }],
  }));

  return (
    <View style={styles.micContainer}>
      {isRecording && (
        <>
          <Animated.View style={[styles.micRing, ring1Style]} />
          <Animated.View style={[styles.micRing, ring2Style]} />
        </>
      )}
      <Animated.View style={[styles.micBtn, isRecording && styles.micBtnActive, micStyle]}>
        <Text style={styles.micIcon}>{isRecording ? '🔴' : '🎙️'}</Text>
      </Animated.View>
    </View>
  );
}

export default function VoiceChallengeScreen() {
  const insets = useSafeAreaInsets();
  const { addXP } = useXP();
  const [rounds] = useState(() => generateRounds());
  const [currentRound, setCurrentRound] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const { transcribeAudio, isLoading: isTranscribing } = useAudioTranscription({
    onSuccess: (result) => {
      const transcribed = result?.toString().trim().toLowerCase() || '';
      setTranscribedText(transcribed);

      const currentWord = rounds[currentRound].word.word.toLowerCase();
      const correct = transcribed.includes(currentWord) ||
        currentWord.includes(transcribed) ||
        levenshteinDistance(transcribed, currentWord) <= 2;

      setIsCorrect(correct);
      setShowResult(true);

      if (correct) {
        setCorrectCount((prev) => prev + 1);
        addXP(20);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    onError: () => {
      setShowResult(true);
      setIsCorrect(false);
      setTranscribedText('(Could not transcribe)');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const currentChallenge = rounds[currentRound];
  const progress = (currentRound + (showResult ? 1 : 0)) / TOTAL_ROUNDS;

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is needed for voice challenges.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await transcribeAudio({ audioUri: uri, language: 'en' });
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecording(false);
    }
  }, [transcribeAudio]);

  const handleNext = useCallback(() => {
    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setIsFinished(true);
      return;
    }
    setCurrentRound((prev) => prev + 1);
    setShowResult(false);
    setTranscribedText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentRound]);

  if (isFinished) {
    const percentage = Math.round((correctCount / TOTAL_ROUNDS) * 100);
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[W.charcoal, '#0A0A0A']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View entering={FadeInDown.duration(500)} style={styles.finishContainer}>
          <Text style={styles.finishIcon}>{percentage >= 60 ? '🎙️' : '🔮'}</Text>
          <Text style={styles.finishTitle}>
            {percentage >= 80 ? 'Outstanding!' : percentage >= 60 ? 'Well Done!' : 'Keep Practicing'}
          </Text>
          <Text style={styles.finishScore}>
            {correctCount}/{TOTAL_ROUNDS} correct ({percentage}%)
          </Text>
          <View style={styles.finishBar}>
            <AnimatedProgressBar
              progress={correctCount / TOTAL_ROUNDS}
              colors={percentage >= 60 ? [W.gardenCrystal, W.gardenBloom] : [W.stability50, W.stability25]}
              height={8}
              trackColor={W.zenBorder}
            />
          </View>
          <Text style={styles.finishXP}>+{correctCount * 20} XP earned</Text>
          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[W.inkBlue, W.inkBlueDim]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.finishBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[W.charcoal, '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Challenge</Text>
        <Text style={styles.headerProgress}>
          {currentRound + 1}/{TOTAL_ROUNDS}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <AnimatedProgressBar
          progress={progress}
          colors={[W.inkBlueGlow, W.inkBlue]}
          height={4}
          trackColor={W.zenBorder}
        />
      </View>

      {/* Challenge content */}
      <View style={styles.challengeContent}>
        {/* Definition card */}
        <View style={styles.definitionCard}>
          <Text style={styles.definitionLabel}>WHAT WORD IS THIS?</Text>
          <Text style={styles.definitionText}>
            &quot;{currentChallenge.word.meanings[currentChallenge.meaningIndex]}&quot;
          </Text>
          <View style={styles.definitionMeta}>
            <Text style={styles.definitionCategory}>
              {currentChallenge.word.category}
            </Text>
            <Text style={styles.definitionDifficulty}>
              {currentChallenge.word.difficulty}
            </Text>
          </View>
        </View>

        {/* Recording area */}
        <View style={styles.recordingArea}>
          {isTranscribing ? (
            <View style={styles.transcribingContainer}>
              <ActivityIndicator size="large" color={W.inkBlueGlow} />
              <Text style={styles.transcribingText}>Listening...</Text>
            </View>
          ) : showResult ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.resultArea}>
              <View style={[
                styles.resultBadge,
                isCorrect ? styles.resultBadgeCorrect : styles.resultBadgeWrong,
              ]}>
                <Text style={styles.resultBadgeIcon}>
                  {isCorrect ? '✓' : '✗'}
                </Text>
                <Text style={[
                  styles.resultBadgeText,
                  isCorrect ? styles.resultTextCorrect : styles.resultTextWrong,
                ]}>
                  {isCorrect ? 'Correct!' : 'Not Quite'}
                </Text>
              </View>

              <Text style={styles.resultHeard}>You said: &quot;{transcribedText}&quot;</Text>
              {!isCorrect && (
                <Text style={styles.resultAnswer}>
                  Answer: <Text style={{ color: W.gardenBloom }}>{currentChallenge.word.word}</Text>
                </Text>
              )}
            </Animated.View>
          ) : (
            <View style={styles.recordPrompt}>
              <Text style={styles.recordPromptText}>
                {isRecording ? 'Say the word now...' : 'Tap & hold to speak'}
              </Text>
            </View>
          )}

          {/* Mic button */}
          {!showResult && !isTranscribing && (
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={1}
              style={styles.micTouchArea}
            >
              <PulsingMic isRecording={isRecording} />
            </TouchableOpacity>
          )}

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
                />
                <Text style={styles.nextBtnText}>
                  {currentRound + 1 >= TOTAL_ROUNDS ? 'See Results' : 'Next →'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
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
  challengeContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  definitionCard: {
    backgroundColor: W.zenSurface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: W.zenBorder,
    padding: 24,
    marginBottom: 30,
    alignItems: 'center',
  },
  definitionLabel: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.black,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  definitionText: {
    color: W.paper,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.medium,
    lineHeight: 28,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  definitionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  definitionCategory: {
    color: W.textTertiary,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.medium,
  },
  definitionDifficulty: {
    color: W.inkBlueLight,
    fontSize: Fonts.sizes.xs,
    fontWeight: Fonts.weights.bold,
  },
  recordingArea: {
    flex: 1,
    alignItems: 'center',
    gap: 24,
  },
  recordPrompt: {
    marginBottom: 8,
  },
  recordPromptText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
  },
  micTouchArea: {
    alignItems: 'center',
  },
  micContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: W.inkBlueGlow,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: W.zenSurfaceElevated,
    borderWidth: 2,
    borderColor: W.zenBorderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: W.inkBlueDim,
    borderColor: W.inkBlueGlow,
  },
  micIcon: {
    fontSize: 32,
  },
  // Transcribing
  transcribingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  transcribingText: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
  },
  // Result
  resultArea: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  resultBadgeCorrect: {
    backgroundColor: W.gardenBloom + '20',
    borderColor: W.gardenBloom + '60',
  },
  resultBadgeWrong: {
    backgroundColor: W.gardenWilt + '20',
    borderColor: W.gardenWilt + '60',
  },
  resultBadgeIcon: {
    fontSize: 18,
    fontWeight: Fonts.weights.bold,
  },
  resultBadgeText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  resultTextCorrect: {
    color: W.gardenBloom,
  },
  resultTextWrong: {
    color: W.gardenWilt,
  },
  resultHeard: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.medium,
  },
  resultAnswer: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  nextBtn: {
    width: 200,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
  // Finished
  finishContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  finishIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  finishTitle: {
    color: W.paper,
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.black,
    marginBottom: 8,
  },
  finishScore: {
    color: W.textSecondary,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
    marginBottom: 24,
  },
  finishBar: {
    width: '100%',
    marginBottom: 16,
  },
  finishXP: {
    color: Colors.gold,
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    marginBottom: 32,
  },
  finishBtn: {
    width: '100%',
    borderRadius: Radii.lg,
    overflow: 'hidden',
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishBtnText: {
    color: W.paper,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
  },
});
