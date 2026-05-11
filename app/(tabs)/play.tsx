
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/theme";

export default function PlayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Play</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Start Game</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>
        A new word challenge awaits.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.gold,
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.purple,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    marginTop: 20,
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
