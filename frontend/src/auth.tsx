import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { removeToken, request, saveToken, token } from "./api";

export type Role = "patient" | "doctor" | "admin";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: Role;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!token()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const currentUser = await request<User>("/api/me");

      setUser(currentUser);
      return currentUser;
    } catch {
      removeToken();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("mediflow:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("mediflow:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  async function login(email: string, password: string): Promise<User> {
    setLoading(true);

    try {
      const data = await request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      saveToken(data.access_token);

      /*
       * Validate the token and load the
       * authoritative user from the backend.
       * We do not trust a role stored in
       * localStorage.
       */
      const verifiedUser = await request<User>("/api/me");

      setUser(verifiedUser);

      return verifiedUser;
    } catch (error) {
      removeToken();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      authenticated: user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, loading, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
