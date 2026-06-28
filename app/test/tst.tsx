import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button, StyleSheet, View } from "react-native";

import { useEffect, useRef, useState } from "react";

import Question from "@/components/ui/tst/question";
import client from "@/scripts/client";
import { QuestionItem } from "@/scripts/model/if_question";

import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";

import { HeaderLogo } from "@/components/headerLogo";

export default function TestScreen() {
  const { colors } = useTheme(); // ✅ THEME
  const { user } = useAuth();

  const params = useLocalSearchParams();

  const title = String(params.title);
  const questionCount = Number(params.questionCount);
  const timeMinutes = Number(params.timeMinutes);

  const rawDomains = params.domains;

  const [testId, setTestId] = useState<string | null>(null);

  const [queue, setQueue] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [questionsFetched, setQuestionsFetched] = useState(0);

  // Steuert das Einfärben und die Sichtbarkeit des Next-Buttons
  const [checked, setChecked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);

  const questionRef = useRef(null);

  useEffect(() => {
    const initTest = async () => {
      try {
        const domainArray = rawDomains ? String(rawDomains).split(",") : [];

        console.debug(domainArray);

        if (client.setDomains && domainArray.length > 0) {
          await client.setDomains(domainArray);
          console.log("Domains an Server übermittelt:", domainArray);
        }

        const result = await client.createTest(title);
        const newTestId = result._id;

        setTestId(newTestId);

        const qstions = await client.fetchQuestion(true);
        const data = qstions[0];

        if (!data) return;

        setQueue([data]);
        setCurrentQuestion(data);
        setQuestionsFetched(1);
      } catch (err) {
        console.error("Fehler bei der Test-Initialisierung:", err);
      }
    };

    initTest();
  }, [rawDomains, title]);

  useEffect(() => {
    if (!timeMinutes) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          if (testId) {
            router.replace({
              pathname: "/test/ergebnis",
              params: { testId },
            });
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testId, timeMinutes]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 🌟 NEU: Diese Funktion wird aufgerufen, sobald in Answers geklickt wird
  const handleAnswerSelected = async () => {
    try {
      // 1. Erst die Antwort an die Datenbank senden (wie im alten OK-Button)
      await client.sendGivenAnswer();
      // 2. Danach das UI rot/grün einfärben und den Next-Button zeigen
      setChecked(true);
    } catch (err) {
      console.error("Fehler beim Speichern der Antwort:", err);
    }
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    const nextQueue = [...queue];
    const currentItem = nextQueue.shift(); // Aktuelle Frage entfernen

    // 1. Neue Frage vom Server nachladen?
    if (
      questionsFetched < questionCount &&
      (nextQueue.length === 0 || !checked)
    ) {
      try {
        const result = await client.fetchQuestion(true);
        const data = result[0];

        if (data) {
          nextQueue.push(data);
          setQuestionsFetched((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Fehler beim Laden der nächsten Frage:", err);
      }
    }

    // 2. Recycling: Wenn die Frage nicht beantwortet wurde (Skip), hinten anstellen
    if (!checked && currentItem) {
      nextQueue.push(currentItem);
    }

    // 3. Abschlussprüfung: Sind noch Fragen in der Liste?
    if (nextQueue.length === 0) {
      if (testId) {
        router.replace({
          pathname: "/test/ergebnis",
          params: { testId },
        });
      }
      return;
    }

    // 4. States für die nächste Frage setzen
    setQueue(nextQueue);
    setCurrentQuestion(nextQueue[0]);
    setChecked(false); // Setzt den Zustand für die neue Frage zurück (entfärbt das UI)
  };

  if (!currentQuestion || !testId) {
    return (
      <ThemedView
        style={[styles.stepContainer, { backgroundColor: colors.background }]}
      >
        <ThemedText>Lade Test...</ThemedText>
      </ThemedView>
    );
  }

  const isLastQuestion =
    questionsFetched === questionCount && queue.length === 1;

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
          style={[
            styles.titleContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ThemedText type="title">{title}</ThemedText>

          {timeMinutes > 0 && (
            <ThemedView
              style={[
                styles.timerBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <ThemedText style={[styles.timer, { color: colors.text }]}>
                ⏱ {formatTime(timeLeft)}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView
          style={[
            styles.questionWrapper,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 0,
              borderRadius: 12,
              padding: 12,
            },
          ]}
        >
          <Question
            key={currentQuestion._id}
            ref={questionRef}
            question={currentQuestion}
            checked={checked}
            test={testId}
            user={user}
            // 🌟 Verweist nun auf die obige Speicher-Logik
            onAnswerSelected={handleAnswerSelected}
          />
        </ThemedView>

        <ThemedView style={styles.fixToText}>
          <View style={{ flex: 1 }} />

          {/* Der Button erscheint sofort, sobald eine Antwort ausgewählt wurde */}
          {checked && (
            <Button
              title={isLastQuestion ? "Test beenden" : "Next"}
              onPress={handleNext}
              color={colors.primary}
            />
          )}
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  timerBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timer: {
    fontSize: 16,
    fontWeight: "bold",
  },
  questionWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
});
