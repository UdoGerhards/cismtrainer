import Pie from "@/components/charts/pie.chart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ExplanationBox from "@/components/ui/tst/explanationBox";
import client from "@/scripts/client";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@react-navigation/native";

export default function ErgebnisScreen() {
  const { colors } = useTheme();

  const { testId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("correct");

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

  const pieData = [
    { name: "OK", value: result.correct ?? 0 },
    { name: "Wrong", value: result.wrong ?? 0 },
  ];

  const currentData =
    activeTab === "correct"
      ? evaluation.correctQuestions || []
      : evaluation.wrongQuestions || [];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 16,

          // 🔥 Responsive Breite
          width: "100%",
          alignSelf: "center",
          flexGrow: 1,
          // maxWidth: Platform.OS === "web" ? "99%" : "100%",
        }}
        data={currentData}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* ✅ RESPONSIVE HEADER IMAGE */}
            <ThemedView
              style={{
                padding: 20,
                backgroundColor: colors.background,
              }}
            >
              <Image
                source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
                style={{
                  width: "60%", // 🔥 jetzt 60%
                  maxWidth: 480, // optional für große Screens
                  aspectRatio: 1024 / 409,
                }}
                contentFit="contain"
              />
            </ThemedView>

            {/* CHART CARD */}
            <ThemedView
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 16,
              }}
            >
              <Pie data={pieData} />
            </ThemedView>

            {/* TABS */}
            <ThemedView
              style={[
                styles.tabsWrapper,
                { backgroundColor: colors.background },
              ]}
            >
              <ThemedView style={styles.tabsRow}>
                <Pressable
                  onPress={() => setActiveTab("correct")}
                  style={styles.tabItem}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === "correct"
                        ? { color: colors.primary }
                        : { color: colors.text, opacity: 0.5 },
                    ]}
                  >
                    CORRECT
                  </ThemedText>
                  {activeTab === "correct" && (
                    <ThemedView
                      style={[
                        styles.tabUnderline,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab("wrong")}
                  style={styles.tabItem}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      activeTab === "wrong"
                        ? { color: colors.primary }
                        : { color: colors.text, opacity: 0.5 },
                    ]}
                  >
                    WRONG
                  </ThemedText>
                  {activeTab === "wrong" && (
                    <ThemedView
                      style={[
                        styles.tabUnderline,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </Pressable>
              </ThemedView>

              <ThemedView
                style={[
                  styles.tabDivider,
                  { backgroundColor: colors.border, opacity: 0.8 },
                ]}
              />
            </ThemedView>
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

              <ThemedView style={styles.row}>
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
              </ThemedView>

              <ThemedView style={styles.row}>
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
              </ThemedView>

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
  tabsWrapper: {
    marginTop: 20,
    paddingHorizontal: 16,
  },

  tabsRow: {
    flexDirection: "row",
  },

  tabItem: {
    marginRight: 30,
    paddingBottom: 8,
  },

  tabText: {
    fontWeight: "600",
  },

  tabUnderline: {
    marginTop: 6,
    height: 2,
    width: "100%",
  },

  tabDivider: {
    height: 1,
    marginTop: 4,
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
