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

        {/* 1. Random Question als erster Eintrag */}
        <Drawer.Screen
          name="qst"
          options={{
            title: "Random Question",
            headerShown: true,
          }}
        />

        {/* 2. Zweiter Eintrag */}
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
