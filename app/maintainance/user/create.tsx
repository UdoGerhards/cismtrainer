import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@react-navigation/native";

import Footer from "@/components/Footer";
import OtpInput, { OtpInputRef } from "@/components/ui/OTPInput";
import client from "@/scripts/client";

import { HeaderLogo } from "@/components/headerLogo";
import { Ionicons } from "@expo/vector-icons";

// 🔐 Bitmasken-Definitionen
const PERM_USER = 1; // 000001 -> Standard-Basisrecht
const PERM_CREATE_USERS = 2; // 000010 -> Benutzer anlegen
const PERM_DELETE_USERS = 4; // 000100 -> Benutzer löschen
const PERM_DELETE_TESTS = 8; // 001000 -> Tests löschen
const PERM_KI_USE_ALLOWED = 16; // 010000 -> Benutzung von KI erlaubt ("Explain")
const PERM_ADMIN = 63; // 111111 -> Adminuser

export default function UserManagementScreen() {
  const { colors } = useTheme();

  // Schutzwand-States für die Vorab-Authentifizierung
  const [isVerified, setIsVerified] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");

  // Passwort-States & Sichtbarkeits-Flags
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Standardmäßig: PERM_USER (1) + PERM_DELETE_TESTS (8) = 9
  const defaultMask = PERM_USER | PERM_DELETE_TESTS;
  const [selectedRoleMask, setSelectedRoleMask] = useState<number>(defaultMask);

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
    if (isVerified) {
      fetchUsers();
    }
  }, [isVerified]);

  /*
  ==========================================
  PRE-VERIFY OTP (ZUGANGS-CHECK)
  ==========================================
  */
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

  /*
  ==========================================
  TOGGLE ROLE BITMASK
  ==========================================
  */
  const handleTogglePermission = (permission: number) => {
    if (permission === PERM_ADMIN) {
      if (selectedRoleMask === PERM_ADMIN) {
        // Wenn Admin aktiv war, setzen wir zurück auf die Standard-User-Kombination
        setSelectedRoleMask(defaultMask);
      } else {
        // Wird Admin gewählt, werden sofort alle Bits gesetzt
        setSelectedRoleMask(PERM_ADMIN);
      }
    } else {
      // Falls aktuell der Admin-Modus aktiv ist und ein einzelnes Recht abgewählt wird,
      // brechen wir den Admin-Status auf und behalten nur das Basisrecht + das geänderte Recht.
      let currentMask =
        selectedRoleMask === PERM_ADMIN ? defaultMask : selectedRoleMask;

      if ((currentMask & permission) === permission) {
        // Recht entfernen (aber PERM_USER bleibt als Basis immer geschützt)
        const newMask = currentMask & ~permission;
        setSelectedRoleMask(newMask | PERM_USER);
      } else {
        // Recht hinzufügen
        setSelectedRoleMask(currentMask | permission);
      }
    }
  };

  // Prüft, ob ein Recht in der aktuellen Maske aktiv ist
  const hasPermission = (permission: number) => {
    if (permission === PERM_ADMIN) {
      return selectedRoleMask === PERM_ADMIN;
    }
    // Wenn Admin aktiv ist, sind implizit alle Einzelrechte aktiv
    if (selectedRoleMask === PERM_ADMIN) {
      return true;
    }
    return (selectedRoleMask & permission) === permission;
  };

  /*
  ==========================================
  CREATE USER
  ==========================================
  */
  const handleCreateUser = async () => {
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      return showError("Alle Felder erforderlich");
    }

    if (password !== confirmPassword) {
      return showError("Die Passwörter stimmen nicht überein");
    }

    setLoading(true);

    try {
      await client.createUser({
        firstname,
        lastname,
        email,
        password,
        role: selectedRoleMask,
      });

      showSuccess("User erstellt ✅");

      setFirstname("");
      setLastname("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setSelectedRoleMask(defaultMask);

      fetchUsers();
    } catch {
      showError("User konnte nicht erstellt werden");
    }

    setLoading(false);
  };

  useEffect(() => {
    otpRef.current?.reset();
  }, []);

  /*
  ==========================================
  SCREEN RENDER LOGIC
  ==========================================
  */

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
              Bitte gib deinen Authenticator-Code ein, um fortzufahren.
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
                    activeOpacity={0.7}
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

            {error ? (
              <ThemedText
                style={{
                  color: colors.errorBackground,
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                {error}
              </ThemedText>
            ) : null}
            {otpLoading ? (
              <ThemedText
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  color: colors.text,
                }}
              >
                Prüfe Code...
              </ThemedText>
            ) : null}
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
        <ThemedView style={[styles.container, styles.responsiveWrapper]}>
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

          {/* Passwort-Eingabe */}
          <View
            style={[styles.passwordContainer, { borderColor: colors.border }]}
          >
            <TextInput
              placeholder="Passwort"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.passwordInput, { color: colors.text }]}
            />
            <TouchableOpacity
              style={styles.eyeWrapper}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={22}
                color={colors.text}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
          </View>

          {/* Passwort wiederholen */}
          <View
            style={[styles.passwordContainer, { borderColor: colors.border }]}
          >
            <TextInput
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={[styles.passwordInput, { color: colors.text }]}
            />
            <TouchableOpacity
              style={styles.eyeWrapper}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye" : "eye-off"}
                size={22}
                color={colors.text}
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.permissionsVerticalContainer}>
            <ThemedText style={styles.verticalLabel}>
              Rechte zuweisen:
            </ThemedText>

            <View style={styles.checkboxGroupVertical}>
              {/* Option: Benutzer anlegen */}
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => handleTogglePermission(PERM_CREATE_USERS)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    { borderColor: colors.border },
                  ]}
                >
                  {hasPermission(PERM_CREATE_USERS) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Benutzer anlegen
                </ThemedText>
              </TouchableOpacity>

              {/* Option: Benutzer löschen */}
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => handleTogglePermission(PERM_DELETE_USERS)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    { borderColor: colors.border },
                  ]}
                >
                  {hasPermission(PERM_DELETE_USERS) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Benutzer löschen
                </ThemedText>
              </TouchableOpacity>

              {/* Option: Tests löschen */}
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => handleTogglePermission(PERM_DELETE_TESTS)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    { borderColor: colors.border },
                  ]}
                >
                  {hasPermission(PERM_DELETE_TESTS) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Tests löschen
                </ThemedText>
              </TouchableOpacity>

              {/* Option: Benutzung von KI erlaubt */}
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => handleTogglePermission(PERM_KI_USE_ALLOWED)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    { borderColor: colors.border },
                  ]}
                >
                  {hasPermission(PERM_KI_USE_ALLOWED) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Benutzung von KI erlaubt ("Explain")
                </ThemedText>
              </TouchableOpacity>

              {/* Option: Adminuser */}
              <TouchableOpacity
                style={styles.checkboxOption}
                activeOpacity={0.7}
                onPress={() => handleTogglePermission(PERM_ADMIN)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    { borderColor: colors.border },
                  ]}
                >
                  {hasPermission(PERM_ADMIN) && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>Adminuser</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateUser}
              activeOpacity={0.8}
              disabled={loading}
            >
              <ThemedText style={styles.submitButtonText}>
                {loading ? "Erstelle..." : "User erstellen"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* STATUS */}
          {error ? (
            <ThemedText
              style={{ color: colors.errorBackground, marginTop: 10 }}
            >
              {error}
            </ThemedText>
          ) : null}
          {success ? (
            <ThemedText
              style={{ color: colors.successBackground, marginTop: 10 }}
            >
              {success}
            </ThemedText>
          ) : null}
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
  responsiveWrapper: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "flex-start",
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
    height: 44,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
  },
  eyeWrapper: {
    paddingLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionsVerticalContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 14,
    gap: 8,
  },
  verticalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  checkboxGroupVertical: {
    width: "100%",
    flexDirection: "column",
    gap: 12,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  checkboxSquare: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 16,
  },
  submitButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 16,
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backspaceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backspaceText: {
    fontSize: 14,
    fontWeight: "600",
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
});
