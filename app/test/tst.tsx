import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";
import { Button, StyleSheet, View } from "react-native";

import { useEffect, useRef, useState } from "react";

import Question from "@/components/ui/tst/question";
import client from "@/scripts/client";
import { QuestionItem } from "@/scripts/model/if_question";

import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";

export default function TestScreen() {
  const { colors } = useTheme(); // ✅ THEME
  const { user } = useAuth();

  const params = useLocalSearchParams();

  const title = String(params.title);
  const questionCount = Number(params.questionCount);
  const timeMinutes = Number(params.timeMinutes);

  const [testId, setTestId] = useState<string | null>(null);

  const [queue, setQueue] = useState<QuestionItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(
    null,
  );
  const [checked, setChecked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(timeMinutes * 60);

  const questionRef = useRef(null);

  useEffect(() => {
    const initTest = async () => {
      try {
        const result = await client.createTest(user?.id, title);
        const newTestId = result._id;

        setTestId(newTestId);

        const data: QuestionItem[] = await client.fetchQuestions(questionCount);

        if (!data || data.length === 0) return;

        setQueue(data);
        setCurrentQuestion(data[0]);
      } catch (err) {
        console.error(err);
      }
    };

    initTest();
  }, []);

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
  }, [testId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleOk = async () => {
    try {
      await client.sendGivenAnswer();
      setChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = () => {
    setQueue((prev) => {
      if (!currentQuestion) return prev;

      let newQueue;

      if (checked) {
        newQueue = prev.slice(1);
      } else {
        newQueue = [...prev.slice(1), currentQuestion];
      }

      if (newQueue.length === 0 && testId) {
        router.replace({
          pathname: "/test/ergebnis",
          params: { testId },
        });

        return [];
      }

      setCurrentQuestion(newQueue[0]);

      return newQueue;
    });

    setChecked(false);
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

  const isLastQuestion = queue.length === 1;
  const nextDisabled = isLastQuestion && !checked;

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
        headerImage={
          <Image
            source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
            style={styles.reactLogo}
          />
        }
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
            ref={questionRef}
            question={currentQuestion}
            checked={checked}
            test={testId}
            user={user}
          />
        </ThemedView>

        <ThemedView style={styles.fixToText}>
          {!checked && (
            <Button
              title="OK"
              onPress={handleOk}
              disabled={checked}
              color={colors.primary}
            />
          )}
          <Button
            title="Next"
            onPress={handleNext}
            disabled={nextDisabled}
            color={colors.primary}
          />
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

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },

  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
});
