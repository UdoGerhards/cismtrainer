import Pie from "@/components/charts/pie.chart";
import Footer from "@/components/Footer";
import { HeaderLogo } from "@/components/headerLogo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ExplanationBox from "@/components/ui/tst/explanationBox";
import client from "@/scripts/client";
import { useTheme } from "@react-navigation/native";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

interface TstEvaluationProps {
  testId: string;
}

const TstEvaluation = forwardRef(({ testId }: TstEvaluationProps, ref) => {
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const [activeDomainTab, setActiveDomainTab] = useState<string | null>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<"correct" | "wrong">(
    "correct",
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<any>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(
    null,
  );

  useImperativeHandle(ref, () => ({
    handlePrint,
  }));

  useEffect(() => {
    async function loadResult() {
      if (!testId) return;
      try {
        setLoading(true);
        const res = await client.calculateTestResults(testId);
        console.log(res);

        const evalRes = await client.getTestEvaluation(testId);
        console.log(evalRes);

        setResult(res);
        setEvaluation(evalRes);
        if (res.domains && Object.keys(res.domains).length > 0) {
          setActiveDomainTab(Object.keys(res.domains)[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [testId]);

  function getCorrectAnswerText(answers: any[], correctKey: string) {
    return answers?.find((a) => a.answer === correctKey)?.text || "—";
  }

  const generateSvgPieChart = (
    correct: number,
    incorrect: number,
    size: number = 40,
  ) => {
    const total = correct + incorrect;
    if (total === 0)
      return `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ccc"/></svg>`;

    const angle = (correct / total) * 360;
    const x = Math.cos(((angle - 90) * Math.PI) / 180) * (size / 2);
    const y = Math.sin(((angle - 90) * Math.PI) / 180) * (size / 2);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${size / 2} ${size / 2} L ${size / 2} 0 A ${size / 2} ${size / 2} 0 ${largeArc} 1 ${size / 2 + x} ${size / 2 + y} Z`;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#ef4444" />
        <path d="${path}" fill="#22c55e" />
      </svg>`;
  };

  const handlePrint = () => {
    if (Platform.OS !== "web" || !result || !evaluation) return;

    const datePart = result._createdAt
      ? new Date(result._createdAt).toISOString().split("T")[0]
      : "Datum";
    const namePart = (result.name || "TestAuswertung").replace(
      /[^a-z0-9]/gi,
      "_",
    );
    const fileName = `${namePart}_${datePart}`;

    const printStyles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          svg { display: block !important; }
          path, circle { fill-opacity: 1 !important; stroke-opacity: 1 !important; }
          .row-chart svg { width: 60px !important; height: 60px !important; }
        }
        body { font-family: sans-serif; color: #333; line-height: 1.5; padding: 40px; }
        h1 { border-bottom: 2px solid #333; padding-bottom: 10px; text-align: center; }
        h2 { margin-top: 30px; color: #444; }
        .correct-header { color: #22c55e; }
        .wrong-header { color: #ef4444; }
        .center-block { display: flex; flex-direction: column; align-items: center; margin: 40px 0; }
        .chart-wrapper { margin: 15px 0; }
        .domain-block { page-break-inside: avoid; margin-top: 20px; }
        .row-chart { display: flex; align-items: center; gap: 15px; margin: 10px 0; }
        .question-box { margin-bottom: 15px; padding: 12px; background: #f4f4f4; border-radius: 6px; }
        b { color: #000; }
      </style>
    `;

    const totalChartHtml = `
      <div class="center-block">
        <h2>Gesamt-Ergebnis</h2>
        <div class="chart-wrapper">${generateSvgPieChart(result.correct || 0, result.wrong || 0, 240)}</div>
        <p>Korrekt: <b>${result.correct}</b> | Falsch: <b>${result.wrong}</b></p>
      </div>
    `;

    const domainsHtml = Object.keys(result.domains || {})
      .map((domName) => {
        const domData = result.domains[domName];
        const correctQs = (evaluation.correctQuestions || []).filter(
          (q: any) => q.domain === domName,
        );
        const wrongQs = (evaluation.wrongQuestions || []).filter(
          (q: any) => q.domain === domName,
        );

        const renderQs = (qs: any[]) =>
          qs.length > 0
            ? qs
                .map(
                  (q: any) => `
                <div class="question-box">
                  <b>Frage:</b> ${q.question}<br>
                  <i>Korrekte Antwort:</i> ${getCorrectAnswerText(q.answers, q.correct)}<br>
                  <b>Deine Antwort:</b> ${q.user || "—"}
                </div>`,
                )
                .join("")
            : `<p><i>Keine Antworten vorhanden</i></p>`;

        return `
        <div class="domain-block">
          <h2>Domain: ${domName}</h2>
          <div class="row-chart">
            ${generateSvgPieChart(domData.ok, domData.wrong, 60)}
            <p>Korrekt: <b>${domData.ok}</b> | Falsch: <b>${domData.wrong}</b></p>
          </div>
          <h3 class="correct-header">✓ Korrekte Antworten</h3>
          ${renderQs(correctQs)}
          <h3 class="wrong-header">✗ Falsche Antworten</h3>
          ${renderQs(wrongQs)}
        </div>
      `;
      })
      .join("");

    const htmlContent = `
      <html>
        <head>
          <style>${printStyles}</style>
        </head>
        <body>
          <h1>Test-Auswertung: ${result.name}</h1>
          ${totalChartHtml}
          <hr>
          ${domainsHtml}
        </body>
      </html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.title = fileName;
      doc.close();

      const originalTitle = document.title;
      document.title = fileName;

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handlePress = async (item: any) => {
    const id = item._id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (explanations[id]) return;
    try {
      setLoadingExplanation(id);
      const res = await client.getExplanation(id);
      setExplanations((prev: any) => ({
        ...prev,
        [id]: res || "Keine Erklärung vorhanden",
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExplanation(null);
    }
  };

  if (loading || !result || !evaluation) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ThemedText>Lade Ergebnis...</ThemedText>
      </ThemedView>
    );
  }

  const totalPieData = [
    { name: "OK", value: result.correct ?? 0 },
    { name: "Wrong", value: result.wrong ?? 0 },
  ];
  const correctInDomain = (evaluation.correctQuestions || []).filter(
    (q: any) => q.domain === activeDomainTab,
  );
  const wrongInDomain = (evaluation.wrongQuestions || []).filter(
    (q: any) => q.domain === activeDomainTab,
  );
  const filteredQuestions =
    activeStatusTab === "correct" ? correctInDomain : wrongInDomain;
  const domainNames = Object.keys(result.domains || {});

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 16,
          width: "100%",
          alignSelf: "center",
          flexGrow: 1,
        }}
        data={filteredQuestions}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <ThemedView
              style={{
                padding: 20,
                backgroundColor: colors.background,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <HeaderLogo />
            </ThemedView>

            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Gesamt-Ergebnis
            </ThemedText>
            <ThemedView
              style={[
                styles.chartCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Pie data={totalPieData} />
            </ThemedView>

            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Ergebnisse nach Domain
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {domainNames.map((domName) => {
                const domData = result.domains[domName];
                return (
                  <ThemedView
                    key={domName}
                    style={[
                      styles.domainChartCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      numberOfLines={1}
                      style={[styles.domainChartTitle, { color: colors.text }]}
                    >
                      {domName}
                    </ThemedText>
                    <Pie
                      data={[
                        { name: "OK", value: domData.ok },
                        { name: "Wrong", value: domData.wrong },
                      ]}
                    />
                  </ThemedView>
                );
              })}
            </ScrollView>

            <ThemedView
              style={[
                styles.tabsWrapper,
                { backgroundColor: colors.background },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tabsRow}>
                  {domainNames.map((domName) => (
                    <Pressable
                      key={domName}
                      onPress={() => setActiveDomainTab(domName)}
                      style={styles.tabItem}
                    >
                      <ThemedText
                        style={[
                          styles.tabText,
                          activeDomainTab === domName
                            ? { color: colors.primary }
                            : { color: colors.text, opacity: 0.5 },
                        ]}
                      >
                        {domName.toUpperCase()}
                      </ThemedText>
                      {activeDomainTab === domName && (
                        <ThemedView
                          style={[
                            styles.tabUnderline,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <ThemedView
                style={[
                  styles.tabDivider,
                  { backgroundColor: colors.border, opacity: 0.8 },
                ]}
              />
            </ThemedView>

            <View style={styles.statusTabsContainer}>
              <Pressable
                onPress={() => setActiveStatusTab("correct")}
                style={[
                  styles.statusTabButton,
                  activeStatusTab === "correct" && {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusTabButtonText,
                    activeStatusTab === "correct" && { color: "#fff" },
                  ]}
                >
                  Korrekt ({correctInDomain.length})
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setActiveStatusTab("wrong")}
                style={[
                  styles.statusTabButton,
                  activeStatusTab === "wrong" && {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusTabButtonText,
                    activeStatusTab === "wrong" && { color: "#fff" },
                  ]}
                >
                  Falsch ({wrongInDomain.length})
                </ThemedText>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const correctText = getCorrectAnswerText(item.answers, item.correct);
          const userText = item.user;
          const isCorrect = userText?.trim() === correctText?.trim();
          const isExpanded = expandedId === item._id;
          return (
            <Pressable
              onPress={() => handlePress(item)}
              style={({ hovered, pressed }) => [
                styles.listItem,
                {
                  borderColor: colors.border,
                  backgroundColor: hovered ? colors.card : colors.background,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={styles.question}>{item.question}</ThemedText>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Answer:
                </ThemedText>
                <ThemedText
                  style={[
                    styles.text,
                    { color: colors.success, fontWeight: "600" },
                  ]}
                >
                  {correctText}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  User:
                </ThemedText>
                <ThemedText
                  style={[
                    styles.text,
                    {
                      color: isCorrect ? colors.success : colors.error,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {userText}
                </ThemedText>
              </View>
              <ExplanationBox
                isExpanded={isExpanded}
                loadingExplanation={loadingExplanation}
                itemId={item._id}
                explanations={explanations}
                styles={styles}
              />
            </Pressable>
          );
        }}
      />
      <Footer />
    </View>
  );
});

TstEvaluation.displayName = "TestEvaluation";

export default TstEvaluation;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    alignItems: "center",
  },
  domainChartCard: {
    width: 240,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginLeft: 16,
    marginRight: 4,
    alignItems: "center",
  },
  domainChartTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  tabsWrapper: { marginTop: 20, paddingHorizontal: 16 },
  tabsRow: { flexDirection: "row" },
  tabItem: { marginRight: 24, paddingBottom: 8 },
  tabText: { fontWeight: "600", fontSize: 13 },
  tabUnderline: { marginTop: 6, height: 2, width: "100%" },
  tabDivider: { height: 1, marginTop: 4, marginBottom: 12 },
  statusTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statusTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTabButtonText: { fontSize: 12, fontWeight: "600" },
  listItem: { padding: 16, borderBottomWidth: 1 },
  question: { fontWeight: "bold", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  label: { width: 70, fontWeight: "bold" },
  text: { flex: 1, flexWrap: "wrap" },
  explanationBox: { marginTop: 10, padding: 12, borderRadius: 8 },
  mdH3: { fontSize: 17, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  mdH4: { fontWeight: "600", marginTop: 12, marginBottom: 6 },
  mdP: { marginBottom: 10, lineHeight: 22 },
  mdUl: { marginTop: 4, marginBottom: 12, paddingLeft: 8 },
  mdLiRow: { flexDirection: "row", marginBottom: 6 },
  mdBullet: { marginRight: 8, marginTop: 2 },
  mdLiText: { flex: 1, lineHeight: 22 },
  mdStrong: { fontWeight: "bold" },
});
