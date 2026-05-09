import React, { useEffect } from "react"
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native"
import { useBlitz } from "../hooks/useBlitz"

export default function Blitz() {
  const {
    currentWord,
    options,
    timer,
    streak,
    streakSet,
    isCorrect,
    isFinished,
    start,
    handleAnswer,
  } = useBlitz()

  const fadeAnim = new Animated.Value(0)

  useEffect(() => {
    start()
  }, [])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [currentWord])

  if (!currentWord) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    )
  }

  if (isFinished) {
    return (
      <View style={styles.container}>
        <Text style={styles.finishedTitle}>STREAK SET COMPLETE</Text>
        <Text style={styles.finishedSubtitle}>🔥 {streakSet} correct answers</Text>

        <TouchableOpacity style={styles.restartButton} onPress={start}>
          <Text style={styles.restartText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerBarOuter}>
        <View style={[styles.timerBarInner, { width: `${(timer / 12) * 100}%` }]} />
      </View>

      <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
        <Text style={styles.wordText}>{currentWord.word}</Text>
        <Text style={styles.themeText}>{currentWord.theme}</Text>
      </Animated.View>

      <View style={styles.optionsContainer}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionButton,
              isCorrect !== null && opt === currentWord.meanings[0].definition && styles.correctOption,
              isCorrect !== null && opt !== currentWord.meanings[0].definition && styles.wrongOption,
            ]}
            onPress={() => handleAnswer(opt)}
            disabled={isCorrect !== null}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.streakText}>🔥 Streak: {streak}</Text>
      <Text style={styles.streakSetText}>Set Progress: {streakSet}/5</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1040",
    padding: 24,
    justifyContent: "center",
  },
  loading: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
  },
  timerBarOuter: {
    height: 10,
    backgroundColor: "#3A2A70",
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
  timerBarInner: {
    height: "100%",
    backgroundColor: "#FFD700",
  },
  wordCard: {
    backgroundColor: "#8B5CF6",
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  wordText: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  themeText: {
    fontSize: 16,
    color: "#E5D4FF",
    textAlign: "center",
    marginTop: 6,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: "#2A1F55",
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
  },
  optionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  correctOption: {
    backgroundColor: "#3CB371",
  },
  wrongOption: {
    backgroundColor: "#B22222",
  },
  streakText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
    textAlign: "center",
  },
  streakSetText: {
    color: "#C9B6FF",
    fontSize: 16,
    textAlign: "center",
  },
  finishedTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  finishedSubtitle: {
    color: "#FFD700",
    fontSize: 20,
    textAlign: "center",
    marginVertical: 20,
  },
  restartButton: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  restartText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
})
