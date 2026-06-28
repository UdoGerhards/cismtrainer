import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
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

// Definition der Bitmasken
const PERM_DELETE_TESTS = 4;
const PERM_ADMIN = 63;

export default function AdminTestOverviewScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const otpRef = useRef<OtpInputRef>(null);

  const userPermissions = user?.role || 0;

  // Echte, strikte Admin-Prüfung
  const isAdmin = (userPermissions & PERM_ADMIN) === PERM_ADMIN;
  const canDeleteOwn =
    (userPermissions & PERM_DELETE_TESTS) === PERM_DELETE_TESTS;

  // Admin sieht standardmäßig immer alles, User niemals
  const allUserTests = isAdmin;

  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Nicht-Admins überspringen die Admin-OTP-Verifizierung komplett
  const [isVerified, setIsVerified] = useState(!isAdmin && canDeleteOwn);

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // --- SELECTION & EXPANSION STATES ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVerified) {
      fetchTests();
    }
  }, [isVerified]);

  const fetchTests = async () => {
    try {
      setLoading(true);

      const [testResult, usersResult] = await Promise.all([
        client.fetchFullTestDetails(allUserTests),
        isAdmin ? client.getAllUsers() : Promise.resolve([]),
      ]);

      // 1. User Map befüllen
      const mapping: Record<string, string> = {};

      if (isAdmin && Array.isArray(usersResult)) {
        usersResult.forEach((u: any) => {
          const fullName = `${u.firstname || ""} ${u.lastname || ""}`.trim();
          mapping[u.id || u._id] = fullName || "Unbekannter User";
        });
      } else if (user) {
        const fullName =
          `${user.firstname || ""} ${user.lastname || ""}`.trim();
        mapping[user.id || user._id] = fullName || "Mein Account";
      }

      setUserMap(mapping);

      // 2. Gruppen-Daten verarbeiten
      let groups = Array.isArray(testResult)
        ? testResult
        : testResult.tests || [];

      if (!isAdmin) {
        if (groups.length === 0 || !groups[0].hasOwnProperty("tests")) {
          groups = [{ _id: user?.id || user?._id || "me", tests: groups }];
        } else {
          groups = groups.filter((g: any) => g._id === (user?.id || user?._id));
        }
      }

      setGroupedData(groups);

      // Tab setzen
      if (groups.length > 0) {
        const currentTabExists = groups.some((g) => g._id === activeTab);
        if (!currentTabExists || !activeTab) {
          setActiveTab(groups[0]._id);
        }
      } else {
        setActiveTab(null);
      }

      setSelectedIds(new Set());
      setExpandedIds(new Set());
    } catch (err: any) {
      console.error(err);
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const currentTests =
    groupedData.find((g) => g._id === activeTab)?.tests || [];

  // --- ACTIONS ---
  const toggleSelectAll = () => {
    if (selectedIds.size === currentTests.length && currentTests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentTests.map((t: any) => t._id)));
    }
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === currentTests.length && currentTests.length > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(currentTests.map((t: any) => t._id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);

    try {
      setLoading(true);
      await client.deleteTests(idsToDelete);
      setSelectedIds(new Set());
      await fetchTests();
    } catch (e: any) {
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
                    Richtig: {item.correct}
                  </ThemedText>
                  <ThemedText style={styles.statDivider}> / </ThemedText>
                  <ThemedText style={{ color: "#F44336" }}>
                    Falsch: {item.wrong}
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
                      Richtige Antwort: {correctOption?.text || q.correct}
                    </ThemedText>
                    <ThemedText style={styles.baseFontSize}>
                      Nutzer-Antwort:{" "}
                      <ThemedText
                        style={{
                          color: isQuestionCorrect ? "#4CAF50" : "#F44336",
                        }}
                      >
                        {q.user || "Keine Antwort"}
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

  const ActionButtons = () => (
    <View style={styles.actionRow}>
      <TouchableOpacity onPress={toggleSelectAll} style={styles.actionBtn}>
        <ThemedText style={styles.actionBtnText}>
          {selectedIds.size === currentTests.length && currentTests.length > 0
            ? "Auswahl aufheben"
            : "Alle auswählen"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleExpandAll} style={styles.actionBtn}>
        <ThemedText style={styles.actionBtnText}>
          {expandedIds.size === currentTests.length && currentTests.length > 0
            ? "Alle einklappen"
            : "Alle ausklappen"}
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
          {loading ? "Lösche..." : `Löschen (${selectedIds.size})`}
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
          <ThemedText style={styles.title}>
            {isAdmin ? "Test Verwaltung" : "Meine Testergebnisse"}
          </ThemedText>

          {!isVerified ? (
            <View style={styles.otpSection}>
              <ThemedText style={{ marginBottom: 10 }}>
                Admin-Autorisierung erforderlich:
              </ThemedText>
              <OtpInput ref={otpRef} onComplete={() => setIsVerified(true)} />
            </View>
          ) : (
            <>
              {/* 1. GRAUE LINIE: Zwischen Titel und Tabs */}
              <View
                style={[styles.separator, { backgroundColor: colors.border }]}
              />

              {/* Reiterkarten-Leiste */}
              {groupedData.length > 0 && (
                <View style={styles.tabsWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                  >
                    {groupedData.map((group) => {
                      const isActive = activeTab === group._id;
                      const displayName =
                        userMap[group._id] || "Unbekannter User";

                      return (
                        <TouchableOpacity
                          key={group._id}
                          style={[
                            styles.tabButton,
                            { borderColor: colors.border },
                            isActive && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => {
                            setActiveTab(group._id);
                            setSelectedIds(new Set());
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.tabButtonText,
                              isActive && { color: "#fff", fontWeight: "700" },
                            ]}
                          >
                            {displayName} ({group.tests?.length || 0})
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 2. GRAUE LINIE: Zwischen Tabs und Buttonleiste */}
              {groupedData.length > 0 && (
                <View
                  style={[
                    styles.separator,
                    {
                      backgroundColor: colors.border,
                      marginTop: 4,
                      marginBottom: 10,
                    },
                  ]}
                />
              )}

              {currentTests.length > 0 && <ActionButtons />}

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{ marginTop: 40 }}
                />
              ) : (
                <FlatList
                  data={currentTests}
                  renderItem={renderTestItem}
                  keyExtractor={(t) => t._id}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <ThemedText style={styles.empty}>
                      Keine Tests gefunden.
                    </ThemedText>
                  }
                />
              )}

              {currentTests.length > 5 && !loading && <ActionButtons />}
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  otpSection: { padding: 20, alignItems: "center" },
  separator: { height: 1, width: "100%" }, // Basis-Style für die grauen Linien
  tabsWrapper: { marginVertical: 10 },
  tabsContainer: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  tabButtonText: { fontSize: 13, fontWeight: "500" },
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
