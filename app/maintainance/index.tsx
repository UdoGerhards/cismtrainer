import { useEffect, useRef, useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@react-navigation/native";
import { Image } from "expo-image";

import Footer from "@/components/Footer";
import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import client from "@/scripts/client";

export default function AdminUserScreen() {
  const { colors } = useTheme();

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState("");
  const otpRef = useRef<OtpInputRef>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

    setSuccess("");
    setError(msg);

    errorTimeoutRef.current = setTimeout(() => {
      setError("");
    }, 5000);
  };

  const showSuccess = (msg: string) => {
    setError("");
    setSuccess(msg);

    setTimeout(() => setSuccess(""), 3000);
  };

  const fetchUsers = async () => {
    try {
      const users = await client.getAllUsers();
      setUsers(users);
    } catch {
      showError("User konnten nicht geladen werden");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /*
  ==========================================
  CREATE USER (OHNE TOKEN)
  ==========================================
  */

  const handleCreateUser = async () => {
    if (!firstname || !lastname || !email || !password) {
      return showError("Alle Felder erforderlich");
    }

    setLoading(true);

    try {
      await client.createUser({
        firstname,
        lastname,
        email,
        password,
      });

      showSuccess("User erstellt ✅");

      setFirstname("");
      setLastname("");
      setEmail("");
      setPassword("");

      fetchUsers();
    } catch {
      showError("User konnte nicht erstellt werden");
    }

    setLoading(false);
  };

  /*
  ==========================================
  DELETE USER (MIT TOKEN)
  ==========================================
  */

  const handleDeleteUser = async (id: string) => {
    if (!token) {
      otpRef.current?.reset(); // 🔥 reset
      return showError("Authenticator-Token erforderlich");
    }

    try {
      await client.deleteUser(id, token);

      showSuccess("User gelöscht 🗑️");
      fetchUsers();

      setToken("");
      otpRef.current?.reset(); // ✅ nach Erfolg
    } catch {
      showError("User konnte nicht gelöscht werden");

      setToken("");
      otpRef.current?.reset(); // ✅ nach Fehler
    }
  };

  /*
  ==========================================
  FILTER
  ==========================================
  */

  const filteredUsers = users.filter((u) =>
    `${u.firstname} ${u.lastname} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  useEffect(() => {
    otpRef.current?.reset();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
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
        <ThemedView style={[styles.container]}>
          <ThemedText style={styles.title}>User Verwaltung</ThemedText>

          {/* CREATE USER */}
          <ThemedText style={styles.label}>Neuen User anlegen</ThemedText>

          <TextInput
            placeholder="Vorname"
            value={firstname}
            onChangeText={setFirstname}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
          />

          <TextInput
            placeholder="Nachname"
            value={lastname}
            onChangeText={setLastname}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
          />

          <TextInput
            placeholder="Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
          />

          <Button
            title={loading ? "Erstelle..." : "User erstellen"}
            onPress={handleCreateUser}
            color={colors.primary}
          />

          {/* STATUS */}
          {error ? (
            <ThemedText style={{ color: colors.errorBackground }}>
              {error}
            </ThemedText>
          ) : null}

          {success ? (
            <ThemedText style={{ color: colors.successBackground }}>
              {success}
            </ThemedText>
          ) : null}
        </ThemedView>
        <ThemedView style={[styles.container]}>
          {/* SEARCH */}
          <TextInput
            placeholder="Suche..."
            value={search}
            onChangeText={setSearch}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
          />
          {/* USER LIST */}
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.row, { borderColor: colors.border }]}>
                <ThemedText>
                  {item.firstname} {item.lastname} ({item.email})
                </ThemedText>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(item.id)}
                >
                  <ThemedText style={styles.deleteText}>-</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          />
        </ThemedView>
        {/* TOKEN INPUT (für DELETE) */}
        <ThemedView style={styles.otpWrapper}>
          <ThemedView
            style={[
              styles.otpContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <OtpInput
              ref={otpRef}
              onComplete={(code) => {
                setToken(code);
                handleDeleteUser(selectedUserId); // 🔥 direkt löschen
              }}
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
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "red",
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  otpWrapper: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginTop: 10,
  },

  otpContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  reactLogo: {
    height: 163,
    width: 408,
    marginTop: 40,
    marginLeft: 30,
  },
});
