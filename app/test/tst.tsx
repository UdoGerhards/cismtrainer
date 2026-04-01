import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Button, StyleSheet } from 'react-native';

import { useEffect, useRef, useState } from "react";

import Question from '@/components/ui/tst/question';
import client from '@/scripts/client';
import { QuestionItem } from '@/scripts/model/if_question';

import { useAuth } from "@/context/AuthContext";
import { router, useLocalSearchParams } from "expo-router";

export default function TestScreen() {

  const { user } = useAuth();

  // ---------------------------------------------------------
  // Params von config.tsx
  // ---------------------------------------------------------
  const params = useLocalSearchParams();

  const title = String(params.title);
  const questionCount = Number(params.questionCount);
  const timeMinutes = Number(params.timeMinutes);

  // ❗ wird jetzt NEU erzeugt
  const [testId, setTestId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const [queue, setQueue] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [checked, setChecked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);

  const questionRef = useRef(null);

  // ---------------------------------------------------------
  // 🆕 Test erstellen + Fragen laden
  // ---------------------------------------------------------
  useEffect(() => {

    const initTest = async () => {
      try {
        // 🔥 NEUER Test bei JEDEM Eintritt
        const result = await client.createTest(user?.id, title);
        const newTestId = result._id;

        console.log("Neuer Test erstellt:", newTestId);

        setTestId(newTestId);

        // Fragen laden
        const data: QuestionItem[] = await client.fetchQuestions(questionCount);

        if (!data || data.length === 0) return;

        setQueue(data);
        setCurrentQuestion(data[0]);

      } catch (err) {
        console.error(err);
      }
    };

    initTest();

  }, []);

  // ---------------------------------------------------------
  // ⏱ Timer
  // ---------------------------------------------------------
  useEffect(() => {

    if (!timeMinutes) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {

        if (prev <= 1) {
          clearInterval(interval);

          if (testId) {
            router.replace({
              pathname: "/test/ergebnis",
              params: { testId }
            });
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);

  }, [testId]);

  // ---------------------------------------------------------
  // Zeit formatieren
  // ---------------------------------------------------------
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ---------------------------------------------------------
  // OK
  // ---------------------------------------------------------
  const handleOk = async () => {
    try {
      await client.sendGivenAnswer();
      setChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------------------------------------------
  // Next
  // ---------------------------------------------------------
  const handleNext = () => {

    setQueue(prev => {

      if (!currentQuestion) return prev;

      let newQueue;

      if (checked) {
        newQueue = prev.slice(1);
      } else {
        newQueue = [...prev.slice(1), currentQuestion];
      }

      if (newQueue.length === 0 && testId) {

        router.replace({
          pathname: "/test/ergebnis",
          params: { testId }
        });

        return [];
      }

      setCurrentQuestion(newQueue[0]);

      return newQueue;
    });

    setChecked(false);
  };

  // ---------------------------------------------------------
  // Ladezustand
  // ---------------------------------------------------------
  if (!currentQuestion || !testId) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Test...</ThemedText>
      </ThemedView>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  const isLastQuestion = queue.length === 1;
  const nextDisabled = isLastQuestion && !checked;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/CISM_logo_RGB-1024x409.png')}
          style={styles.reactLogo}
        />
      }
    >

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title"></ThemedText>
        {timeMinutes > 0 && (
          <ThemedText style={styles.timer}>
            ⏱ {formatTime(timeLeft)}
          </ThemedText>
        )}
      </ThemedView>

      <Question
        ref={questionRef}
        question={currentQuestion}
        checked={checked}
        test={testId}
        user={user}
      />

      <ThemedView style={styles.fixToText}>
        {!checked && (
          <Button title="OK" onPress={handleOk} disabled={checked} />
        )}
        <Button title="Next" onPress={handleNext} disabled={nextDisabled} />
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between'
  },
  timer: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  reactLogo: {
    height: 163,
    width: 408,
    marginTop:40,
    marginLeft:30
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});