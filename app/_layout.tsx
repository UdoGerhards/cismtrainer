import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Redirect } from "expo-router";
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

        <Drawer.Screen
          name="index"
          options={{
            title: "Performance",
          }}
        />

        <Drawer.Screen
          name="question"
          options={{
            title: "Random question",
          }}
        />

        <Drawer.Screen
          name="test"
          options={{
            title: "CISM Test",
          }}
        />

        {/* versteckter Screen */}
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