import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { Image } from "expo-image";

import { useFocusEffect, useTheme } from "@react-navigation/native";

export default function LoginScreen() {
  const { colors } = useTheme(); // ✅ THEME
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, []),
  );

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
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
    <ParallaxScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ backgroundColor: colors.background }}
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
        <ThemedText style={styles.label}>E-Mail:</ThemedText>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          placeholder="E-Mail"
          placeholderTextColor={colors.border}
          autoCapitalize="none"
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

        <ThemedView style={styles.inputWrapper}>
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            placeholder="Passwort"
            placeholderTextColor={colors.border}
            secureTextEntry={!showPassword}
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
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={[styles.icon, { color: colors.border }]}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        {error ? (
          <ThemedText style={[styles.error, { color: colors.errorBackground }]}>
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

  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
});
