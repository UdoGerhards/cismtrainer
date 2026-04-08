import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@react-navigation/native";

import Footer from "@/components/Footer";
import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";

import { HeaderLogo } from "@/components/headerLogo";

export default function AdminTestOverviewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const otpRef = useRef<OtpInputRef>(null);

  const [allUserTests, setAllUserTests] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // --- SELECTION & EXPANSION STATES ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVerified) fetchTests();
  }, [allUserTests]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const result = await client.fetchFullTestDetails(allUserTests);
      setTests(result.tests || []);
      setIsVerified(true);

      // Reset selections
      setSelectedIds(new Set());
      setExpandedIds(new Set());
    } catch (err: any) {
      console.error(err);
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const toggleSelectAll = () => {
    if (selectedIds.size === tests.length && tests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tests.map((t) => t._id)));
    }
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === tests.length && tests.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(tests.map((t) => t._id)));
    }
  };

  const handleDelete = async () => {
    // Falls nichts ausgewählt ist, brechen wir direkt ab
    if (selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);
    console.log("Starte direkten Löschvorgang für:", idsToDelete);

    try {
      setLoading(true);

      // Direkter Aufruf ohne Bestätigungs-Dialog
      await client.deleteTests(idsToDelete);

      // UI zurücksetzen und Liste neu laden
      setSelectedIds(new Set());
      await fetchTests();

      console.log("Löschen erfolgreich abgeschlossen.");
    } catch (e: any) {
      // Nur im Fehlerfall zeigen wir eine Meldung an
      alert(e.message || "Fehler beim Löschen der Tests");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleItemExpansion = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  // --- RENDER FUNCTIONS ---
  const renderTestItem = ({ item }: { item: any }) => {
    const isExpanded = expandedIds.has(item._id);
    const isSelected = selectedIds.has(item._id);

    const allQuestions = [
      ...(item.correctQuestions || []),
      ...(item.wrongQuestions || []),
    ];

    return (
      <ThemedView
        style={[
          styles.testCard,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <View style={styles.cardHeaderMain}>
          <TouchableOpacity
            onPress={() => toggleItemSelection(item._id)}
            style={styles.checkbox}
          >
            <Ionicons
              name={isSelected ? "checkbox" : "square-outline"}
              size={24}
              color={isSelected ? colors.primary : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleItemExpansion(item._id)}
            style={styles.cardInfoArea}
          >
            <View style={styles.testHeaderText}>
              <ThemedText style={styles.testTitle}>
                {item.name || "N/A"}
              </ThemedText>
              <ThemedText style={styles.testDate}>
                {/* Formatiert das Datum zu dd.mm.yyyy */}
                {new Date(item._createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </ThemedText>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <ThemedText style={styles.smallStatText}>
                  <ThemedText style={{ color: "#4CAF50" }}>
                    Correct: {item.correct}
                  </ThemedText>
                  <ThemedText style={styles.statDivider}> / </ThemedText>
                  <ThemedText style={{ color: "#F44336" }}>
                    Wrong: {item.wrong}
                  </ThemedText>
                </ThemedText>
              </View>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.text}
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.detailsArea}>
            {allQuestions.map((q: any, idx: number) => {
              const correctOption = q.answers?.find(
                (a: any) => a.answer === q.correct,
              );
              const isQuestionCorrect = item.correctQuestions?.some(
                (cq: any) => cq._id === q._id,
              );

              return (
                <View
                  key={q._id || idx}
                  style={[
                    styles.questionBox,
                    {
                      borderLeftColor: isQuestionCorrect
                        ? "#4CAF50"
                        : "#F44336",
                      backgroundColor: colors.background + "20",
                    },
                  ]}
                >
                  <ThemedText style={[styles.baseFontSize, styles.qText]}>
                    Frage {q.ID}: {q.question}
                  </ThemedText>
                  <View style={styles.answerInfo}>
                    <ThemedText style={styles.baseFontSize}>
                      Correct answer: {correctOption?.text || q.correct}
                    </ThemedText>
                    <ThemedText style={styles.baseFontSize}>
                      User answer:{" "}
                      <ThemedText
                        style={{
                          color: isQuestionCorrect ? "#4CAF50" : "#F44336",
                        }}
                      >
                        {q.user || "No answer"}
                      </ThemedText>
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ThemedView>
    );
  };

  // Hilfs-Komponente für die Buttons
  const ActionButtons = () => (
    <View style={styles.actionRow}>
      <TouchableOpacity onPress={toggleSelectAll} style={styles.actionBtn}>
        <ThemedText style={styles.actionBtnText}>
          {selectedIds.size === tests.length && tests.length > 0
            ? "Deselect All"
            : "Select All"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleExpandAll} style={styles.actionBtn}>
        <ThemedText style={styles.actionBtnText}>
          {expandedIds.size === tests.length && tests.length > 0
            ? "Collapse All"
            : "Expand All"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDelete}
        disabled={loading || selectedIds.size === 0}
        style={[
          styles.actionBtn,
          {
            backgroundColor: "#ff444420",
            borderColor: "#ff444440",
            opacity: selectedIds.size === 0 ? 0.5 : 1,
          },
        ]}
      >
        <ThemedText style={[styles.actionBtnText, { color: "#ff4444" }]}>
          {loading ? "Deleting..." : `Delete (${selectedIds.size})`}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: colors.card, dark: colors.card }}
        headerImage={<HeaderLogo />}
      >
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title}>Test Management</ThemedText>

          {!isVerified ? (
            <View style={styles.otpSection}>
              <ThemedText style={{ marginBottom: 10 }}>
                Admin Authorization required:
              </ThemedText>
              <OtpInput ref={otpRef} onComplete={() => fetchTests()} />
            </View>
          ) : (
            <>
              {user?.role === "admin" && (
                <View
                  style={[styles.adminSwitch, { borderColor: colors.primary }]}
                >
                  <ThemedText>Show all user tests</ThemedText>
                  <Switch
                    value={allUserTests}
                    onValueChange={setAllUserTests}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
              )}

              {tests.length > 0 && <ActionButtons />}

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginTop: 40 }}
                />
              ) : (
                <FlatList
                  data={tests}
                  renderItem={renderTestItem}
                  keyExtractor={(t) => t._id} // Geändert auf _id von MongoDB
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <ThemedText style={styles.empty}>
                      No tests found.
                    </ThemedText>
                  }
                />
              )}

              {tests.length > 5 && !loading && <ActionButtons />}
            </>
          )}
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10 },
  title: { fontSize: 24, fontWeight: "bold" },
  otpSection: { padding: 20, alignItems: "center" },
  adminSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginVertical: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  testCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeaderMain: { flexDirection: "row", alignItems: "center", padding: 12 },
  checkbox: { marginRight: 12 },
  cardInfoArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  testHeaderText: { flex: 1 },
  testTitle: { fontSize: 16, fontWeight: "600" },
  testDate: { fontSize: 11, opacity: 0.5 },
  statsContainer: { flexDirection: "row", alignItems: "center" },
  statBadge: {
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallStatText: { fontSize: 13, lineHeight: 18 },
  statDivider: { opacity: 0.3 },
  detailsArea: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  baseFontSize: { fontSize: 15, lineHeight: 22 },
  questionBox: {
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
    borderRadius: 6,
  },
  qText: { marginBottom: 6 },
  answerInfo: { gap: 4 },
  empty: { textAlign: "center", marginTop: 30, opacity: 0.5 },
});
