import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PackDomain, WORD_PACKS } from '@/constants/packs';
import { useMastery } from './useMastery';

const PACKS_STORAGE_KEY = 'polyplex_word_packs';

export interface PackState {
  unlockedPacks: PackDomain[];
  justUnlocked: PackDomain | null;
}

function createDefaultState(): PackState {
  return {
    unlockedPacks: ['legal'], // Legal Codex is free starter pack
    justUnlocked: null,
  };
}

export function useWordPacks() {
  const [state, setState] = useState<PackState>(createDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const mastery = useMastery();

  useEffect(() => {
    AsyncStorage.getItem(PACKS_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          setState({ ...parsed, justUnlocked: null });
        } catch {
          setState(createDefaultState());
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((next: PackState) => {
    const toSave = { ...next, justUnlocked: null };
    AsyncStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const unlockPack = useCallback((packId: PackDomain) => {
    setState((prev) => {
      if (prev.unlockedPacks.includes(packId)) return prev;
      const next: PackState = {
        unlockedPacks: [...prev.unlockedPacks, packId],
        justUnlocked: packId,
      };
      save(next);
      return next;
    });
  }, [save]);

  const clearJustUnlocked = useCallback(() => {
    setState((prev) => ({ ...prev, justUnlocked: null }));
  }, []);

  const isPackUnlocked = useCallback((packId: PackDomain): boolean => {
    return state.unlockedPacks.includes(packId);
  }, [state.unlockedPacks]);

  const canUnlockPack = useCallback((packId: PackDomain): boolean => {
    const pack = WORD_PACKS.find((p) => p.id === packId);
    if (!pack) return false;
    return mastery.state.totalMastered >= pack.unlockCost;
  }, [mastery.state.totalMastered]);

  const getPackProgress = useCallback((packId: PackDomain): { mastered: number; total: number; ratio: number } => {
    const pack = WORD_PACKS.find((p) => p.id === packId);
    if (!pack) return { mastered: 0, total: 0, ratio: 0 };

    let mastered = 0;
    for (const wordId of pack.wordIds) {
      const status = mastery.getWordStatus(wordId);
      if (status.status === 'mastered') mastered++;
    }

    return {
      mastered,
      total: pack.wordIds.length,
      ratio: pack.wordIds.length > 0 ? mastered / pack.wordIds.length : 0,
    };
  }, [mastery]);

  return {
    state,
    isLoaded,
    unlockPack,
    clearJustUnlocked,
    isPackUnlocked,
    canUnlockPack,
    getPackProgress,
  };
}
