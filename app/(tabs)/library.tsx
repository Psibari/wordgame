
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import words from "../../data/polywords.json";

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Word Library</Text>

      <FlatList
        data={words}
        keyExtractor={(item) => item.word}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.word}>{item.word}</Text>
            <Text style={styles.meta}>
              {item.type} • {item.difficulty}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1040",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 20,
  },
  card: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  word: {
    fontSize: 20,
    color: "white",
  },
  meta: {
    fontSize: 14,
    color: "#8B5CF6",
    marginTop: 4,
  },
});
