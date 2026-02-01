import { ThemedView } from '@/components/themed-view';
import { Answer } from "@/scripts/if_answer";

import { ThemedText } from '@/components/themed-text';
import Checkbox from '@/components/ui/checkbox';
import client from '@/scripts/test/client';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function Answers({
  answers,
  correct,
  checked
}: {
  answers: Answer[],
  correct: string,
  checked: boolean   // <-- Prüfung kommt jetzt von außen
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (answer: Answer) => {
    setSelected(answer._id);
    client.setGivenAnswer(answer);
  };

  return (
    <ThemedView>
      {answers.map(answer => {
        const isSelected = selected === answer._id;
        const isCorrect = answer.answer === correct;

        // Hintergrundfarbe bestimmen
        let backgroundColor = "#fff";

        if (checked && isSelected) {
          backgroundColor = isCorrect ? "lightgreen" : "salmon";
        }

        return (
          <TouchableOpacity
            key={answer._id}
            onPress={() => handleSelect(answer)}
            style={[
              styles.answerContainer,
              { backgroundColor }
            ]}
          >
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              disabled={false}
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
