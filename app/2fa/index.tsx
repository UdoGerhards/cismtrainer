import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Image } from "expo-image";

import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";

import { useTheme } from "@react-navigation/native";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function TwoFactorScreen() {
  const { colors } = useTheme(); // ✅ THEME
  const { verify2FA, tempToken } = useAuth();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const otpRef = useRef<OtpInputRef>(null);

  // 🔐 redirect if no tempToken
  useEffect(() => {
    if (!tempToken) {
      router.replace("/login");
    }
  }, [tempToken]);

  // ⏱️ Countdown
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
    } catch {
      setError("Verifizierung fehlgeschlagen");
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ backgroundColor: colors.background }}
      headerBackgroundColor={{
        light: colors.headerImageBackground,
        dark: colors.headerImageBackground,
      }}
      headerImage={
        <ThemedView
          style={{
            padding: 20,
            backgroundColor: colors.headerImageBackground,
          }}
        >
          <Image
            source={require("@/assets/images/CISM_logo_RGB-1024x409.png")}
            style={{
              width: "60%", // 🔥 wie gewünscht
              maxWidth: 480, // 🔥 für Web
              aspectRatio: 1024 / 409,
            }}
            contentFit="contain"
          />
        </ThemedView>
      }
    >
      <ThemedView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedText style={styles.title}>
          Zwei-Faktor-Authentifizierung
        </ThemedText>

        <ThemedView
          style={[
            styles.otpContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 16,
            },
          ]}
        >
          <OtpInput ref={otpRef} onComplete={(code) => handleVerify(code)} />
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
          <ThemedText style={[styles.error, { color: colors.errorBackground }]}>
            {error}
          </ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },

  title: {
    fontSize: 22,
  },

  otpContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },

  error: {
    fontSize: 14,
  },

  info: {
    fontSize: 14,
  },
});
