import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";
import { Image } from "expo-image";

import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

export default function ChangePasswordScreen() {
  const { colors } = useTheme(); // ✅ THEME

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

  const isValid = password.trim().length >= 8 && password === confirm;

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

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

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
        <ThemedText style={styles.title}>Passwort ändern</ThemedText>

        <ThemedText style={styles.label}>Neues Passwort:</ThemedText>

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
            placeholderTextColor={colors.border}
            style={[
              styles.inputWithIcon,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={[styles.icon, { color: colors.border }]}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        <ThemedText style={styles.label}>Passwort bestätigen:</ThemedText>

        <ThemedView style={styles.inputWrapper}>
          <TextInput
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              setError("");
            }}
            secureTextEntry={!showPassword}
            placeholder="Wiederholen"
            placeholderTextColor={colors.border}
            style={[
              styles.inputWithIcon,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={[styles.icon, { color: colors.border }]}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        {!isValid && password.length > 0 && (
          <ThemedText style={[styles.error, { color: colors.errorBackground }]}>
            Passwort ungültig oder stimmt nicht überein (min. 8 Zeichen)
          </ThemedText>
        )}

        {error ? (
          <ThemedText style={[styles.error, { color: colors.errorBackground }]}>
            {error}
          </ThemedText>
        ) : null}

        {success ? (
          <ThemedText
            style={[styles.success, { color: colors.successBackground }]}
          >
            Passwort erfolgreich geändert ✅
          </ThemedText>
        ) : null}

        <ThemedView style={styles.button}>
          <Button
            title={loading ? "Wird geändert..." : "Passwort ändern"}
            onPress={handleChangePassword}
            disabled={!isValid || loading}
            color={colors.primary}
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

  button: {
    marginTop: 10,
    alignItems: "flex-start",
  },

  error: {
    fontSize: 14,
  },

  success: {
    fontWeight: "bold",
    fontSize: 14,
  },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  inputWithIcon: {
    borderWidth: 1,
    padding: 10,
    paddingRight: 40,
    borderRadius: 8,
  },

  icon: {
    position: "absolute",
    right: 10,
  },

  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
});
