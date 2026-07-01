import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";

import { useFocusEffect, useTheme } from "@react-navigation/native";

import Footer from "@/components/Footer";
import { HeaderLogo } from "@/components/headerLogo";
import PasswordInput from "@/components/passwordInput";

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hilfsfunktion zur E-Mail-Validierung
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = isValidEmail(email) && password.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, []),
  );

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleLogin = async () => {
    if (!isFormValid) return;

    setError("");

    try {
      const result = await login(email, password);

      if (result === "error") {
        setError("Login fehlgeschlagen");
        return;
      }

      resetForm();

      if (result === "2fa") {
        router.replace("/2fa");
        return;
      }
    } catch (e) {
      setError("Serverfehler beim Login");
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
          <ThemedText style={styles.label}>E-Mail:</ThemedText>
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError("");
            }}
            placeholder="john.doe@john-doe.de"
            placeholderTextColor={colors.border}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            textContentType="emailAddress"
            autoComplete="email"
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.card,
                width: "100%",
                maxWidth: 400,
              },
            ]}
          />

          <ThemedText style={styles.label}>Passwort:</ThemedText>

          <PasswordInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError("");
            }}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <ThemedText
              style={[styles.error, { color: colors.errorBackground }]}
            >
              {error}
            </ThemedText>
          ) : null}

          <ThemedView style={styles.fixToText}>
            <Button
              title="Login"
              onPress={handleLogin}
              disabled={!isFormValid}
              color={isFormValid ? colors.primary : colors.border}
            />
          </ThemedView>
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
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  error: {
    fontSize: 14,
    marginTop: 5,
  },
});
