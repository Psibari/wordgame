import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STABILITY_STORAGE_KEY = 'polyplex_stability';
const REVIEW_HISTORY_KEY = 'polyplex_review_history';

// Time constants
const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

// Stability decay rates (per day without review)
const DECAY_RATE_BASE = 0.08; // 8% per day base decay
const DECAY_RATE_BONUS = 0.02; // 2% less decay per successful review

export interface WordStability {
  wordId: string;
  stability: number; // 0-100
  lastReviewedAt: number;
  reviewCount: number;
  consecutiveCorrect: number;
  phase: 'seed' | 'sprout' | 'bloom' | 'crystal'; // visual phase
}

export interface ReviewHistoryEntry {
  wordId: string;
  timestamp: number;
  correct: boolean;
}

interface StabilityState {
  words: Record<string, WordStability>;
  reviewHistory: ReviewHistoryEntry[];
}

function getPhaseFromStability(stability: number): WordStability['phase'] {
  if (stability >= 90) return 'crystal';
  if (stability >= 60) return 'bloom';
  if (stability >= 30) return 'sprout';
  return 'seed';
}

function calculateDecayedStability(word: WordStability, now: number): number {
  const elapsed = now - word.lastReviewedAt;
  const daysPassed = elapsed / DAY;
  if (daysPassed < 0.1) return word.stability; // Less than ~2.4 hours

  // Decay slows with more reviews (spaced repetition benefit)
  const reviewBonus = Math.min(word.reviewCount * DECAY_RATE_BONUS, 0.06);
  const effectiveDecay = Math.max(DECAY_RATE_BASE - reviewBonus, 0.02);

  // Consecutive correct answers slow decay further
  const streakBonus = Math.min(word.consecutiveCorrect * 0.01, 0.03);
  const finalDecay = Math.max(effectiveDecay - streakBonus, 0.01);

  const decayed = word.stability - (daysPassed * finalDecay * 100);
  return Math.max(0, Math.min(100, decayed));
}

function createEmptyState(): StabilityState {
  return { words: {}, reviewHistory: [] };
}

export function useStability() {
  const [state, setState] = useState<StabilityState>(createEmptyState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STABILITY_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setState(JSON.parse(val));
        } catch {
          setState(createEmptyState());
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((next: StabilityState) => {
    setState(next);
    AsyncStorage.setItem(STABILITY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Initialize stability for a mastered word
  const initializeWord = useCallback((wordId: string) => {
    setState((prev) => {
      if (prev.words[wordId]) return prev;
      const now = Date.now();
      const newWord: WordStability = {
        wordId,
        stability: 50, // Start at 50% - needs review to grow
        lastReviewedAt: now,
        reviewCount: 0,
        consecutiveCorrect: 0,
        phase: 'seed',
      };
      const next = {
        ...prev,
        words: { ...prev.words, [wordId]: newWord },
      };
      AsyncStorage.setItem(STABILITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Record a review result
  const recordReview = useCallback((wordId: string, correct: boolean) => {
    setState((prev) => {
      const now = Date.now();
      const existing = prev.words[wordId];
      const current: WordStability = existing ?? {
        wordId,
        stability: 50,
        lastReviewedAt: now,
        reviewCount: 0,
        consecutiveCorrect: 0,
        phase: 'seed',
      };

      // Calculate current decayed stability before applying review
      const decayedStability = calculateDecayedStability(current, now);

      let newStability: number;
      let newConsecutive: number;

      if (correct) {
        // Boost stability (diminishing returns near 100)
        const boost = Math.max(5, 20 - (decayedStability / 10));
        newStability = Math.min(100, decayedStability + boost);
        newConsecutive = current.consecutiveCorrect + 1;
      } else {
        // Penalty for incorrect (harsh but fair)
        newStability = Math.max(0, decayedStability - 15);
        newConsecutive = 0;
      }

      const updated: WordStability = {
        ...current,
        stability: newStability,
        lastReviewedAt: now,
        reviewCount: current.reviewCount + 1,
        consecutiveCorrect: newConsecutive,
        phase: getPhaseFromStability(newStability),
      };

      const historyEntry: ReviewHistoryEntry = {
        wordId,
        timestamp: now,
        correct,
      };

      const next: StabilityState = {
        words: { ...prev.words, [wordId]: updated },
        reviewHistory: [...prev.reviewHistory.slice(-200), historyEntry], // Keep last 200
      };

      AsyncStorage.setItem(STABILITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Get current stability for a word (with decay applied)
  const getWordStability = useCallback((wordId: string): WordStability | null => {
    const word = state.words[wordId];
    if (!word) return null;
    const now = Date.now();
    const decayed = calculateDecayedStability(word, now);
    return {
      ...word,
      stability: decayed,
      phase: getPhaseFromStability(decayed),
    };
  }, [state.words]);

  // Get all words sorted by stability (lowest first = needs review most)
  const getWordsNeedingReview = useCallback((limit: number = 10): WordStability[] => {
    const now = Date.now();
    return Object.values(state.words)
      .map((w) => {
        const decayed = calculateDecayedStability(w, now);
        return { ...w, stability: decayed, phase: getPhaseFromStability(decayed) };
      })
      .sort((a, b) => a.stability - b.stability)
      .slice(0, limit);
  }, [state.words]);

  // Get all words with current stability
  const allWordsWithStability = useMemo(() => {
    const now = Date.now();
    return Object.values(state.words).map((w) => {
      const decayed = calculateDecayedStability(w, now);
      return { ...w, stability: decayed, phase: getPhaseFromStability(decayed) };
    });
  }, [state.words]);

  // Stats
  const stats = useMemo(() => {
    const words = allWordsWithStability;
    const total = words.length;
    const avgStability = total > 0
      ? words.reduce((sum, w) => sum + w.stability, 0) / total
      : 0;
    const crystals = words.filter((w) => w.phase === 'crystal').length;
    const blooms = words.filter((w) => w.phase === 'bloom').length;
    const sprouts = words.filter((w) => w.phase === 'sprout').length;
    const seeds = words.filter((w) => w.phase === 'seed').length;
    const wilting = words.filter((w) => w.stability < 25).length;
    return { total, avgStability, crystals, blooms, sprouts, seeds, wilting };
  }, [allWordsWithStability]);

  return {
    state,
    isLoaded,
    stats,
    allWordsWithStability,
    initializeWord,
    recordReview,
    getWordStability,
    getWordsNeedingReview,
  };
}
