import { Stack } from "expo-router";

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="config" 
        options={{ 
          title: "Test konfigurieren",
          headerBackVisible: false // optional
        }} 
      />
      <Stack.Screen 
        name="tst" 
        options={{ 
          title: "CISM Test",
          headerBackTitle: "Zurück"
        }} 
      />
      <Stack.Screen 
        name="ergebnis" 
        options={{ title: "Ergebnis" }} 
      />
    </Stack>
  );
}