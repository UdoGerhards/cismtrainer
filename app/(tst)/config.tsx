import client from '@/scripts/tst/client';

import { router } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';

export default function ConfigScreen() {
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(false);

  const startTest = () => {

    client.createTest(title)
      .then(result => {
        let testId = result.insertedId;

        router.push({
          pathname: "/(tst)/tst",
          params: {
            testId,
            questionCount,
            timeMinutes
          },
        });
      })
      .catch(err => {
        // Fehler → Abbruch
        console.error(err);
      });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.label}>Titel</ThemedText >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titel eingeben"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Anzahl Fragen</ThemedText >
        <TextInput
          value={questionCount}
          onChangeText={setQuestionCount}
          keyboardType="numeric"
          placeholder="z. B. 20"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Zeit (Minuten)</ThemedText >
        <TextInput
          value={timeMinutes}
          onChangeText={setTimeMinutes}
          keyboardType="numeric"
          placeholder="z. B. 60"
          style={styles.input}
        />

        <ThemedView style={styles.fixToText}>
          <Button title="Test starten" onPress={startTest} />
        </ThemedView>
      </ThemedView >
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
