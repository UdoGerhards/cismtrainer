import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { Image } from 'expo-image';

export default function ChangePasswordScreen() {

  const { refreshUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isValid =
    password.trim().length >= 6 &&
    password === confirm;

  const handleChangePassword = async () => {
    if (!isValid) return;

    setError("");
    setSuccess(false);

    try {
      const res = await client.request("/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          newPassword: password,
        }),
      });

      if (res?.success) {
        setSuccess(true);

        // 🔑 wichtig: User neu laden → Guard reagiert
        await refreshUser();

      } else {
        setError("Passwort konnte nicht geändert werden");
      }

    } catch (e) {
      setError("Serverfehler");
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
          Passwort ändern
        </ThemedText>

        <ThemedText style={styles.label}>
          Neues Passwort:
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Neues Passwort"
          style={styles.input}
        />

        <ThemedText style={styles.label}>
          Passwort bestätigen:
        </ThemedText>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Wiederholen"
          style={styles.input}
        />

        {!isValid && password.length > 0 && (
          <ThemedText style={styles.error}>
            Passwort ungültig oder stimmt nicht überein
          </ThemedText>
        )}

        {error ? (
          <ThemedText style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        {success ? (
          <ThemedText style={styles.success}>
            Passwort erfolgreich geändert ✅
          </ThemedText>
        ) : null}

        <ThemedView style={styles.button}>
          <Button
            title="Passwort ändern"
            onPress={handleChangePassword}
            disabled={!isValid}
          />
        </ThemedView>

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
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: "red",
  },
  success: {
    color: "green",
    fontWeight: "bold",
  },
});