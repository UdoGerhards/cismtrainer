import { HelloWave } from '@/components/hello-wave';
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

export default function HomeScreen() {

  const params = useLocalSearchParams();

  const testId = String(params.testId);
  const questionCount = Number(params.questionCount);

  const { user } = useAuth();

  const [queue, setQueue] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [checked, setChecked] = useState(false);

  const questionRef = useRef(null);

  // ---------------------------------------------------------
  // Fragen laden
  // ---------------------------------------------------------
  useEffect(() => {

    console.log(testId);

    client.fetchQuestions(questionCount)
      .then((data: QuestionItem[]) => {

        if (!data || data.length === 0) return;

        setQueue(data);
        setCurrentQuestion(data[0]);

      })
      .catch(err => console.error(err));

  }, []);

  // ---------------------------------------------------------
  // OK → Antwort prüfen
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
  // Next → nächste Frage
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

      if (newQueue.length === 0) {

        console.log(testId);

        router.replace({
          pathname: "/test/ergebnis",
          params: {
            testId: testId
          }
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
  if (!currentQuestion) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Fragen...</ThemedText>
      </ThemedView>
    );
  }

  // ---------------------------------------------------------
  // Button-Logik
  // ---------------------------------------------------------

  const isLastQuestion = queue.length === 1;
  const nextDisabled = isLastQuestion && !checked;

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

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Test</ThemedText>
        <HelloWave />
      </ThemedView>

      <Question
        ref={questionRef}
        question={currentQuestion}
        checked={checked}
        test={testId}
        user={user}
      />

      <ThemedView style={styles.fixToText}>

        <Button
          title="OK"
          onPress={handleOk}
          disabled={checked}
        />

        <Button
          title="Next"
          onPress={handleNext}
          disabled={nextDisabled}
        />

      </ThemedView>

    </ParallaxScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

});