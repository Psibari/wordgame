import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_KEY = 'polyplex_daily_puzzle';
const MAX_ATTEMPTS = 3;

export type DailyStatus = 'available' | 'in_progress' | 'completed' | 'failed';

export interface DailyPuzzleState {
  date: string;
  attemptsUsed: number;
  completed: boolean;
  failed: boolean;
  score: number;
  resultEmoji?: string;
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useDailyPuzzle() {
  const [state, setState] = useState<DailyPuzzleState>({
    date: getTodayString(),
    attemptsUsed: 0,
    completed: false,
    failed: false,
    score: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DAILY_KEY).then((val) => {
      if (val) {
        const saved: DailyPuzzleState = JSON.parse(val);
        if (saved.date === getTodayString()) {
          setState(saved);
        } else {
          // New day, reset
          const fresh: DailyPuzzleState = {
            date: getTodayString(),
            attemptsUsed: 0,
            completed: false,
            failed: false,
            score: 0,
          };
          setState(fresh);
          AsyncStorage.setItem(DAILY_KEY, JSON.stringify(fresh));
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((next: DailyPuzzleState) => {
    setState(next);
    AsyncStorage.setItem(DAILY_KEY, JSON.stringify(next));
  }, []);

  const recordAttempt = useCallback(
    (success: boolean, score: number, emoji?: string) => {
      const next: DailyPuzzleState = {
        ...state,
        attemptsUsed: state.attemptsUsed + 1,
        completed: success,
        failed: !success && state.attemptsUsed + 1 >= MAX_ATTEMPTS,
        score: success ? score : state.score,
        resultEmoji: emoji,
      };
      save(next);
      return next;
    },
    [state, save],
  );

  const status: DailyStatus = state.completed
    ? 'completed'
    : state.failed
      ? 'failed'
      : state.attemptsUsed > 0
        ? 'in_progress'
        : 'available';

  const attemptsRemaining = MAX_ATTEMPTS - state.attemptsUsed;
  const canPlay = !state.completed && !state.failed;

  return {
    state,
    isLoaded,
    status,
    attemptsRemaining,
    canPlay,
    recordAttempt,
    maxAttempts: MAX_ATTEMPTS,
  };
}
