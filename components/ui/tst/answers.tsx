import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Checkbox from '@/components/ui/checkbox';
import { Answer } from "@/scripts/model/if_answer";
//import TestAnswer from '@/scripts/model/testModel/testAnswer';
import client from '@/scripts/client';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function Answers({
  answers,
  correct,
  checked,
  questionId,
  test,
  user
}: {
  answers: [],
  correct: string,
  checked: boolean, 
  questionId: number,
  test: number,
  user: object
}) {

  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: Answer) => {
    if (checked) return; // verhindert erneutes Klicken nach Auswertung
    setSelected(answer._id);

    let result = answer.answer.trim() === correct.trim()?true:false;

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

        let backgroundColor = "#fff";

        if (checked) {
          // richtige Antwort immer grün
          if (isCorrect) {
            backgroundColor = "lightgreen";
          }

          // falsche Auswahl rot
          if (isSelected && !isCorrect) {
            backgroundColor = "salmon";
          }
        }

        return (
          <TouchableOpacity
            key={answer._id}
            onPress={() => handleSelect(answer)}
            disabled={checked} // deaktiviert Touch
            style={[
              styles.answerContainer,
              { backgroundColor }
            ]}
          >
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              disabled={checked} // deaktiviert Checkbox
              color="#6200ee"
              uncheckedColor="#757575"
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
