import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type CaveItem = {
  id: string;
  word: string;
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
};

const MOCK_ITEMS: CaveItem[] = [
  {
    id: "1",
    word: "lucid",
    definition: "expressed clearly; easy to understand",
    example: "She gave a lucid explanation of the complex topic.",
    synonyms: ["clear", "coherent", "intelligible"],
    antonyms: ["confusing", "unclear"]
  },
  {
    id: "2",
    word: "astute",
    definition: "having or showing an ability to accurately assess situations",
    example: "His astute comments impressed the entire board.",
    synonyms: ["sharp", "shrewd", "perceptive"],
    antonyms: ["slow", "unaware"]
  },
  {
    id: "3",
    word: "succinct",
    definition: "briefly and clearly expressed",
    example: "Her succinct summary saved everyone time.",
    synonyms: ["concise", "compact"],
    antonyms: ["wordy", "long‑winded"]
  }
  // TODO: replace with real dataset
];

export default function ScholarsCave() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quip, setQuip] = useState<string | null>(null);
  const [knownCount, setKnownCount] = useState(0);

  const item = MOCK_ITEMS[index % MOCK_ITEMS.length];
  const progress = (index / MOCK_ITEMS.length) * 100;

  const handleFlip = () => setFlipped((f) => !f);

  const handleKnow = () => {
    setKnownCount((c) => c + 1);
    setQuip("Scholar mode activated.");
    nextCard();
  };

  const handleDontKnow = () => {
    setQuip("No shame. Knowledge grows in the dark.");
    nextCard();
  };

  const nextCard = () => {
    setTimeout(() => {
      setFlipped(false);
      setIndex((i) => i + 1);
      setQuip(null);
    }, 400);
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
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>SCHOLAR’S CAVE</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Deep Meaning Mode</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#C4B5FD" }}>Mastered</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{knownCount}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "#2D1B69",
            overflow: "hidden"
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            style={{
              height: "100%",
              background: "#8B5CF6"
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#C4B5FD", marginTop: 4 }}>
          {index + 1} / {MOCK_ITEMS.length}
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

      {/* Flashcard */}
      <motion.div
        onClick={handleFlip}
        style={{
          perspective: 1000,
          marginBottom: 20,
          cursor: "pointer"
        }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45 }}
          style={{
            position: "relative",
            width: "100%",
            minHeight: 180,
            borderRadius: 18,
            background: "#2D1B69",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            padding: 20,
            transformStyle: "preserve-3d"
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden"
            }}
          >
            <div style={{ fontSize: 14, color: "#C4B5FD" }}>Word</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{item.word}</div>
            <div
              style={{
                fontSize: 13,
                color: "#A5B4FC",
                marginTop: 8
              }}
            >
              Tap to reveal meaning
            </div>
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)"
            }}
          >
            <div style={{ fontSize: 14, color: "#C4B5FD" }}>Definition</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {item.definition}
            </div>

            <div style={{ fontSize: 14, color: "#C4B5FD", marginTop: 12 }}>
              Example
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>{item.example}</div>

            <div style={{ fontSize: 14, color: "#C4B5FD", marginTop: 12 }}>
              Synonyms
            </div>
            <div style={{ fontSize: 14 }}>{item.synonyms.join(", ")}</div>

            <div style={{ fontSize: 14, color: "#C4B5FD", marginTop: 12 }}>
              Antonyms
            </div>
            <div style={{ fontSize: 14 }}>{item.antonyms.join(", ")}</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Buttons */}
      {flipped && (
        <div
          style={{
            display: "flex",
            gap: 12
          }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleKnow}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 999,
              border: "none",
              background: "#22C55E",
              color: "#1F2933",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            I knew this
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDontKnow}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 999,
              border: "none",
              background: "#EF4444",
              color: "white",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Not yet
          </motion.button>
        </div>
      )}
    </div>
  );
}
