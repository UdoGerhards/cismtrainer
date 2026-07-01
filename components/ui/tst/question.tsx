import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Answers from "@/components/ui/tst/answers";
import { QuestionItem } from "@/scripts/model/if_question";
import React, { forwardRef } from "react";
import { StyleSheet } from "react-native";

function TestComponent(
  {
    question,
    checked,
    test,
    user,
    onAnswerSelected, // 🌟 NEU: Wird aufgerufen, sobald der User eine Antwort anklickt
  }: {
    question?: QuestionItem | null;
    checked: boolean;
    test?: string | null; // Auf String angepasst, da testId im Screen ein String/Null ist
    user: any;
    onAnswerSelected: () => void; // 🌟 NEU
  },
  ref: any,
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
      <ThemedText style={styles.questionText}>
        {question.question} <br />
        <ThemedText style={{ color: "#aaaaaa", fontWeight: "normal" }}>
          {question._id}
        </ThemedText>
      </ThemedText>

      {/* 🔥 Antworten */}
      <Answers
        answers={question.answers}
        correct={question.correct}
        checked={checked}
        questionId={question._id}
        test={test}
        user={user}
        // 🌟 NEU: Answers muss diese Funktion triggern, wenn eine Antwort gedrückt wurde
        onSelectAnswer={onAnswerSelected}
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
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    marginBottom: 8,
  },
});
