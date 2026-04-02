import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { Image } from 'expo-image';

import { useRouter } from "expo-router";

export default function ChangePasswordScreen() {

  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  // ✅ an Backend angepasst
  const isValid =
    password.trim().length >= 8 &&
    password === confirm;

  // ✅ Zentrales Error-Messaging-System
  const ERROR_MESSAGES: Record<string, string> = {
    PASSWORD_SAME: "Neues Passwort darf nicht dem alten entsprechen",
    PASSWORD_WEAK: "Passwort ist zu unsicher (bitte Anforderungen beachten)",
    SERVER_ERROR: "Passwort konnte nicht geändert werden",
  };

  const showError = (type: keyof typeof ERROR_MESSAGES) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    setSuccess(false);
    setError(ERROR_MESSAGES[type]);

    errorTimeoutRef.current = setTimeout(() => {
      setError("");
      errorTimeoutRef.current = null;
    }, 60000);
  };

  const handleChangePassword = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await client.request("/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          newPassword: password,
        }),
      });

      console.log("Change password response:", res);

      if (res?.success === true) {
        setSuccess(true);

        await refreshUser();

        setTimeout(() => {
          setLoading(false);
          router.replace("/performance");
        }, 1500);

      } else {
        showError("SERVER_ERROR");

        setPassword("");
        setConfirm("");
        passwordRef.current?.focus();

        setLoading(false);
      }

    } catch (e: any) {
      console.log("ERROR:", e);

      // ✅ robust gegen verschiedene client-Implementierungen
      const status = e?.status || e?.response?.status;
      const errorCode = e?.data?.error || e?.response?.data?.error;

      if (status === 400) {
        if (errorCode === "PASSWORD_SAME") {
          showError("PASSWORD_SAME");
        } else if (errorCode === "PASSWORD_WEAK") {
          showError("PASSWORD_WEAK");
        } else {
          showError("SERVER_ERROR");
        }
      } else {
        showError("SERVER_ERROR");
      }

      setPassword("");
      setConfirm("");
      passwordRef.current?.focus();

      setLoading(false);
    }
  };

  // ✅ Cleanup
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

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

        <ThemedView style={styles.inputWrapper}>
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            secureTextEntry={!showPassword}
            placeholder="Neues Passwort"
            style={styles.inputWithIcon}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={styles.icon}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        <ThemedText style={styles.label}>
          Passwort bestätigen:
        </ThemedText>

        <ThemedView style={styles.inputWrapper}>
          <TextInput
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              setError("");
            }}
            secureTextEntry={!showPassword}
            placeholder="Wiederholen"
            style={styles.inputWithIcon}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={styles.icon}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        {!isValid && password.length > 0 && (
          <ThemedText style={styles.error}>
            Passwort ungültig oder stimmt nicht überein (min. 8 Zeichen)
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
            title={loading ? "Wird geändert..." : "Passwort ändern"}
            onPress={handleChangePassword}
            disabled={!isValid || loading}
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
  toggle: {
    color: "#007AFF",
    marginTop: 5,
  },
  inputWrapper: {
  position: "relative",
  justifyContent: "center",
},
inputWithIcon: {
  borderWidth: 1,
  borderColor: "#ccc",
  padding: 8,
  paddingRight: 40, // Platz für Icon!
  borderRadius: 6,
},

icon: {
  position: "absolute",
  right: 10,
  color: "#888",
},
});