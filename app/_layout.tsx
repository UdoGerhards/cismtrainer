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

// ======================================================
// 🔹 DRAWER ITEM
// ======================================================
function DrawerItem({ label, onPress, active, indent = false }: any) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.itemContainer,
        indent && styles.indent,
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
// 🔹 CUSTOM DRAWER (props hinzugefügt!)
// ======================================================
function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [quizOpen, setQuizOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  // Hilfsfunktion zum Navigieren und Schließen
  const navigateTo = (path: any) => {
    props.navigation.closeDrawer();
    router.push(path);
  };

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

        {user?.role === "admin" && (
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
                <DrawerItem
                  label="User Management"
                  indent
                  active={isActive("/maintainance")}
                  onPress={() => navigateTo("/maintainance")}
                />
                <DrawerItem
                  label="Test Management"
                  indent
                  active={isActive("/maintainance/testBatch")}
                  onPress={() => navigateTo("/maintainance/testBatch")}
                />
                <DrawerItem
                  label="AI Batch Processing"
                  indent
                  active={isActive("/maintainance/cismBatch")}
                  onPress={() => navigateTo("/maintainance/cismBatch")}
                />
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
  // 1. isAuthenticated hier hinzufügen
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
          // 🔥 DIESE BEIDEN ZEILEN SIND ENTSCHEIDEND:
          headerShown: isAuthenticated, // Zeigt Header nur wenn eingeloggt
          swipeEnabled: isAuthenticated, // Verhindert Wischen zum Öffnen wenn ausgeloggt

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

        {/* Falls die login-Route im Drawer definiert ist, verstecke sie aus der Liste */}
        <Drawer.Screen
          name="login"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false, // Sicherheitshalber auch hier aus
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
