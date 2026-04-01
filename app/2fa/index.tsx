import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';

import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import { useAuth } from "@/context/AuthContext";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function TwoFactorScreen() {

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

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

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

        // 🔥 RESET + Fokus zurück
        otpRef.current?.reset();

        return;
      }

      // ✅ Erfolg → AuthGuard übernimmt Routing

    } catch {
      setError("Verifizierung fehlgeschlagen");

      // 🔥 auch hier reset
      otpRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/CISM_logo_RGB-1024x409.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.container}>

        <ThemedText style={styles.title}>
          Zwei-Faktor-Authentifizierung
        </ThemedText>

        <OtpInput
          ref={otpRef}
          onComplete={(code) => handleVerify(code)}
        />

        {cooldown > 0 && (
          <ThemedText style={styles.info}>
            Neuer Versuch in {cooldown}s
          </ThemedText>
        )}

        {attempts > 0 && attempts < MAX_ATTEMPTS && (
          <ThemedText style={styles.info}>
            Versuch {attempts} / {MAX_ATTEMPTS}
          </ThemedText>
        )}

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  title: { fontSize: 22 },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: 20,
    borderRadius: 6,
  },
  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
  error: { color: "red" },
  info: { color: "#666" },
});