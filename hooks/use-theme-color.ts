import { useTheme } from "@react-navigation/native";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ReturnType<typeof useTheme>["colors"],
) {
  const { colors, dark } = useTheme();

  // Falls explizite Farbe übergeben wurde
  const colorFromProps = dark ? props.dark : props.light;

  if (colorFromProps) {
    return colorFromProps;
  }

  // Sonst Theme-Farbe verwenden
  return colors[colorName];
}
