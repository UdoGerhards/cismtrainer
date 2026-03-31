import client from "@/scripts/client";
import { useRouter, useSegments } from "expo-router";
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
  login: (username?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

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

  async function init() {
    try {
      const storedToken = await getItem(TOKEN_KEY);

      if (storedToken) {
        try {
          const me = await client.me(storedToken);

          if (me?.user) {
            setToken(storedToken);
            setUser(me.user);
            return;
          }

          throw new Error("Token invalid");
        } catch {
          await deleteItem(TOKEN_KEY);
          await deleteItem(USER_KEY);
        }
      }

      setToken(null);
      setUser(null);

    } finally {
      setLoading(false);
    }
  }

  async function login(username?: string, password?: string): Promise<boolean> {
    try {
      const response = await client.login(username, password);

      if (!response?.token || !response?.user) {
        return false;
      }

      await setItem(TOKEN_KEY, response.token);
      await setItem(USER_KEY, JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);

      return true;
    } catch {
      return false;
    }
  }

  async function logout() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      <AuthGuard />
      {children}
    </AuthContext.Provider>
  );
}

function AuthGuard() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {

    console.log(loading);

    if (loading) return;

    const first = segments[0];

    console.log(first);


    if (!token && first !== "login" && first !== "registration") {
      router.replace("/login");
    }

    if (token && (first === "login" || first === "registration")) {
      router.replace("/");
    }
  }, [token, loading, segments]);

  return null;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}