import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Colors } from "@/constants/theme";

type WordChallenge = {
  word: string;
  options: string[];
  answers: number[];
};

const CHALLENGES: WordChallenge[] = [
  {
    word: "BARK",
    options: ["Sound a dog makes", "Outer layer of a tree", "A type of fruit", "A small boat"],
    answers: [0, 1],
  },
  {
    word: "BAT",
    options: ["Flying mammal", "Sports equipment", "To hit something", "A type of shoe"],
    answers: [0, 1, 2],
  },
  {
    word: "SPRING",
    options: ["A season", "To jump", "A coil", "A type of bird"],
    answers: [0, 1, 2],
  },
  {
    word: "RING",
    options: ["Jewelry", "A phone sound", "To surround", "A type of soup"],
    answers: [0, 1, 2],
  },
  {
    word: "LIGHT",
    options: ["Opposite of heavy", "Illumination", "Pale in color", "A loud noise"],
    answers: [0, 1, 2],
  },
  {
    word: "WATCH",
    options: ["To look at", "A timepiece", "To guard", "A wild animal"],
    answers: [0, 1, 2],
  },
  {
    word: "MATCH",
    options: ["A contest", "To pair", "A fire stick", "A winter coat"],
    answers: [0, 1, 2],
  },
  {
    word: "ROCK",
    options: ["A stone", "A music genre", "To move back and forth", "A liquid"],
    answers: [0, 1, 2],
  },
  {
    word: "BANK",
    options: ["Financial institution", "River edge", "To rely on", "A musical instrument"],
    answers: [0, 1, 2],
  },
  {
    word: "CURRENT",
    options: ["Happening now", "Flow of water or electricity", "A type of currency", "A small insect"],
    answers: [0, 1],
  },
];

function arraysMatch(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export default function PlayScreen() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = CHALLENGES[index];
  const isCorrect = useMemo(
    () => arraysMatch(selected, current.answers),
    [selected, current.answers]
  );

  function toggleOption(optionIndex: number) {
    if (submitted) return;

    setSelected((currentSelection) =>
      currentSelection.includes(optionIndex)
        ? currentSelection.filter((item) => item !== optionIndex)
        : [...currentSelection, optionIndex]
    );
  }

  function submitAnswer() {
    if (selected.length === 0 || submitted) return;

    setSubmitted(true);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setScore((currentScore) => currentScore + 1 + (nextStreak >= 3 ? 1 : 0));
    } else {
      setStreak(0);
    }
  }

  function nextWord() {
    if (index + 1 >= CHALLENGES.length) {
      setFinished(true);
      return;
    }

    setIndex((currentIndex) => currentIndex + 1);
    setSelected([]);
    setSubmitted(false);
  }

  function playAgain() {
    setIndex(0);
    setSelected([]);
    setSubmitted(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <View style={styles.container}>
        <Text style={styles.kicker}>Session Complete</Text>
        <Text style={styles.title}>POLYWORDS</Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.subtitle}>Best streak: {bestStreak}</Text>
        <Text style={styles.pollyLine}>🦜 Nice work. Ready for another round?</Text>

        <Pressable style={styles.primaryButton} onPress={playAgain}>
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.gameContainer}>
      <View style={styles.topBar}>
        <Text style={styles.stat}>Score {score}</Text>
        <Text style={styles.stat}>🔥 {streak}</Text>
        <Text style={styles.stat}>{index + 1}/{CHALLENGES.length}</Text>
      </View>

      <Text style={styles.kicker}>Select every meaning that fits</Text>
      <Text style={styles.word}>{current.word}</Text>
      <Text style={styles.prompt}>One word. Multiple truths.</Text>

      <View style={styles.optionsWrap}>
        {current.options.map((option, optionIndex) => {
          const optionSelected = selected.includes(optionIndex);
          const optionCorrect = current.answers.includes(optionIndex);

          let cardStyle = styles.optionCard;
          if (optionSelected && !submitted) cardStyle = styles.optionCardSelected;
          if (submitted && optionCorrect) cardStyle = styles.optionCardCorrect;
          if (submitted && optionSelected && !optionCorrect) cardStyle = styles.optionCardWrong;

          return (
            <Pressable
              key={option}
              style={cardStyle}
              onPress={() => toggleOption(optionIndex)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted ? (
        <Pressable
          style={[styles.primaryButton, selected.length === 0 && styles.disabledButton]}
          onPress={submitAnswer}
        >
          <Text style={styles.primaryButtonText}>Submit</Text>
        </Pressable>
      ) : (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>{isCorrect ? "🦜 Word Up!" : "🦜 Nice try!"}</Text>
          <Text style={styles.feedbackText}>
            {isCorrect
              ? "You found every meaning."
              : "The full set is highlighted above."}
          </Text>

          <Pressable style={styles.primaryButton} onPress={nextWord}>
            <Text style={styles.primaryButtonText}>
              {index + 1 >= CHALLENGES.length ? "Finish" : "Next Word"}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  gameContainer: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: 24,
    paddingTop: 64,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  stat: {
    color: Colors.textSub,
    fontSize: 15,
    fontWeight: "700",
  },
  kicker: {
    color: Colors.gold,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: Colors.gold,
    fontSize: 42,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  word: {
    color: Colors.text,
    fontSize: 52,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  prompt: {
    color: Colors.textSub,
    fontSize: 17,
    marginTop: 8,
    textAlign: "center",
  },
  optionsWrap: {
    marginTop: 36,
    gap: 14,
  },
  optionCard: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  optionCardSelected: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentLight,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  optionCardCorrect: {
    backgroundColor: Colors.successDim,
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  optionCardWrong: {
    backgroundColor: Colors.errorDim,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  optionText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    marginTop: 24,
    paddingVertical: 18,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: Colors.bg,
    fontSize: 19,
    fontWeight: "900",
  },
  feedbackCard: {
    backgroundColor: Colors.bgCardAlt,
    borderColor: Colors.borderLight,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 24,
    padding: 20,
  },
  feedbackTitle: {
    color: Colors.gold,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackText: {
    color: Colors.textSub,
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  scoreText: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 28,
  },
  subtitle: {
    color: Colors.textSub,
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  pollyLine: {
    color: Colors.text,
    fontSize: 18,
    lineHeight: 26,
    marginTop: 28,
    textAlign: "center",
  },
});
