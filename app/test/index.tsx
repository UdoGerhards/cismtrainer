import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

import { HeaderLogo } from "@/components/headerLogo";

import client from "@/scripts/client";

// 🌟 Name sauber von ConfigScreen zu TestConfigScreen geändert
export default function TestConfigScreen() {
  const { colors } = useTheme(); // ✅ THEME

  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");

  const [domains, setDomains] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTitle("");
    setQuestionCount("");
    setTimeMinutes("");
  }, []);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setIsLoading(true);
        const data = await client.fetchDomains();
        const fetchedDomains = data || [];
        setDomains(fetchedDomains);

        const allDomainIds = fetchedDomains.map((d) => d.id || d._id || d);
        setSelectedDomains(allDomainIds);
      } catch (err) {
        setError("Domains konnten nicht geladen werden.");
        console.error("Fehler im Frontend:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDomains();
  }, []);

  const toggleDomain = (domainId) => {
    if (selectedDomains.includes(domainId)) {
      setSelectedDomains(selectedDomains.filter((id) => id !== domainId));
    } else {
      setSelectedDomains([...selectedDomains, domainId]);
    }
  };

  const isFormValid =
    title.trim().length > 0 &&
    Number(questionCount) > 0 &&
    Number(timeMinutes) > 0 &&
    selectedDomains.length > 0;

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
        domains: selectedDomains.join(","),
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
            autoComplete="off"
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
            autoComplete="one-time-code"
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
            autoComplete="one-time-code"
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

          <ThemedText style={[styles.label, { marginTop: 8 }]}>
            CISM-Domains:
          </ThemedText>

          {isLoading && (
            <ActivityIndicator
              color={colors.primary}
              style={{ alignSelf: "flex-start" }}
            />
          )}
          {error && <ThemedText style={{ color: "red" }}>{error}</ThemedText>}

          {!isLoading && !error && (
            <View style={styles.checkboxContainer}>
              {domains.map((domain) => {
                const domainId = domain.id || domain._id || domain;
                const domainName = domain.name || domain.title || domain;

                const isChecked = selectedDomains.includes(domainId);

                return (
                  <Pressable
                    key={
                      domainId ? domainId.toString() : Math.random().toString()
                    }
                    style={styles.checkboxRow}
                    onPress={() => toggleDomain(domainId)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: colors.border,
                          backgroundColor: isChecked
                            ? colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      {isChecked && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>
                      {domainName}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}

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
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  checkboxContainer: {
    gap: 12,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 16,
  },
  checkboxLabel: {
    fontSize: 15,
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
