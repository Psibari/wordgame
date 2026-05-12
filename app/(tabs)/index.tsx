import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function ModeSelect() {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "700", textAlign: "center" }}>
        POLY WORDS
      </Text>

      <Text style={{ marginTop: 8, textAlign: "center", opacity: 0.7 }}>
        Choose your path
      </Text>

      <View style={{ marginTop: 40, gap: 16 }}>
        {/* Crossroads */}
        <Link href="/(tabs)/play" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#4F46E5", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Crossroads
            </Text>
          </Pressable>
        </Link>

        {/* Blitz */}
        <Link href="/Blitz" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#DC2626", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Blitz
            </Text>
          </Pressable>
        </Link>

        {/* Scholar’s Cave */}
        <Link href="/Scholar" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#16A34A", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Scholar’s Cave
            </Text>
          </Pressable>
        </Link>

        {/* Echo Canyon */}
        <Link href="/Echo" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#F59E0B", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Echo Canyon
            </Text>
          </Pressable>
        </Link>

        {/* Library */}
        <Link href="/(tabs)/library" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#6B7280", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Library
            </Text>
          </Pressable>
        </Link>

        {/* Polly */}
        <Link href="/(tabs)/polly" asChild>
          <Pressable style={{ padding: 20, backgroundColor: "#9333EA", borderRadius: 14 }}>
            <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
              Polly
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
