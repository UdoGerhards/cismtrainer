import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function HomeScreen() {

  const { token, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (token) {
    return <Redirect href="/(qst)" />;
  }

  return null;
}