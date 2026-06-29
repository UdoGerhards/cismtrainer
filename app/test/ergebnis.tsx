import Pie from "@/components/charts/pie.chart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ExplanationBox from "@/components/ui/tst/explanationBox";
import client from "@/scripts/client";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Footer from "@/components/Footer";
import { HeaderLogo } from "@/components/headerLogo";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@react-navigation/native";

export default function TestErgebnisScreen() {
  const { colors } = useTheme();

  const { testId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  // States für die beiden Filterebenen (Standardmäßig auf "correct")
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
      try {
        const res = await client.calculateTestResults(testId);
        const evalRes = await client.getTestEvaluation(testId);

        setResult(res);
        setEvaluation(evalRes);

        // Standardmäßig die erste Domain auswählen
        if (res.domains && Object.keys(res.domains).length > 0) {
          const firstDomain = Object.keys(res.domains)[0];
          setActiveDomainTab(firstDomain);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [testId]);

  function getCorrectAnswerText(answers: any[], correctKey: string) {
    let txt = "—";
    answers.forEach((a) => {
      console.log(a.type + " - " + a.text);

      if (a.type.trim() === correctKey.trim()) {
        txt = a.text.trim();
      }
    });

    return txt;
  }

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
        [id]: res || "Keine Erklärung vorhanden",
      }));
    } catch (e) {
      console.error(e);
      setExplanations((prev: any) => ({
        ...prev,
        [id]: "Fehler beim Laden der Erklärung",
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (loading || !result || !evaluation) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  // Gesamt-Ergebnis Daten
  const totalPieData = [
    { name: "OK", value: result.correct ?? 0 },
    { name: "Wrong", value: result.wrong ?? 0 },
  ];

  // Filtern nach der aktiven Domain und dem selektierten Zustand (Korrekt / Falsch)
  const correctInDomain = (evaluation.correctQuestions || []).filter(
    (q: any) => q.domain === activeDomainTab,
  );
  const wrongInDomain = (evaluation.wrongQuestions || []).filter(
    (q: any) => q.domain === activeDomainTab,
  );

  const filteredQuestions =
    activeStatusTab === "correct" ? correctInDomain : wrongInDomain;
  const domainNames = Object.keys(result.domains || {});

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 16,
          width: "100%",
          alignSelf: "center",
          flexGrow: 1,
        }}
        data={filteredQuestions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* LOGO */}
            <ThemedView
              style={{ padding: 20, backgroundColor: colors.background }}
            >
              <HeaderLogo />
            </ThemedView>

            {/* 1.) GESAMT-ERGEBNIS */}
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Gesamt-Ergebnis
            </ThemedText>
            <ThemedView
              style={[
                styles.chartCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Pie data={totalPieData} />
            </ThemedView>

            {/* 2.) DOMAIN ERGEBNISSE */}
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Ergebnisse nach Domain
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {domainNames.map((domName) => {
                const domData = result.domains[domName];
                const domPieData = [
                  { name: "OK", value: domData.ok },
                  { name: "Wrong", value: domData.wrong },
                ];
                return (
                  <ThemedView
                    key={domName}
                    style={[
                      styles.domainChartCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.domainChartTitle, { color: colors.text }]}
                    >
                      {domName}
                    </ThemedText>
                    <Pie data={domPieData} />
                  </ThemedView>
                );
              })}
            </ScrollView>

            {/* 3.) DOMAIN TABS */}
            <ThemedView
              style={[
                styles.tabsWrapper,
                { backgroundColor: colors.background },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabsRow}>
                  {domainNames.map((domName) => (
                    <Pressable
                      key={domName}
                      onPress={() => setActiveDomainTab(domName)}
                      style={styles.tabItem}
                    >
                      <ThemedText
                        style={[
                          styles.tabText,
                          activeDomainTab === domName
                            ? { color: colors.primary }
                            : { color: colors.text, opacity: 0.5 },
                        ]}
                      >
                        {domName.toUpperCase()}
                      </ThemedText>
                      {activeDomainTab === domName && (
                        <ThemedView
                          style={[
                            styles.tabUnderline,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <ThemedView
                style={[
                  styles.tabDivider,
                  { backgroundColor: colors.border, opacity: 0.8 },
                ]}
              />
            </ThemedView>

            {/* SUB-TABS: NUR NOCH CORRECT & WRONG */}
            <View style={styles.statusTabsContainer}>
              <Pressable
                onPress={() => setActiveStatusTab("correct")}
                style={[
                  styles.statusTabButton,
                  activeStatusTab === "correct" && {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusTabButtonText,
                    activeStatusTab === "correct" && { color: "#fff" },
                  ]}
                >
                  Korrekt ({correctInDomain.length})
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => setActiveStatusTab("wrong")}
                style={[
                  styles.statusTabButton,
                  activeStatusTab === "wrong" && {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusTabButtonText,
                    activeStatusTab === "wrong" && { color: "#fff" },
                  ]}
                >
                  Falsch ({wrongInDomain.length})
                </ThemedText>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const correctText = getCorrectAnswerText(item.answers, item.correct);
          const userText = item.user;
          const isCorrect = userText?.trim() === correctText?.trim();
          const isExpanded = expandedId === item._id;

          return (
            <Pressable
              onPress={() => handlePress(item)}
              style={({ hovered, pressed }) => [
                styles.listItem,
                {
                  borderColor: colors.border,
                  backgroundColor: hovered ? colors.card : colors.background,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={styles.question}>{item.question}</ThemedText>

              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Answer:
                </ThemedText>
                <ThemedText
                  style={[
                    styles.text,
                    { color: colors.success, fontWeight: "600" },
                  ]}
                >
                  {correctText}
                </ThemedText>
              </View>

              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  User:
                </ThemedText>
                <ThemedText
                  style={[
                    styles.text,
                    {
                      color: isCorrect ? colors.success : colors.error,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {userText}
                </ThemedText>
              </View>

              <ExplanationBox
                isExpanded={isExpanded}
                loadingExplanation={loadingExplanation}
                itemId={item._id}
                explanations={explanations}
                styles={styles}
              />
            </Pressable>
          );
        }}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
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
    marginLeft: 16,
    marginRight: 4,
    alignItems: "center",
  },
  domainChartTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  tabsWrapper: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  tabsRow: {
    flexDirection: "row",
  },
  tabItem: {
    marginRight: 24,
    paddingBottom: 8,
  },
  tabText: {
    fontWeight: "600",
    fontSize: 13,
  },
  tabUnderline: {
    marginTop: 6,
    height: 2,
    width: "100%",
  },
  tabDivider: {
    height: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  statusTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statusTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTabButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  question: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  label: {
    width: 70,
    fontWeight: "bold",
  },
  text: {
    flex: 1,
    flexWrap: "wrap",
  },
  explanationBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },
  mdH3: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
  },
  mdH4: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  mdP: {
    marginBottom: 10,
    lineHeight: 22,
  },
  mdUl: {
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 8,
  },
  mdLiRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  mdBullet: {
    marginRight: 8,
    marginTop: 2,
  },
  mdLiText: {
    flex: 1,
    lineHeight: 22,
  },
  mdStrong: {
    fontWeight: "bold",
  },
});
