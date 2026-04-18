// ─── Word Mastery System ─────────────────────────────────────────────────────
// Status: Locked → Discovered → Mastered
// Mastery requires 3 correct answers across any game mode

export type WordStatus = 'locked' | 'discovered' | 'mastered';

export type MasteryTier = 'bronze' | 'silver' | 'gold' | 'amethyst';

export interface WordMasteryData {
  wordId: string;
  status: WordStatus;
  correctCount: number; // 0-3, mastered at 3
  firstSeenAt?: number; // timestamp
  masteredAt?: number; // timestamp
}

export interface MasteryState {
  words: Record<string, WordMasteryData>;
  totalDiscovered: number;
  totalMastered: number;
}

// ─── Mastery Tier Thresholds ─────────────────────────────────────────────────
export function getMasteryTier(totalMastered: number): MasteryTier {
  if (totalMastered >= 75) return 'amethyst';
  if (totalMastered >= 40) return 'gold';
  if (totalMastered >= 15) return 'silver';
  return 'bronze';
}

export const MASTERY_TIER_CONFIG: Record<MasteryTier, {
  label: string;
  color: string;
  colorDim: string;
  icon: string;
  minMastered: number;
}> = {
  bronze: {
    label: 'Bronze',
    color: '#CD7F32',
    colorDim: '#3D2610',
    icon: '🥉',
    minMastered: 0,
  },
  silver: {
    label: 'Silver',
    color: '#C0C0C0',
    colorDim: '#2A2A2A',
    icon: '🥈',
    minMastered: 15,
  },
  gold: {
    label: 'Gold',
    color: '#F0B429',
    colorDim: '#3D2D08',
    icon: '🥇',
    minMastered: 40,
  },
  amethyst: {
    label: 'Amethyst',
    color: '#A855F7',
    colorDim: '#2D1045',
    icon: '💎',
    minMastered: 75,
  },
};

// ─── Title System (every 5 levels) ──────────────────────────────────────────
export const PLAYER_TITLES: { level: number; title: string; icon: string }[] = [
  { level: 1, title: 'Novice', icon: '📖' },
  { level: 5, title: 'Word Seeker', icon: '🔍' },
  { level: 10, title: 'Polyglot', icon: '🌍' },
  { level: 15, title: 'Lexicographer', icon: '📚' },
  { level: 20, title: 'Etymologist', icon: '🧬' },
  { level: 25, title: 'Wordsmith', icon: '⚒️' },
  { level: 30, title: 'Lexical Legend', icon: '👑' },
];

export function getPlayerTitle(level: number): { title: string; icon: string } {
  let current = PLAYER_TITLES[0];
  for (const entry of PLAYER_TITLES) {
    if (level >= entry.level) current = entry;
    else break;
  }
  return current;
}

// ─── Contronyms (words that can mean opposite things) ────────────────────────
// These are needed for the "Contronym Killer" achievement
export const CONTRONYM_IDS = [
  'buckle', // to fasten / to collapse
  'dust',   // to remove dust / to sprinkle dust
  'sanction', // to approve / to penalize
  'clip',   // to attach / to cut
  'bolt',   // to secure / to flee
  'screen', // to show / to conceal
  'cleave', // to split / to cling
  'trim',   // to add decorations / to cut away
  'weather', // to endure / to erode
  'strike', // to hit / to miss (in bowling)
];
