import Pie from "@/components/charts/pie.chart";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import client from "@/scripts/client";
import { Image } from 'expo-image';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet } from 'react-native';

import { useAuth } from "@/context/AuthContext";

export default function ErgebnisScreen() {
  const { testId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await client.calculateTestResults(testId);
        console.log(res);
        const evaluation = await client.getTestEvaluation(testId);
        console.log(evaluation);
        setResult(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [testId]);

  if (loading || !result) {
    return (
      <ThemedView>
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  const pieData = [
    { name: "OK", value: result.correct ?? 0 },
    { name: "Wrong", value: result.wrong ?? 0 }
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >

      {/* 🔥 HEADER */}
      <ThemedView>
        <ThemedText type="title">Ergebnis</ThemedText>
        <Pie data={pieData} />
      </ThemedView>

      {/* 🔥 TABLE */}
      <ThemedView style={styles.tableContainer}>
        <ThemedText type="subtitle">Antworten</ThemedText>

        {/* Header */}
        <ThemedView style={styles.tableHeader}>
          <ThemedText style={styles.cell}>Frage</ThemedText>
          <ThemedText style={styles.cell}>Antwort</ThemedText>
          <ThemedText style={styles.cell}>OK</ThemedText>
        </ThemedView>

        {/* Rows */}
        <FlatList
          data={result.answers || []}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ThemedView style={styles.tableRow}>
              <ThemedText style={styles.cell}>
                {item.question_id}
              </ThemedText>

              <ThemedText style={styles.cell}>
                {item.answer_id}
              </ThemedText>

              <ThemedText
                style={[
                  styles.cell,
                  { color: item.correct ? "green" : "red" }
                ]}
              >
                {item.correct ? "✔️" : "❌"}
              </ThemedText>
            </ThemedView>
          )}
        />
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },

  tableContainer: {
    marginTop: 20,
    width: '100%',
  },

  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingBottom: 6,
    marginBottom: 6,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  cell: {
    flex: 1,
    fontSize: 12,
  },
});