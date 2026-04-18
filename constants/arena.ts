// ─── The Global Arena: Constants & Data ──────────────────────────────────────
// High-stakes competitive environment for POLYPLEX

// ─── Arena Color Palette ─────────────────────────────────────────────────────
export const ArenaColors = {
  // Core Arena Midnight
  bg: '#05071A',
  bgDeep: '#020412',
  bgCard: '#0A0E2A',
  bgCardAlt: '#0E1335',
  bgCardBorder: '#1A2255',

  // Championship Gold
  gold: '#FFD700',
  goldLight: '#FFE44D',
  goldDim: '#3D3200',
  goldGlow: '#FFD70060',

  // Rival Red
  rivalRed: '#FF4B4B',
  rivalRedLight: '#FF7070',
  rivalRedDim: '#3D0F0F',
  rivalRedGlow: '#FF4B4B60',

  // Glory Violet
  violet: '#8A2BE2',
  violetLight: '#A855F7',
  violetDim: '#1E0A3D',
  violetGlow: '#8A2BE260',

  // Neon accents
  neonCyan: '#00F0FF',
  neonCyanDim: '#003840',
  neonGreen: '#39FF14',
  neonGreenDim: '#0A3D04',

  // Text
  text: '#F0F4FF',
  textSub: '#8896AB',
  textMuted: '#4A5568',
  textGold: '#FFD700',

  // Utility
  border: '#1A2255',
  borderGlow: '#2A3570',
  overlay: '#05071Acc',
};

// ─── League Tier System ──────────────────────────────────────────────────────
export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'amethyst' | 'prime';

export interface LeagueTierConfig {
  id: LeagueTier;
  label: string;
  fullName: string;
  icon: string;
  color: string;
  colorLight: string;
  colorDim: string;
  glowColor: string;
  minElo: number;
  maxElo: number;
}

export const LEAGUE_TIERS: Record<LeagueTier, LeagueTierConfig> = {
  bronze: {
    id: 'bronze',
    label: 'Bronze',
    fullName: 'Bronze League',
    icon: '🥉',
    color: '#CD7F32',
    colorLight: '#D4944E',
    colorDim: '#3D2610',
    glowColor: '#CD7F3260',
    minElo: 0,
    maxElo: 999,
  },
  silver: {
    id: 'silver',
    label: 'Silver',
    fullName: 'Silver League',
    icon: '🥈',
    color: '#C0C0C0',
    colorLight: '#D0D0D0',
    colorDim: '#2A2A2A',
    glowColor: '#C0C0C060',
    minElo: 1000,
    maxElo: 1499,
  },
  gold: {
    id: 'gold',
    label: 'Gold',
    fullName: 'Gold League',
    icon: '🥇',
    color: '#FFD700',
    colorLight: '#FFE44D',
    colorDim: '#3D3200',
    glowColor: '#FFD70060',
    minElo: 1500,
    maxElo: 1999,
  },
  amethyst: {
    id: 'amethyst',
    label: 'Amethyst',
    fullName: 'Amethyst League',
    icon: '💎',
    color: '#A855F7',
    colorLight: '#C084FC',
    colorDim: '#2D1045',
    glowColor: '#A855F760',
    minElo: 2000,
    maxElo: 2499,
  },
  prime: {
    id: 'prime',
    label: 'Prime',
    fullName: 'Polyplex Prime',
    icon: '👑',
    color: '#FFD700',
    colorLight: '#FFE44D',
    colorDim: '#3D2D08',
    glowColor: '#FFD70080',
    minElo: 2500,
    maxElo: 9999,
  },
};

export const LEAGUE_ORDER: LeagueTier[] = ['bronze', 'silver', 'gold', 'amethyst', 'prime'];

export function getLeagueTier(elo: number): LeagueTier {
  if (elo >= 2500) return 'prime';
  if (elo >= 2000) return 'amethyst';
  if (elo >= 1500) return 'gold';
  if (elo >= 1000) return 'silver';
  return 'bronze';
}

export function getNextLeagueTier(current: LeagueTier): LeagueTier | null {
  const idx = LEAGUE_ORDER.indexOf(current);
  if (idx === -1 || idx >= LEAGUE_ORDER.length - 1) return null;
  return LEAGUE_ORDER[idx + 1];
}

// ─── Elo Rating Helpers ──────────────────────────────────────────────────────
export function calculateEloChange(
  userElo: number,
  rivalElo: number,
  won: boolean,
  kFactor: number = 32,
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (rivalElo - userElo) / 400));
  const actualScore = won ? 1 : 0;
  return Math.round(kFactor * (actualScore - expectedScore));
}

// ─── Rival Profiles ──────────────────────────────────────────────────────────
export interface ArenaRival {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  league: LeagueTier;
  winRate: number;
  totalDuels: number;
  speciality: string;
  personality: string;
  trashTalk: string[];
  avgResponseTime: number; // ms
  accuracy: number; // 0-1
}

export const ARENA_RIVALS: ArenaRival[] = [
  {
    id: 'rival_1',
    name: 'NeonLex',
    avatar: '⚡',
    elo: 850,
    league: 'bronze',
    winRate: 0.55,
    totalDuels: 142,
    speciality: 'Speed Demon',
    personality: 'Aggressive and fast, but makes careless mistakes under pressure.',
    trashTalk: ['Too slow!', 'Is that all you got?', 'Speed is my game!'],
    avgResponseTime: 3500,
    accuracy: 0.72,
  },
  {
    id: 'rival_2',
    name: 'VocabWraith',
    avatar: '👻',
    elo: 1050,
    league: 'silver',
    winRate: 0.62,
    totalDuels: 230,
    speciality: 'Ghost Reader',
    personality: 'Silent and calculating, rarely misses but takes their time.',
    trashTalk: ['...', 'Patience wins wars.', 'You blinked.'],
    avgResponseTime: 4200,
    accuracy: 0.88,
  },
  {
    id: 'rival_3',
    name: 'LexStorm',
    avatar: '🌪️',
    elo: 1250,
    league: 'silver',
    winRate: 0.68,
    totalDuels: 315,
    speciality: 'Definition Master',
    personality: 'Encyclopedic knowledge with a competitive edge.',
    trashTalk: ['Did you even study?', 'Knowledge is power.', 'Elementary.'],
    avgResponseTime: 3800,
    accuracy: 0.85,
  },
  {
    id: 'rival_4',
    name: 'GoldenQuill',
    avatar: '✒️',
    elo: 1550,
    league: 'gold',
    winRate: 0.74,
    totalDuels: 412,
    speciality: 'Etymology Expert',
    personality: 'Refined and precise. Knows the origin of every word.',
    trashTalk: ['That word originates from Latin.', 'Precision wins.', 'How pedestrian.'],
    avgResponseTime: 3200,
    accuracy: 0.91,
  },
  {
    id: 'rival_5',
    name: 'CrimsonBlade',
    avatar: '🗡️',
    elo: 1800,
    league: 'gold',
    winRate: 0.78,
    totalDuels: 520,
    speciality: 'Poly-Strike King',
    personality: 'Ruthless combatant who weaponizes speed.',
    trashTalk: ['Strike first, think later!', 'Feel the pressure?', 'BLITZ!'],
    avgResponseTime: 2800,
    accuracy: 0.82,
  },
  {
    id: 'rival_6',
    name: 'AmethystSage',
    avatar: '🔮',
    elo: 2100,
    league: 'amethyst',
    winRate: 0.82,
    totalDuels: 688,
    speciality: 'All-Rounder',
    personality: 'Wise and adaptable. Adjusts strategy mid-match.',
    trashTalk: ['I see your pattern.', 'Predictable.', 'Adapt or perish.'],
    avgResponseTime: 3000,
    accuracy: 0.93,
  },
  {
    id: 'rival_7',
    name: 'PrimeOracle',
    avatar: '👁️',
    elo: 2550,
    league: 'prime',
    winRate: 0.88,
    totalDuels: 999,
    speciality: 'The Unbeatable',
    personality: 'Legendary player who seems to know every answer before it appears.',
    trashTalk: ['I knew you\'d pick that.', 'The Oracle sees all.', 'Fascinating attempt.'],
    avgResponseTime: 2500,
    accuracy: 0.96,
  },
];

export function getMatchedRival(userElo: number): ArenaRival {
  // Find a rival within ±300 Elo, preferring close matches
  const sorted = [...ARENA_RIVALS].sort(
    (a, b) => Math.abs(a.elo - userElo) - Math.abs(b.elo - userElo),
  );
  // Pick from the top 3 closest with some randomness
  const pool = sorted.slice(0, 3);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Duel Words (Speed Challenge Format) ─────────────────────────────────────
export interface DuelQuestion {
  id: string;
  word: string;
  definition: string;
  options: string[];
  correctIndex: number;
}

export const DUEL_QUESTIONS: DuelQuestion[] = [
  { id: 'dq1', word: 'Buckle', definition: 'To fasten securely OR to collapse under pressure', options: ['Buckle', 'Tackle', 'Shackle', 'Rankle'], correctIndex: 0 },
  { id: 'dq2', word: 'Sanction', definition: 'To officially approve OR to impose a penalty', options: ['Fraction', 'Sanction', 'Traction', 'Function'], correctIndex: 1 },
  { id: 'dq3', word: 'Dust', definition: 'To remove fine particles OR to sprinkle fine particles', options: ['Gust', 'Trust', 'Dust', 'Rust'], correctIndex: 2 },
  { id: 'dq4', word: 'Clip', definition: 'To attach together OR to cut off a portion', options: ['Grip', 'Skip', 'Drip', 'Clip'], correctIndex: 3 },
  { id: 'dq5', word: 'Bolt', definition: 'To secure in place OR to flee suddenly', options: ['Bolt', 'Jolt', 'Molt', 'Volt'], correctIndex: 0 },
  { id: 'dq6', word: 'Screen', definition: 'To display publicly OR to hide from view', options: ['Preen', 'Screen', 'Serene', 'Sheen'], correctIndex: 1 },
  { id: 'dq7', word: 'Cleave', definition: 'To split apart OR to cling tightly together', options: ['Weave', 'Leave', 'Cleave', 'Heave'], correctIndex: 2 },
  { id: 'dq8', word: 'Trim', definition: 'To add decorations OR to cut away excess', options: ['Prim', 'Brim', 'Grim', 'Trim'], correctIndex: 3 },
  { id: 'dq9', word: 'Weather', definition: 'To endure hardship OR to wear away over time', options: ['Weather', 'Feather', 'Leather', 'Tether'], correctIndex: 0 },
  { id: 'dq10', word: 'Strike', definition: 'To hit forcefully OR to fail to hit (in bowling)', options: ['Spike', 'Strike', 'Psych', 'Hike'], correctIndex: 1 },
  { id: 'dq11', word: 'Oversight', definition: 'Watchful supervision OR an unintentional error', options: ['Foresight', 'Hindsight', 'Oversight', 'Insight'], correctIndex: 2 },
  { id: 'dq12', word: 'Temper', definition: 'To moderate or strengthen OR a state of anger', options: ['Pepper', 'Ember', 'Timber', 'Temper'], correctIndex: 3 },
  { id: 'dq13', word: 'Resign', definition: 'To quit a position OR to sign again', options: ['Resign', 'Design', 'Assign', 'Benign'], correctIndex: 0 },
  { id: 'dq14', word: 'Ravel', definition: 'To tangle threads OR to untangle threads', options: ['Travel', 'Ravel', 'Gravel', 'Navel'], correctIndex: 1 },
  { id: 'dq15', word: 'Seed', definition: 'To plant seeds OR to remove seeds from', options: ['Feed', 'Need', 'Seed', 'Heed'], correctIndex: 2 },
];

// ─── World Events ────────────────────────────────────────────────────────────
export interface WorldEvent {
  id: string;
  title: string;
  theme: string;
  description: string;
  targetPoints: number;
  currentPoints: number;
  deadline: string;
  reward: string;
  icon: string;
  accentColor: string;
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'evt_1',
    title: 'The Scientific Revolution',
    theme: 'Science & Discovery',
    description: 'A collective quest through the lexicon of science. Contribute Lex-Points to unlock the secrets of empirical vocabulary.',
    targetPoints: 50000,
    currentPoints: 32450,
    deadline: '2026-04-24',
    reward: 'Golden Microscope Badge',
    icon: '🔬',
    accentColor: '#00F0FF',
  },
  {
    id: 'evt_2',
    title: 'The Rhetorical Uprising',
    theme: 'Language & Persuasion',
    description: 'Master the art of rhetoric and persuasion. Every correct answer fuels the revolution of words.',
    targetPoints: 75000,
    currentPoints: 41200,
    deadline: '2026-05-01',
    reward: 'Violet Quill of Rhetoric',
    icon: '📜',
    accentColor: '#8A2BE2',
  },
];

// ─── World Feed Messages ─────────────────────────────────────────────────────
export interface WorldFeedMessage {
  id: string;
  text: string;
  icon: string;
  type: 'achievement' | 'league' | 'duel' | 'event' | 'milestone';
  accentColor: string;
}

export const WORLD_FEED_MESSAGES: WorldFeedMessage[] = [
  { id: 'wf1', text: 'User99 just entered Gold League!', icon: '🥇', type: 'league', accentColor: '#FFD700' },
  { id: 'wf2', text: 'CrimsonBlade won 10 duels in a row!', icon: '🔥', type: 'duel', accentColor: '#FF4B4B' },
  { id: 'wf3', text: 'VocabWraith mastered 100 words!', icon: '💯', type: 'milestone', accentColor: '#8A2BE2' },
  { id: 'wf4', text: 'The Scientific Revolution is 65% complete!', icon: '🔬', type: 'event', accentColor: '#00F0FF' },
  { id: 'wf5', text: 'NeonLex achieved a 15x combo streak!', icon: '⚡', type: 'achievement', accentColor: '#FFD700' },
  { id: 'wf6', text: 'GoldenQuill entered Amethyst League!', icon: '💎', type: 'league', accentColor: '#A855F7' },
  { id: 'wf7', text: 'LexStorm defeated PrimeOracle in a duel!', icon: '⚔️', type: 'duel', accentColor: '#FF4B4B' },
  { id: 'wf8', text: 'The Rhetorical Uprising gains momentum!', icon: '📜', type: 'event', accentColor: '#8A2BE2' },
  { id: 'wf9', text: 'AmethystSage completed the Legal Codex!', icon: '⚖️', type: 'milestone', accentColor: '#00F0FF' },
  { id: 'wf10', text: 'PolyPlayer42 earned Polyplex Prime!', icon: '👑', type: 'league', accentColor: '#FFD700' },
  { id: 'wf11', text: 'SilverTongue unlocked Arcane Prism!', icon: '🔮', type: 'achievement', accentColor: '#A855F7' },
  { id: 'wf12', text: '500 players contributed to the world event!', icon: '🌍', type: 'event', accentColor: '#39FF14' },
];

// ─── Community Tomes ─────────────────────────────────────────────────────────
export interface CommunityTome {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  description: string;
  wordCount: number;
  downloads: number;
  rating: number;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  icon: string;
  accentColor: string;
  featured: boolean;
}

export const COMMUNITY_TOMES: CommunityTome[] = [
  {
    id: 'tome_1',
    title: 'Medical Lexicon',
    author: 'Dr. Syntax',
    authorAvatar: '🩺',
    description: 'Essential medical terminology for aspiring healthcare professionals. Covers anatomy, pathology, and clinical terms.',
    wordCount: 40,
    downloads: 12500,
    rating: 4.8,
    tags: ['Medical', 'Science', 'Professional'],
    difficulty: 'Advanced',
    icon: '🏥',
    accentColor: '#FF6B6B',
    featured: true,
  },
  {
    id: 'tome_2',
    title: 'Diplomatic Discourse',
    author: 'Ambassador Verba',
    authorAvatar: '🕊️',
    description: 'The language of diplomacy, international relations, and geopolitics. Master the vocabulary that shapes world affairs.',
    wordCount: 35,
    downloads: 8200,
    rating: 4.6,
    tags: ['Politics', 'Diplomacy', 'Global'],
    difficulty: 'Intermediate',
    icon: '🌐',
    accentColor: '#4ECDC4',
    featured: true,
  },
  {
    id: 'tome_3',
    title: 'Architectural Vernacular',
    author: 'BuilderBot',
    authorAvatar: '🏗️',
    description: 'From flying buttresses to fenestration—explore the rich lexicon of architecture and design.',
    wordCount: 30,
    downloads: 5600,
    rating: 4.5,
    tags: ['Architecture', 'Design', 'Art'],
    difficulty: 'Intermediate',
    icon: '🏛️',
    accentColor: '#F7DC6F',
    featured: false,
  },
  {
    id: 'tome_4',
    title: 'Cybersecurity Cipher',
    author: 'H4ck3rL3x',
    authorAvatar: '🔐',
    description: 'Decode the language of cybersecurity. From phishing to zero-day exploits, speak like a pro.',
    wordCount: 25,
    downloads: 15800,
    rating: 4.9,
    tags: ['Tech', 'Security', 'Modern'],
    difficulty: 'Expert',
    icon: '🛡️',
    accentColor: '#00F0FF',
    featured: true,
  },
  {
    id: 'tome_5',
    title: 'Culinary Chronicles',
    author: 'ChefLingua',
    authorAvatar: '👨‍🍳',
    description: 'A delicious collection of culinary terms from Michelin kitchens to molecular gastronomy.',
    wordCount: 28,
    downloads: 9300,
    rating: 4.7,
    tags: ['Food', 'Culture', 'Lifestyle'],
    difficulty: 'Beginner',
    icon: '🍽️',
    accentColor: '#FF9F43',
    featured: false,
  },
  {
    id: 'tome_6',
    title: 'Philosophical Foundations',
    author: 'ThinkDeep',
    authorAvatar: '🤔',
    description: 'Navigate the profound vocabulary of philosophy—from epistemology to existentialism.',
    wordCount: 32,
    downloads: 7100,
    rating: 4.4,
    tags: ['Philosophy', 'Academic', 'Critical Thinking'],
    difficulty: 'Advanced',
    icon: '📖',
    accentColor: '#8A2BE2',
    featured: false,
  },
];

// ─── Elo Leaderboard Entries ─────────────────────────────────────────────────
export interface EloLeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  elo: number;
  league: LeagueTier;
  wins: number;
  losses: number;
  winStreak: number;
  isUser: boolean;
}

export function generateEloLeaderboard(userElo: number): EloLeaderboardEntry[] {
  const rivals: EloLeaderboardEntry[] = ARENA_RIVALS.map((r) => ({
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    elo: r.elo + Math.floor(Math.random() * 100 - 50),
    league: r.league,
    wins: Math.floor(r.totalDuels * r.winRate),
    losses: Math.floor(r.totalDuels * (1 - r.winRate)),
    winStreak: Math.floor(Math.random() * 8),
    isUser: false,
  }));

  const userEntry: EloLeaderboardEntry = {
    id: 'user',
    name: 'You',
    avatar: '⭐',
    elo: userElo,
    league: getLeagueTier(userElo),
    wins: 0,
    losses: 0,
    winStreak: 0,
    isUser: true,
  };

  const all = [userEntry, ...rivals];
  all.sort((a, b) => b.elo - a.elo);
  return all;
}

// ─── Duel Result ─────────────────────────────────────────────────────────────
export interface DuelRoundResult {
  questionId: string;
  word: string;
  userTime: number; // ms, -1 if wrong
  rivalTime: number; // ms, -1 if wrong
  userCorrect: boolean;
  rivalCorrect: boolean;
  polyStrike: boolean;
}

export interface DuelResult {
  rivalId: string;
  rivalName: string;
  rivalAvatar: string;
  rounds: DuelRoundResult[];
  userScore: number;
  rivalScore: number;
  userWon: boolean;
  eloChange: number;
  userElo: number;
  newLeague: LeagueTier | null;
}
