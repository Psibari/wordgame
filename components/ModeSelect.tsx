import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Blitz from "./Blitz";
import Crossroads from "./Crossroads";
import ScholarsCave from "./ScholarsCave";
import EchoCanyon from "./EchoCanyon";

const modes = [
  {
    id: "blitz",
    title: "Clock Tower",
    vibe: "Speed • Tap all meanings fast",
    icon: "🔥",
    component: Blitz,
    quip: "Move those feathers, speedster!"
  },
  {
    id: "crossroads",
    title: "Crossroads",
    vibe: "Context • Choose what fits",
    icon: "🧭",
    component: Crossroads,
    quip: "Think, human… THINK!"
  },
  {
    id: "scholars",
    title: "Scholar’s Cave",
    vibe: "Knowledge • Recall every meaning",
    icon: "📚",
    component: ScholarsCave,
    quip: "Ah yes… the *scholar* returns."
  },
  {
    id: "echo",
    title: "Echo Canyon",
    vibe: "Memory • Match the echoes",
    icon: "🔊",
    component: EchoCanyon,
    quip: "Echo… echo… echo… your brain working?"
  }
];

export default function ModeSelect() {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [quip, setQuip] = useState<string | null>(null);

  const handleSelect = (modeId: string, quip: string) => {
    setQuip(quip);
    setTimeout(() => setActiveMode(modeId), 250); // slight delay for animation
  };

  const ActiveComponent =
    activeMode ? modes.find((m) => m.id === activeMode)?.component : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1A1040",
        padding: "24px",
        overflow: "hidden",
        position: "relative"
      }}
    >
      {/* Polly Bubble */}
      <AnimatePresence>
        {quip && !activeMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#FFD700",
              color: "#1A1040",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              zIndex: 10
            }}
          >
            {quip}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Grid */}
      <AnimatePresence>
        {!activeMode && (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
              marginTop: "60px"
            }}
          >
            {modes.map((mode) => (
              <motion.div
                key={mode.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelect(mode.id, mode.quip)}
                style={{
                  background: "#8B5CF6",
                  borderRadius: "18px",
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Glow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileTap={{ opacity: 0.4 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle, #FFD70055, transparent)",
                    zIndex: 0
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    fontSize: 40,
                    marginRight: 16,
                    zIndex: 1
                  }}
                >
                  {mode.icon}
                </div>

                {/* Text */}
                <div style={{ zIndex: 1 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "white"
                    }}
                  >
                    {mode.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#E5D9FF",
                      marginTop: 4
                    }}
                  >
                    {mode.vibe}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Mode */}
      <AnimatePresence>
        {activeMode && ActiveComponent && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#1A1040",
              padding: "16px",
              overflowY: "auto"
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => {
                setActiveMode(null);
                setQuip(null);
              }}
              style={{
                background: "#FFD700",
                color: "#1A1040",
                border: "none",
                padding: "10px 16px",
                borderRadius: 12,
                fontWeight: 700,
                marginBottom: 16,
                cursor: "pointer"
              }}
            >
              ← Back
            </button>

            <ActiveComponent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
