import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { usePathname, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useState } from "react";


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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.itemContainer,
        indent && styles.indent,
        active && styles.activeItem,
      ]}
    >
      <Text
        style={[
          styles.itemText,
          active && styles.activeText,
          muted && styles.mutedText,
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
  return (
    <TouchableOpacity onPress={toggle} style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.chevron}>{open ? "▼" : "▶"}</Text>
    </TouchableOpacity>
  );
}


// ======================================================
// 🔹 CUSTOM DRAWER
// ======================================================

function CustomDrawerContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [quizOpen, setQuizOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>

      {/* PERFORMANCE */}
      <DrawerItem
        label="Performance"
        active={pathname === "/"}
        onPress={() => router.push("/")}
      />

      <View style={styles.divider} />

      {/* QUIZ */}
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

      <View style={styles.divider} />

      {/* PROFILE */}
      <SectionHeader
        title="PROFILE"
        open={profileOpen}
        toggle={() => setProfileOpen(!profileOpen)}
      />

      {profileOpen && (
        <DrawerItem
          label="Change-Password"
          indent
          active={isActive("/change-password")}
          onPress={() => router.push("/change-password")}
        />
      )}

      <View style={styles.divider} />

      {/* LOGOUT */}
      <DrawerItem
        label="Logout"
        onPress={handleLogout}
        muted
        icon="⊘"
      />

    </DrawerContentScrollView>
  );
}


// ======================================================
// 🔹 APP CONTENT
// ======================================================

function AppContent() {
  const { loading, user } = useAuth();
  const colorScheme = useColorScheme();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerTitle: "",

          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.headerRight}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstname?.slice(2)?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>

              <Text style={styles.headerUser}>
                {user?.firstname?.slice(2) || "User"}
              </Text>
            </TouchableOpacity>
          ),

          headerRightContainerStyle: {
            paddingRight: 16,
          },
        }}
        drawerContent={() => <CustomDrawerContent />}
      >

        {/* Visible */}
        <Drawer.Screen name="index" />
        <Drawer.Screen name="question" />
        <Drawer.Screen name="test" />

        {/* Hidden */}
        <Drawer.Screen name="test/tst" options={{ drawerItemStyle: { display: "none" } }} />
        <Drawer.Screen name="test/ergebnis" options={{ drawerItemStyle: { display: "none" } }} />

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

      <StatusBar style="auto" />
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

  activeItem: {
    backgroundColor: "#e8f0ff",
  },

  activeText: {
    fontWeight: "600",
    color: "#2a5bd7",
  },

  mutedText: {
    color: "#aaa",
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
    color: "#999",
    letterSpacing: 1,
  },

  chevron: {
    fontSize: 12,
    color: "#999",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
    marginHorizontal: 16,
  },

  // HEADER
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerUser: {
    fontSize: 14,
    fontWeight: "500",
    color: "#444",
    marginLeft: 4,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a5bd7",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
};