import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Checkbox from "@/components/ui/checkbox";
import { Answer } from "@/scripts/model/if_answer";
import client from "@/scripts/client";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";

export default function Answers({
  answers,
  correct,
  checked,
  questionId,
  test,
  user,
}: {
  answers: Answer[];
  correct: string;
  checked: boolean;
  questionId: number;
  test: number;
  user: any;
}) {
  const { colors, dark } = useTheme();

  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: Answer) => {
    if (checked) return;

    setSelected(answer._id);

    const result = answer.answer.trim() === correct.trim();

    const safeTest = typeof test === "undefined" ? null : test;

    client.setGivenAnswer(user.id, safeTest, questionId, answer._id, result);
  };

  return (
    <ThemedView>
      {answers.map((answer) => {
        const isSelected = selected === answer._id;
        const isCorrect = answer.answer === correct;

        // 🔥 Basis-Hintergrund (Light/Dark sauber definiert)
        let backgroundColor = colors.answerBackground
          ? colors.answerBackground
          : dark
            ? "#1e1e1e"
            : "#f5f5f5"; // 👈 kein hartes Weiß mehr

        // ✅ Zustand nach Auswahl
        if (checked) {
          if (isCorrect) {
            backgroundColor = dark ? "#1b5e20" : "#d4edda"; // grün
          } else if (isSelected) {
            backgroundColor = dark ? "#7f1d1d" : "#f8d7da"; // rot
          }
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
                borderColor: colors.border,
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

            <ThemedText style={styles.answerText}>{answer.text}</ThemedText>
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
  },
});
