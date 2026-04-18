import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_STORAGE_KEY = 'polyplex_total_xp';
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800, 7800];

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

export function getXPProgress(xp: number): number {
  const level = getLevelFromXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  if (nextThreshold === currentThreshold) return 1;
  return Math.min((xp - currentThreshold) / (nextThreshold - currentThreshold), 1);
}

export function useXP() {
  const [totalXP, setTotalXP] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(XP_STORAGE_KEY).then((val) => {
      const xp = val !== null ? parseInt(val, 10) : 0;
      setTotalXP(xp);
      prevLevelRef.current = getLevelFromXP(xp);
      setIsLoaded(true);
    });
  }, []);

  // Detect level changes
  useEffect(() => {
    if (!isLoaded || prevLevelRef.current === null) return;
    const currentLevel = getLevelFromXP(totalXP);
    if (currentLevel > prevLevelRef.current) {
      setDidLevelUp(true);
      prevLevelRef.current = currentLevel;
    }
  }, [totalXP, isLoaded]);

  const addXP = useCallback(async (amount: number) => {
    setTotalXP((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(XP_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const resetXP = useCallback(async () => {
    await AsyncStorage.setItem(XP_STORAGE_KEY, '0');
    setTotalXP(0);
    prevLevelRef.current = 1;
  }, []);

  const clearLevelUp = useCallback(() => {
    setDidLevelUp(false);
  }, []);

  return {
    totalXP,
    isLoaded,
    level: getLevelFromXP(totalXP),
    progress: getXPProgress(totalXP),
    didLevelUp,
    clearLevelUp,
    addXP,
    resetXP,
  };
}
