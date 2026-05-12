import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { WORDS } from "../data/words";
import { useRouter } from "expo-router";

export default function Scholar() {
  const router = useRouter();
  const [word, setWord] = useState(
    WORDS[Math.floor(Math.random() * WORDS.length)]
  );
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  function check() {
    const joined = word.meanings.join(" ").toLowerCase();
    const a = answer.toLowerCase().trim();

    if (!a) return;

    if (joined.includes(a)) setFeedback("correct");
    else if (a.split(" ").some(t => joined.includes(t))) setFeedback("close");
    else setFeedback("wrong");
  }

  function next() {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setAnswer("");
    setFeedback(null);
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", textAlign: "center" }}>
        SCHOLAR’S CAVE
      </Text>

      <Text style={{ marginTop: 40, fontSize: 24, textAlign: "center" }}>
        {word.word}
      </Text>

      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Describe one meaning..."
        style={{
          marginTop: 24,
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 12,
          padding: 12,
          minHeight: 80,
        }}
        multiline
      />

      {feedback && (
        <Text
          style={{
            marginTop: 16,
            textAlign: "center",
            color:
              feedback === "correct"
                ? "#16A34A"
                : feedback === "close"
                ? "#F59E0B"
                : "#DC2626",
          }}
        >
          {feedback === "correct" && "Correct!"}
          {feedback === "close" && "Close — you're circling it."}
          {feedback === "wrong" &&
            `Not quite. Meanings: ${word.meanings.join(" • ")}`}
        </Text>
      )}

      <View style={{ marginTop: 24, gap: 12 }}>
        <Pressable
          style={{ padding: 16, backgroundColor: "#4F46E5", borderRadius: 12 }}
          onPress={check}
        >
          <Text style={{ color: "white", textAlign: "center" }}>Check</Text>
        </Pressable>

        <Pressable
          style={{ padding: 16, backgroundColor: "#E5E7EB", borderRadius: 12 }}
          onPress={next}
        >
          <Text style={{ textAlign: "center" }}>Next Word</Text>
        </Pressable>

        <Pressable style={{ padding: 12 }} onPress={() => router.back()}>
          <Text style={{ textAlign: "center" }}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
