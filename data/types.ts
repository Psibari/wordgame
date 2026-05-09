export type Meaning = {
  definition: string
  example: string
}

export type WordEntry = {
  word: string
  type: "Double" | "Triple" | "Quadruple"
  meanings: Meaning[]
  theme: string
  difficulty: "Easy" | "Medium" | "Hard"
}
