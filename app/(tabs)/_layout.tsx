import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,   // <-- WICHTIG: Stack-Header aus!
      }}
    />
  );
}
