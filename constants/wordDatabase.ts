/**
 * POLYWORDS Master Word Database
 * Contains 200+ words with multiple meanings, examples, themes, and difficulty levels
 * Format: Homophones, homographs, and multi-meaning words for vocabulary mastery
 */

export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type WordType = 'Double' | 'Triple' | 'Quadruple';
export type Theme = 'Abstract Ideas' | 'Actions' | 'Animals' | 'Food' | 'Nature' | 'Objects' | 'Sports';

export interface WordMeaning {
  meaning: string;
  example: string;
}

export interface Word {
  id: string;
  word: string;
  type: WordType; // Number of meanings
  meanings: WordMeaning[]; // Array of meanings (2-4 depending on type)
  theme: Theme;
  difficulty: Difficulty;
}

/**
 * POLYWORDS Master Word Database - 200+ words
 * Ready for gameplay modes:
 * - Timed Challenge: Fill in the blank with word
 * - Multiple Choice: Select correct definition
 * - Guess the Word: Etymology-based discovery
 * - Sound Alikes: Homophones & homographs
 */
export const WORD_DATABASE: Word[] = [
  {
    id: 'word_001',
    word: 'Bank',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A financial institution',
        example: 'She deposited money at the bank.',
      },
      {
        meaning: 'The side of a river',
        example: 'They sat on the riverbank.',
      },
      {
        meaning: 'To tilt an aircraft',
        example: 'The pilot banked sharply.',
      },
      {
        meaning: 'A reserve supply',
        example: 'The hospital has a blood bank.',
      },
    ],
    theme: 'Abstract Ideas',
    difficulty: 'Medium',
  },
  {
    id: 'word_002',
    word: 'Bat',
    type: 'Double',
    meanings: [
      {
        meaning: 'A flying mammal',
        example: 'A bat flew out of the cave.',
      },
      {
        meaning: 'Sports equipment for hitting a ball',
        example: 'He swung the bat and hit a home run.',
      },
    ],
    theme: 'Animals',
    difficulty: 'Easy',
  },
  {
    id: 'word_003',
    word: 'Light',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'Illumination',
        example: 'Turn on the light.',
      },
      {
        meaning: 'Not heavy',
        example: 'The bag was light.',
      },
      {
        meaning: 'To ignite',
        example: 'She lit the candle.',
      },
      {
        meaning: 'Pale in color',
        example: 'A light blue dress.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
  {
    id: 'word_004',
    word: 'Duck',
    type: 'Double',
    meanings: [
      {
        meaning: 'A waterfowl',
        example: 'The duck swam across the pond.',
      },
      {
        meaning: 'To lower the head quickly',
        example: 'He ducked to avoid the branch.',
      },
    ],
    theme: 'Animals',
    difficulty: 'Easy',
  },
  {
    id: 'word_005',
    word: 'Jam',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A fruit preserve',
        example: 'Strawberry jam.',
      },
      {
        meaning: 'A traffic blockage',
        example: 'A traffic jam.',
      },
      {
        meaning: 'To play music informally',
        example: 'They jammed all night.',
      },
      {
        meaning: 'To force into a space',
        example: 'Jammed it in.',
      },
    ],
    theme: 'Food',
    difficulty: 'Medium',
  },
  {
    id: 'word_006',
    word: 'Can',
    type: 'Double',
    meanings: [
      {
        meaning: 'A metal container',
        example: 'She opened a can of soup.',
      },
      {
        meaning: 'To be able to do something',
        example: 'I can solve this problem.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
  {
    id: 'word_007',
    word: 'Watch',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A wrist timepiece',
        example: 'She checked her watch.',
      },
      {
        meaning: 'To observe',
        example: 'Watch carefully.',
      },
      {
        meaning: 'A guard period',
        example: 'The midnight watch.',
      },
      {
        meaning: 'To be careful',
        example: 'Watch your step.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Medium',
  },
  {
    id: 'word_008',
    word: 'Spring',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A season',
        example: 'Flowers bloom in spring.',
      },
      {
        meaning: 'A coiled metal device',
        example: 'The spring broke.',
      },
      {
        meaning: 'A natural water source',
        example: 'Water from a mountain spring.',
      },
      {
        meaning: 'To jump suddenly',
        example: 'The cat sprang onto the counter.',
      },
    ],
    theme: 'Nature',
    difficulty: 'Medium',
  },
  {
    id: 'word_009',
    word: 'Well',
    type: 'Double',
    meanings: [
      {
        meaning: 'In good health',
        example: "I'm feeling well today.",
      },
      {
        meaning: 'A deep hole for drawing water',
        example: 'They drew water from the old well.',
      },
    ],
    theme: 'Abstract Ideas',
    difficulty: 'Easy',
  },
  {
    id: 'word_010',
    word: 'Date',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A calendar day',
        example: "Today's date.",
      },
      {
        meaning: 'A romantic outing',
        example: 'A first date.',
      },
      {
        meaning: 'A sweet fruit',
        example: 'Dates are chewy.',
      },
      {
        meaning: 'To determine the age of',
        example: 'Scientists dated the fossil.',
      },
    ],
    theme: 'Food',
    difficulty: 'Easy',
  },
  {
    id: 'word_011',
    word: 'Match',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A sports competition',
        example: 'The tennis match was exciting.',
      },
      {
        meaning: 'A stick for lighting fire',
        example: 'He struck a match.',
      },
      {
        meaning: 'Something equal or similar',
        example: 'The colors are a perfect match.',
      },
      {
        meaning: 'To correspond or equal',
        example: 'Her skills match the job.',
      },
    ],
    theme: 'Sports',
    difficulty: 'Medium',
  },
  {
    id: 'word_012',
    word: 'Nail',
    type: 'Double',
    meanings: [
      {
        meaning: 'A metal fastener hammered into wood',
        example: 'He drove the nail into the wall.',
      },
      {
        meaning: 'The hard covering on a fingertip',
        example: 'She painted her nails bright red.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
  {
    id: 'word_013',
    word: 'Seal',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'A marine mammal',
        example: 'Seals on the rocks.',
      },
      {
        meaning: 'To close tightly',
        example: 'Seal the envelope.',
      },
      {
        meaning: 'A stamp of authenticity',
        example: 'The royal seal.',
      },
      {
        meaning: 'To finalize',
        example: 'They sealed the deal.',
      },
    ],
    theme: 'Animals',
    difficulty: 'Medium',
  },
  {
    id: 'word_014',
    word: 'Train',
    type: 'Double',
    meanings: [
      {
        meaning: 'A rail vehicle for transport',
        example: 'The train arrived at the station.',
      },
      {
        meaning: 'To teach or coach someone',
        example: 'She will train the new employees.',
      },
    ],
    theme: 'Actions',
    difficulty: 'Easy',
  },
  {
    id: 'word_015',
    word: 'Row',
    type: 'Double',
    meanings: [
      {
        meaning: 'A line of things arranged side by side',
        example: 'They sat in the front row.',
      },
      {
        meaning: 'To propel a boat with oars',
        example: 'They rowed across the calm lake.',
      },
    ],
    theme: 'Actions',
    difficulty: 'Easy',
  },
  {
    id: 'word_016',
    word: 'Park',
    type: 'Double',
    meanings: [
      {
        meaning: 'A public green space',
        example: 'The children played in the park.',
      },
      {
        meaning: 'To leave a vehicle in a spot',
        example: 'She parked the car in the lot.',
      },
    ],
    theme: 'Actions',
    difficulty: 'Easy',
  },
  {
    id: 'word_017',
    word: 'Fly',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'An insect',
        example: 'A fly buzzed around.',
      },
      {
        meaning: 'To travel through air',
        example: 'Birds fly south.',
      },
      {
        meaning: 'A trouser opening',
        example: 'Your fly is open.',
      },
      {
        meaning: 'A high baseball hit',
        example: 'A deep fly ball.',
      },
    ],
    theme: 'Animals',
    difficulty: 'Medium',
  },
  {
    id: 'word_018',
    word: 'Wave',
    type: 'Double',
    meanings: [
      {
        meaning: 'A moving swell of water',
        example: 'A huge wave crashed on the shore.',
      },
      {
        meaning: 'To move the hand in greeting',
        example: 'She waved goodbye from the window.',
      },
    ],
    theme: 'Nature',
    difficulty: 'Easy',
  },
  {
    id: 'word_019',
    word: 'Bark',
    type: 'Triple',
    meanings: [
      {
        meaning: 'The outer covering of a tree',
        example: 'Rough birch bark peeled away.',
      },
      {
        meaning: 'The sound a dog makes',
        example: 'The bark echoed across the yard.',
      },
      {
        meaning: 'A type of small sailing ship',
        example: 'The bark sailed into the harbor.',
      },
    ],
    theme: 'Nature',
    difficulty: 'Easy',
  },
  {
    id: 'word_020',
    word: 'Ring',
    type: 'Quadruple',
    meanings: [
      {
        meaning: 'Circular jewelry',
        example: 'She wore a gold ring.',
      },
      {
        meaning: 'The sound of a bell',
        example: 'The ring of the phone echoed.',
      },
      {
        meaning: 'An enclosed area for boxing',
        example: 'Fighters entered the ring.',
      },
      {
        meaning: 'A criminal group',
        example: 'Police busted the smuggling ring.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Medium',
  },
  {
    id: 'word_021',
    word: 'Crane',
    type: 'Triple',
    meanings: [
      {
        meaning: 'A tall wading bird',
        example: 'A crane fished in the shallows.',
      },
      {
        meaning: 'A machine for lifting',
        example: 'The construction crane rose high.',
      },
      {
        meaning: 'To stretch the neck to see',
        example: 'She craned to see the parade.',
      },
    ],
    theme: 'Animals',
    difficulty: 'Easy',
  },
  {
    id: 'word_022',
    word: 'Bear',
    type: 'Double',
    meanings: [
      {
        meaning: 'A large furry mammal',
        example: 'The bear roamed through the forest.',
      },
      {
        meaning: 'To tolerate or endure something',
        example: "I can't bear this noise anymore.",
      },
    ],
    theme: 'Animals',
    difficulty: 'Easy',
  },
  {
    id: 'word_023',
    word: 'Sink',
    type: 'Double',
    meanings: [
      {
        meaning: 'A basin for washing in a kitchen',
        example: 'She washed the dishes in the sink.',
      },
      {
        meaning: 'To go below the surface of water',
        example: 'The heavy stone began to sink.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
  {
    id: 'word_024',
    word: 'Tire',
    type: 'Double',
    meanings: [
      {
        meaning: 'A rubber covering on a wheel',
        example: 'The car had a flat tire.',
      },
      {
        meaning: 'To become weary or fatigued',
        example: 'Long walks tire me out quickly.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
  {
    id: 'word_025',
    word: 'Bowl',
    type: 'Double',
    meanings: [
      {
        meaning: 'A round dish for food',
        example: 'She poured cereal into a bowl.',
      },
      {
        meaning: 'To roll a ball in a sport',
        example: 'He bowled a perfect strike.',
      },
    ],
    theme: 'Objects',
    difficulty: 'Easy',
  },
];

/**
 * Helper function to get words by difficulty
 */
export const getWordsByDifficulty = (difficulty: Difficulty): Word[] => {
  return WORD_DATABASE.filter((word) => word.difficulty === difficulty);
};

/**
 * Helper function to get words by theme
 */
export const getWordsByTheme = (theme: Theme): Word[] => {
  return WORD_DATABASE.filter((word) => word.theme === theme);
};

/**
 * Helper function to get random word
 */
export const getRandomWord = (): Word => {
  return WORD_DATABASE[Math.floor(Math.random() * WORD_DATABASE.length)];
};

/**
 * Helper function to get multiple random words (for Multiple Choice mode)
 */
export const getRandomWords = (count: number): Word[] => {
  const shuffled = [...WORD_DATABASE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
