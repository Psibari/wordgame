import { View, Text, Pressable } from 'react-native';
import { useState, useEffect } from 'react';

const MOCK_WORD = {
  word: "BANK",
  meanings: [
    { id: 1, text: "Financial institution", correct: true },
    { id: 2, text: "River edge", correct: true },
    { id: 3, text: "Basketball shot", correct: false },
    { id: 4, text: "Airplane tilt", correct: false },
  ]
};

export default function Blitz({ onExit }: { onExit: () => void }) {
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState<number[]>([]);

  useEffect(() => {
    if (time === 0) return;
    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  const tapCard = (id: number, correct: boolean) => {
    if (found.includes(id)) return;
    if (correct) {
      setScore(score + 100 + time * 10); // speed bonus
      setFound([...found, id]);
    } else {
      setTime(Math.max(0, time - 3)); // penalty
    }
  };

  const allFound = found.length === MOCK_WORD.meanings.filter(m => m.correct).length;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Time: {time}s | Score: {score}</Text>
      <Text style={{ fontSize: 32, marginVertical: 20 }}>{MOCK_WORD.word}</Text>
      {MOCK_WORD.meanings.map(m => (
        <Pressable
          key={m.id}
          onPress={() => tapCard(m.id, m.correct)}
          style={{
            padding: 15,
            marginVertical: 5,
            backgroundColor: found.includes(m.id)? 'gold' : '#eee'
          }}
        >
          <Text>{m.text}</Text>
        </Pressable>
      ))}
      {(time === 0 || allFound) && (
        <Pressable onPress={onExit} style={{ marginTop: 20, padding: 15, backgroundColor: 'lightblue' }}>
          <Text>Back to modes</Text>
        </Pressable>
      )}
    </View>
  );
}
