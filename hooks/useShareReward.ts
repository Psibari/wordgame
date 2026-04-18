import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHARE_REWARD_KEY = 'polyplex_share_reward';
const SHARE_REWARD_AMOUNT = 50;

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useShareReward() {
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SHARE_REWARD_KEY).then((val) => {
      setLastClaimDate(val);
      setIsLoaded(true);
    });
  }, []);

  const hasClaimedToday = lastClaimDate === getTodayString();

  const claimDailyShareReward = useCallback((): number => {
    const today = getTodayString();
    if (lastClaimDate !== today) {
      setLastClaimDate(today);
      AsyncStorage.setItem(SHARE_REWARD_KEY, today);
      return SHARE_REWARD_AMOUNT;
    }
    return 0;
  }, [lastClaimDate]);

  return {
    hasClaimedToday,
    claimDailyShareReward,
    rewardAmount: SHARE_REWARD_AMOUNT,
    isLoaded,
  };
}
