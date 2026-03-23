import Pie from "@/components/charts/pie.chart";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ExplanationBox from "@/components/ui/tst/explanationBox";
import client from "@/scripts/client";
import { Image } from 'expo-image';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { useAuth } from "@/context/AuthContext";

export default function ErgebnisScreen() {
  const { testId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [activeTab, setActiveTab] = useState("correct");

  const [expandedId, setExpandedId] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingExplanation, setLoadingExplanation] = useState(null);

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

  function getCorrectAnswerText(answers, correctKey) {
    return answers?.find(a => a.answer === correctKey)?.text || "—";
  }

  const handlePress = async (item) => {
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

      setExplanations(prev => ({
        ...prev,
        [id]: res || "Keine Erklärung vorhanden"
      }));
    } catch (e) {
      console.error(e);
      setExplanations(prev => ({
        ...prev,
        [id]: "Fehler beim Laden der Erklärung"
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (loading || !result || !evaluation) {
    return (
      <ThemedView>
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  const pieData = [
    { name: "OK", value: result.correct ?? 0 },
    { name: "Wrong", value: result.wrong ?? 0 }
  ];

  const currentData =
    activeTab === "correct"
      ? evaluation.correctQuestions || []
      : evaluation.wrongQuestions || [];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* HEADER */}
      <ThemedView>
        <ThemedText type="title">Ergebnis</ThemedText>
        <Pie data={pieData} />
      </ThemedView>

      {/* TABS */}
      <ThemedView style={styles.tabsWrapper}>
        <ThemedView style={styles.tabsRow}>

          <Pressable onPress={() => setActiveTab("correct")} style={styles.tabItem}>
            <ThemedText style={[
              styles.tabText,
              activeTab === "correct" && styles.activeTabText
            ]}>
              CORRECT
            </ThemedText>
            {activeTab === "correct" && <ThemedView style={styles.tabUnderline} />}
          </Pressable>

          <Pressable onPress={() => setActiveTab("wrong")} style={styles.tabItem}>
            <ThemedText style={[
              styles.tabText,
              activeTab === "wrong" && styles.activeTabText
            ]}>
              WRONG
            </ThemedText>
            {activeTab === "wrong" && <ThemedView style={styles.tabUnderline} />}
          </Pressable>

        </ThemedView>

        <ThemedView style={styles.tabDivider} />
      </ThemedView>

      {/* LISTE */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item._id}
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
                hovered && styles.hovered,
                pressed && styles.pressed
              ]}
            >
              <ThemedText style={styles.question}>
                {item.question}
              </ThemedText>

              <ThemedView style={styles.row}>
                <ThemedText style={styles.label}>Answer:</ThemedText>
                <ThemedText style={[styles.text, styles.correct]}>
                  {correctText}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.row}>
                <ThemedText style={styles.label}>User:</ThemedText>
                <ThemedText style={[
                  styles.text,
                  { color: isCorrect ? "green" : "red" }
                ]}>
                  {userText}
                </ThemedText>
              </ThemedView>

              {/* Erklärung */}
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
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

  tabsWrapper: {
    marginTop: 20,
  },

  tabsRow: {
    flexDirection: "row",
  },

  tabItem: {
    marginRight: 30,
    paddingBottom: 8,
  },

  tabText: {
    color: "#666",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#2f6fed",
  },

  tabUnderline: {
    marginTop: 6,
    height: 2,
    backgroundColor: "#2f6fed",
    width: "100%",
  },

  tabDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginTop: 4,
  },

  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#dddddd",
  },

  hovered: {
    backgroundColor: "#dddddd",
  },

  pressed: {
    opacity: 0.7,
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
    color: "black",
    fontWeight: "bold",
  },

  text: {
    flex: 1,
    flexWrap: "wrap",
  },

  correct: {
    color: "green",
  },

  explanationBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },

  /* Markdown Styles */
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
    backgroundColor: "transparent",
  },

  mdUl: {
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 8,
    backgroundColor: "transparent",
  },

  mdLiRow: {
    flexDirection: "row",
    marginBottom: 6,
    backgroundColor: "transparent",
  },

  mdBullet: {
    marginRight: 8,
    marginTop: 2,
    backgroundColor: "transparent",
  },

  mdLiText: {
    flex: 1,
    lineHeight: 22,
    backgroundColor: "transparent",
  },

  mdStrong: {
    fontWeight: "bold",
  },
});