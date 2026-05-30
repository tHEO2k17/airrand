"use client";

import type { MerchantMeResponse, MerchantUserResponse } from "@airrand/contracts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMerchantMe, loginMerchant, logoutMerchant } from "../lib/auth-api";
import { clearSession, getStoredSession, saveSession } from "../lib/auth-session";
import { setAuthToken } from "../lib/api";
import { sessionEndedMessage } from "../lib/auth-errors";
import { ApiError } from "../lib/api";

interface AuthContextValue {
  user: MerchantMeResponse["user"] | null;
  merchant: MerchantMeResponse["merchant"] | null;
  merchantId: string | null;
  token: string | null;
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  applyPasswordChange: (user: MerchantUserResponse) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantMeResponse["user"] | null>(null);
  const [merchant, setMerchant] = useState<MerchantMeResponse["merchant"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((session: MerchantMeResponse | null, sessionToken: string | null) => {
    if (!session || !sessionToken) {
      setUser(null);
      setMerchant(null);
      setToken(null);
      setAuthToken(null);
      return;
    }

    setUser(session.user);
    setMerchant(session.merchant);
    setToken(sessionToken);
    setAuthToken(sessionToken);
  }, []);

  const applyPasswordChange = useCallback((nextUser: MerchantUserResponse) => {
    setUser(nextUser);
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    const stored = getStoredSession();
    if (!stored?.token) {
      applySession(null, null);
      setLoading(false);
      return;
    }

    try {
      const me = await fetchMerchantMe(stored.token);
      applySession(me, stored.token);
    } catch (err) {
      clearSession();
      applySession(null, null);
      if (err instanceof ApiError) {
        setError(sessionEndedMessage(err.code));
      } else {
        setError(err instanceof Error ? err.message : "Session expired");
      }
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const result = await loginMerchant({ email, password });
      saveSession({ token: result.token });
      applySession(
        { user: result.user, merchant: result.merchant },
        result.token,
      );
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const currentToken = token ?? getStoredSession()?.token ?? null;
    try {
      await logoutMerchant(currentToken);
    } finally {
      clearSession();
      applySession(null, null);
    }
  }, [applySession, token]);

  const value = useMemo(
    () => ({
      user,
      merchant,
      merchantId: merchant?.id ?? null,
      token,
      mustChangePassword: user?.mustChangePassword ?? false,
      loading,
      error,
      login,
      logout,
      refreshSession,
      applyPasswordChange,
    }),
    [
      user,
      merchant,
      token,
      loading,
      error,
      login,
      logout,
      refreshSession,
      applyPasswordChange,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
