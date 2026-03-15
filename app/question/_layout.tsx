import { useAuth } from "@/context/AuthContext";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function QstLayout() {

  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/unauthorized" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTitle: "Random question",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Random question" }}
      />
    </Stack>
  );
}