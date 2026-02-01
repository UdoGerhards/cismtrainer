import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer>
        {/* Tabs als Hauptscreen */}
        <Drawer.Screen
          name="(tabs)"
          options={{
            title: "Random question",
            headerShown: true, // Header kommt aus (tabs)/_layout.tsx
          }}
        />

        {/* Beispiel: zusätzlicher Drawer-Screen */}
        <Drawer.Screen
          name="test"
          options={{
            title: "CISM Test",
          }}
        />
      </Drawer>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
