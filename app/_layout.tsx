import AsyncStorage from "@react-native-async-storage/async-storage";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { ThemeProvider, useTheme } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { DarkTheme, LightTheme } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const THEME_KEY = "APP_THEME";

// 🔐 Vollständiges Bitmasken-Berechtigungssystem
const PERM_USER = 1; // 000001 -> Standard-Basisrecht (kein Menü-Einfluss)
const PERM_CREATE_USERS = 2; // 000010 -> Berechtigung Benutzer anzulegen
const PERM_DELETE_USERS = 4; // 000100 -> Berechtigung Benutzer zu löschen
const PERM_DELETE_TESTS = 8; // 001000 -> Berechtigung für Test Management
const PERM_KI_USE_ALLOWED = 16; // 010000 -> Keine Auswirkungen auf diese Anzeige
const PERM_ADMIN = 63; // 111111 -> Adminuser (alle Rechte freigeschaltet)

// Helper-Funktion um zu prüfen, ob ein bestimmtes Recht in der Bitmaske enthalten ist
const hasPermission = (userRole: any, permission: number) => {
  const roleMask = Number(userRole);
  if (isNaN(roleMask)) return false;

  // Wenn der User Admin ist, hat er implizit alle Rechte
  if ((roleMask & PERM_ADMIN) === PERM_ADMIN) return true;

  return (roleMask & permission) === permission;
};

// ======================================================
// 🔹 DRAWER ITEM
// ======================================================
function DrawerItem({
  label,
  onPress,
  active,
  indent = false,
  doubleIndent = false,
}: any) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.itemContainer,
        indent && styles.indent,
        doubleIndent && styles.doubleIndent,
        active && { backgroundColor: colors.primary + "20", borderRadius: 10 },
      ]}
    >
      <Text
        style={[
          styles.itemText,
          { color: colors.text },
          active && { color: colors.primary, fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 SECTION HEADER
// ======================================================
function SectionHeader({ title, open, toggle }: any) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={toggle} style={styles.sectionHeader}>
      <Text style={{ color: colors.text, fontWeight: "bold", opacity: 0.6 }}>
        {open ? "▼ " : "▶ "} {title}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 CUSTOM DRAWER
// ======================================================
function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [quizOpen, setQuizOpen] = useState(true);

  // 📉 Hier geändert: Beide Menüs starten standardmäßig auf `false` (eingeklappt)
  const [adminOpen, setAdminOpen] = useState(false);
  const [userSubOpen, setUserSubOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navigateTo = (path: any) => {
    props.navigation.closeDrawer();
    router.push(path);
  };

  // 🔍 Berechtigungen für das Hamburger Menü auswerten
  const showTestManagement = hasPermission(user?.role, PERM_DELETE_TESTS);
  const canCreate = hasPermission(user?.role, PERM_CREATE_USERS);
  const canDelete = hasPermission(user?.role, PERM_DELETE_USERS);

  // "User" (Hauptpunkt) blendet sich nur ein, wenn man anlegen ODER löschen darf
  const showUserMenu = canCreate || canDelete;

  // 🔒 Bestimmt, ob die gesamte "ADMINISTRATION"-Sektion sichtbar sein soll
  const showAdministrationSection = showTestManagement || showUserMenu;

  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.card }}
    >
      <View style={styles.container}>
        <DrawerItem
          label="Performance Overview"
          active={isActive("/")}
          onPress={() => navigateTo("/")}
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SectionHeader
          title="QUIZ"
          open={quizOpen}
          toggle={() => setQuizOpen(!quizOpen)}
        />

        {quizOpen && (
          <>
            <DrawerItem
              label="Random Question"
              indent
              active={isActive("/question")}
              onPress={() => navigateTo("/question")}
            />
            <DrawerItem
              label="CISM Test"
              indent
              active={pathname.includes("/test")}
              onPress={() => navigateTo("/test")}
            />
          </>
        )}

        {/* 🔓 ADMINISTRATION SEKTION (Blendet sich komplett aus, wenn Rolle nur 000001 ist) */}
        {showAdministrationSection && (
          <>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <SectionHeader
              title="ADMINISTRATION"
              open={adminOpen}
              toggle={() => setAdminOpen(!adminOpen)}
            />

            {adminOpen && (
              <>
                {/* 📋 BITMASKEN-PRÜFUNG: Test Management einblenden */}
                {showTestManagement && (
                  <DrawerItem
                    label="Test Management"
                    indent
                    active={isActive("/maintainance/testBatch")}
                    onPress={() => navigateTo("/maintainance/testBatch")}
                  />
                )}

                {/* 👤 BITMASKEN-PRÜFUNG: Hauptpunkt "User" einblenden */}
                {showUserMenu && (
                  <>
                    <TouchableOpacity
                      onPress={() => setUserSubOpen(!userSubOpen)}
                      activeOpacity={0.7}
                      style={[styles.itemContainer, styles.indent]}
                    >
                      <Text style={[styles.itemText, { color: colors.text }]}>
                        {userSubOpen ? "▼ " : "▶ "} User
                      </Text>
                    </TouchableOpacity>

                    {userSubOpen && (
                      <>
                        {/* ➕ Link nur einblenden, wenn Bit 000010 (oder Admin) gesetzt ist */}
                        {canCreate && (
                          <DrawerItem
                            label="User anlegen"
                            doubleIndent
                            active={isActive("/maintainance/user/create")}
                            onPress={() =>
                              navigateTo("/maintainance/user/create")
                            }
                          />
                        )}
                        {/* ❌ Link nur einblenden, wenn Bit 000100 (oder Admin) gesetzt ist */}
                        {canDelete && (
                          <DrawerItem
                            label="User löschen"
                            doubleIndent
                            active={isActive("/maintainance/user/delete")}
                            onPress={() =>
                              navigateTo("/maintainance/user/delete")
                            }
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </View>
    </DrawerContentScrollView>
  );
}

// ======================================================
// 🔹 HEADER RIGHT (AVATAR & DROPDOWN)
// ======================================================
function HeaderRight({ user, router, theme, setTheme, logout }: any) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSwitch = async (value: boolean) => {
    const newTheme = value ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  // 🔥 Prüfen, ob der User mindestens eines der Verwaltungsrechte besitzt
  const showUserManagementLink =
    hasPermission(user?.role, PERM_CREATE_USERS) ||
    hasPermission(user?.role, PERM_DELETE_USERS);

  return (
    <View style={{ zIndex: 1000 }}>
      <TouchableOpacity onPress={() => setOpen(!open)}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.firstname?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
      </TouchableOpacity>

      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              setOpen(false);
              router.push("/profile");
            }}
            style={styles.dropdownItem}
          >
            <Text style={{ color: colors.text }}>👤 Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setOpen(false);
              router.push("/change-password");
            }}
            style={styles.dropdownItem}
          >
            <Text style={{ color: colors.text }}>🔑 Change Password</Text>
          </TouchableOpacity>

          <View style={styles.dropdownItemRow}>
            <Text style={{ color: colors.text }}>
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </Text>
            <Switch
              value={theme === "dark"}
              onValueChange={handleSwitch}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View
            style={[styles.divider, { marginHorizontal: 0, marginVertical: 5 }]}
          />

          <TouchableOpacity
            onPress={async () => {
              setOpen(false);
              await logout();
              router.replace("/login");
            }}
            style={styles.dropdownItem}
          >
            <Text style={{ color: colors.text, opacity: 0.7 }}>⊘ Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ======================================================
// 🔹 MAIN APP CONTENT
// ======================================================
function AppContent() {
  const { loading, user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme || "light");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setTheme(saved as any);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : LightTheme}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerTitle: "CISM Trainer",
          headerShown: isAuthenticated,
          swipeEnabled: isAuthenticated,

          headerRight: () =>
            user ? (
              <HeaderRight
                user={user}
                router={router}
                theme={theme}
                setTheme={setTheme}
                logout={logout}
              />
            ) : null,
          headerRightContainerStyle: { paddingRight: 16 },
        }}
      >
        <Drawer.Screen name="index" options={{ title: "Home" }} />
        <Drawer.Screen name="question" options={{ title: "Practice" }} />
        <Drawer.Screen name="test" options={{ title: "Exam" }} />

        <Drawer.Screen
          name="login"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="profile/users"
          options={{
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// ======================================================
// 🔹 STYLES
// ======================================================
const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  indent: {
    paddingLeft: 32,
  },
  doubleIndent: {
    paddingLeft: 48,
  },
  itemText: {
    fontSize: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  dropdown: {
    position: "absolute",
    top: 50,
    right: 0,
    width: 220,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
    opacity: 0.5,
  },
});
