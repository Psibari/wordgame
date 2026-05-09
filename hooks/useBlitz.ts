import { useState, useEffect, useCallback } from "react"
import { WORDS } from "../data/words"
import type { WordEntry } from "../data/types"

type BlitzState = {
  currentWord: WordEntry | null
  options: string[]
  correctAnswer: string
  streak: number
  streakSet: number
  timer: number
  isCorrect: boolean | null
  isFinished: boolean
}

const ROUND_TIME = 12
const STREAK_SET_SIZE = 5

export function useBlitz() {
  const [state, setState] = useState<BlitzState>({
    currentWord: null,
    options: [],
    correctAnswer: "",
    streak: 0,
    streakSet: 0,
    timer: ROUND_TIME,
    isCorrect: null,
    isFinished: false,
  })

  const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5)

  const loadNewWord = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)]
    const correct = word.meanings[0].definition

    const decoys = shuffle(
      WORDS.filter(w => w.word !== word.word)
        .slice(0, 3)
        .map(w => w.meanings[0].definition)
    )

    const options = shuffle([correct, ...decoys])

    setState(prev => ({
      ...prev,
      currentWord: word,
      correctAnswer: correct,
      options,
      timer: ROUND_TIME,
      isCorrect: null,
    }))
  }, [])

  useEffect(() => {
    if (state.isFinished || state.isCorrect !== null) return

    if (state.timer <= 0) {
      handleAnswer(null)
      return
    }

    const interval = setInterval(() => {
      setState(prev => ({ ...prev, timer: prev.timer - 1 }))
    }, 1000)

    return () => clearInterval(interval)
  }, [state.timer, state.isCorrect, state.isFinished])

  const handleAnswer = (selected: string | null) => {
    const isCorrect = selected === state.correctAnswer

    setState(prev => ({
      ...prev,
      isCorrect,
      streak: isCorrect ? prev.streak + 1 : 0,
      streakSet: isCorrect ? prev.streakSet + 1 : prev.streakSet,
    }))

    setTimeout(() => {
      setState(prev => {
        if (prev.streakSet >= STREAK_SET_SIZE) {
          return { ...prev, isFinished: true }
        }
        return prev
      })

      if (!state.isFinished) loadNewWord()
    }, 900)
  }

  const start = () => {
    setState({
      currentWord: null,
      options: [],
      correctAnswer: "",
      streak: 0,
      streakSet: 0,
      timer: ROUND_TIME,
      isCorrect: null,
      isFinished: false,
    })
    loadNewWord()
  }

  return {
    ...state,
    start,
    handleAnswer,
  }
}
