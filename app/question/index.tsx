import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, LogBox, StyleSheet, View } from "react-native";

import { useEffect, useRef, useState } from "react";

import Question from "@/components/ui/tst/question";
import client from "@/scripts/client";
import { QuestionItem } from "@/scripts/model/if_question";

import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";

import ExplanationBox from "@/components/ui/tst/explanationBox";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

import { HeaderLogo } from "@/components/headerLogo";

LogBox.ignoreLogs(["props.pointerEvents is deprecated"]);

const PERM_KI_USE_ALLOWED = 0b010000;
const PERM_ADMIN = 0b111111;

export default function RandomQuestionScreen() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();

  // Anpassung: Wir erwarten ein einzelnes QuestionItem Objekt, nicht ein Array
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );

  const questionRef = useRef(null);

  const userRole = user?.role ? Number(user.role) : 0;
  const isKiAllowed = (userRole & PERM_KI_USE_ALLOWED) === PERM_KI_USE_ALLOWED;
  const isAdmin = (userRole & PERM_ADMIN) === PERM_ADMIN;
  const showExplainButton = isKiAllowed || isAdmin;

  const loadNextQuestion = () => {
    setLoading(true);
    setExpanded(false);

    client
      .fetchQuestion()
      .then((qstns) => {
        let data = qstns[0]; // Das erste Element der Antwort

        if (data && data.answers) {
          // Felder für die Antworten anreichern
          data.answers = data.answers.map((ans: any) => ({
            ...ans,
            question_id: data._id,
            question: data.ID,
          }));
        }

        setQuestion(data);
        setChecked(false);
        setCurrentQuestionId(data?._id || null);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const handleAnswerSelected = async () => {
    try {
      await client.sendGivenAnswer();
      setChecked(true);
    } catch (err) {
      console.error("Fehler beim Speichern der Antwort:", err);
    }
  };

  const handleExplain = async () => {
    if (!currentQuestionId) return;
    setExpanded(true);
    if (explanations[currentQuestionId]) return;

    try {
      setLoadingExplanation(currentQuestionId);
      const res = await client.getExplanation(currentQuestionId);
      setExplanations((prev) => ({
        ...prev,
        [currentQuestionId]: res || "Keine Erklärung vorhanden",
      }));
    } catch (e) {
      console.error(e);
      setExplanations((prev) => ({
        ...prev,
        [currentQuestionId]: "Fehler beim Laden der Erklärung",
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (authLoading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Benutzer ...</ThemedText>
      </ThemedView>
    );
  }

  if (loading || !question) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Fragen ...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ title: "Random Question" }} />

        <ParallaxScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{
            backgroundColor: colors.background,
            flexGrow: 1,
          }}
          headerBackgroundColor={{
            light: colors.card,
            dark: colors.card,
          }}
          headerImage={<HeaderLogo />}
        >
          {/* Hier werden die angereicherten Daten übergeben */}
          <Question
            key={currentQuestionId}
            ref={questionRef}
            question={question}
            checked={checked}
            user={user}
            onAnswerSelected={handleAnswerSelected}
          />

          <ThemedView style={styles.fixToText}>
            {checked && !expanded && showExplainButton && (
              <Button
                title="Explain"
                color={colors.primary}
                onPress={handleExplain}
              />
            )}

            <View style={{ flex: 1 }} />

            {checked && (
              <Button
                title="Next"
                color={colors.primary}
                onPress={loadNextQuestion}
              />
            )}
          </ThemedView>

          {showExplainButton && (
            <ExplanationBox
              isExpanded={expanded}
              loadingExplanation={loadingExplanation}
              itemId={currentQuestionId}
              explanations={explanations}
              styles={styles}
            />
          )}
        </ParallaxScrollView>
        <Footer />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
});
