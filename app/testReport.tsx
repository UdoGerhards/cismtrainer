import { ThemedText } from "@/components/themed-text";
import TstEvaluation from "@/components/ui/tst/tstEvaluation";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Feather from "react-native-vector-icons/Feather";

export default function TestErgebnisScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Erstellen der Referenz, um auf die Methoden der TstEvaluation Komponente zuzugreifen
  const tstRef = useRef<any>(null);

  console.log("TestErgebnisScreen", id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevrons-left" size={26} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {typeof title === "string" ? title : "Auswertung"}
        </ThemedText>

        {/* Aufruf der handlePrint Funktion aus der TstEvaluation Komponente */}
        <TouchableOpacity onPress={() => tstRef.current?.handlePrint()}>
          <Feather name="download" size={22} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Übergeben der Referenz an die Kind-Komponente */}
      <TstEvaluation ref={tstRef} testId={id as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
});
