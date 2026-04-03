import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from "@react-navigation/native";

export const LightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,

    background: "#ffffff",
    card: "#f5f5f5",
    text: "#111111",
    border: "#e0e0e0",
    primary: "#3b82f6",

    success: "#16a34a", // kräftiges Grün
    error: "#dc2626", // kräftiges Rot

    successBackground: "#16a34a",
    errorBackground: "#dc2626",
    headerImageBackground: "#25619a",
  },
};

export const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,

    background: "#121212",
    card: "#1c1c1e",
    text: "#ffffff",
    border: "#2c2c2e",
    primary: "#60a5fa",
    success: "#22c55e",
    error: "#ef4444",

    successBackground: "#16a34a",
    errorBackground: "#dc2626",
    headerImageBackground: "#25619a",
  },
};
