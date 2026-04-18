/**
 * usePolly - State management for Polly the Polymath mascot
 * Handles plumage themes, domain detection, and lex-point unlocks
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PollyDomain,
  PLUMAGE_THEMES,
  PlumageTheme,
  POLLY_PLUMAGE_KEY,
  POLLY_DOMAIN_COLORS,
} from '@/constants/polly';

interface PollyState {
  activePlumageId: string;
  unlockedPlumages: string[];
  tapCount: number;
  lastTapDate: string;
}

const DEFAULT_STATE: PollyState = {
  activePlumageId: 'default',
  unlockedPlumages: ['default'],
  tapCount: 0,
  lastTapDate: '',
};

export function usePolly() {
  const [state, setState] = useState<PollyState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    AsyncStorage.getItem(POLLY_PLUMAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data) as PollyState;
          setState(parsed);
        } catch {
          // Use default
        }
      }
      setIsLoaded(true);
    });
  }, []);

  // Persist state
  const persistState = useCallback((newState: PollyState) => {
    setState(newState);
    AsyncStorage.setItem(POLLY_PLUMAGE_KEY, JSON.stringify(newState));
  }, []);

  // Get active plumage theme
  const activePlumage = useMemo((): PlumageTheme => {
    return PLUMAGE_THEMES.find((p) => p.id === state.activePlumageId) ?? PLUMAGE_THEMES[0];
  }, [state.activePlumageId]);

  // Get domain colors based on context
  const getDomainColors = useCallback((domain: PollyDomain = 'default') => {
    return POLLY_DOMAIN_COLORS[domain];
  }, []);

  // Set active plumage
  const setPlumage = useCallback((plumageId: string) => {
    if (state.unlockedPlumages.includes(plumageId)) {
      persistState({ ...state, activePlumageId: plumageId });
    }
  }, [state, persistState]);

  // Unlock plumage (returns true if successful)
  const unlockPlumage = useCallback((plumageId: string, lexPoints: number): boolean => {
    const theme = PLUMAGE_THEMES.find((p) => p.id === plumageId);
    if (!theme || state.unlockedPlumages.includes(plumageId)) return false;
    if (lexPoints < theme.cost) return false;

    const newState = {
      ...state,
      unlockedPlumages: [...state.unlockedPlumages, plumageId],
    };
    persistState(newState);
    return true;
  }, [state, persistState]);

  // Record a tap interaction
  const recordTap = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const newState = {
      ...state,
      tapCount: state.lastTapDate === today ? state.tapCount + 1 : 1,
      lastTapDate: today,
    };
    persistState(newState);
    return newState.tapCount;
  }, [state, persistState]);

  // Check if a plumage is unlocked
  const isPlumageUnlocked = useCallback((plumageId: string): boolean => {
    return state.unlockedPlumages.includes(plumageId);
  }, [state.unlockedPlumages]);

  return {
    state,
    isLoaded,
    activePlumage,
    getDomainColors,
    setPlumage,
    unlockPlumage,
    recordTap,
    isPlumageUnlocked,
    allPlumages: PLUMAGE_THEMES,
  };
}
