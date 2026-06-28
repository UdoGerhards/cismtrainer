import Pie from "@/components/charts/pie.chart";
import Footer from "@/components/Footer";
import { HeaderLogo } from "@/components/headerLogo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ExplanationBox from "@/components/ui/tst/explanationBox";
import client from "@/scripts/client";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

interface TstEvaluationProps {
  testId: string;
}

export default function TstEvaluation({ testId }: TstEvaluationProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [activeDomainTab, setActiveDomainTab] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<"correct" | "wrong">(
    "correct",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<any>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function loadResult() {
      if (!testId) return;
      try {
        setLoading(true);
        const res = await client.calculateTestResults(testId);
        const evalRes = await client.getTestEvaluation(testId);
        setResult(res);
        setEvaluation(evalRes);
        if (res.domains && Object.keys(res.domains).length > 0)
          setActiveDomainTab(Object.keys(res.domains)[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [testId]);

  function getCorrectAnswerText(answers: any[], correctKey: string) {
    return answers?.find((a) => a.answer === correctKey)?.text || "—";
  }

  // Verbesserte Chart-Generierung für PDF
  const generateSvgPieChart = (correct: number, incorrect: number) => {
    const total = correct + incorrect;
    if (total === 0)
      return `<div style="width:50px; height:50px; border-radius:50%; background:#e5e7eb;"></div>`;
    const percentage = (correct / total) * 100;
    return `
      <div style="width:60px; height:60px; border-radius:50%; background: conic-gradient(#22c55e 0% ${percentage}%, #ef4444 ${percentage}% 100%);">
      </div>`;
  };

  const handlePrint = () => {
    if (Platform.OS !== "web" || !result || !evaluation) return;

    const domainsHtml = Object.keys(result.domains || {})
      .map((domName) => {
        const domData = result.domains[domName];
        const correctQs = (evaluation.correctQuestions || []).filter(
          (q: any) => q.domain === domName,
        );
        const wrongQs = (evaluation.wrongQuestions || []).filter(
          (q: any) => q.domain === domName,
        );

        return `
        <div style="page-break-inside: avoid; margin-bottom: 30px;">
          <h2 style="font-family: 'Times New Roman', serif; border-bottom: 1px solid #ccc; padding-bottom: 5px;">${domName}</h2>
          <div style="display: flex; align-items: center; gap: 15px; margin: 10px 0;">
            ${generateSvgPieChart(domData.ok, domData.wrong)}
            <div style="font-family: 'Times New Roman', serif;">
              <b>Richtig:</b> ${domData.ok} | <b>Falsch:</b> ${domData.wrong}
            </div>
          </div>
          <h3 style="font-family: 'Times New Roman', serif;">Details</h3>
          <ul style="font-family: 'Times New Roman', serif; line-height: 1.6;">
            ${correctQs.map((q: any) => `<li>✓ ${q.question}</li>`).join("")}
            ${wrongQs.map((q: any) => `<li style="color: #b91c1c;">✗ ${q.question}</li>`).join("")}
          </ul>
        </div>`;
      })
      .join("");

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; }
            h1 { border-bottom: 2px solid #000; }
          </style>
        </head>
        <body>
          <h1>Test-Auswertung</h1>
          <p>Gesamtergebnis: ${result.correct} richtig, ${result.wrong} falsch.</p>
          ${domainsHtml}
        </body>
      </html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.print();
    }
  };

  const handlePress = async (item: any) => {
    const id = item._id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (explanations[id]) return;
    try {
      setLoadingExplanation(id);
      const res = await client.getExplanation(id);
      setExplanations((prev: any) => ({
        ...prev,
        [id]: res || "Keine Erklärung",
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (loading || !result || !evaluation)
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText>Lade...</ThemedText>
      </ThemedView>
    );

  const filteredQuestions =
    activeStatusTab === "correct"
      ? (evaluation.correctQuestions || []).filter(
          (q: any) => q.domain === activeDomainTab,
        )
      : (evaluation.wrongQuestions || []).filter(
          (q: any) => q.domain === activeDomainTab,
        );

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <HeaderLogo />
        <TouchableOpacity onPress={handlePrint} style={{ padding: 10 }}>
          <Feather name="download" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredQuestions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <ThemedText style={styles.sectionTitle}>Gesamt-Ergebnis</ThemedText>
            <ThemedView style={styles.chartCard}>
              <Pie
                data={[
                  { name: "OK", value: result.correct },
                  { name: "Wrong", value: result.wrong },
                ]}
              />
            </ThemedView>
            <ThemedText style={styles.sectionTitle}>
              Ergebnisse nach Domain
            </ThemedText>
            <ScrollView horizontal style={{ paddingLeft: 16 }}>
              {Object.keys(result.domains).map((d) => (
                <ThemedView key={d} style={styles.domainChartCard}>
                  <ThemedText>{d}</ThemedText>
                  <Pie
                    data={[
                      { name: "OK", value: result.domains[d].ok },
                      { name: "Wrong", value: result.domains[d].wrong },
                    ]}
                  />
                </ThemedView>
              ))}
            </ScrollView>
            <View style={styles.tabsWrapper}>
              {Object.keys(result.domains).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setActiveDomainTab(d)}
                  style={styles.tabItem}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeDomainTab === d && { color: colors.primary },
                    ]}
                  >
                    {d.toUpperCase()}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item)} style={styles.listItem}>
            <ThemedText style={styles.question}>{item.question}</ThemedText>
            <ExplanationBox
              isExpanded={expandedId === item._id}
              loadingExplanation={loadingExplanation}
              itemId={item._id}
              explanations={explanations}
              styles={styles}
            />
          </Pressable>
        )}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: "bold", margin: 16 },
  chartCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    alignItems: "center",
  },
  domainChartCard: {
    width: 240,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
  },
  tabsWrapper: { flexDirection: "row", padding: 16 },
  tabItem: { marginRight: 20 },
  tabText: { fontWeight: "bold", fontSize: 12 },
  listItem: { padding: 16, borderBottomWidth: 1 },
  question: { fontWeight: "bold" },
});
