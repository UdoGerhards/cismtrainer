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

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  const [nextDisabled, setNextDisabled] = useState(true);
  const [okDisabled, setOkDisabled] = useState(false);
  const [explainDisabled, setExplainDisabled] = useState(true);

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );
  const [expanded, setExpanded] = useState(false);

  const questionRef = useRef(null);

  const loadNextQuestion = () => {
    setLoading(true);

    setNextDisabled(true);
    setOkDisabled(false);
    setExplainDisabled(true);
    setExpanded(false);

    client
      .fetchQuestion()
      .then((data) => {
        setQuestions(data);
        setChecked(false);
        setCurrentQuestionId(data?._id || null);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadNextQuestion();
  }, []);

  if (authLoading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Benutzer ...</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Fragen ...</ThemedText>
      </ThemedView>
    );
  }

  const isExpanded = expanded;

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
          <Question
            ref={questionRef}
            question={questions}
            checked={checked}
            user={user}
          />

          {/* BUTTONS */}
          <ThemedView style={styles.fixToText}>
            {!okDisabled && (
              <Button
                title="OK"
                color={colors.primary}
                onPress={() => {
                  client.sendGivenAnswer();
                  setChecked(true);
                  setOkDisabled(true);
                  setNextDisabled(false);
                  setExplainDisabled(false);
                }}
              />
            )}

            {!explainDisabled && (
              <Button
                title="Explain"
                color={colors.primary}
                onPress={async () => {
                  if (!currentQuestionId) return;

                  setExplainDisabled(true);
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
                }}
              />
            )}

            {!nextDisabled && (
              <Button
                title="Next"
                color={colors.primary}
                onPress={loadNextQuestion}
                disabled={nextDisabled}
              />
            )}
          </ThemedView>

          <ExplanationBox
            isExpanded={isExpanded}
            loadingExplanation={loadingExplanation}
            itemId={currentQuestionId}
            explanations={explanations}
            styles={styles}
          />
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
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
