import client from "@/scripts/client";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

type AuthContextType = {
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);


// 🔐 Storage Helper (Web + Native)
async function getItem(key: string) {

  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return await SecureStore.getItemAsync(key);
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


export function AuthProvider({ children }: any) {

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {

    try {

      let storedToken = await getItem(TOKEN_KEY);

      if (!storedToken) {

        const response = await client.login();

        storedToken = response.token;

        await setItem(TOKEN_KEY, storedToken);
      }

      setToken(storedToken);

    } catch (err) {

      console.log("Login failed", err);
      setToken(null);

    } finally {

      setLoading(false);

    }
  }

  async function login() {

    const response = await client.login();

    await setItem(TOKEN_KEY, response.token);

    setToken(response.token);
  }

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

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("AuthContext missing");

  return ctx;
}