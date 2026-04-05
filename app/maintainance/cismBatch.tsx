import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";

import Footer from "@/components/Footer";
import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import client from "@/scripts/client";

export default function AdminCismBatchScreen() {
  const { colors } = useTheme();

  // Konfiguration & Datenbasis
  const [batchSize, setBatchSize] = useState("20");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const otpRef = useRef<OtpInputRef>(null);

  // Status-States für UI
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentInfo, setCurrentInfo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hilfsfunktionen für Statusmeldungen
  const showError = (msg: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setSuccess("");
    setError(msg);
    errorTimeoutRef.current = setTimeout(() => setError(""), 7000);
  };

  const showSuccess = (msg: string) => {
    setError("");
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 10000);
  };

  /*
  ==========================================
  INITIALISIERUNG: Echte Anzahl laden
  ==========================================
  */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const count = await client.getQuestionCount();
        console.log("Anzahl Fragen in DB:", count);
        setTotalQuestions(count);
      } catch (err) {
        console.error("Fehler beim Initialisieren der Fragenanzahl:", err);
        showError("Konnte Fragenanzahl nicht vom Server laden.");
      }
    };

    fetchInitialData();
    otpRef.current?.reset();
  }, []);

  /*
  ==========================================
  PROCESS BATCH (Frontend-Loop für Progress)
  ==========================================
  */
  const handleStartBatch = async (tokenFromOtp: string) => {
    const size = parseInt(batchSize);

    // Validierung
    if (isNaN(size) || size <= 0) {
      otpRef.current?.reset();
      return showError("Bitte eine gültige Batch-Größe eingeben.");
    }

    // Falls der Count beim Laden fehlgeschlagen ist, versuchen wir es erneut
    let currentTotal = totalQuestions;
    if (currentTotal <= 0) {
      try {
        currentTotal = await client.getQuestionCount();
        setTotalQuestions(currentTotal);
      } catch (e) {
        otpRef.current?.reset();
        return showError("Fehler: Fragenanzahl ist unbekannt.");
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setProgress(0);

    let totalOk = 0;
    let totalWrong = 0;
    const totalSteps = Math.ceil(currentTotal / size);

    try {
      for (let i = 0; i < totalSteps; i++) {
        const offset = i * size;

        // UI Update: Fortschritt berechnen
        const percent = Math.round((i / totalSteps) * 100);
        setProgress(percent);
        setCurrentInfo(
          `Verarbeite Batch ${i + 1} von ${totalSteps} (Fragen ${offset} - ${offset + size})...`,
        );

        // API Call für den spezifischen Chunk
        const result = await client.processCismBatch(
          size,
          tokenFromOtp,
          offset,
        );

        totalOk += result.successCount;
        totalWrong += result.errorCount;

        // Falls der Server signalisiert, dass keine Daten mehr vorliegen
        if (result.finished) break;
      }

      // Abschluss-Status
      setProgress(100);
      setCurrentInfo("Optimierung abgeschlossen.");
      showSuccess(
        `Batch-Lauf beendet! ✅\nGesamt optimiert: ${totalOk}\nGesamt Fehler: ${totalWrong}`,
      );

      otpRef.current?.reset();
    } catch (err: any) {
      showError(err.message || "Kritischer Fehler während der Verarbeitung.");
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
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
        <ThemedView style={styles.container}>
          <ThemedText style={styles.title}>CISM AI Batch Optimizer</ThemedText>

          <ThemedView style={[styles.card, { borderColor: colors.border }]}>
            <ThemedText style={styles.label}>Konfiguration</ThemedText>
            <ThemedText style={styles.subLabel}>
              Datenbank enthält aktuell:{" "}
              <ThemedText style={{ fontWeight: "bold" }}>
                {totalQuestions}
              </ThemedText>{" "}
              Fragen.
            </ThemedText>

            <View style={styles.inputRow}>
              <ThemedText>Batch-Größe:</ThemedText>
              <TextInput
                placeholder="20"
                value={batchSize}
                onChangeText={setBatchSize}
                keyboardType="numeric"
                editable={!loading}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
            </View>
          </ThemedView>

          <ThemedText style={styles.infoText}>
            Geben Sie zur Autorisierung Ihren Admin-Token ein:
          </ThemedText>

          {/* OTP INPUT */}
          <ThemedView style={styles.otpWrapper}>
            <ThemedView
              style={[
                styles.otpContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <OtpInput
                ref={otpRef}
                onComplete={(code) => handleStartBatch(code)}
              />
            </ThemedView>
          </ThemedView>

          {/* PROGRESS & STATUS ANZEIGE */}
          <View style={styles.statusArea}>
            {loading && (
              <View style={styles.progressContainer}>
                <ThemedText style={styles.infoSmall}>{currentInfo}</ThemedText>

                {/* Progress Bar */}
                <View
                  style={[
                    styles.progressBg,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>

                <ThemedText style={styles.percentage}>{progress}%</ThemedText>
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 10 }}
                />
              </View>
            )}

            {error ? (
              <ThemedText style={[styles.statusText, { color: "red" }]}>
                {error}
              </ThemedText>
            ) : null}

            {success ? (
              <ThemedText
                style={[styles.statusText, { color: colors.primary }]}
              >
                {success}
              </ThemedText>
            ) : null}
          </View>
        </ThemedView>
      </ParallaxScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  subLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    textAlign: "center",
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  infoSmall: {
    fontSize: 13,
    marginBottom: 8,
    fontStyle: "italic",
    textAlign: "center",
  },
  otpWrapper: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  otpContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  statusArea: {
    marginTop: 20,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressBg: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  percentage: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  statusText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  reactLogo: {
    height: 100,
    width: 250,
    marginTop: 60,
    alignSelf: "center",
  },
});
