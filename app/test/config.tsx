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

  // ---------------------------------------------------------
  // Start Test (nur Navigation!)s
  // ---------------------------------------------------------
  const startTest = () => {

    // einfache Defaults / Absicherung
    const safeTitle = title || "CISM Test";
    const safeQuestionCount = Number(questionCount) || 20;
    const safeTimeMinutes = Number(timeMinutes) || 0;

    router.push({
      pathname: "/test/tst",
      params: {
        title: safeTitle,
        questionCount: safeQuestionCount.toString(),
        timeMinutes: safeTimeMinutes.toString(),
        ts: Date.now(), 
      },
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
      }
    >
      <ThemedView style={styles.container}>

        <ThemedText style={styles.label}>Titel</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titel eingeben"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Anzahl Fragen</ThemedText>
        <TextInput
          value={questionCount}
          onChangeText={setQuestionCount}
          keyboardType="numeric"
          placeholder="z. B. 20"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Zeit (Minuten)</ThemedText>
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

      </ThemedView>
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