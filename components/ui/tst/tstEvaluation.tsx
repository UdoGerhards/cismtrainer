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
  const [performance, setPerformance] = useState<any>(null);

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
    async function loadData() {
      if (!testId) return;

      console.log("===>", testId);
      try {
        setLoading(true);
        console.log(testId);
        const res = await client.calculateTestResults(testId);
        const evalRes = await client.getTestEvaluation(testId);

        console.log(res);
        console.log(evalRes);

        const perfRes = await client.getPerformance(testId); // Performance-Daten laden
        setResult(res);
        setEvaluation(evalRes);
        setPerformance(perfRes);
        if (res.domains && Object.keys(res.domains).length > 0) {
          setActiveDomainTab(Object.keys(res.domains)[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testId]);

  const handlePrint = () => {
    if (Platform.OS !== "web" || !result || !evaluation) return;
    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(
        `<html><head><style>body{font-family:'Times New Roman',serif;padding:50px;}</style></head><body><h1>Auswertung</h1><pre>${JSON.stringify(performance, null, 2)}</pre></body></html>`,
      );
      printWin.document.close();
      printWin.print();
    }
  };

  const handlePress = async (item: any) => {
    if (expandedId === item._id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item._id);
    if (!explanations[item._id]) {
      setLoadingExplanation(item._id);
      const res = await client.getExplanation(item._id);
      setExplanations((prev: any) => ({
        ...prev,
        [item._id]: res || "Keine Erklärung",
      }));
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

            {performance && (
              <ThemedView style={styles.performanceCard}>
                <ThemedText style={styles.sectionTitle}>Performance</ThemedText>
                <ThemedText>Score: {performance.score}%</ThemedText>
                <ThemedText>Zeit: {performance.timeSpent}s</ThemedText>
              </ThemedView>
            )}

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
  performanceCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  domainChartCard: {
    width: 240,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
  },
  listItem: { padding: 16, borderBottomWidth: 1 },
  question: { fontWeight: "bold" },
});
