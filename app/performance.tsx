import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

// 📊 Charts (NEU)
import { LineChart, StackedBarChart } from "react-native-chart-kit";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

// 🎯 CONFIG
const TARGET = 80;
const MOVING_AVG_WINDOW = 3;

export default function Performance() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any>(null);
  const [range, setRange] = useState(7);
  const { colors } = useTheme();

  // ===============================
  // 🔥 GROUPING
  // ===============================
  function groupAndAggregateByDate(data: any[]) {
    const map: any = {};

    data.forEach((item) => {
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

  // ===============================
  // 🔥 TRANSFORM
  // ===============================
  function transformData(grouped: any) {
    const sorted = Object.entries(grouped)
      .map(([date, value]: any) => ({
        rawDate: new Date(date),
        date: new Date(date).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        }),
        correct: value.correct,
        wrong: value.wrong,
        tests: value.totalTests,
        avg:
          value.totalAnswers === 0
            ? 0
            : (value.correct / value.totalAnswers) * 100,
      }))
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    return sorted.map((d, i, arr) => {
      const start = Math.max(0, i - MOVING_AVG_WINDOW + 1);
      const slice = arr.slice(start, i + 1);

      const movingAvg = slice.reduce((sum, x) => sum + x.avg, 0) / slice.length;

      return {
        ...d,
        trend: Math.round(movingAvg),
      };
    });
  }

  // ===============================
  // 🔥 FILTER
  // ===============================
  function filterData(data: any[], days: number) {
    const now = new Date();
    return data.filter((d) => {
      const diff =
        (now.getTime() - d.rawDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });
  }

  // ===============================
  // 🔥 LOAD DATA
  // ===============================
  useEffect(() => {
    async function loadResult() {
      try {
        if (!user?.id) return;

        const result = await client.getPerformance(user.id);
        const grouped = groupAndAggregateByDate(result.list);
        setPerformance(grouped);
      } catch (error) {
        console.error("Fehler:", error);
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [user]);

  // ===============================
  // ⏳ LOADING
  // ===============================
  if (loading || !performance) {
    return (
      <ThemedView>
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  const transformed = transformData(performance);
  const chartData = filterData(transformed, range);

  const labels = chartData.map((d) => d.date);
  const trendData = chartData.map((d) => d.trend);
  const testsData = chartData.map((d) => d.tests);
  const stackedData = chartData.map((d) => [d.correct, d.wrong]);

  // ===============================
  // 🌐 WEB (Recharts bleibt)
  // ===============================
  let WebChart: any = null;

  if (Platform.OS === "web") {
    const {
      Area,
      Bar,
      CartesianGrid,
      ComposedChart,
      Legend,
      Line,
      ReferenceLine,
      Tooltip,
      XAxis,
      YAxis,
    } = require("recharts");

    WebChart = (
      <ComposedChart width={width - 20} height={300} data={chartData}>
        <CartesianGrid stroke={colors.border} />
        <ReferenceLine y={TARGET} stroke={colors.primary} />
        <Area stroke={colors.primary} fill={colors.card} />
        <Bar dataKey="correct" fill={colors.successBackground} />
        <Bar dataKey="wrong" fill={colors.errorBackground} />
        <Line stroke={colors.text} />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={TARGET} stroke="blue" strokeDasharray="5 5" />
        <Area type="monotone" dataKey="trend" stroke="#8884d8" fill="#156e19" />
        <Bar dataKey="correct" stackId="a" fill="#4caf50" />
        <Bar dataKey="wrong" stackId="a" fill="#f44336" />
        <Line type="monotone" dataKey="tests" stroke="#050505" />
      </ComposedChart>
    );
  }

  // ===============================
  // 📱 MOBILE (NEU)
  // ===============================
  let MobileChart: any = null;

  if (Platform.OS !== "web") {
    const chartConfig = {
      backgroundGradientFrom: colors.background,
      backgroundGradientTo: colors.background,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
      labelColor: () => colors.text,
    };

    MobileChart = (
      <View>
        {/* 🎯 Trend + Tests */}
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: trendData,
                color: () => colors.successBackground,
                strokeWidth: 2,
              },
              {
                data: testsData,
                color: () => colors.text,
                strokeWidth: 2,
              },
            ],
          }}
          width={width - 20}
          height={220}
          chartConfig={chartConfig}
          bezier
        />

        {/* 📊 Correct vs Wrong */}
        <StackedBarChart
          data={{
            labels,
            legend: ["Correct", "Wrong"],
            data: stackedData,
            barColors: [colors.successBackground, colors.errorBackground],
          }}
          width={width - 20}
          height={220}
          chartConfig={chartConfig}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          backgroundColor: colors.background,
          flexGrow: 1,
        }}
        headerBackgroundColor={{
          light: colors.card,
          dark: colors.card,
        }}
        headerImage={
          <Image
            source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView
          style={[
            styles.chartContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 10,
            },
          ]}
        >
          <ThemedText
            type="title"
            style={{ backgroundColor: colors.background }}
          >
            Your performance
          </ThemedText>
        </ThemedView>

        <View style={styles.buttonRow}>
          <Button
            title="7 Tage"
            color={colors.primary}
            onPress={() => setRange(7)}
          />
          <Button
            title="30 Tage"
            color={colors.primary}
            onPress={() => setRange(30)}
          />
          <Button
            title="Alle"
            color={colors.primary}
            onPress={() => setRange(3650)}
          />
        </View>

        <ThemedView
          style={
            (styles.chartContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
              marginHorizontal: 16,
            })
          }
        >
          {Platform.OS === "web" ? WebChart : MobileChart}
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
  chartContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    marginTop: 50,
  },
});
