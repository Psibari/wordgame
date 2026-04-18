import { WORD_POOL, WordEntry, shuffleArray, Difficulty } from '@/constants/words';
import { WORD_PACKS, PackDomain } from '@/constants/packs';

// ─── Dynamic Difficulty Scaling ──────────────────────────────────────────────
// As the player's level increases, harder words appear more frequently.

interface DifficultyWeights {
  Easy: number;
  Medium: number;
  Hard: number;
  Expert: number;
}

/**
 * Returns weighted difficulty distribution based on player level.
 * Lower levels see mostly Easy/Medium, higher levels see more Hard/Expert.
 */
export function getDifficultyWeights(playerLevel: number): DifficultyWeights {
  if (playerLevel <= 2) {
    return { Easy: 0.50, Medium: 0.35, Hard: 0.12, Expert: 0.03 };
  }
  if (playerLevel <= 4) {
    return { Easy: 0.35, Medium: 0.35, Hard: 0.22, Expert: 0.08 };
  }
  if (playerLevel <= 6) {
    return { Easy: 0.20, Medium: 0.30, Hard: 0.35, Expert: 0.15 };
  }
  if (playerLevel <= 8) {
    return { Easy: 0.12, Medium: 0.25, Hard: 0.38, Expert: 0.25 };
  }
  // Level 9+
  return { Easy: 0.08, Medium: 0.17, Hard: 0.40, Expert: 0.35 };
}

/**
 * Builds a weighted, shuffled word queue based on player level.
 * Words are selected according to difficulty weights.
 */
export function buildScaledWordQueue(playerLevel: number, count?: number): WordEntry[] {
  const weights = getDifficultyWeights(playerLevel);
  const poolByDifficulty: Record<Difficulty, WordEntry[]> = {
    Easy: shuffleArray(WORD_POOL.filter((w) => w.difficulty === 'Easy')),
    Medium: shuffleArray(WORD_POOL.filter((w) => w.difficulty === 'Medium')),
    Hard: shuffleArray(WORD_POOL.filter((w) => w.difficulty === 'Hard')),
    Expert: shuffleArray(WORD_POOL.filter((w) => w.difficulty === 'Expert')),
  };

  const targetCount = count ?? WORD_POOL.length;
  const result: WordEntry[] = [];
  const usedIds = new Set<string>();

  // Add words proportionally
  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
  for (const diff of difficulties) {
    const targetForDiff = Math.round(targetCount * weights[diff]);
    const pool = poolByDifficulty[diff];
    for (let i = 0; i < Math.min(targetForDiff, pool.length); i++) {
      if (!usedIds.has(pool[i].id)) {
        result.push(pool[i]);
        usedIds.add(pool[i].id);
      }
    }
  }

  // Fill remaining from any pool
  if (result.length < targetCount) {
    const remaining = shuffleArray(WORD_POOL.filter((w) => !usedIds.has(w.id)));
    for (const w of remaining) {
      if (result.length >= targetCount) break;
      result.push(w);
    }
  }

  return shuffleArray(result);
}

/**
 * Builds a word queue filtered to a specific domain pack.
 * Uses the same difficulty scaling but only from words in the pack.
 */
export function buildPackWordQueue(playerLevel: number, domain: PackDomain): WordEntry[] {
  const pack = WORD_PACKS.find((p) => p.id === domain);
  if (!pack) return buildScaledWordQueue(playerLevel);

  const packWords = WORD_POOL.filter((w) => pack.wordIds.includes(w.id));
  if (packWords.length === 0) return buildScaledWordQueue(playerLevel);

  return shuffleArray(packWords);
}

/**
 * Distractor Logic: At higher levels, MCQ distractors are semantically closer.
 * This selects decoys from words in the same or adjacent categories.
 */
export function getSmartDistractors(
  correctWord: WordEntry,
  playerLevel: number,
): string[] {
  // Below level 4, use the word's built-in decoys (which are random/easy)
  if (playerLevel < 4) {
    return correctWord.mcqDecoys.slice(0, 3);
  }

  // At higher levels, use other real words from the pool as distractors
  // to make it harder to distinguish
  const sameCategory = WORD_POOL.filter(
    (w) => w.id !== correctWord.id && w.category === correctWord.category,
  );
  const sameDifficulty = WORD_POOL.filter(
    (w) => w.id !== correctWord.id && w.difficulty === correctWord.difficulty,
  );
  const allOthers = WORD_POOL.filter((w) => w.id !== correctWord.id);

  let candidates: WordEntry[] = [];

  if (playerLevel >= 7) {
    // Highest difficulty: prioritize same category words
    candidates = [...sameCategory, ...sameDifficulty, ...allOthers];
  } else {
    // Mid difficulty: mix of same difficulty and others
    candidates = [...sameDifficulty, ...allOthers];
  }

  // Deduplicate and pick 3
  const seen = new Set<string>();
  const distactors: string[] = [];

  for (const c of candidates) {
    if (!seen.has(c.word) && c.word !== correctWord.word) {
      seen.add(c.word);
      distactors.push(c.word);
      if (distactors.length >= 3) break;
    }
  }

  // Fall back to built-in decoys if needed
  while (distactors.length < 3) {
    const fallback = correctWord.mcqDecoys[distactors.length];
    if (fallback) distactors.push(fallback);
    else distactors.push('Unknown');
  }

  return distactors;
}
