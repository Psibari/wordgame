import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type EchoItem = {
  id: string;
  word: string;
  meaning: string;
  decoys: string[];
};

const MOCK_ITEMS: EchoItem[] = [
  {
    id: "1",
    word: "temperate",
    meaning: "showing moderation or self‑restraint",
    decoys: ["extremely hot", "easily angered", "full of energy"]
  },
  {
    id: "2",
    word: "opaque",
    meaning: "not able to be seen through; not transparent",
    decoys: ["easy to understand", "extremely bright", "full of holes"]
  },
  {
    id: "3",
    word: "resolute",
    meaning: "admirably purposeful and determined",
    decoys: ["easily confused", "relaxed and casual", "uncertain or hesitant"]
  }
  // TODO: replace with real dataset
];

type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function EchoCanyon() {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [quip, setQuip] = useState<string | null>(null);

  const item = MOCK_ITEMS[index % MOCK_ITEMS.length];

  const choices: Choice[] = useMemo(() => {
    const all = [
      { id: "correct", text: item.meaning, isCorrect: true },
      ...item.decoys.map((d, i) => ({
        id: `decoy-${i}`,
        text: d,
        isCorrect: false
      }))
    ];
    return shuffle(all);
  }, [item]);

  const handleSelect = (choice: Choice) => {
    if (locked) return;
    setSelectedId(choice.id);
    setLocked(true);

    if (choice.isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setQuip(
        newStreak >= 3
          ? "Your memory echoes are getting sharp."
          : "Nice recall. The canyon approves."
      );
    } else {
      setStreak(0);
      setQuip("That echo didn’t match. Listen again.");
    }
  };

  const handleNext = () => {
    setSelectedId(null);
    setLocked(false);
    setQuip(null);
    setIndex((i) => i + 1);
  };

  return (
    <div
      style={{
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>ECHO CANYON</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Memory Mode</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>Streak</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{streak}</div>
        </div>
      </div>

      {/* Polly quip */}
      <AnimatePresence>
        {quip && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              marginBottom: 12,
              background: "#FACC15",
              color: "#1F2933",
              padding: "8px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              display: "inline-block"
            }}
          >
            {quip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Echo card */}
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
        style={{
          background: "#2D1B69",
          borderRadius: 18,
          padding: 20,
          marginBottom: 16,
          boxShadow: "0 12px 30px rgba(0,0,0,0.35)"
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#C4B5FD",
            marginBottom: 6
          }}
        >
          Echo this meaning:
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.4
          }}
        >
          {item.meaning}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#A5B4FC",
            marginTop: 12
          }}
        >
          Tap the word that matches the echo.
        </div>
      </motion.div>

      {/* Choices */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          marginBottom: 16
        }}
      >
        {choices.map((choice) => {
          const isSelected = selectedId === choice.id;
          const isCorrect = choice.isCorrect;
          const showResult = locked && isSelected;

          const bg = (() => {
            if (!locked && isSelected) return "#4C1D95";
            if (showResult && isCorrect) return "#15803D";
            if (showResult && !isCorrect) return "#7F1D1D";
            return "#1F143F";
          })();

          const border = (() => {
            if (showResult && isCorrect) return "0 0 0 2px #BBF7D0";
            if (showResult && !isCorrect) return "0 0 0 2px #FCA5A5";
            if (!locked && isSelected) return "0 0 0 2px #FACC15";
            return "0 4px 12px rgba(0,0,0,0.35)";
          })();

          return (
            <motion.button
              key={choice.id}
              whileTap={!locked ? { scale: 0.97 } : undefined}
              onClick={() => handleSelect(choice)}
              disabled={locked}
              style={{
                textAlign: "left",
                border: "none",
                outline: "none",
                borderRadius: 14,
                padding: "12px 14px",
                cursor: locked ? "default" : "pointer",
                background: bg,
                color: "white",
                boxShadow: border,
                fontSize: 14
              }}
            >
              {choice.text}
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      {locked && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            background: "#FACC15",
            color: "#1F2933",
            fontWeight: 700,
            fontSize: 15
          }}
        >
          Next echo →
        </motion.button>
      )}
    </div>
  );
}
