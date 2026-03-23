import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Button, LogBox, StyleSheet } from 'react-native';

import { useEffect, useRef, useState } from "react";

import Question from '@/components/ui/tst/question';
import client from '@/scripts/client';
import { QuestionItem } from '@/scripts/model/if_question';

import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";

import ExplanationBox from "@/components/ui/tst/explanationBox";

LogBox.ignoreLogs([
  "props.pointerEvents is deprecated"
]);

export default function HomeScreen() {

  const { user, loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  const [nextDisabled, setNextDisabled] = useState(true);
  const [okDisabled, setOkDisabled] = useState(false);
  const [explainDisabled, setExplainDisabled] = useState(true);

  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const questionRef = useRef(null);

  const loadNextQuestion = () => {
    setLoading(true);

    setNextDisabled(true);
    setOkDisabled(false);
    setExplainDisabled(true);

    setExpanded(false);

    client.fetchQuestion()
      .then(data => {
        setQuestions(data);
        setChecked(false);

        // ✅ FIX
        setCurrentQuestionId(data?._id || null);

        setLoading(false);
      })
      .catch(err => console.error(err));
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
      <Stack.Screen options={{ title: "Random Question" }} />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/CISMw.png')}
            style={styles.reactLogo}
          />
        }
      >



        <Question
          ref={questionRef}
          question={questions}
          checked={checked}
          user={user}
        />

        {/* BUTTONS */}
        <ThemedView style={styles.fixToText}>

          {/* OK nur anzeigen wenn aktiv */}
          {!okDisabled && (
            <Button
              title="OK"
              onPress={() => {
                client.sendGivenAnswer();
                setChecked(true);
                setOkDisabled(true);
                setNextDisabled(false);

                setExplainDisabled(false);
              }}
            />
          )}

          {/* Explain nur anzeigen wenn aktiv */}
          {!explainDisabled && (
            <Button
              title="Explain"
              onPress={async () => {
                if (!currentQuestionId) return;

                setExplainDisabled(true);
                setExpanded(true);

                if (explanations[currentQuestionId]) return;

                try {
                  setLoadingExplanation(currentQuestionId);

                  const res = await client.getExplanation(currentQuestionId);

                  setExplanations(prev => ({
                    ...prev,
                    [currentQuestionId]: res || "Keine Erklärung vorhanden"
                  }));

                } catch (e) {
                  console.error(e);
                  setExplanations(prev => ({
                    ...prev,
                    [currentQuestionId]: "Fehler beim Laden der Erklärung"
                  }));
                } finally {
                  setLoadingExplanation(null);
                }
              }}
            />
          )}

          {/* Next bleibt immer sichtbar */}
          {/* NEXT */}
          {!nextDisabled && (
            <Button
              title="Next"
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
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 200,
    width: 290,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});