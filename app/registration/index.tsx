import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';

import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";

import { useTheme } from "@react-navigation/native";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function RegistrationScreen() {

  const { colors } = useTheme(); // ✅ THEME

  const { refreshUser, logout } = useAuth();
  const router = useRouter();

  const [qr, setQr] = useState<string | null>(null);

  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const otpRef = useRef<OtpInputRef>(null);

  // ---------------------------------------------------------
  // Setup starten
  // ---------------------------------------------------------
  useEffect(() => {
    const startSetup = async () => {
      setError("");
      setQr(null);
      setVerified(false);
      setLoading(true);

      try {
        const res = await client.request("/2fa/setup", {
          method: "POST",
        });

        if (res?.qr) {
          setQr(res.qr);
        } else {
          setError("QR-Code konnte nicht geladen werden");
        }
      } catch {
        setError("Fehler beim Setup");
      } finally {
        setLoading(false);
      }
    };

    startSetup();
  }, []);

  // ⏱️ Countdown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // ---------------------------------------------------------
  // Verify Setup
  // ---------------------------------------------------------
  const verifySetup = async (otpCode: string) => {
    if (cooldown > 0 || attempts >= MAX_ATTEMPTS) return;

    setError("");

    try {
      const res = await client.request("/2fa/verify-setup", {
        method: "POST",
        body: JSON.stringify({ token: otpCode }),
      });

      if (!res?.success) {
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

      setVerified(true);
      await refreshUser();

    } catch {
      setError("Verifizierung fehlgeschlagen");
      otpRef.current?.reset();
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
        source={require('@/assets/images/CISM_logo_RGB-1024x409.png')}
        style={{
          width: "60%",          // 🔥 wie gewünscht
          maxWidth: 480,         // 🔥 für Web
          aspectRatio: 1024 / 409,
        }}
        contentFit="contain"
      />
    </ThemedView>
  }
>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>

        <ThemedText style={styles.title}>
          Authenticator Registrierung
        </ThemedText>

        {/* 🔄 Loading */}
        {loading && (
          <ThemedText>QR-Code wird geladen...</ThemedText>
        )}

        {/* ✅ QR + Eingabe */}
        {qr && !verified && (
          <ThemedView
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Image source={{ uri: qr }} style={styles.qr} />

            <OtpInput
              ref={otpRef}
              onComplete={(code) => {
                verifySetup(code);
              }}
            />

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
          </ThemedView>
        )}

        {/* ✅ Erfolg */}
        {verified && (
          <ThemedText style={[styles.success, { color: colors.successBackground }]}>
            Registrierung erfolgreich ✅
            Weiterleitung zum Login...
          </ThemedText>
        )}

        {/* ❌ Fehler */}
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

  card: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },

  qr: {
    width: 200,
    height: 200,
  },

  error: {
    fontSize: 14,
  },

  success: {
    fontWeight: "bold",
    fontSize: 14,
  },

  info: {
    fontSize: 14,
  },
});