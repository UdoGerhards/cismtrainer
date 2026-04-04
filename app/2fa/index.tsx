import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";

import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";

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

        otpRef.current?.reset();
        return;
      }

      otpRef.current?.reset();
    } catch {
      setError("Verifizierung fehlgeschlagen");
      otpRef.current?.reset();
    } finally {
      setLoading(false);
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
        headerImage={
          <Image
            source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
            style={styles.reactLogo}
          />
        }
      >
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.title}>
            Zwei-Faktor-Authentifizierung
          </ThemedText>

          {/* 🔥 Wrapper sorgt für saubere Breite */}
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
                onComplete={(code) => handleVerify(code)}
              />
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
    textAlign: "center", // 🔥 sieht besser aus
  },

  // 🔥 NEU: kontrolliert die Gesamtbreite
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
  },

  error: {
    fontSize: 14,
    textAlign: "center",
  },

  info: {
    fontSize: 14,
    textAlign: "center",
  },

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
});
