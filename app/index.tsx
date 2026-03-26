import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { Image } from 'expo-image';
import { useEffect, useState } from "react";
import { Button, StyleSheet, View, useWindowDimensions } from 'react-native';

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// 🎯 CONFIG
const TARGET = 80;
const MOVING_AVG_WINDOW = 3;

export default function Performance() {

  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);
  const [range, setRange] = useState(7);

  // 🔥 GROUPING
  function groupAndAggregateByDate(data) {
    const map = {};

    data.forEach(item => {
      const rawDate = new Date(item.date);
      const dateKey = rawDate.toISOString().split("T")[0];

      if (!map[dateKey]) {
        map[dateKey] = {
          sortDate: rawDate,
          totalTests: 0,
          totalAnswers: 0,
          correct: 0,
          wrong: 0,
        };
      }

      const group = map[dateKey];

      group.totalTests += 1;

      const answers = (item.correct || 0) + (item.wrong || 0);
      group.totalAnswers += answers;
      group.correct += item.correct || 0;
      group.wrong += item.wrong || 0;
    });

    return map;
  }

  // 🔥 TRANSFORM + MOVING AVG
  function transformData(grouped) {
    const sorted = Object.entries(grouped)
      .map(([date, value]) => ({
        rawDate: new Date(date),
        date: new Date(date).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit"
        }),
        correct: value.correct,
        wrong: value.wrong,
        tests: value.totalTests,
        avg:
          value.totalAnswers === 0
            ? 0
            : (value.correct / value.totalAnswers) * 100,
      }))
      .sort((a, b) => a.rawDate - b.rawDate);

    return sorted.map((d, i, arr) => {
      const start = Math.max(0, i - MOVING_AVG_WINDOW + 1);
      const slice = arr.slice(start, i + 1);

      const movingAvg =
        slice.reduce((sum, x) => sum + x.avg, 0) / slice.length;

      return {
        ...d,
        trend: Math.round(movingAvg),
      };
    });
  }

  // 🔥 FILTER
  function filterData(data, days) {
    const now = new Date();
    return data.filter(d => {
      const diff = (now - d.rawDate) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });
  }

  useEffect(() => {
    async function loadResult() {
      try {
        if (!user?.id) return;

        const result = await client.getPerformance(user.id);
        const tests = result.list;

        const grouped = groupAndAggregateByDate(tests);
        setPerformance(grouped);

      } catch (error) {
        console.error("Fehler beim Laden:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [user]);

  if (loading || !performance) {
    return (
      <ThemedView>
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  const transformed = transformData(performance);
  const chartData = filterData(transformed, range);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/CISM_logo_RGB-1024x409.png')}
          style={styles.reactLogo}
        />
      }
    >

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Your performance</ThemedText>
      </ThemedView>

      {/* 🔥 FILTER */}
      <View style={styles.buttonRow}>
        <Button title="7 Tage" onPress={() => setRange(7)} />
        <Button title="30 Tage" onPress={() => setRange(30)} />
        <Button title="Alle" onPress={() => setRange(3650)} />
      </View>

      {/* 🔥 CHART */}
      <ThemedView style={styles.chartContainer}>

        <ComposedChart
          width={width - 20} // 🔥 volle Breite (mit Padding)
          height={300}
          data={chartData}
        >

          {/* 🎨 GRADIENT */}
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#f44336" stopOpacity={0.8} />
              <stop offset={`${TARGET}%`} stopColor="#f44336" />
              <stop offset={`${TARGET}%`} stopColor="#4caf50" />
              <stop offset="100%" stopColor="#4caf50" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#eee" />

          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />

          <Tooltip />
          <Legend />

          {/* 🎯 TARGET */}
          <ReferenceLine
            y={TARGET}
            stroke="blue"
            strokeDasharray="5 5"
          />

          {/* 🌈 TREND */}
          <Area
            type="monotone"
            dataKey="trend"
            stroke="#8884d8"
            fill="url(#trendGradient)"
          />

          {/* 📊 STACKED */}
          <Bar dataKey="correct" stackId="a" fill="#4caf50">
            <LabelList dataKey="correct" position="top" />
          </Bar>

          <Bar dataKey="wrong" stackId="a" fill="#f44336">
            <LabelList dataKey="wrong" position="top" />
          </Bar>

          {/* 📈 TESTS */}
          <Line
            type="monotone"
            dataKey="tests"
            stroke="#050505"
            strokeWidth={2}
          />

        </ComposedChart>

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
  reactLogo: {
    height: 163,
    width: 408,
    marginTop:40,
    marginLeft:30
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    marginTop: 50
  },
});