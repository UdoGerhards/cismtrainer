import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useState } from "react";
import { Button, StyleSheet, TextInput } from "react-native";

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from "@/context/AuthContext";
import { Image } from 'expo-image';

export default function LoginScreen() {

  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid =
    email.trim().length > 0 &&
    password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setError("");

    try {
      const result = await login(email, password);

      if (result === "error") {
        setError("Login fehlgeschlagen");
        return;
      }

      if (result === "2fa") {
        router.replace("/2fa");
        return;
      }

      // normaler Login → AuthGuard übernimmt

    } catch (e) {
      setError("Serverfehler beim Login");
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

        <ThemedText style={styles.label}>E-Mail:</ThemedText>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          placeholder="E-Mail"
          placeholderTextColor="#999"
          autoCapitalize="none"
          style={styles.input}
        />

        <ThemedText style={styles.label}>Passwort:</ThemedText>

        {/* ✅ Passwortfeld mit Icon */}
        <ThemedView style={styles.inputWrapper}>
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            placeholder="Passwort"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            style={styles.inputWithIcon}
          />

          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            style={styles.icon}
            onPress={() => setShowPassword((prev) => !prev)}
          />
        </ThemedView>

        {error ? (
          <ThemedText style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <ThemedView style={styles.fixToText}>
          <Button
            title="Login"
            onPress={handleLogin}
            disabled={!isFormValid}
            color={isFormValid ? "#007AFF" : "#ccc"}
          />
        </ThemedView>

        {/* ❌ Link wurde entfernt */}

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
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
  },

  // ✅ neues Wrapper-System
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  inputWithIcon: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    paddingRight: 40,
    borderRadius: 6,
  },

  icon: {
    position: "absolute",
    right: 10,
    color: "#888",
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

  error: {
    color: "red",
  },
});