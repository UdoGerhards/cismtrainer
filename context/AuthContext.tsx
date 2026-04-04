import client from "@/scripts/client";
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

type User = {
  id: string;
  firstname: string;
  lastname: string;
  twoFactor: {
    enabled: boolean;
  };
  mustChangePassword: boolean;
};

type AuthContextType = {
  token: string | null;
  tempToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    username?: string,
    password?: string,
  ) => Promise<"ok" | "2fa" | "error">;
  verify2FA: (code: string) => Promise<boolean>;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;

  loginEmail: string | null;
  setLoginEmail: (email: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/*
==========================================
STORAGE HELPERS
==========================================
*/
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

/*
==========================================
PROVIDER
==========================================
*/
export function AuthProvider({ children }: any) {
  const [token, setToken] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [loginEmail, setLoginEmailState] = useState<string | null>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    init();
  }, []);

  /*
  ==========================================
  INIT
  ==========================================
  */
  async function init() {
    try {
      const storedToken = await getItem(TOKEN_KEY);

      if (storedToken) {
        try {
          const me = await client.me(storedToken);

          if (me?.user) {
            setToken(storedToken);
            setUserState(me.user);
            setIsAuthenticated(true);
            await setItem(USER_KEY, JSON.stringify(me.user));
            return;
          }
        } catch (e) {
          console.warn("INIT failed:", e);
        }

        await deleteItem(TOKEN_KEY);
        await deleteItem(USER_KEY);
      }

      setToken(null);
      setUserState(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  /*
  ==========================================
  LOGIN
  ==========================================
  */
  async function login(
    username?: string,
    password?: string,
  ): Promise<"ok" | "2fa" | "error"> {
    try {
      await deleteItem(TOKEN_KEY);
      await deleteItem(USER_KEY);

      setToken(null);
      setTempToken(null);
      setUserState(null);
      setIsAuthenticated(false);

      const response = await client.login(username, password);

      if (response?.requires2FA && response?.tempToken) {
        setTempToken(response.tempToken);
        return "2fa";
      }

      if (response?.token && response?.user) {
        // 🔥 STATE FIRST
        setToken(response.token);
        setUserState(response.user);
        setIsAuthenticated(true);

        // 🔥 THEN STORAGE
        await setItem(TOKEN_KEY, response.token);
        await setItem(USER_KEY, JSON.stringify(response.user));

        return "ok";
      }

      return "error";
    } catch {
      return "error";
    }
  }

  /*
  ==========================================
  2FA VERIFY
  ==========================================
  */
  async function verify2FA(code: string): Promise<boolean> {
    if (!tempToken) return false;

    try {
      const response = await client.verify2FA(tempToken, code);

      if (response?.success && response?.token && response?.user) {
        // 🔥 STATE FIRST (CRITICAL FIX)
        setToken(response.token);
        setUserState(response.user);
        setTempToken(null);
        setIsAuthenticated(true);

        // 🔥 THEN STORAGE
        await setItem(TOKEN_KEY, response.token);
        await setItem(USER_KEY, JSON.stringify(response.user));

        return true;
      }

      return false;
    } catch (e) {
      console.error("2FA ERROR:", e);
      return false;
    }
  }

  /*
  ==========================================
  LOGOUT
  ==========================================
  */
  async function logout() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);

    setToken(null);
    setTempToken(null);
    setUserState(null);
    setIsAuthenticated(false);
    setLoginEmailState(null);
  }

  /*
  ==========================================
  REFRESH USER
  ==========================================
  */
  async function refreshUser() {
    if (!token) return;

    try {
      const me = await client.me(token);

      if (me?.user) {
        setUserState(me.user);
        await setItem(USER_KEY, JSON.stringify(me.user));
      }
    } catch (e) {
      console.warn("refreshUser failed:", e);
      // ❌ KEIN logout mehr hier!
    }
  }

  function setUser(user: User | null) {
    setUserState(user);
    if (user) {
      setItem(USER_KEY, JSON.stringify(user));
    } else {
      deleteItem(USER_KEY);
    }
  }

  function setLoginEmail(email: string) {
    setLoginEmailState(email);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        tempToken,
        user,
        loading,
        isAuthenticated,

        login,
        verify2FA,
        logout,
        refreshUser,
        setUser,

        loginEmail,
        setLoginEmail,
      }}
    >
      <AuthGuard />
      {children}
    </AuthContext.Provider>
  );
}

/*
==========================================
AUTH GUARD (STABIL VERSION)
==========================================
*/
function AuthGuard() {
  const { user, loading, isAuthenticated, tempToken, token } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];

    const inLogin = first === "login";
    const inRegistration = first === "registration";
    const inChangePassword = first === "change-password";
    const in2FA = first === "2fa";

    const logout = async () => {
      setUser(null);
    };

    /*    
    console.log("🛡️ GUARD", {
      token,
      user,
      isAuthenticated,
      tempToken,
      route: first,
    });

*/

    // 1. 2FA pending
    if (tempToken) {
      if (!in2FA) router.replace("/2fa");
      return;
    }

    // 2. Not authenticated (🔥 FIXED)
    if (!isAuthenticated || !user) {
      if (!inLogin) router.replace("/login");
      return;
    }

    // 3. No 2FA setup
    if (!user.twoFactor?.enabled) {
      if (!inRegistration) router.replace("/registration");
      return;
    }

    // 4. Must change password
    if (user.mustChangePassword) {
      if (!inChangePassword) router.replace("/change-password");
      return;
    }

    if (inLogin) {
      if (user.mustChangePassword) {
        router.replace("/change-password");
      } else {
        router.replace("/");
      }
    }
  }, [user, loading, isAuthenticated, tempToken, segments]);

  return null;
}

/*
==========================================
HOOK
==========================================
*/
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}
