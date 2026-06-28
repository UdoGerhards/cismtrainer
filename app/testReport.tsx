import { ThemedText } from "@/components/themed-text";
import TstEvaluation from "@/components/ui/tst/tstEvaluation";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react"; // Wir speichern die echten Daten hier
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Feather from "react-native-vector-icons/Feather";

export default function TestErgebnisScreen() {
  const { colors } = useTheme();
  const { testId, title } = useLocalSearchParams();
  const router = useRouter();

  // HIER: Das ist der State, den TstEvaluation füllen muss
  const [testData, setTestData] = useState<any>(null);

  const generateSvgPieChart = (
    correct: number,
    incorrect: number,
    size: number = 60,
  ) => {
    const total = correct + incorrect;
    if (total === 0) return "";
    const circumference = 2 * Math.PI * 8;
    const correctStroke = (correct / total) * circumference;
    return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" style="transform: rotate(-90deg); display: block;"><circle r="8" cx="16" cy="16" fill="transparent" stroke="#ef4444" stroke-width="16" /><circle r="8" cx="16" cy="16" fill="transparent" stroke="#22c55e" stroke-width="16" stroke-dasharray="${correctStroke} ${circumference}" /></svg>`;
  };

  const handlePrint = () => {
    if (Platform.OS !== "web" || !testData) return;

    let domainsHtml = "";
    // Iteration über die echten Daten, die in testData geladen wurden
    testData.domains.forEach((d: any, index: number) => {
      const correctQs = d.questions.filter((q: any) => q.status === "correct");
      const incorrectQs = d.questions.filter(
        (q: any) => q.status === "incorrect",
      );

      domainsHtml += `
        <div class="${index === 0 ? "page-break" : ""}" style="page-break-inside: avoid; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;">
          <h2>${d.name}</h2>
          <table class="chart-table">
            <tr>
              <td style="width: 70px;">${generateSvgPieChart(d.correct, d.incorrect, 60)}</td>
              <td>Korrekt: ${d.correct} | Falsch: ${d.incorrect}</td>
            </tr>
          </table>
          <h3>✓ Korrekte Antworten</h3>
          ${correctQs.map((q: any) => `<div class="question-block"><b>Frage:</b> ${q.text}<br><i>Antwort:</i> ${q.answer}</div>`).join("")}
          <h3>✗ Falsche Antworten</h3>
          ${incorrectQs.length === 0 ? "<p>Keine</p>" : incorrectQs.map((q: any) => `<div class="question-block"><b>Frage:</b> ${q.text}<br><i>Antwort:</i> ${q.answer}</div>`).join("")}
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>@page { size: A4 portrait; margin: 20mm; } body { font-family: Arial, sans-serif; padding: 20px; } .page-break { page-break-before: always; } .chart-table { width: 100%; border-collapse: collapse; background: #f8fafc; padding: 15px; margin: 15px 0; } .question-block { margin-bottom: 15px; }</style></head>
        <body>
          <h1>Test-Auswertung: ${title}</h1>
          <p>Datum: ${new Date().toLocaleDateString("de-DE")}</p>
          <table class="chart-table">
            <tr>
              <td style="width: 200px;">${generateSvgPieChart(testData.totalCorrect, testData.totalIncorrect, 180)}</td>
              <td><h2>Gesamtergebnis</h2>Korrekt: ${testData.totalCorrect}% | Falsch: ${testData.totalIncorrect}%</td>
            </tr>
          </table>
          ${domainsHtml}
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevrons-left" size={26} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {typeof title === "string" ? title : "Auswertung"}
        </ThemedText>
        <TouchableOpacity onPress={handlePrint}>
          <Feather name="download" size={22} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Übergib die Callback-Funktion an deine Komponente, um die echten Daten zu fangen */}
      <TstEvaluation
        testId={testId as string}
        onDataLoaded={(data) => setTestData(data)}
      />
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
