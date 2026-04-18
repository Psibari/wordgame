// Pack completion milestones with shareable names and descriptions

import { PackDomain } from './packs';

export interface Milestone {
  id: string;
  packId: PackDomain;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  colorDim: string;
  shareMessage: string;
}

export const PACK_MILESTONES: Milestone[] = [
  {
    id: 'legal_eagle',
    packId: 'legal',
    title: 'Legal Eagle',
    subtitle: 'Mastered every word in the Legal Codex',
    icon: '⚖️',
    color: '#2E4199',
    colorDim: '#0D1536',
    shareMessage: 'I just earned the "Legal Eagle" title on Polyplex! Mastered every word in the Legal Codex. The court of vocabulary recognizes my authority. ⚖️📚',
  },
  {
    id: 'wall_street',
    packId: 'finance',
    title: 'Wall Street',
    subtitle: 'Mastered every word in the Gilt Ledger',
    icon: '🏦',
    color: '#10B068',
    colorDim: '#052E1B',
    shareMessage: 'I just earned the "Wall Street" title on Polyplex! Mastered every word in the Gilt Ledger. The verbal portfolio is diversified. 🏦💰',
  },
  {
    id: 'lab_rat',
    packId: 'science',
    title: 'Lab Rat',
    subtitle: 'Mastered every word in the Arcane Prism',
    icon: '🔬',
    color: '#33D6F5',
    colorDim: '#003840',
    shareMessage: 'I just earned the "Lab Rat" title on Polyplex! Mastered every word in the Arcane Prism. Science vocabulary: fully synthesized. 🔬🧪',
  },
];

export function getMilestoneForPack(packId: PackDomain): Milestone | undefined {
  return PACK_MILESTONES.find((m) => m.packId === packId);
}
