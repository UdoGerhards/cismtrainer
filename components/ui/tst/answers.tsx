import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Checkbox from "@/components/ui/checkbox";
import client from "@/scripts/client";
import { Answer } from "@/scripts/model/if_answer";
import { useTheme } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function Answers({
  answers,
  correct,
  checked,
  questionId,
  test,
  user,
  onSelectAnswer,
}: {
  answers: Answer[];
  correct: string;
  checked: boolean;
  questionId: string | number;
  test: string | number | null;
  user: any;
  onSelectAnswer: () => void;
}) {
  const { colors, dark } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (answer: Answer) => {
    if (checked) return;

    setSelected(answer._id);

    // Prüfung basierend auf ID-Vergleich
    const result = answer._id === correct;
    const safeTest = typeof test === "undefined" ? null : test;

    try {
      if (client.setGivenAnswer) {
        await client.setGivenAnswer(
          user.id,
          safeTest,
          questionId,
          answer._id,
          result,
        );
      } else if (client.sendGivenAnswer) {
        await client.sendGivenAnswer(
          user.id,
          safeTest,
          questionId,
          answer._id,
          result,
        );
      }
    } catch (err) {
      console.error("Fehler beim Senden der Antwort:", err);
    }

    onSelectAnswer();
  };

  return (
    <ThemedView>
      {answers.map((answer) => {
        const isSelected = selected === answer._id;
        const isCorrect = answer.type.trim() === correct.trim();
        // Basis-Farben
        let backgroundColor =
          colors.answerBackground || (dark ? "#1e1e1e" : "#f5f5f5");

        // Logik für die Einfärbung nach Auswahl
        if (checked) {
          if (isCorrect) {
            backgroundColor = dark ? "#1b5e20" : "#d4edda"; // Grün für korrekt
          } else if (isSelected) {
            backgroundColor = dark ? "#7f1d1d" : "#f8d7da"; // Rot nur für die falsch gewählte
          }
        } else if (isSelected) {
          backgroundColor = colors.primary + "30"; // Leichtes Highlight während der Auswahl
        }

        return (
          <TouchableOpacity
            key={answer._id}
            onPress={() => handleSelect(answer)}
            disabled={checked}
            style={[
              styles.answerContainer,
              {
                backgroundColor,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Checkbox
              status={isSelected ? "checked" : "unchecked"}
              disabled={checked}
              color={colors.primary}
              uncheckedColor={colors.border}
              onPress={() => handleSelect(answer)}
            />

            <ThemedText style={styles.answerText}>
              {answer.text}
              {"\n"}
              <ThemedText style={{ color: "#aaaaaa", fontSize: 12 }}>
                {answer.question_id}
              </ThemedText>
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  answerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  answerText: {
    marginLeft: 8,
    flex: 1,
  },
});
