import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordMasteryData, MasteryState, WordStatus, getMasteryTier, MasteryTier } from '@/constants/mastery';
import { WORD_POOL } from '@/constants/words';

const MASTERY_STORAGE_KEY = 'polyplex_mastery';

function createEmptyState(): MasteryState {
  return {
    words: {},
    totalDiscovered: 0,
    totalMastered: 0,
  };
}

function recalcTotals(words: Record<string, WordMasteryData>): { totalDiscovered: number; totalMastered: number } {
  let totalDiscovered = 0;
  let totalMastered = 0;
  for (const w of Object.values(words)) {
    if (w.status === 'discovered') totalDiscovered++;
    if (w.status === 'mastered') {
      totalDiscovered++;
      totalMastered++;
    }
  }
  return { totalDiscovered, totalMastered };
}

export function useMastery() {
  const [state, setState] = useState<MasteryState>(createEmptyState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [justMastered, setJustMastered] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(MASTERY_STORAGE_KEY).then((val) => {
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

  const save = useCallback((next: MasteryState) => {
    setState(next);
    AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Mark a word as seen (discovered) if it was locked
  const discoverWord = useCallback(
    (wordId: string) => {
      setState((prev) => {
        const existing = prev.words[wordId];
        if (existing && existing.status !== 'locked') return prev; // already discovered/mastered

        const updated: WordMasteryData = existing
          ? { ...existing, status: 'discovered' as WordStatus, firstSeenAt: existing.firstSeenAt ?? Date.now() }
          : {
              wordId,
              status: 'discovered' as WordStatus,
              correctCount: 0,
              firstSeenAt: Date.now(),
            };

        const words = { ...prev.words, [wordId]: updated };
        const totals = recalcTotals(words);
        const next = { words, ...totals };
        AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  // Record a correct answer for a word (towards mastery)
  const recordCorrect = useCallback(
    (wordId: string) => {
      setState((prev) => {
        const existing = prev.words[wordId];
        const current: WordMasteryData = existing ?? {
          wordId,
          status: 'discovered' as WordStatus,
          correctCount: 0,
          firstSeenAt: Date.now(),
        };

        const newCount = current.correctCount + 1;
        const newStatus: WordStatus = newCount >= 3 ? 'mastered' : 'discovered';
        const wasMastered = current.status === 'mastered';
        const nowMastered = newStatus === 'mastered' && !wasMastered;

        const updated: WordMasteryData = {
          ...current,
          status: newStatus,
          correctCount: Math.min(newCount, 3),
          firstSeenAt: current.firstSeenAt ?? Date.now(),
          masteredAt: nowMastered ? Date.now() : current.masteredAt,
        };

        const words = { ...prev.words, [wordId]: updated };
        const totals = recalcTotals(words);
        const next = { words, ...totals };
        AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(next));

        if (nowMastered) {
          setJustMastered(wordId);
        }

        return next;
      });
    },
    [],
  );

  const clearJustMastered = useCallback(() => {
    setJustMastered(null);
  }, []);

  // Get status for a specific word
  const getWordStatus = useCallback(
    (wordId: string): WordMasteryData => {
      return (
        state.words[wordId] ?? {
          wordId,
          status: 'locked' as WordStatus,
          correctCount: 0,
        }
      );
    },
    [state.words],
  );

  // Get all words with their mastery data, organized by difficulty
  const getMasteryByDifficulty = useCallback(() => {
    const result: Record<string, (typeof WORD_POOL[0] & { mastery: WordMasteryData })[]> = {
      Easy: [],
      Medium: [],
      Hard: [],
      Expert: [],
    };

    for (const word of WORD_POOL) {
      const mastery = getWordStatus(word.id);
      result[word.difficulty].push({ ...word, mastery });
    }

    return result;
  }, [getWordStatus]);

  const tier: MasteryTier = getMasteryTier(state.totalMastered);

  return {
    state,
    isLoaded,
    tier,
    justMastered,
    clearJustMastered,
    discoverWord,
    recordCorrect,
    getWordStatus,
    getMasteryByDifficulty,
    totalWords: WORD_POOL.length,
  };
}
