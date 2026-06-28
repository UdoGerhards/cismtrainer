import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@react-navigation/native";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

// 1. Die Komponente importieren, die unten gerendert wird
import TstEvaluation from "@/components/ui/tst/tstEvaluation";

// 2. Die neuen, statischen Icons ohne das fehlerhafte "@" importieren
import FontAwesomeDownload from "react-native-vector-icons/font-awesome/static/download";
import IoniconsPlayBack from "react-native-vector-icons/ionicons/static/play-back";

export default function TestErgebnisScreen() {
  const { colors } = useTheme();
  const { testId, title } = useLocalSearchParams();
  const router = useRouter();

  if (!testId || typeof testId !== "string") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedText>Keine gültige Test-ID gefunden.</ThemedText>
      </View>
    );
  }

  const handlePrint = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; }
              html, body { margin: 0; padding: 0; width: 100%; background-color: #ffffff; font-family: sans-serif; color: #1e293b; }
              .page-wrapper { width: 100%; max-width: 180mm; margin: 0 auto; page-break-inside: auto; }
              h1 { color: #0284c7; font-size: 26px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              .content-block { page-break-inside: avoid; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="page-wrapper">
              <div class="content-block">
                <h1>Test-Auswertung Report</h1>
                <p><strong>Titel:</strong> ${typeof title === "string" ? title : "Unbenannter Test"}</p>
                <p><strong>ID:</strong> ${testId}</p>
              </div>
            </div>
          </body>
        </html>
      `;
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Fehler", "PDF konnte nicht erstellt werden.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        {/* Links: Nativer Doppelpfeil über die statische Komponente */}
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/performance")
          }
          style={styles.navButton}
        >
          <IoniconsPlayBack size={22} color={colors.primary} />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {typeof title === "string" ? title : "Auswertung"}
        </ThemedText>

        {/* Rechts: Download-Button über die statische Komponente */}
        <TouchableOpacity onPress={handlePrint} style={styles.navButton}>
          <FontAwesomeDownload size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TstEvaluation testId={testId} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 8,
  },
});
