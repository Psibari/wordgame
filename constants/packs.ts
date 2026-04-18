import { Colors } from './theme';

export type PackDomain = 'legal' | 'finance' | 'science';

export interface WordPack {
  id: PackDomain;
  name: string;
  subtitle: string;
  icon: string;
  auraColor: string;
  auraColorLight: string;
  auraColorDim: string;
  wordIds: string[];
  unlockCost: number; // mastered words required to unlock
}

export const WORD_PACKS: WordPack[] = [
  {
    id: 'legal',
    name: 'Legal Codex',
    subtitle: 'Words of Law & Justice',
    icon: '⚖️',
    auraColor: Colors.auraLegal,
    auraColorLight: Colors.auraLegalLight,
    auraColorDim: Colors.auraLegalDim,
    wordIds: [
      'fair', 'case', 'suit', 'charge', 'right', 'sanction',
      'bill', 'bound', 'post', 'table', 'check', 'fine',
      'tender', 'draft', 'cover', 'sole',
    ],
    unlockCost: 0, // starter pack
  },
  {
    id: 'finance',
    name: 'Gilt Ledger',
    subtitle: 'Words of Wealth & Commerce',
    icon: '🏦',
    auraColor: Colors.auraFinance,
    auraColorLight: Colors.auraFinanceLight,
    auraColorDim: Colors.auraFinanceDim,
    wordIds: [
      'bank', 'net', 'bill', 'pound', 'index', 'tip',
      'bear', 'score', 'mint', 'check', 'charge', 'note',
      'tender', 'draft', 'point', 'base',
    ],
    unlockCost: 10,
  },
  {
    id: 'science',
    name: 'Arcane Prism',
    subtitle: 'Words of Discovery & Nature',
    icon: '🔬',
    auraColor: Colors.auraScience,
    auraColorLight: Colors.auraScienceLight,
    auraColorDim: Colors.auraScienceDim,
    wordIds: [
      'light', 'current', 'base', 'plate', 'mole', 'field',
      'pupil', 'sound', 'stem', 'bolt', 'ground', 'set',
      'run', 'draw', 'well', 'spring',
    ],
    unlockCost: 20,
  },
];

export function getPackById(id: PackDomain): WordPack | undefined {
  return WORD_PACKS.find((p) => p.id === id);
}

export function getPackForWord(wordId: string): WordPack[] {
  return WORD_PACKS.filter((p) => p.wordIds.includes(wordId));
}

export const PACK_DOMAIN_COLORS: Record<PackDomain, { color: string; light: string; dim: string }> = {
  legal: { color: Colors.auraLegal, light: Colors.auraLegalLight, dim: Colors.auraLegalDim },
  finance: { color: Colors.auraFinance, light: Colors.auraFinanceLight, dim: Colors.auraFinanceDim },
  science: { color: Colors.auraScience, light: Colors.auraScienceLight, dim: Colors.auraScienceDim },
};
