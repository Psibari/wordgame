import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLeagueTier,
  calculateEloChange,
  LeagueTier,
  DuelResult,
  DuelRoundResult,
} from '@/constants/arena';

const ARENA_ELO_KEY = 'polyplex_arena_elo';
const ARENA_WINS_KEY = 'polyplex_arena_wins';
const ARENA_LOSSES_KEY = 'polyplex_arena_losses';
const ARENA_STREAK_KEY = 'polyplex_arena_streak';
const ARENA_HISTORY_KEY = 'polyplex_arena_history';
const ARENA_LEAGUE_KEY = 'polyplex_arena_league';

const DEFAULT_ELO = 800;

export interface ArenaStats {
  elo: number;
  league: LeagueTier;
  wins: number;
  losses: number;
  winStreak: number;
  bestStreak: number;
  duelHistory: DuelResult[];
}

export function useArena() {
  const [elo, setElo] = useState(DEFAULT_ELO);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [duelHistory, setDuelHistory] = useState<DuelResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rankedUp, setRankedUp] = useState<{ from: LeagueTier; to: LeagueTier } | null>(null);

  const league = getLeagueTier(elo);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eloStr, winsStr, lossesStr, streakStr, historyStr] = await Promise.all([
          AsyncStorage.getItem(ARENA_ELO_KEY),
          AsyncStorage.getItem(ARENA_WINS_KEY),
          AsyncStorage.getItem(ARENA_LOSSES_KEY),
          AsyncStorage.getItem(ARENA_STREAK_KEY),
          AsyncStorage.getItem(ARENA_HISTORY_KEY),
        ]);

        if (eloStr) setElo(parseInt(eloStr, 10));
        if (winsStr) setWins(parseInt(winsStr, 10));
        if (lossesStr) setLosses(parseInt(lossesStr, 10));
        if (streakStr) {
          const parsed = JSON.parse(streakStr);
          setWinStreak(parsed.current || 0);
          setBestStreak(parsed.best || 0);
        }
        if (historyStr) {
          const parsed = JSON.parse(historyStr);
          setDuelHistory(parsed.slice(0, 20)); // Keep last 20
        }
      } catch {
        // Use defaults
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const saveDuelResult = useCallback(
    async (result: DuelResult) => {
      const oldLeague = getLeagueTier(elo);
      const newElo = Math.max(0, elo + result.eloChange);
      const newLeague = getLeagueTier(newElo);
      const newWins = result.userWon ? wins + 1 : wins;
      const newLosses = result.userWon ? losses : losses + 1;
      const newStreak = result.userWon ? winStreak + 1 : 0;
      const newBest = Math.max(bestStreak, newStreak);

      setElo(newElo);
      setWins(newWins);
      setLosses(newLosses);
      setWinStreak(newStreak);
      setBestStreak(newBest);

      const newHistory = [result, ...duelHistory].slice(0, 20);
      setDuelHistory(newHistory);

      // Check for rank up
      if (newLeague !== oldLeague && newElo > elo) {
        setRankedUp({ from: oldLeague, to: newLeague });
      }

      await Promise.all([
        AsyncStorage.setItem(ARENA_ELO_KEY, String(newElo)),
        AsyncStorage.setItem(ARENA_WINS_KEY, String(newWins)),
        AsyncStorage.setItem(ARENA_LOSSES_KEY, String(newLosses)),
        AsyncStorage.setItem(
          ARENA_STREAK_KEY,
          JSON.stringify({ current: newStreak, best: newBest }),
        ),
        AsyncStorage.setItem(ARENA_HISTORY_KEY, JSON.stringify(newHistory)),
        AsyncStorage.setItem(ARENA_LEAGUE_KEY, newLeague),
      ]);

      return { newElo, newLeague, rankUp: newLeague !== oldLeague && newElo > elo };
    },
    [elo, wins, losses, winStreak, bestStreak, duelHistory],
  );

  const clearRankUp = useCallback(() => {
    setRankedUp(null);
  }, []);

  const simulateRivalAnswer = useCallback(
    (rivalAccuracy: number, rivalAvgTime: number): { correct: boolean; time: number } => {
      const correct = Math.random() < rivalAccuracy;
      // Add some variance to response time (±30%)
      const variance = 0.7 + Math.random() * 0.6;
      const time = correct ? Math.round(rivalAvgTime * variance) : -1;
      return { correct, time };
    },
    [],
  );

  return {
    elo,
    league,
    wins,
    losses,
    winStreak,
    bestStreak,
    duelHistory,
    isLoaded,
    rankedUp,
    saveDuelResult,
    clearRankUp,
    simulateRivalAnswer,
    calculateEloChange,
    stats: {
      elo,
      league,
      wins,
      losses,
      winStreak,
      bestStreak,
      duelHistory,
    } as ArenaStats,
  };
}
