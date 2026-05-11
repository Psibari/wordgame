import { View, Text, StyleSheet, Image } from "react-native";
import { Colors } from "@/constants/theme";

export default function PollyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polly</Text>

      <Image
        source={require("@/assets/images/polly.png")}
        style={styles.polly}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>
        Your smartass-but-welcoming guide to mastering words.
      </Text>

      <Text style={styles.line}>
        “Squawk! Ready to learn something new today.”
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
    marginBottom: 20,
  },
  polly: {
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.purple,
    textAlign: "center",
    marginBottom: 10,
  },
  line: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
  },
});
