import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ActivityIndicator, View } from 'react-native';

function AppContent() {

  const { loading } = useAuth();
  const colorScheme = useColorScheme();

  // 🔐 Während AuthContext Token prüft
  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

      <Drawer>

        {/* Random Question */}
        <Drawer.Screen
          name="qst"
          options={{
            title: "Random Question",
            headerShown: true,
          }}
        />

        {/* CISM Test */}
        <Drawer.Screen
          name="(tst)"
          options={{
            title: "CISM Test",
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