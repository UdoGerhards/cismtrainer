import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function Footer() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.push("/impressum")}>
        <ThemedText style={{ color: colors.primary }}>Impressum</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopWidth: 1,
    alignItems: "center",
  },
});
