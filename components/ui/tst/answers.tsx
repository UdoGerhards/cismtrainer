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
  onSelectAnswer, // 🌟 NEU: Dieses Callback informiert die Question-Komponente über den Klick
}: {
  answers: Answer[];
  correct: string;
  checked: boolean;
  questionId: string | number; // Flexibel gehalten, falls IDs Strings sind
  test: string | number | null;
  user: any;
  onSelectAnswer: () => void; // 🌟 NEU
}) {
  const { colors, dark } = useTheme();

  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = async (answer: Answer) => {
    if (checked) return; // Wenn schon ausgewertet, Klicks sperren

    setSelected(answer._id);

    // 1. Ergebnis lokal prüfen
    const result = answer.type.trim() === correct.trim();
    const safeTest = typeof test === "undefined" ? null : test;

    try {
      // 2. Antwort direkt im Hintergrund an den Server senden
      if (client.setGivenAnswer) {
        await client.setGivenAnswer(
          user.id,
          safeTest,
          questionId,
          answer._id,
          result,
        );
      } else if (client.sendGivenAnswer) {
        // Falls deine Methode im Client 'sendGivenAnswer' heißt:
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

    // 3. Dem Parent-Screen Bescheid geben, damit checked auf true gesetzt wird
    // (Aktiviert sofort die Farben und zeigt den "Next"-Button)
    onSelectAnswer();
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
            : "#f5f5f5";

        // ✅ Zustand nach Auswahl (Rot/Grün Einfärbung)
        if (checked) {
          if (isCorrect) {
            backgroundColor = dark ? "#1b5e20" : "#d4edda"; // grün bei korrekter Antwort
          } else if (isSelected) {
            backgroundColor = dark ? "#7f1d1d" : "#f8d7da"; // rot bei falscher Auswahl
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

            <ThemedText style={styles.answerText}>
              {answer.text}
              <br />
              <ThemedText style={{ color: "#aaaaaa" }}>
                {answer.question} - {answer.question_id} - {answer.type}{" "}
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
    flex: 1, // Verhindert Text-Overflow bei sehr langen Antworttexten
  },
});
