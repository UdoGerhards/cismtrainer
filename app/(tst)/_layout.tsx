import { Stack } from "expo-router";

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen name="config" options={{ title: "Test konfigurieren" }} />
      <Stack.Screen name="tst" options={{ title: "CISM Test" }} />
      <Stack.Screen name="ergebnis" options={{ title: "Ergebnis" }} />
    </Stack>
  );
}
