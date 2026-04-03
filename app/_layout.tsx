import { ThemeProvider, useTheme } from "@react-navigation/native";

import { LightTheme, DarkTheme } from "@/constants/theme";

import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";

import { usePathname, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useState, useEffect } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "APP_THEME";

// ======================================================
// 🔹 DRAWER ITEM
// ======================================================

function DrawerItem({
  label,
  onPress,
  active,
  indent = false,
  muted = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  indent?: boolean;
  muted?: boolean;
  icon?: string;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.itemContainer,
        indent && styles.indent,
        active && {
          backgroundColor: colors.primary + "25",
          borderWidth: 1,
          borderColor: colors.primary + "40",
        },
      ]}
    >
      <Text
        style={[
          styles.itemText,
          { color: colors.text },
          active && { color: colors.primary, fontWeight: "600" },
          muted && { color: colors.text, opacity: 0.4 },
        ]}
      >
        {icon ? `${icon} ` : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 SECTION HEADER
// ======================================================

function SectionHeader({
  title,
  open,
  toggle,
}: {
  title: string;
  open: boolean;
  toggle: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={toggle} style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>
        {title}
      </Text>
      <Text style={{ color: colors.text, opacity: 0.6 }}>
        {open ? "▼" : "▶"}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 CUSTOM DRAWER
// ======================================================

function CustomDrawerContent({ theme, toggleTheme }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { colors } = useTheme();

  const [quizOpen, setQuizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <DrawerContentScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.card,
        },
      ]}
    >
      <DrawerItem
        label="Performance"
        active={pathname === "/"}
        onPress={() => router.push("/")}
      />

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border, opacity: 0.6 },
        ]}
      />

      <SectionHeader
        title="QUIZ"
        open={quizOpen}
        toggle={() => setQuizOpen(!quizOpen)}
      />

      {quizOpen && (
        <>
          <DrawerItem
            label="Random question"
            indent
            active={isActive("/question")}
            onPress={() => router.push("/question")}
          />

          <DrawerItem
            label="CISM Test"
            indent
            active={isActive("/test")}
            onPress={() => router.replace("/test/config")}
          />
        </>
      )}

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border, opacity: 0.6 },
        ]}
      />

      <SectionHeader
        title="PROFILE"
        open={profileOpen}
        toggle={() => setProfileOpen(!profileOpen)}
      />

      {profileOpen && (
        <>
          <DrawerItem
            label="Change-Password"
            indent
            active={isActive("/change-password")}
            onPress={() => router.push("/change-password")}
          />

          <DrawerItem
            icon={theme === "light" ? "🌙" : "☀️"}
            label={theme === "light" ? "Dark" : "Light"}
            indent
            onPress={toggleTheme}
          />
        </>
      )}

      <View
        style={[
          styles.divider,
          { backgroundColor: colors.border, opacity: 0.6 },
        ]}
      />

      <DrawerItem label="Logout" onPress={handleLogout} muted icon="⊘" />
    </DrawerContentScrollView>
  );
}

// ======================================================
// 🔹 HEADER COMPONENT
// ======================================================

function HeaderRight({ user, router }: any) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => router.push("/profile")}
      style={styles.headerRight}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>
          {user?.firstname?.charAt(0)?.toUpperCase() || "U"}
        </Text>
      </View>

      <Text style={[styles.headerUser, { color: colors.text }]}>
        {user?.firstname || "User"}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 APP CONTENT
// ======================================================

function AppContent() {
  const { loading, user } = useAuth();
  const router = useRouter();

  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme || "light");

  // 🔥 LOAD THEME
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (e) {
        console.log("Fehler beim Laden", e);
      }
    };

    loadTheme();
  }, []);

  // 🔥 TOGGLE + SAVE
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    try {
      await AsyncStorage.setItem(THEME_KEY, newTheme);
    } catch (e) {
      console.log("Fehler beim Speichern", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : LightTheme}>
      <Drawer
        screenOptions={({ theme }) => ({
          headerTitle: "",
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
          headerTintColor: theme.colors.text,
          headerRight: () => <HeaderRight user={user} router={router} />,
          headerRightContainerStyle: {
            paddingRight: 16,
          },
        })}
        drawerContent={() => (
          <CustomDrawerContent
            key={theme} // 🔥 FIX: Re-render Drawer
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="question" />
        <Drawer.Screen name="test" />

        <Drawer.Screen
          name="test/tst"
          options={{ drawerItemStyle: { display: "none" } }}
        />
        <Drawer.Screen
          name="test/ergebnis"
          options={{ drawerItemStyle: { display: "none" } }}
        />

        <Drawer.Screen
          name="login/index"
          options={{ drawerItemStyle: { display: "none" }, headerShown: false }}
        />

        <Drawer.Screen
          name="registration/index"
          options={{ drawerItemStyle: { display: "none" }, headerShown: false }}
        />

        <Drawer.Screen
          name="change-password/index"
          options={{ drawerItemStyle: { display: "none" } }}
        />

        <Drawer.Screen
          name="profile/index"
          options={{ drawerItemStyle: { display: "none" } }}
        />
      </Drawer>

      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

// ======================================================
// 🔹 ROOT
// ======================================================

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

const styles = {
  container: {
    paddingVertical: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  indent: {
    paddingLeft: 32,
  },
  itemText: {
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUser: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
};
