/**
 * POLLY - Mascot Constants
 * Domain-based color themes, plumage unlocks, and AI prompt templates
 */

// Domain color themes for Polly's feathers
export const POLLY_DOMAIN_COLORS = {
  science: {
    primary: '#00E5FF',    // Electric Cyan
    secondary: '#00B8D4',
    glow: '#00E5FF',
    dim: '#003840',
    accent: '#80F0FF',
  },
  finance: {
    primary: '#00E676',    // Emerald
    secondary: '#00C853',
    glow: '#00E676',
    dim: '#002E1B',
    accent: '#69F0AE',
  },
  workspace: {
    primary: '#0066CC',    // Ink Blue
    secondary: '#003366',
    glow: '#0088FF',
    dim: '#001A33',
    accent: '#448AFF',
  },
  default: {
    primary: '#00CED1',    // Default teal (like the reference image)
    secondary: '#00A3A6',
    glow: '#00E5FF',
    dim: '#003840',
    accent: '#80F0FF',
  },
} as const;

export type PollyDomain = keyof typeof POLLY_DOMAIN_COLORS;

// Polly plumage themes that can be unlocked with Lex-Points
export interface PlumageTheme {
  id: string;
  name: string;
  cost: number; // Lex-Points to unlock
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  description: string;
}

export const PLUMAGE_THEMES: PlumageTheme[] = [
  {
    id: 'default',
    name: 'Cyber Teal',
    cost: 0,
    bodyColor: '#00CED1',
    accentColor: '#00E5FF',
    eyeColor: '#1A1464',
    description: 'Classic Polly',
  },
  {
    id: 'amethyst',
    name: 'Amethyst Prism',
    cost: 50,
    bodyColor: '#9F7AEA',
    accentColor: '#B794F4',
    eyeColor: '#2D1045',
    description: 'Regal & wise',
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    cost: 100,
    bodyColor: '#FFB300',
    accentColor: '#FFD54F',
    eyeColor: '#3D2D08',
    description: 'Blazing brilliance',
  },
  {
    id: 'rose',
    name: 'Rose Quartz',
    cost: 75,
    bodyColor: '#EC407A',
    accentColor: '#F48FB1',
    eyeColor: '#3D0F1F',
    description: 'Elegant & sharp',
  },
  {
    id: 'arctic',
    name: 'Arctic Shard',
    cost: 125,
    bodyColor: '#E0F7FA',
    accentColor: '#FFFFFF',
    eyeColor: '#003366',
    description: 'Icy perfection',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Edge',
    cost: 200,
    bodyColor: '#37474F',
    accentColor: '#78909C',
    eyeColor: '#FF6B35',
    description: 'Dark & mysterious',
  },
];

// Forge tone accessories mapping
export const FORGE_TONE_ACCESSORIES: Record<string, { emoji: string; label: string }> = {
  academic: { emoji: '🎓', label: 'Mortarboard' },
  legal: { emoji: '🧐', label: 'Monocle' },
  executive: { emoji: '👔', label: 'Tie' },
  poetic: { emoji: '🪶', label: 'Quill' },
};

// Squawk-Box tip categories
export const SQUAWK_BOX_PROMPTS = {
  proTip: (words: string[]) =>
    `You are POLLY, a witty geometric parrot mascot for the vocabulary app POLYWORDS. Give a short, clever pro-tip about vocabulary learning. Reference one of these words if possible: ${words.join(', ')}. Keep it under 20 words and fun!`,
  dailyComment: (story: string) =>
    `You are POLLY, a witty parrot mascot for POLYWORDS. React to this daily micro-story with a brief, cheeky comment (under 15 words). Be playful and clever. Story: "${story}". Only return the comment, no quotes.`,
  wordPun: (word: string) =>
    `You are POLLY, a witty parrot mascot for POLYWORDS. Create a clever pun or fun etymology fact about the word "${word}". Keep it under 25 words. Be clever and memorable. Only return the pun/fact.`,
  arenaCoach: (isWinning: boolean, score: string) =>
    `You are POLLY, a parrot coaching a player in POLYWORDS. The player is ${isWinning ? 'winning' : 'losing'} with score ${score}. Give a short, encouraging battle cry (under 15 words). Be motivational!`,
  postMatch: (won: boolean, score: string, rivalName: string) =>
    `You are POLLY, a dramatic parrot commentator for POLYWORDS. The player ${won ? 'won' : 'lost'} their match vs ${rivalName} with score ${score}. Write a dramatic 1-sentence post-match quip (under 20 words).`,
  gardenNudge: (wiltingWords: string[]) =>
    `You are POLLY, a caring parrot mascot for POLYWORDS. These words are "wilting" (low retention): ${wiltingWords.join(', ')}. Write a gentle, witty nudge to review them (under 18 words). Be nurturing but fun!`,
  parrotBack: (word: string) =>
    `You are POLLY, a pronunciation coach parrot for POLYWORDS. For the word "${word}", explain how you'd "parrot back" the pronunciation with emphasis on tricky parts. Include a phonetic breakdown. Keep it under 30 words.`,
};

// AsyncStorage key
export const POLLY_STORAGE_KEY = 'polywords_polly_state';
export const POLLY_PLUMAGE_KEY = 'polywords_polly_plumage';
