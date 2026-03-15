import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function QstLayout() {

  const { token, loading } = useAuth();

  // 🔐 Während AuthContext den Token lädt
  if (loading) {
    return (
      <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ❌ Kein Token → Zugriff verweigern
  if (!token) {
    return <Redirect href="/unauthorized" />;
  }

  // ✅ Token vorhanden → Screens laden
  return <Stack />;
}