import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Answers from '@/components/ui/tst/answers';
import { QuestionItem } from '@/scripts/model/if_question';
import React, { forwardRef } from "react";
import { StyleSheet } from 'react-native';

function TestComponent(
  {
    question,
    checked,
    test,
    user
  }: {
    question?: QuestionItem | null,
    checked: boolean,
    test?: number,
    user: any
  },
  ref: any
) {

  // ✅ Safety Check
  if (!question) {
    return (
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Keine Frage geladen.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.stepContainer}>

      {/* 🔥 Fragetext */}
      <ThemedText>
        {question.question}
      </ThemedText>

      {/* 🔥 Antworten */}
      <Answers
        answers={question.answers}
        correct={question.correct}
        checked={checked}
        questionId={question._id}
        test={test}
        user={user}
      />

    </ThemedView>
  );
}

export default forwardRef(TestComponent);

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});