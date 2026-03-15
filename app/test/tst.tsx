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

import { router, useLocalSearchParams } from "expo-router";

export default function HomeScreen() {

  const { testId, questionCount, timeMinutes } = useLocalSearchParams(); 
  
  // 🔥 FIFO-Stack
  const [stack, setStack] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);

  const [checked, setChecked] = useState(false);

  // Button-States
  const [nextDisabled, setNextDisabled] = useState(false);
  const [okDisabled, setOkDisabled] = useState(false);

  const questionRef = useRef(null);

  // ---------------------------------------------------------
  // 🔥 Lädt initial ALLE Fragen in den FIFO-Stack
  // ---------------------------------------------------------
  useEffect(() => {
    client.fetchRandom(questionCount)
      .then(data => {
        setStack(data);
        setCurrentQuestion(data[0]);
      })
      .catch(err => console.error(err));
  }, []);

  // ---------------------------------------------------------
  // 🔥 Holt die nächste Frage aus dem FIFO-Stack (mit Ergebnis-Weiterleitung)
  // ---------------------------------------------------------
  const loadNextQuestion = () => {

    setStack(prev => {
      let newStack;

      if (!checked && currentQuestion) {
        // unbeantwortete Frage hinten anhängen
        newStack = [...prev.slice(1), currentQuestion];
      } else {
        // beantwortete Frage entfernen
        newStack = prev.slice(1);
      }

      // 👉 Wenn der Stack jetzt leer ist → Ergebnis-Seite
      if (newStack.length === 0) {
        router.replace({
          pathname: "/ergebnis",
          params: { testId }
        });
        return [];
      }

      // neue Frage setzen
      setCurrentQuestion(newStack[0]);

      return newStack;
    });

    // Buttons zurücksetzen
    setOkDisabled(false);
    setChecked(false);
  };

  if (!currentQuestion) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Keine Fragen mehr im Stack.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* 🔥 Neue Übergabe: EIN Question-Objekt */}
      <Question
        ref={questionRef}
        question={currentQuestion}
        checked={checked}
        test= {testId}
      />

      <ThemedView style={styles.fixToText}>
        <Button
          title=" OK "
          disabled={okDisabled}
          onPress={() => {
            client.sendGivenAnswer();
            setChecked(true);

            setOkDisabled(true);
            setNextDisabled(false);
          }}
        />

        <Button
          title="Next"
          onPress={loadNextQuestion}
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
