
import { View, Text, StyleSheet } from "react-native";

export default function MasteryCard({ word, type, difficulty, mastery }) {
  return (
    <View style={styles.card}>
      <Text style={styles.word}>{word}</Text>
      <Text style={styles.meta}>
        {type} • {difficulty}
      </Text>

      <View style={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <Text key={i} style={i < mastery ? styles.starActive : styles.star}>
            ★
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1A1040",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  word: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
  },
  meta: {
    fontSize: 14,
    color: "#8B5CF6",
    marginTop: 4,
  },
  stars: {
    flexDirection: "row",
    marginTop: 10,
  },
  star: {
    fontSize: 20,
    color: "#444",
    marginRight: 4,
  },
  starActive: {
    fontSize: 20,
    color: "#FFD700",
    marginRight: 4,
  },
});
