// ─── Achievement System ──────────────────────────────────────────────────────

export type AchievementId =
  | 'contronym_killer'
  | 'expert_navigator'
  | 'streak_master'
  | 'speed_demon'
  | 'first_mastery'
  | 'ten_mastered'
  | 'fifty_mastered'
  | 'hundred_mastered'
  | 'perfect_round'
  | 'daily_devotee';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  glowColor: string;
  category: 'mastery' | 'skill' | 'dedication';
}

export interface AchievementProgress {
  id: AchievementId;
  currentProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AchievementsState {
  achievements: Record<AchievementId, AchievementProgress>;
  // Tracking data for complex achievements
  expertGamesWithoutMistake: number; // consecutive expert games no mistake
  dailyPuzzleStreak: number; // consecutive days completing daily puzzle
  lastDailyPuzzleDate?: string; // last date daily was completed
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'contronym_killer',
    title: 'The Contronym Killer',
    description: 'Master 5 contronyms — words with opposite meanings',
    icon: '⚔️',
    requirement: 5,
    glowColor: '#EF476F',
    category: 'mastery',
  },
  {
    id: 'expert_navigator',
    title: 'Expert Navigator',
    description: 'Complete 10 Expert-difficulty games without a mistake',
    icon: '🧭',
    requirement: 10,
    glowColor: '#A855F7',
    category: 'skill',
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Complete the Daily Puzzle 5 days in a row',
    icon: '🔥',
    requirement: 5,
    glowColor: '#FF6B35',
    category: 'dedication',
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Finish a Timed Challenge with more than 10 seconds remaining',
    icon: '⚡',
    requirement: 1,
    glowColor: '#F0B429',
    category: 'skill',
  },
  {
    id: 'first_mastery',
    title: 'First Steps',
    description: 'Master your first word',
    icon: '✨',
    requirement: 1,
    glowColor: '#06D6A0',
    category: 'mastery',
  },
  {
    id: 'ten_mastered',
    title: 'Vocabulary Builder',
    description: 'Master 10 words',
    icon: '📚',
    requirement: 10,
    glowColor: '#7C5CFC',
    category: 'mastery',
  },
  {
    id: 'fifty_mastered',
    title: 'Lexicon Lord',
    description: 'Master 50 words',
    icon: '🏛️',
    requirement: 50,
    glowColor: '#F0B429',
    category: 'mastery',
  },
  {
    id: 'hundred_mastered',
    title: 'Word Omniscient',
    description: 'Master all 100+ words',
    icon: '👁️',
    requirement: 100,
    glowColor: '#A855F7',
    category: 'mastery',
  },
  {
    id: 'perfect_round',
    title: 'Flawless Victory',
    description: 'Complete a Multiple Choice round with 100% accuracy',
    icon: '💯',
    requirement: 1,
    glowColor: '#06D6A0',
    category: 'skill',
  },
  {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Complete 10 daily puzzles total',
    icon: '📅',
    requirement: 10,
    glowColor: '#F0B429',
    category: 'dedication',
  },
];

export function getAchievementById(id: AchievementId): AchievementDef {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}
