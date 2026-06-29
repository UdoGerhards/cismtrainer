import { useEffect, useRef, useState } from "react";
import {
  Button,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useAuth } from "@/context/AuthContext";
import client from "@/scripts/client";

import Footer from "@/components/Footer";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { HeaderLogo } from "@/components/headerLogo";

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isValid = password.trim().length >= 8 && password === confirm;

  const ERROR_MESSAGES: Record<string, string> = {
    PASSWORD_SAME: "Neues Passwort darf nicht dem alten entsprechen",
    PASSWORD_WEAK: "Passwort ist zu unsicher (bitte Anforderungen beachten)",
    SERVER_ERROR: "Passwort konnte nicht geändert werden",
  };

  const showError = (type: keyof typeof ERROR_MESSAGES) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
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
        body: JSON.stringify({ newPassword: password }),
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
      const errorCode = e?.data?.error || e?.response?.data?.error;
      showError(
        errorCode === "PASSWORD_SAME"
          ? "PASSWORD_SAME"
          : errorCode === "PASSWORD_WEAK"
            ? "PASSWORD_WEAK"
            : "SERVER_ERROR",
      );
      setPassword("");
      setConfirm("");
      passwordRef.current?.focus();
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          backgroundColor: colors.background,
          flexGrow: 1,
        }}
        headerBackgroundColor={{ light: colors.card, dark: colors.card }}
        headerImage={<HeaderLogo />}
      >
        <ThemedView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <ThemedText style={styles.title}>Passwort ändern</ThemedText>

          {/* PASSWORD */}
          <ThemedText style={styles.label}>Neues Passwort:</ThemedText>
          <View style={styles.inputWrapper}>
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
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                },
              ]}
            />
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#cccccc"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM */}
          <ThemedText style={styles.label}>Passwort bestätigen:</ThemedText>
          <View style={styles.inputWrapper}>
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
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.card,
                },
              ]}
            />
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#cccccc"
              />
            </TouchableOpacity>
          </View>

          {/* FEEDBACK */}
          {!isValid && password.length > 0 && (
            <ThemedText
              style={[styles.error, { color: colors.errorBackground }]}
            >
              Passwort ungültig (min. 8 Zeichen)
            </ThemedText>
          )}
          {error && (
            <ThemedText
              style={[styles.error, { color: colors.errorBackground }]}
            >
              {error}
            </ThemedText>
          )}
          {success && (
            <ThemedText
              style={[styles.success, { color: colors.successBackground }]}
            >
              Passwort erfolgreich geändert ✅
            </ThemedText>
          )}

          <View style={styles.button}>
            <Button
              title={loading ? "Wird geändert..." : "Passwort ändern"}
              onPress={handleChangePassword}
              disabled={!isValid || loading}
              color={colors.primary}
            />
          </View>
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  title: { fontSize: 22, marginBottom: 10 },
  label: { fontSize: 16 },
  button: { marginTop: 10, alignItems: "flex-start" },
  error: { fontSize: 14 },
  success: { fontWeight: "bold", fontSize: 14 },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
  },
  input: { borderWidth: 1, padding: 12, paddingRight: 45, borderRadius: 8 },
  iconContainer: { position: "absolute", right: 12, padding: 5 },
});
