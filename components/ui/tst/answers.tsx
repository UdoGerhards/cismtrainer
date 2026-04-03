import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Checkbox from '@/components/ui/checkbox';
import { Answer } from "@/scripts/model/if_answer";
import client from '@/scripts/client';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from "@react-navigation/native";

export default function Answers({
  answers,
  correct,
  checked,
  questionId,
  test,
  user
}: {
  answers: Answer[],
  correct: string,
  checked: boolean, 
  questionId: number,
  test: number,
  user: any
}) {

  const { colors, dark } = useTheme();

  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: Answer) => {
    if (checked) return;

    setSelected(answer._id);

    let result = answer.answer.trim() === correct.trim();

    if (typeof test === "undefined") {
      test = null;
    }

    client.setGivenAnswer(user.id, test, questionId, answer._id, result);
  };

  return (
    <ThemedView>
      {answers.map(answer => {
        const isSelected = selected === answer._id;
        const isCorrect = answer.answer === correct;

        // 🔥 Theme-basierte Farben
        let backgroundColor = dark ? "#1e1e1e" : "#fff"; // Standard-Hintergrund

        if (checked) {
          if (isCorrect) {
            backgroundColor = dark ? "#1b5e20" : "#d4edda"; // grün angepasst
          }

          if (isSelected && !isCorrect) {
            backgroundColor = dark ? "#7f1d1d" : "#f8d7da"; // rot angepasst
          }
        }

        return (
          <TouchableOpacity
            key={answer._id}
            onPress={() => handleSelect(answer)}
            disabled={checked}
            style={[
              styles.answerContainer,
              { backgroundColor }
            ]}
          >
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              disabled={checked}
              color={colors.primary}
              uncheckedColor={colors.border}
              onPress={() => handleSelect(answer)}
            />

            <ThemedText style={{ marginLeft: 8 }}>
              {answer.text}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  }
});