import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { router, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function AppContent() {
  const { loading, token } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();

  const first = segments[0];
  const inLogin = first === "login";
  const inRegistration = first === "registration";

  useEffect(() => {
    if (loading) return;

    if (!token && !inLogin && !inRegistration) {
      router.replace("/login");
    }

    if (token && (inLogin || inRegistration)) {
      router.replace("/");
    }
  }, [token, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token && !inLogin && !inRegistration) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Drawer screenOptions={{ headerTitle: "" }}>
        
        <Drawer.Screen
          name="index"
          options={{ title: "performance" }}
        />

        <Drawer.Screen
          name="question"
          options={{ title: "Random question" }}
        />

        <Drawer.Screen
          name="test"
          options={{ title: "CISM Test" }}
          listeners={{
            drawerItemPress: (e) => {
              e.preventDefault();
              router.replace("/test/config");
            },
          }}
        />

        <Drawer.Screen
          name="test/tst"
          options={{ drawerItemStyle: { display: "none" } }}
        />

        <Drawer.Screen
          name="test/ergebnis"
          options={{ drawerItemStyle: { display: "none" } }}
        />

        <Drawer.Screen
          name="login"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
          }}
        />

        <Drawer.Screen
          name="registration"
          options={{
            drawerItemStyle: { display: "none" },
            headerShown: false,
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