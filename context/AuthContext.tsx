import client from "@/scripts/client";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type User = {
  id: string;
  firstname: string;
  lastname: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

//
// Storage Helper
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
// Provider
//

export function AuthProvider({ children }: any) {

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
      const storedUser = await getItem(USER_KEY);

      if (storedToken && storedUser) {

        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        return;

      }

      console.log("No token found → logging in");

      const response = await client.login();

      if (!response?.token || !response?.user) {
        console.error("Login response invalid");
        return;
      }

      await setItem(TOKEN_KEY, response.token);
      await setItem(USER_KEY, JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

    } catch (err) {

      console.log("Login failed:", err);
      setToken(null);
      setUser(null);

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

      if (!response?.token || !response?.user) {
        throw new Error("Login response invalid");
      }

      await setItem(TOKEN_KEY, response.token);
      await setItem(USER_KEY, JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

    } catch (err) {

      console.log("Login error:", err);

    }
  }

  //
  // Logout
  //

  async function logout() {

    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);

    setToken(null);
    setUser(null);

  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
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