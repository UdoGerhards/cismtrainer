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

  // ✅ Validierung
  const isFormValid =
    title.trim().length > 0 &&
    Number(questionCount) > 0 &&
    Number(timeMinutes) > 0;

  // ---------------------------------------------------------
  // Start Test (nur Navigation!)
  // ---------------------------------------------------------
  const startTest = () => {
    if (!isFormValid) return;

    const safeTitle = title;
    const safeQuestionCount = Number(questionCount);
    const safeTimeMinutes = Number(timeMinutes);

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
          source={require('@/assets/images/CISM_logo_RGB-1024x409.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.container}>

        <ThemedText style={styles.label}>Title:</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title of your test"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Number questions:</ThemedText>
        <TextInput
          value={questionCount}
          onChangeText={setQuestionCount}
          keyboardType="numeric"
          placeholder="For e.g. 20, 30, ..."
          placeholderTextColor="#999"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Time (minutes):</ThemedText>
        <TextInput
          value={timeMinutes}
          onChangeText={setTimeMinutes}
          keyboardType="numeric"
          placeholder="For e.g. 60, 120, ..."
          placeholderTextColor="#999"
          style={styles.input}
        />

        <ThemedView style={styles.fixToText}>
          <Button
            title="Test starten"
            onPress={startTest}
            disabled={!isFormValid}
            color={isFormValid ? "#007AFF" : "#ccc"}
          />
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
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30
  },
});