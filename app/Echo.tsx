import React, { useState, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { WORDS } from "../data/words";
import { useRouter } from "expo-router";

export default function Echo() {
  const router = useRouter();
  const [now, setNow] = useState(0);

  const [queue, setQueue] = useState(() =>
    WORDS.slice(0, 20).map((_, i) => ({
      index: i,
      due: 0,
      interval: 1,
    }))
  );

  const current = useMemo(
    () =>
      queue.reduce(
        (best, item) =>
          item.due <= now && item.due <= (best?.due ?? Infinity)
            ? item
            : best,
        null
      ),
    [queue, now]
  );

  function review(result) {
    if (!current) return;

    setQueue(q =>
      q.map(item => {
        if (item.index !== current.index) return item;

        let interval = item.interval;
        if (result === "easy") interval *= 2;
        if (result === "hard") interval = Math.max(1, Math.floor(interval * 0.75));
        if (result === "again") interval = 1;

        return { ...item, interval, due: now + interval };
      })
    );

    setNow(t => t + 1);
  }

  const word = current ? WORDS[current.index] : null;

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", textAlign: "center" }}>
        ECHO CANYON
      </Text>

      {word ? (
        <>
          <Text style={{ marginTop: 40, fontSize: 24, textAlign: "center" }}>
            {word.word}
          </Text>

          <Text style={{ marginTop: 12, textAlign: "center" }}>
            {word.meanings.join(" • ")}
          </Text>

          <View style={{ marginTop: 32, gap: 12 }}>
            <Pressable
              style={{ padding: 16, backgroundColor: "#16A34A", borderRadius: 12 }}
              onPress={() => review("easy")}
            >
              <Text style={{ color: "white", textAlign: "center" }}>Easy</Text>
            </Pressable>

            <Pressable
              style={{ padding: 16, backgroundColor: "#F59E0B", borderRadius: 12 }}
              onPress={() => review("hard")}
            >
              <Text style={{ color: "white", textAlign: "center" }}>Hard</Text>
            </Pressable>

            <Pressable
              style={{ padding: 16, backgroundColor: "#DC2626", borderRadius: 12 }}
              onPress={() => review("again")}
            >
              <Text style={{ color: "white", textAlign: "center" }}>Again</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={{ marginTop: 40, textAlign: "center", fontSize: 18 }}>
          Queue clear — you’ve echoed everything.
        </Text>
      )}

      <Pressable style={{ marginTop: 24 }} onPress={() => router.back()}>
        <Text style={{ textAlign: "center" }}>Back</Text>
      </Pressable>
    </View>
  );
}
