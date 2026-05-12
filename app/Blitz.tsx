import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { WORDS } from "../data/words";
import { useRouter } from "expo-router";

export default function Blitz() {
  const router = useRouter();
  const [time, setTime] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [word, setWord] = useState(null);
  const [showMeaning, setShowMeaning] = useState(false);

  function nextWord() {
    const random = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(random);
    setShowMeaning(false);
  }

  useEffect(() => {
    nextWord();
  }, []);

  useEffect(() => {
    if (time <= 0) return;
    const id = setInterval(() => setTime(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [time]);

  function handleCorrect() {
    const newStreak = streak + 1;
    setStreak(newStreak);
    setScore(s => s + 10 + newStreak * 2);
    nextWord();
  }

  function handleSkip() {
    setStreak(0);
    nextWord();
  }

  if (!word) return null;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", textAlign: "center" }}>
        BLITZ
      </Text>

      <Text style={{ textAlign: "center", marginTop: 8 }}>
        Time: {time}s • Score: {score} • Streak: {streak}
      </Text>

      {time <= 0 ? (
        <>
          <Text style={{ marginTop: 40, fontSize: 22, textAlign: "center" }}>
            Time’s up!
          </Text>

          <Pressable
            style={{ marginTop: 24, padding: 16, backgroundColor: "#4F46E5", borderRadius: 12 }}
            onPress={() => {
              setTime(60);
              setScore(0);
              setStreak(0);
              nextWord();
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Play Again</Text>
          </Pressable>

          <Pressable style={{ marginTop: 12 }} onPress={() => router.back()}>
            <Text style={{ textAlign: "center" }}>Back</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "700" }}>{word.word}</Text>

            {showMeaning && (
              <Text style={{ marginTop: 12, textAlign: "center" }}>
                {word.meanings.join(" • ")}
              </Text>
            )}
          </View>

          <View style={{ marginTop: 32, gap: 12 }}>
            <Pressable
              style={{ padding: 16, backgroundColor: "#16A34A", borderRadius: 12 }}
              onPress={handleCorrect}
            >
              <Text style={{ color: "white", textAlign: "center" }}>I knew it</Text>
            </Pressable>

            <Pressable
              style={{ padding: 16, backgroundColor: "#F97316", borderRadius: 12 }}
              onPress={() => setShowMeaning(true)}
            >
              <Text style={{ color: "white", textAlign: "center" }}>Reveal Meaning</Text>
            </Pressable>

            <Pressable
              style={{ padding: 16, backgroundColor: "#E5E7EB", borderRadius: 12 }}
              onPress={handleSkip}
            >
              <Text style={{ textAlign: "center" }}>Skip</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
