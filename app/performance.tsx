import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { useEffect, useState } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { HeaderLogo } from "@/components/headerLogo";

// 📊 Charts
import { LineChart, StackedBarChart } from "react-native-chart-kit";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router"; // 👈 Expo Router Import

// 🎯 CONFIG
const TARGET = 80;
const MOVING_AVG_WINDOW = 3;

export default function Performance() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter(); // 👈 Router initialisieren

  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any>(null);
  const [rawTests, setRawTests] = useState<any[]>([]);
  const [range, setRange] = useState(7);
  const { colors } = useTheme();

  // ===============================
  // 🔥 GROUPING & TRANSFORM & FILTER
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
      return { ...d, trend: Math.round(movingAvg) };
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
        setRawTests(result.list || []);
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

  function filterData(data: any[], days: number) {
    const now = new Date();
    return data.filter((d) => {
      const diff =
        (now.getTime() - d.rawDate.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= days;
    });
  }

  // 🎯 ANGEPASST: Leitet jetzt auf die statische Route /testReport mit Query-Parametern weiter
  const handleTestPress = (test: any) => {
    const testId = test._id;

    console.log(testId);

    if (!testId) {
      console.warn("Test hat keine valide ID!");
      return;
    }

    // Übergibt id und title via URL-Query (?id=...&title=...) an app/testReport.tsx
    router.push({
      pathname: "/test/ergebnis",
      params: { id: testId },
    });
  };

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

  const mobileChartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: () => colors.text,
  };

  // ===============================
  // 📱 MOBILE & WEB CHARTS
  // ===============================
  let WebChart: any = null;
  if (Platform.OS === "web") {
    const {
      ComposedChart,
      CartesianGrid,
      ReferenceLine,
      Area,
      Bar,
      Line,
      XAxis,
      YAxis,
      Tooltip,
      Legend,
    } = require("recharts");
    WebChart = (
      <ComposedChart width={width - 20} height={300} data={chartData}>
        <CartesianGrid stroke={colors.border} />
        <ReferenceLine y={TARGET} stroke={colors.primary} />
        <Area type="monotone" dataKey="trend" stroke="#8884d8" fill="#156e19" />
        <Bar dataKey="correct" stackId="a" fill="#4caf50" />
        <Bar dataKey="wrong" stackId="a" fill="#f44336" />
        <Line type="monotone" dataKey="tests" stroke="#050505" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
      </ComposedChart>
    );
  }

  let MobileChart: any = null;
  if (Platform.OS !== "web") {
    MobileChart = (
      <View>
        <LineChart
          data={{
            labels,
            datasets: [
              { data: trendData, color: () => "#4caf50", strokeWidth: 2 },
              { data: testsData, color: () => "#1e293b", strokeWidth: 2 },
            ],
          }}
          width={width - 50}
          height={180}
          chartConfig={mobileChartConfig}
          bezier
        />
        <StackedBarChart
          data={{
            labels,
            legend: ["Correct", "Wrong"],
            data: stackedData,
            barColors: ["#4caf50", "#e11d48"],
          }}
          width={width - 50}
          height={200}
          chartConfig={mobileChartConfig}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        headerBackgroundColor={{ light: colors.card, dark: colors.card }}
        headerImage={<HeaderLogo />}
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
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            marginHorizontal: 16,
          }}
        >
          {Platform.OS === "web" ? WebChart : MobileChart}
        </ThemedView>

        {/* =============================== */}
        {/* 📋 TESTLISTE UNTERHALB          */}
        {/* =============================== */}
        <ThemedView style={styles.listContainer}>
          <ThemedText style={styles.listTitle} type="subtitle">
            Detaillierte Testergebnisse
          </ThemedText>

          {rawTests.map((test, index) => {
            const testName = test.name || test.title || `Test #${index + 1}`;
            const correct = test.correct || 0;
            const wrong = test.wrong || 0;
            const total = correct + wrong;

            const correctFlex = total > 0 ? correct / total : 0.5;
            const wrongFlex = total > 0 ? wrong / total : 0.5;

            return (
              <TouchableOpacity
                key={test.id || index}
                style={[styles.listItem, { borderColor: colors.border }]}
                onPress={() => handleTestPress(test)} // Navigiert beim Klick
                activeOpacity={0.7}
              >
                {/* Linke Seite: Testname */}
                <View style={styles.testNameContainer}>
                  <ThemedText numberOfLines={1} style={styles.testName}>
                    {testName} ↗
                  </ThemedText>
                </View>

                {/* Stabile native Progress Bar */}
                <View style={styles.nativeBarWrapper}>
                  {correct > 0 && (
                    <View style={[styles.barGreen, { flex: correctFlex }]} />
                  )}
                  {wrong > 0 && (
                    <View style={[styles.barRed, { flex: wrongFlex }]} />
                  )}
                  {total === 0 && (
                    <View style={{ flex: 1, backgroundColor: "#cbd5e1" }} />
                  )}
                </View>

                {/* Rechter Pfeil */}
                <ThemedText style={styles.chevron}>〉</ThemedText>
              </TouchableOpacity>
            );
          })}
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
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
  listContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingBottom: 40,
  },
  listTitle: {
    marginBottom: 16,
    fontWeight: "bold",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  testNameContainer: {
    flex: 1,
    paddingRight: 12,
  },
  testName: {
    fontWeight: "500",
    fontSize: 16,
    color: "#0284c7",
  },
  nativeBarWrapper: {
    width: 75,
    height: 16,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  barGreen: {
    height: "100%",
    backgroundColor: "#4caf50",
  },
  barRed: {
    height: "100%",
    backgroundColor: "#e11d48",
  },
  chevron: {
    fontSize: 14,
    color: "#94a3b8",
    paddingLeft: 4,
  },
});
