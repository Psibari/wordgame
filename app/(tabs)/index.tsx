import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Colors } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>POLYWORDS</Text>
      <Text style={styles.subtitle}>Are you game?</Text>

      <Link href="/(tabs)/play" asChild>
        <Pressable style={styles.playButton}>
          <Text style={styles.playText}>▶ Play</Text>
        </Pressable>
      </Link>

      <View style={styles.secondaryRow}>
        <Link href="/(tabs)/library" asChild>
          <Pressable style={styles.secondaryCard}>
            <Text style={styles.cardTitle}>📚 Library</Text>
            <Text style={styles.cardText}>Browse your words</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/polly" asChild>
          <Pressable style={styles.secondaryCard}>
            <Text style={styles.cardTitle}>🦜 Polly</Text>
            <Text style={styles.cardText}>Meet your guide</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.gold,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: Colors.textSub,
    textAlign: "center",
    marginBottom: 48,
  },
  playButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  playText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 16,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: Colors.textSub,
    marginTop: 8,
  },
});