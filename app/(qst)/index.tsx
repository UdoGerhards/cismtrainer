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

import { Stack } from "expo-router"; // 🔥 Wichtig für Header-Titel

export default function HomeScreen() {

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  // 🔥 Button-States
  const [nextDisabled, setNextDisabled] = useState(true);
  const [okDisabled, setOkDisabled] = useState(false);

  const questionRef = useRef(null);

  const loadNextQuestion = () => {
    setLoading(true);

    // 🔥 Buttons zurücksetzen
    setNextDisabled(true);
    setOkDisabled(false);

    client.fetchQuestion()
      .then(data => {
        setQuestions(data);
        setChecked(false);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadNextQuestion();
  }, {});

  if (loading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Fragen ...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      {/* 🔥 Erzwingt den Header-Titel für diesen Screen */}
      <Stack.Screen
        options={{
          title: "Random Question",
        }}
      />

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/CISMw.png')}
            style={styles.reactLogo}
          />
        }>

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView>

        <Question
          ref={questionRef}
          question={questions}
          checked={checked}
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
