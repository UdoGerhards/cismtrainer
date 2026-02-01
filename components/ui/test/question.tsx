import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Answers from '@/components/ui/test/answers';
import { QuestionItem } from '@/scripts/test/if_question';
import { StyleSheet } from 'react-native';

export default function Test({
  questions = [],
  checked
}: {
  questions?: QuestionItem[],
  checked: boolean
}) {
  return (
    <>
      {questions.map((q, i) => (
        <ThemedView key={i} style={styles.stepContainer}>
          <ThemedText>{q.question}</ThemedText>

          <Answers
            answers={q.answers}
            correct={q.correct}
            checked={checked}   // <-- Prüfung von oben weitergeben
          />
        </ThemedView>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
