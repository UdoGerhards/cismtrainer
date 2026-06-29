import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@react-navigation/native";

import Footer from "@/components/Footer";
import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import client from "@/scripts/client";

import { HeaderLogo } from "@/components/headerLogo";
import Ionicons from "@react-native-vector-icons/ionicons/static";

// Definition der Rechte basierend auf der Bitmaske
const PERMISSIONS = [
  { bit: 0b000010, label: "Kann Benutzer anlegen" },
  { bit: 0b000100, label: "Kann Benutzer löschen" },
  { bit: 0b001000, label: "Kann Tests löschen" },
  { bit: 0b010000, label: 'Kann KI benutzen ("Explain")' },
  { bit: 0b100000, label: "Admin" },
];

export default function UserManagementScreen() {
  const { colors } = useTheme();

  const [isVerified, setIsVerified] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const otpRef = useRef<OtpInputRef>(null);

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
    if (isVerified) {
      fetchUsers();
    }
  }, [isVerified]);

  const handlePreVerifyOtp = async (code: string) => {
    setOtpLoading(true);
    setError("");
    try {
      const isValid = (await client.verifyAdminOtp?.(code)) ?? true;
      if (isValid) {
        setIsVerified(true);
        setCurrentCode("");
      } else {
        showError("Ungültiger OTP-Code");
        otpRef.current?.reset();
        setCurrentCode("");
      }
    } catch {
      showError("Verifizierung fehlgeschlagen");
      otpRef.current?.reset();
      setCurrentCode("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeleteUser = async (id: string | null) => {
    if (!id) return;
    try {
      await client.deleteUser(id);
      showSuccess("User gelöscht 🗑️");
      fetchUsers();
    } catch {
      showError("User konnte nicht gelöscht werden");
    }
  };

  const filteredUsers = users.filter((u) =>
    `${u.firstname} ${u.lastname} ${u.email} ${u.role || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const hasPermission = (roleMask: number, bit: number) => {
    if (roleMask === 0b111111) return true;
    return (roleMask & bit) !== 0;
  };

  if (!isVerified) {
    return (
      <View style={{ flex: 1 }}>
        <ParallaxScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ flexGrow: 1 }}
          headerBackgroundColor={{ light: colors.card, dark: colors.card }}
          headerImage={<HeaderLogo />}
        >
          <ThemedView
            style={[
              styles.container,
              { justifyContent: "center", flex: 1, marginTop: 40 },
            ]}
          >
            <ThemedText style={[styles.title, { textAlign: "center" }]}>
              Sicherheitsbereich
            </ThemedText>
            <ThemedText
              style={{
                textAlign: "center",
                color: colors.border,
                marginBottom: 10,
              }}
            >
              Bitte gib deinen Authenticator-Code ein, um auf die User-Liste
              zuzugreifen.
            </ThemedText>

            <ThemedView style={styles.otpWrapper}>
              <ThemedView
                style={[
                  styles.otpContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <OtpInput
                  ref={otpRef}
                  onChangeText={(code) => setCurrentCode(code)}
                  onComplete={(code) => handlePreVerifyOtp(code)}
                />
                {currentCode.length > 0 && (
                  <TouchableOpacity
                    style={styles.backspaceButton}
                    onPress={() => otpRef.current?.clearLast()}
                  >
                    <ThemedText
                      style={[styles.backspaceText, { color: colors.text }]}
                    >
                      ⌫ Ziffer löschen
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ParallaxScrollView>
        <Footer />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1 }}
        headerBackgroundColor={{ light: colors.card, dark: colors.card }}
        headerImage={<HeaderLogo />}
      >
        <ThemedView style={[styles.container]}>
          <View
            style={[styles.searchContainer, { borderColor: colors.border }]}
          >
            <TextInput
              placeholder="Suche..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.text + "80"}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity style={styles.searchIconWrapper}>
              <Ionicons name="search" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const roleMask =
                typeof item.role === "number"
                  ? item.role
                  : parseInt(item.role, 10) || 0;

              return (
                <View style={[styles.row, { borderColor: colors.border }]}>
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userTextName}>
                      {item.firstname} {item.lastname}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.userTextEmail,
                        { color: colors.text + "A0" },
                      ]}
                    >
                      {item.email}
                    </ThemedText>
                  </View>

                  <View style={styles.checkboxContainer}>
                    {PERMISSIONS.map((p) => {
                      const active = hasPermission(roleMask, p.bit);
                      return (
                        <View key={p.bit} style={styles.checkboxWrapper}>
                          <Feather
                            name={active ? "check-square" : "square"}
                            size={18}
                            color={active ? colors.primary : colors.text + "40"}
                          />
                          <ThemedText style={styles.checkboxLabel}>
                            {p.label}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item.id)}
                  >
                    <ThemedText style={styles.deleteText}>-</ThemedText>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </ThemedView>
      </ParallaxScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    marginHorizontal: 30,
    gap: 12,
    marginBottom: 20,
  },
  title: { fontSize: 22 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: { flex: 1, height: "100%", paddingVertical: 0 },
  searchIconWrapper: {
    paddingLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  userInfo: { flex: 1 },
  userTextName: { fontWeight: "600", fontSize: 14 },
  userTextEmail: { fontSize: 11 },
  checkboxContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flex: 3,
    gap: 10,
  },
  checkboxWrapper: { alignItems: "center", minWidth: 55, maxWidth: 70, gap: 4 },
  checkboxLabel: {
    fontSize: 8,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 10,
  },
  deleteButton: {
    backgroundColor: "red",
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 18,
  },
  backspaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backspaceText: { fontSize: 14, fontWeight: "600" },
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
});
