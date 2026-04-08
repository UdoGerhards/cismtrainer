import { router } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

import { HeaderLogo } from "@/components/headerLogo";

export default function ConfigScreen() {
  const { colors } = useTheme(); // ✅ THEME

  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");

  const isFormValid =
    title.trim().length > 0 &&
    Number(questionCount) > 0 &&
    Number(timeMinutes) > 0;

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
    <View style={{ flex: 1 }}>
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
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.label}>Title:</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title of your test"
            placeholderTextColor={colors.border}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <ThemedText style={styles.label}>Number questions:</ThemedText>
          <TextInput
            value={questionCount}
            onChangeText={setQuestionCount}
            keyboardType="numeric"
            placeholder="For e.g. 20, 30, ..."
            placeholderTextColor={colors.border}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <ThemedText style={styles.label}>Time (minutes):</ThemedText>
          <TextInput
            value={timeMinutes}
            onChangeText={setTimeMinutes}
            keyboardType="numeric"
            placeholder="For e.g. 60, 120, ..."
            placeholderTextColor={colors.border}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <ThemedView style={styles.fixToText}>
            <Button
              title="Test starten"
              onPress={startTest}
              disabled={!isFormValid}
              color={isFormValid ? colors.primary : colors.border}
            />
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
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
    padding: 10,
    borderRadius: 8,
  },

  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
