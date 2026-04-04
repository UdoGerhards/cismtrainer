import { DarkTheme, LightTheme } from "@/constants/theme";
import { ThemeProvider, useTheme } from "@react-navigation/native";

import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";

import { usePathname, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useEffect, useState } from "react";

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
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  indent?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.itemContainer,
        indent && styles.indent,
        active && {
          backgroundColor: colors.primary + "25",
          borderRadius: 10,
        },
      ]}
    >
      <Text
        style={[
          styles.itemText,
          { color: colors.text },
          active && {
            color: colors.primary,
            fontWeight: "600",
          },
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
      <Text style={{ color: colors.text }}>
        {open ? "▼ " : "▶ "} {title}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// 🔹 CUSTOM DRAWER
// ======================================================

function CustomDrawerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { user } = useAuth(); // 🔥 USER holen

  const [quizOpen, setQuizOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const isAdmin = user?.role === "admin";

  return (
    <DrawerContentScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.card },
      ]}
    >
      <DrawerItem
        label="Performance"
        active={pathname === "/"}
        onPress={() => router.push("/")}
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

      {/* 🔥 ADMIN nur für Admin */}
      {isAdmin && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SectionHeader
            title="ADMIN"
            open={adminOpen}
            toggle={() => setAdminOpen(!adminOpen)}
          />

          {adminOpen && (
            <>
              <DrawerItem
                label="User Management"
                indent
                active={isActive("/maintainance")}
                onPress={() => router.push("/maintainance")}
              />

              <DrawerItem
                label="TestManagement"
                indent
                active={isActive("/")}
                onPress={() => router.push("/")}
              />
            </>
          )}
        </>
      )}
    </DrawerContentScrollView>
  );
}

// ======================================================
// 🔹 HEADER WITH DROPDOWN
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
    <View>
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
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
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
            <Text style={{ color: colors.text, flex: 1 }}>
              {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </Text>

            <Switch
              value={theme === "dark"}
              onValueChange={handleSwitch}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor="#fff"
            />
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 6,
            }}
          />

          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            style={styles.dropdownItem}
          >
            <Text style={{ color: colors.text, opacity: 0.8 }}>⊘ Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ======================================================
// 🔹 APP CONTENT
// ======================================================

function AppContent() {
  const { loading, user, logout } = useAuth();
  const router = useRouter();

  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState(systemScheme || "light");

  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setTheme(saved);
    };
    loadTheme();
  }, []);

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
        screenOptions={{
          headerTitle: "",
          headerRight: () =>
            user ? ( // 🔥 Avatar nur wenn eingeloggt
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
        drawerContent={() => <CustomDrawerContent />}
      >
        <Drawer.Screen name="index" />
        <Drawer.Screen name="question" />
        <Drawer.Screen name="test" />

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
    padding: 16,
  },
  indent: {
    paddingLeft: 32,
  },
  itemText: {
    fontSize: 15,
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
  dropdown: {
    position: "absolute",
    top: 45,
    right: 0,
    width: 200,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 16,
  },
};
