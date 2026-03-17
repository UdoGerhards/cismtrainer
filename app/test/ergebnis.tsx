import Pie from "@/components/charts/pie.chart";
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import client from "@/scripts/client";
import { Image } from 'expo-image';
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from 'react-native';

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

        setResult(res);
      } catch (err) {
        console.error(err);
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
    { name: "OK", value: result.ok },
    { name: "Wrong", value: result.wrong }
  ];

  return (

    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>

      <ThemedView>
        <ThemedText type="title">Ergebnis: </ThemedText>
        <Pie data={pieData} />
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
