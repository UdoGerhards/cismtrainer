import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';

import client from "@/scripts/client";

export default function RegistrationScreen() {

  const [email, setEmail] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const isEmailValid = email.trim().length > 0;
  const isTokenValid = token.trim().length > 0;

  // ---------------------------------------------------------
  // 2FA Setup starten (nur wenn User existiert)
  // ---------------------------------------------------------
  const startSetup = async () => {
    if (!isEmailValid) return;

    setError("");
    setQr(null);
    setVerified(false);

    try {
      const res = await client.request("/2fa/setup", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      // 👉 Nur wenn User existiert kommt ein QR zurück
      if (res?.qr) {
        setQr(res.qr);
      } else {
        // 👉 User existiert nicht → nichts anzeigen
        setQr(null);
      }

    } catch (e: any) {
      // 👉 404 = User existiert nicht → nichts tun
      if (e?.message?.includes("404")) {
        setQr(null);
        return;
      }

      setError("Fehler beim Setup");
    }
  };

  // ---------------------------------------------------------
  // 2FA bestätigen
  // ---------------------------------------------------------
  const verifySetup = async () => {
    if (!isEmailValid || !isTokenValid) return;

    setError("");

    try {
      const res = await client.request("/2fa/verify-setup", {
        method: "POST",
        body: JSON.stringify({ email, token }),
      });

      if (res?.success) {
        setVerified(true);
      } else {
        setError("Code ungültig");
      }
    } catch (e) {
      setError("Verifizierung fehlgeschlagen");
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
          Authenticator Registrierung
        </ThemedText>

        <ThemedText style={styles.label}>E-Mail:</ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-Mail"
          placeholderTextColor="#999"
          autoCapitalize="none"
          style={styles.input}
        />

        <ThemedView style={styles.fixToText}>
          <Button
            title="Setup starten"
            onPress={startSetup}
            disabled={!isEmailValid}
          />
        </ThemedView>

        {qr && (
          <>
            <ThemedText style={styles.label}>
              QR-Code scannen:
            </ThemedText>

            <Image
              source={{ uri: qr }}
              style={styles.qr}
            />

            <ThemedText style={styles.label}>
              Code aus App:
            </ThemedText>

            <TextInput
              value={token}
              onChangeText={setToken}
              keyboardType="numeric"
              placeholder="123456"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <ThemedView style={styles.fixToText}>
              <Button
                title="Bestätigen"
                onPress={verifySetup}
                disabled={!isTokenValid}
              />
            </ThemedView>
          </>
        )}

        {verified && (
          <ThemedText style={styles.success}>
            Registrierung erfolgreich ✅
          </ThemedText>
        )}

        {error ? (
          <ThemedText style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

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
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30
  },
  qr: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  error: {
    color: "red",
  },
  success: {
    color: "green",
    fontWeight: "bold",
  },
});