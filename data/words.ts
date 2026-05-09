import { WordEntry } from "./types"

export const WORDS: WordEntry[] = [
  {
    word: "Bank",
    type: "Quadruple",
    meanings: [
      { definition: "A financial institution", example: "She deposited money at the bank." },
      { definition: "The side of a river", example: "They sat on the riverbank." },
      { definition: "To tilt an aircraft", example: "The pilot banked sharply." },
      { definition: "A reserve supply", example: "The hospital has a blood bank." }
    ],
    theme: "Abstract Ideas",
    difficulty: "Medium",
  },
  {
    word: "Bat",
    type: "Double",
    meanings: [
      { definition: "A flying mammal", example: "A bat flew out of the cave." },
      { definition: "Sports equipment for hitting a ball", example: "He swung the bat and hit a home run." }
    ],
    theme: "Animals",
    difficulty: "Easy",
  },
  {
    word: "Light",
    type: "Quadruple",
    meanings: [
      { definition: "Illumination", example: "Turn on the light." },
      { definition: "Not heavy", example: "The bag was light." },
      { definition: "To ignite", example: "She lit the candle." },
      { definition: "Pale in color", example: "A light blue dress." }
    ],
    theme: "Objects",
    difficulty: "Easy",
  },
]
