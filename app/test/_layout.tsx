import { Stack } from "expo-router";

export default function TestLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="config"
        options={{
          title: "Configure your test",
          headerBackTitle: "",
          headerLeft: () => null,
          headerBackVisible: false // optional
        }}
      />
      <Stack.Screen
        name="tst"
        options={{
          title: "Test",
          headerBackTitle: "",
          headerLeft: () => null,
          headerBackVisible: false // option
        }}
      />
      <Stack.Screen
        name="ergebnis"
        options={{
          title: "Your test result",
          headerBackTitle: "",
          headerLeft: () => null,
          headerBackVisible: false // option
        }}
      />
    </Stack>
  );
}