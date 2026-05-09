import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CrossroadsItem = {
  id: string;
  word: string;
  sentence: string;
  correctMeaning: string;
  decoys: string[];
};

const MOCK_ITEMS: CrossroadsItem[] = [
  {
    id: "1",
    word: "seasoned",
    sentence: "The seasoned engineer spotted the flaw in seconds.",
    correctMeaning: "experienced and skilled",
    decoys: ["flavored with spices", "tired and worn out", "recently hired"]
  },
  {
    id: "2",
    word: "charged",
    sentence: "The atmosphere in the room felt charged before the announcement.",
    correctMeaning: "tense and full of emotion",
    decoys: ["accused of a crime", "filled with electricity", "asked to pay money"]
  },
  {
    id: "3",
    word: "light",
    sentence: "They kept the conversation light during dinner.",
    correctMeaning: "not serious or heavy in tone",
    decoys: ["not heavy in weight", "bright and full of illumination", "pale in color"]
  }
  // TODO: replace with real data
];

type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Crossroads() {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quip, setQuip] = useState<string | null>(null);

  const item = MOCK_ITEMS[index % MOCK_ITEMS.length];

  const choices: Choice[] = useMemo(() => {
    const all = [
      { id: "correct", text: item.correctMeaning, isCorrect: true },
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
      setScore((s) => s + 50 + newStreak * 10);
      setQuip(
        newStreak >= 3
          ? "You’re reading the room like a pro."
          : "Nice pick. Context brain online."
      );
    } else {
      setStreak(0);
      setQuip("Yeah… not that one. Try reading the vibe again.");
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
      {/* Header: Score + Streak */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>CROSSROADS</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Context Mode</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>Score</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{score}</div>
          <AnimatePresence>
            {streak > 0 && (
              <motion.div
                key={streak}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 12,
                  color: "#FACC15",
                  fontWeight: 600
                }}
              >
                {streak} in a row
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Sentence card */}
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
            fontSize: 13,
            color: "#C4B5FD",
            marginBottom: 6
          }}
        >
          Choose the meaning that fits this sentence:
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.5 }}>
          {item.sentence.split(" ").map((token, i) => {
            const clean = token.replace(/[.,!?]/g, "");
            const isTarget =
              clean.toLowerCase() === item.word.toLowerCase();
            return (
              <span key={i} style={{ marginRight: 4 }}>
                {isTarget ? (
                  <span
                    style={{
                      background: "#FACC15",
                      color: "#1F2933",
                      padding: "2px 6px",
                      borderRadius: 6,
                      fontWeight: 700
                    }}
                  >
                    {token}
                  </span>
                ) : (
                  token
                )}
              </span>
            );
          })}
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
          Next sentence →
        </motion.button>
      )}
    </div>
  );
}
