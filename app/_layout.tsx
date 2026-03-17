import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect, router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ActivityIndicator, View } from "react-native";

function AppContent() {

  const { loading, token } = useAuth();
  const colorScheme = useColorScheme();

  // 🔐 Während AuthContext lädt
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ❌ Nicht eingeloggt → Unauthorized Screen
  if (!token) {
    return <Redirect href="/unauthorized" />;
  }

  // ✅ Auth OK → App laden
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>

      <Drawer
        screenOptions={{
          headerTitle: "",
        }}
      >

        {/* Performance */}
        <Drawer.Screen
          name="index"
          options={{
            title: "Performance",
          }}
        />

        {/* Random Question */}
        <Drawer.Screen
          name="question"
          options={{
            title: "Random question",
          }}
        />

        {/* 🔥 WICHTIG: test Stack ROOT verstecken */}
        <Drawer.Screen
          name="test"
          options={{
            title: "CISM Test",
          }}
          listeners={{
            drawerItemPress: (e) => {
              e.preventDefault();

              // 🔥 erzwingt Reset auf Config
              router.replace("/test/config");
            },
          }}
        />

        {/* versteckte Screens */}
        <Drawer.Screen
          name="test/tst"
          options={{
            drawerItemStyle: { display: "none" },
          }}
        />

        <Drawer.Screen
          name="test/ergebnis"
          options={{
            drawerItemStyle: { display: "none" },
          }}
        />

        {/* Unauthorized */}
        <Drawer.Screen
          name="unauthorized"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false
          }}
        />

      </Drawer>

      <StatusBar style="auto" />

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