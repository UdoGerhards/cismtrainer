import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native"; // 🔥 TouchableOpacity hinzugefügt

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

import { HeaderLogo } from "@/components/headerLogo";
import Ionicons from "@react-native-vector-icons/ionicons/static";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function TwoFactorScreen() {
  const { colors } = useTheme();
  const { verify2FA, tempToken } = useAuth();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Zustand für den aktuellen Code-Inhalt, um den Button nur anzuzeigen, wenn getippt wurde
  const [currentCode, setCurrentCode] = useState("");

  const otpRef = useRef<OtpInputRef>(null);

  useEffect(() => {
    if (!tempToken) {
      router.replace("/login");
    }
  }, [tempToken]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (otpCode: string) => {
    if (loading || cooldown > 0 || attempts >= MAX_ATTEMPTS) return;

    setError("");
    setLoading(true);

    try {
      const success = await verify2FA(otpCode);

      if (!success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setError("Zu viele Fehlversuche. Bitte neu einloggen.");
          return;
        }

        setCooldown(COOLDOWN_SECONDS);
        setError("Code ungültig");

        handleReset();
        return;
      }

      handleReset();
    } catch {
      setError("Verifizierung fehlgeschlagen");
      handleReset();
    } finally {
      setLoading(false);
    }
  };

  // Hilfsfunktion zum Zurücksetzen des lokalen States + Ref
  const handleReset = () => {
    otpRef.current?.reset();
    setCurrentCode("");
  };

  // 🔥 NEU: Funktion für den Zurück-Button
  const handleBackspace = () => {
    if (currentCode.length === 0) return;

    const newValue = currentCode.slice(0, -1);
    setCurrentCode(newValue);

    // Je nachdem, wie deine OtpInput-Komponente aufgebaut ist,
    // benötigt sie eine dieser Methoden:
    if ("setValue" in (otpRef.current || {})) {
      (otpRef.current as any).setValue(newValue);
    } else if ("handleTextChange" in (otpRef.current || {})) {
      (otpRef.current as any).handleTextChange(newValue);
    }
  };

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
        headerImage={<HeaderLogo />}
      >
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.title}>
            Zwei-Faktor-Authentifizierung
          </ThemedText>

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
                // 🔥 code im State tracken, um die Länge zu kennen
                onTextChange={(code) => setCurrentCode(code)}
                onComplete={(code) => handleVerify(code)}
              />

              {/* 🔥 NEU: Der Zurück-Button wird unter/neben dem Input angezeigt */}
              {currentCode.length > 0 && (
                <TouchableOpacity
                  style={styles.backspaceButton}
                  onPress={handleBackspace}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="backspace-outline"
                    size={24}
                    color={colors.text}
                  />
                  <ThemedText style={styles.backspaceText}>Löschen</ThemedText>
                </TouchableOpacity>
              )}
            </ThemedView>
          </ThemedView>

          {cooldown > 0 && (
            <ThemedText style={[styles.info, { color: colors.border }]}>
              Neuer Versuch in {cooldown}s
            </ThemedText>
          )}

          {attempts > 0 && attempts < MAX_ATTEMPTS && (
            <ThemedText style={[styles.info, { color: colors.border }]}>
              Versuch {attempts} / {MAX_ATTEMPTS}
            </ThemedText>
          )}

          {error && (
            <ThemedText
              style={[styles.error, { color: colors.errorBackground }]}
            >
              {error}
            </ThemedText>
          )}
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
  title: {
    fontSize: 22,
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
    padding: 16,
    gap: 12, // 🔥 Abstand zwischen OTP-Feldern und dem Löschen-Button
  },
  // 🔥 NEU: Styles für den Button
  backspaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backspaceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    fontSize: 14,
    textAlign: "center",
  },
  info: {
    fontSize: 14,
    textAlign: "center",
  },
});
