import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AchievementId,
  AchievementProgress,
  AchievementsState,
  ACHIEVEMENTS,
} from '@/constants/achievements';
import { CONTRONYM_IDS } from '@/constants/mastery';

const ACHIEVEMENTS_STORAGE_KEY = 'polyplex_achievements';

function createEmptyAchievements(): AchievementsState {
  const achievements: Record<string, AchievementProgress> = {};
  for (const a of ACHIEVEMENTS) {
    achievements[a.id] = {
      id: a.id,
      currentProgress: 0,
      unlocked: false,
    };
  }
  return {
    achievements: achievements as Record<AchievementId, AchievementProgress>,
    expertGamesWithoutMistake: 0,
    dailyPuzzleStreak: 0,
  };
}

export function useAchievements() {
  const [state, setState] = useState<AchievementsState>(createEmptyAchievements);
  const [isLoaded, setIsLoaded] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<AchievementId | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACHIEVEMENTS_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          const saved = JSON.parse(val);
          // Merge with defaults for new achievements
          const defaults = createEmptyAchievements();
          setState({
            ...defaults,
            ...saved,
            achievements: { ...defaults.achievements, ...saved.achievements },
          });
        } catch {
          setState(createEmptyAchievements());
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((next: AchievementsState) => {
    setState(next);
    AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Generic progress update
  const updateProgress = useCallback(
    (achievementId: AchievementId, newProgress: number) => {
      setState((prev) => {
        const current = prev.achievements[achievementId];
        if (!current || current.unlocked) return prev;

        const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!def) return prev;

        const unlocked = newProgress >= def.requirement;
        const updated: AchievementProgress = {
          ...current,
          currentProgress: Math.min(newProgress, def.requirement),
          unlocked,
          unlockedAt: unlocked ? Date.now() : undefined,
        };

        const next: AchievementsState = {
          ...prev,
          achievements: { ...prev.achievements, [achievementId]: updated },
        };

        if (unlocked && !current.unlocked) {
          setJustUnlocked(achievementId);
        }

        AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  // Check mastery-based achievements when word mastery changes
  const checkMasteryAchievements = useCallback(
    (masteredWords: Record<string, { status: string; correctCount: number }>) => {
      const masteredIds = Object.keys(masteredWords).filter(
        (id) => masteredWords[id].status === 'mastered',
      );
      const totalMastered = masteredIds.length;

      // First Mastery
      if (totalMastered >= 1) {
        updateProgress('first_mastery', totalMastered);
      }
      // 10 mastered
      if (totalMastered >= 1) {
        updateProgress('ten_mastered', totalMastered);
      }
      // 50 mastered
      if (totalMastered >= 1) {
        updateProgress('fifty_mastered', totalMastered);
      }
      // 100 mastered
      if (totalMastered >= 1) {
        updateProgress('hundred_mastered', totalMastered);
      }

      // Contronym Killer
      const masteredContronyms = CONTRONYM_IDS.filter((id) =>
        masteredIds.includes(id),
      ).length;
      updateProgress('contronym_killer', masteredContronyms);
    },
    [updateProgress],
  );

  // Record a perfect expert game (no mistakes)
  const recordExpertGame = useCallback(
    (hadMistake: boolean) => {
      setState((prev) => {
        const newCount = hadMistake ? 0 : prev.expertGamesWithoutMistake + 1;
        const next = { ...prev, expertGamesWithoutMistake: newCount };
        AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));

        if (newCount >= 1) {
          // Update progress
          const current = prev.achievements.expert_navigator;
          if (!current.unlocked) {
            const def = ACHIEVEMENTS.find((a) => a.id === 'expert_navigator')!;
            const unlocked = newCount >= def.requirement;
            const updated: AchievementProgress = {
              ...current,
              currentProgress: Math.min(newCount, def.requirement),
              unlocked,
              unlockedAt: unlocked ? Date.now() : undefined,
            };
            next.achievements = { ...next.achievements, expert_navigator: updated };
            if (unlocked && !current.unlocked) {
              setJustUnlocked('expert_navigator');
            }
            AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));
          }
        }

        return next;
      });
    },
    [],
  );

  // Record daily puzzle completion for streak
  const recordDailyCompletion = useCallback(
    (dateString: string) => {
      setState((prev) => {
        let newStreak: number;
        const yesterday = getYesterdayString(dateString);

        if (prev.lastDailyPuzzleDate === yesterday) {
          newStreak = prev.dailyPuzzleStreak + 1;
        } else if (prev.lastDailyPuzzleDate === dateString) {
          // Already recorded today
          return prev;
        } else {
          newStreak = 1;
        }

        const next: AchievementsState = {
          ...prev,
          dailyPuzzleStreak: newStreak,
          lastDailyPuzzleDate: dateString,
        };

        // Update streak_master
        const current = prev.achievements.streak_master;
        if (!current.unlocked) {
          const def = ACHIEVEMENTS.find((a) => a.id === 'streak_master')!;
          const unlocked = newStreak >= def.requirement;
          next.achievements = {
            ...next.achievements,
            streak_master: {
              ...current,
              currentProgress: Math.min(newStreak, def.requirement),
              unlocked,
              unlockedAt: unlocked ? Date.now() : undefined,
            },
          };
          if (unlocked && !current.unlocked) {
            setJustUnlocked('streak_master');
          }
        }

        // Update daily_devotee (total daily puzzles - use currentProgress + 1)
        const devotee = prev.achievements.daily_devotee;
        if (!devotee.unlocked) {
          const newTotal = devotee.currentProgress + 1;
          const def = ACHIEVEMENTS.find((a) => a.id === 'daily_devotee')!;
          const unlocked = newTotal >= def.requirement;
          next.achievements = {
            ...next.achievements,
            daily_devotee: {
              ...devotee,
              currentProgress: Math.min(newTotal, def.requirement),
              unlocked,
              unlockedAt: unlocked ? Date.now() : undefined,
            },
          };
          if (unlocked && !devotee.unlocked) {
            setJustUnlocked('daily_devotee');
          }
        }

        AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  // Record speed demon
  const recordTimedChallengeComplete = useCallback(
    (timeRemaining: number) => {
      if (timeRemaining > 10) {
        updateProgress('speed_demon', 1);
      }
    },
    [updateProgress],
  );

  // Record a perfect MC round
  const recordPerfectRound = useCallback(() => {
    updateProgress('perfect_round', 1);
  }, [updateProgress]);

  const clearJustUnlocked = useCallback(() => {
    setJustUnlocked(null);
  }, []);

  const getUnlockedCount = useCallback((): number => {
    return Object.values(state.achievements).filter((a) => a.unlocked).length;
  }, [state.achievements]);

  return {
    state,
    isLoaded,
    justUnlocked,
    clearJustUnlocked,
    checkMasteryAchievements,
    recordExpertGame,
    recordDailyCompletion,
    recordTimedChallengeComplete,
    recordPerfectRound,
    updateProgress,
    getUnlockedCount,
  };
}

function getYesterdayString(todayString: string): string {
  const parts = todayString.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
