import client from "@/scripts/client";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

type AuthContextType = {
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

//
// 🔐 Storage Helper
//

async function getItem(key: string): Promise<string | null> {

  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {

  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {

  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

//
// 🔐 Provider
//

export function AuthProvider({ children }: any) {

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  useEffect(() => {

    if (initialized.current) return;
    initialized.current = true;

    init();

  }, []);

  //
  // Init
  //

  async function init() {

    try {

      const storedToken = await getItem(TOKEN_KEY);

      if (storedToken) {

        setToken(storedToken);
        return;

      }

      console.log("No token found → logging in");

      const response = await client.login();

      console.log("Login response:", response);

      if (!response?.token) {
        console.error("Login response missing token");
        return;
      }

      await setItem(TOKEN_KEY, response.token);

      setToken(response.token);

    } catch (err) {

      console.log("Login failed:", err);
      setToken(null);

    } finally {

      setLoading(false);

    }
  }

  //
  // Login
  //

  async function login() {

    try {

      const response = await client.login();

      console.log("Login response:", response);

      if (!response?.token) {
        throw new Error("Login response missing token");
      }

      await setItem(TOKEN_KEY, response.token);

      setToken(response.token);

    } catch (err) {

      console.log("Login error:", err);

    }
  }

  //
  // Logout
  //

  async function logout() {

    await deleteItem(TOKEN_KEY);

    setToken(null);

  }

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

//
// Hook
//

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("AuthContext missing");

  return ctx;
}