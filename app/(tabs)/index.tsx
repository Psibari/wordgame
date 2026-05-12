
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function ModeSelect() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>POLY WORDS</Text>
      <Text style={styles.subtitle}>Choose your path</Text>

      <View style={styles.grid}>
        {/* Blitz */}
        <Link href="/Blitz" asChild>
          <Pressable style={[styles.tile, { backgroundColor: "#DC2626" }]}>
            <Text style={styles.tileTitle}>⚡ Blitz</Text>
            <Text style={styles.tileDesc}>Speed & precision</Text>
          </Pressable>
        </Link>

        {/* Crossroads */}
        <Link href="/(tabs)/play" asChild>
          <Pressable style={[styles.tile, { backgroundColor: "#4F46E5" }]}>
            <Text style={styles.tileTitle}>🔀 Crossroads</Text>
            <Text style={styles.tileDesc}>Context mastery</Text>
          </Pressable>
        </Link>

        {/* Scholar's Cave */}
        <Link href="/Scholar" asChild>
          <Pressable style={[styles.tile, { backgroundColor: "#16A34A" }]}>
            <Text style={styles.tileTitle}>📚 Scholar’s Cave</Text>
            <Text style={styles.tileDesc}>Deep knowledge</Text>
          </Pressable>
        </Link>

        {/* Echo Canyon */}
        <Link href="/Echo" asChild>
          <Pressable style={[styles.tile, { backgroundColor: "#F59E0B" }]}>
            <Text style={styles.tileTitle}>🔊 Echo Canyon</Text>
            <Text style={styles.tileDesc}>Memory & recall</Text>
          </Pressable>
        </Link>
      </View>

      {/* Library */}
      <Link href="/(tabs)/library" asChild>
        <Pressable style={[styles.longTile, { backgroundColor: "#6B7280" }]}>
          <Text style={styles.tileTitle}>🌱 Word Garden</Text>
          <Text style={styles.tileDesc}>Your growing mastery world</Text>
        </Pressable>
      </Link>

      {/* Polly */}
      <Link href="/(tabs)/polly" asChild>
        <Pressable style={[styles.longTile, { backgroundColor: "#9333EA" }]}>
          <Text style={styles.tileTitle}>🦜 Polly’s Perch</Text>
          <Text style={styles.tileDesc}>Talk to your guide</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#0F0F1A",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    textAlign: "center",
    color: "#A1A1AA",
    fontSize: 16,
  },
  grid: {
    marginTop: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
  },
  longTile: {
    marginTop: 20,
    width: "100%",
    height: 90,
    borderRadius: 16,
    padding: 16,
    justifyContent: "center",
  },
  tileTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  tileDesc: {
    marginTop: 4,
    fontSize: 14,
    color: "#E5E5E5",
  },
});
