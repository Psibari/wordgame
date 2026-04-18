// Ghost players for the local leaderboard
// These AI personas simulate a competitive environment

export interface GhostPlayer {
  id: string;
  name: string;
  xp: number;
  level: number;
  wordsMastered: number;
  tier: 'bronze' | 'silver' | 'gold' | 'amethyst';
  avatar: string;
  isGhost: true;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5800, 7800];

function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

function getTierFromWords(words: number): GhostPlayer['tier'] {
  if (words >= 75) return 'amethyst';
  if (words >= 40) return 'gold';
  if (words >= 15) return 'silver';
  return 'bronze';
}

const BASE_GHOSTS: {
  name: string;
  baseXP: number;
  avatar: string;
  baseWords: number;
}[] = [
  { name: 'VocabQueen', baseXP: 8100, avatar: '👸', baseWords: 78 },
  { name: 'LexMaster99', baseXP: 6200, avatar: '🧙', baseWords: 52 },
  { name: 'GrammarGhost', baseXP: 5600, avatar: '👻', baseWords: 48 },
  { name: 'WordNinja_X', baseXP: 4800, avatar: '🥷', baseWords: 44 },
  { name: 'EtymoLogic', baseXP: 4100, avatar: '🔬', baseWords: 41 },
  { name: 'PolyProf', baseXP: 3400, avatar: '🎓', baseWords: 32 },
  { name: 'SilverTongue', baseXP: 2200, avatar: '🗣️', baseWords: 22 },
  { name: 'PhrasePhreak', baseXP: 1500, avatar: '🤓', baseWords: 16 },
  { name: 'TheDefiner', baseXP: 800, avatar: '📝', baseWords: 8 },
  { name: 'SyntaxSage', baseXP: 300, avatar: '🌿', baseWords: 3 },
];

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

export function getGhostPlayers(): GhostPlayer[] {
  const weekNum = getWeekNumber();
  return BASE_GHOSTS.map((ghost, i) => {
    // Deterministic weekly variation using a hash-like function
    const seed = (weekNum * 31 + i * 17 + 42) % 300;
    const variation = seed - 150; // range: -150 to +150
    const xp = Math.max(50, ghost.baseXP + variation);
    const wordVariation = Math.floor(variation / 50);
    const words = Math.max(1, ghost.baseWords + wordVariation);
    const level = getLevelFromXP(xp);
    const tier = getTierFromWords(words);

    return {
      id: `ghost_${i}`,
      name: ghost.name,
      xp,
      level,
      wordsMastered: words,
      tier,
      avatar: ghost.avatar,
      isGhost: true as const,
    };
  });
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  xp: number;
  level: number;
  wordsMastered: number;
  tier: 'bronze' | 'silver' | 'gold' | 'amethyst';
  avatar: string;
  isGhost: boolean;
  rank: number;
}

export function buildLeaderboard(
  userXP: number,
  userLevel: number,
  userWords: number,
  userTier: 'bronze' | 'silver' | 'gold' | 'amethyst',
): LeaderboardEntry[] {
  const ghosts = getGhostPlayers();
  const userEntry: LeaderboardEntry = {
    id: 'user',
    name: 'You',
    xp: userXP,
    level: userLevel,
    wordsMastered: userWords,
    tier: userTier,
    avatar: '⭐',
    isGhost: false,
    rank: 0,
  };

  const all: LeaderboardEntry[] = [
    userEntry,
    ...ghosts.map((g) => ({ ...g, rank: 0 })),
  ];

  // Sort by XP descending
  all.sort((a, b) => b.xp - a.xp);

  // Assign ranks
  all.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return all;
}
