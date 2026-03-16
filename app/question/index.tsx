import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Button, LogBox, StyleSheet } from 'react-native';

import { useEffect, useRef, useState } from "react";

import Question from '@/components/ui/tst/question';
import client from '@/scripts/client';
import { QuestionItem } from '@/scripts/model/if_question';

import { useAuth } from "@/context/AuthContext"; // ⭐ neu
import { Stack } from "expo-router";

LogBox.ignoreLogs([
  "props.pointerEvents is deprecated"
]);

export default function HomeScreen() {

  const { user, loading: authLoading } = useAuth();   // ⭐ neu

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  const [nextDisabled, setNextDisabled] = useState(true);
  const [okDisabled, setOkDisabled] = useState(false);

  const questionRef = useRef(null);

  const loadNextQuestion = () => {
    setLoading(true);

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
  }, []);

  // 🔐 Auth lädt noch
  if (authLoading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Benutzer ...</ThemedText>
      </ThemedView>
    );
  }

  // 📚 Fragen laden
  if (loading) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Lade Fragen ...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
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
        }
      >

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">
            Question!
          </ThemedText>
        </ThemedView>

        <Question
          ref={questionRef}
          question={questions}
          checked={checked}
          user={user}
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