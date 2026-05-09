
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Meaning = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type BlitzWord = {
  id: string;
  word: string;
  meanings: Meaning[];
};

const MOCK_WORDS: BlitzWord[] = [
  {
    id: "1",
    word: "sharp",
    meanings: [
      { id: "m1", text: "intelligent, quick‑witted", isCorrect: true },
      { id: "m2", text: "having a thin cutting edge", isCorrect: true },
      { id: "m3", text: "slightly angry or critical", isCorrect: false },
      { id: "m4", text: "musical note raised by a semitone", isCorrect: true }
    ]
  },
  {
    id: "2",
    word: "light",
    meanings: [
      { id: "m5", text: "not heavy", isCorrect: true },
      { id: "m6", text: "illumination", isCorrect: true },
      { id: "m7", text: "serious, grave", isCorrect: false },
      { id: "m8", text: "pale in color", isCorrect: true }
    ]
  }
  // TODO: replace with real data from your backend
];

const ROUND_DURATION_MS = 30000; // 30 seconds

export default function Blitz() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [streakGlow, setStreakGlow] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [roundOver, setRoundOver] = useState(false);

  const currentWord = useMemo(
    () => MOCK_WORDS[currentIndex % MOCK_WORDS.length],
    [currentIndex]
  );

  // Timer tick
  useEffect(() => {
    if (roundOver) return;
    if (!startTime) {
      setStartTime(Date.now());
      setNow(Date.now());
      return;
    }

    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startTime, roundOver]);

  const elapsed = startTime ? now - startTime : 0;
  const remaining = Math.max(ROUND_DURATION_MS - elapsed, 0);
  const progress = 1 - remaining / ROUND_DURATION_MS;

  useEffect(() => {
    if (remaining <= 0 && !roundOver) {
      setRoundOver(true);
      setLocked(true);
    }
  }, [remaining, roundOver]);

  const handleToggleMeaning = (meaning: Meaning) => {
    if (locked) return;

    setSelectedIds((prev) =>
      prev.includes(meaning.id)
        ? prev.filter((id) => id !== meaning.id)
        : [...prev, meaning.id]
    );
  };

  const handleSubmit = () => {
    if (locked) return;
    setLocked(true);

    const correctIds = currentWord.meanings
      .filter((m) => m.isCorrect)
      .map((m) => m.id);

    const isPerfect =
      correctIds.length === selectedIds.length &&
      correctIds.every((id) => selectedIds.includes(id));

    if (isPerfect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setScore((s) => s + 100 * newCombo);
      setStreakGlow(true);
      setTimeout(() => setStreakGlow(false), 300);
    } else {
      setCombo(0);
    }

    setTimeout(() => {
      setSelectedIds([]);
      setLocked(false);
      setCurrentIndex((i) => i + 1);
    }, 600);
  };

  const handleRestart = () => {
    setStartTime(null);
    setNow(Date.now());
    setScore(0);
    setCombo(0);
    setStreakGlow(false);
    setCurrentIndex(0);
    setSelectedIds([]);
    setLocked(false);
    setRoundOver(false);
  };

  return (
    <div
      style={{
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Header: Timer + Score */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16
        }}
      >
        {/* Timer bar */}
        <div style={{ flex: 1, marginRight: 12 }}>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "#2D1B69",
              overflow: "hidden"
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              style={{
                height: "100%",
                background:
                  "linear-gradient(90deg, #22C55E, #FACC15, #EF4444)"
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              color: "#C4B5FD"
            }}
          >
            {Math.ceil(remaining / 1000)}s left
          </div>
        </div>

        {/* Score + Combo */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>Score</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{score}</div>
          <AnimatePresence>
            {combo > 0 && (
              <motion.div
                key={combo}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  fontSize: 12,
                  color: "#FACC15",
                  fontWeight: 600
                }}
              >
                {combo}x combo
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Word card */}
      <motion.div
        layout
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
            marginBottom: 4
          }}
        >
          CLOCK TOWER • BLITZ
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: 1
          }}
        >
          {currentWord.word}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#A5B4FC",
            marginTop: 8
          }}
        >
          Tap every meaning that is correct. Miss one and your combo breaks.
        </div>
      </motion.div>

      {/* Meanings grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
          marginBottom: 16
        }}
      >
        {currentWord.meanings.map((meaning) => {
          const isSelected = selectedIds.includes(meaning.id);
          return (
            <motion.button
              key={meaning.id}
              whileTap={!locked ? { scale: 0.97 } : undefined}
              onClick={() => handleToggleMeaning(meaning)}
              disabled={locked}
              style={{
                textAlign: "left",
                border: "none",
                outline: "none",
                borderRadius: 14,
                padding: "12px 14px",
                cursor: locked ? "default" : "pointer",
                background: isSelected ? "#4C1D95" : "#1F143F",
                color: "white",
                boxShadow: isSelected
                  ? "0 0 0 2px #FACC15"
                  : "0 4px 12px rgba(0,0,0,0.35)",
                fontSize: 14
              }}
            >
              {meaning.text}
            </motion.button>
          );
        })}
      </div>

      {/* Submit / Round over */}
      {!roundOver ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={locked}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 999,
            border: "none",
            cursor: locked ? "default" : "pointer",
            background: locked ? "#4B5563" : "#FACC15",
            color: "#1F2933",
            fontWeight: 700,
            fontSize: 15
          }}
        >
          {locked ? "Checking…" : "Lock in answers"}
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginTop: 12 }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Time’s up!
          </div>
          <div style={{ fontSize: 14, color: "#C4B5FD", marginBottom: 12 }}>
            Final score: {score} • Best combo: {combo}
          </div>
          <button
            onClick={handleRestart}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#FACC15",
              color: "#1F2933",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Play again
          </button>
        </motion.div>
      )}

      {/* Combo glow overlay */}
      <AnimatePresence>
        {streakGlow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(circle at center, rgba(250,204,21,0.35), transparent)"
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
