"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";

import * as authClient from "@/api/auth.client";
import type { AuthSession } from "@/types/domain";

type LoginInput = Parameters<typeof authClient.login>[0];
type RegisterInput = Parameters<typeof authClient.register>[0];

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signIn: (input: LoginInput) => Promise<AuthSession>;
  signUp: (input: RegisterInput) => Promise<AuthSession>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const queryClient = useQueryClient();

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      signIn: async (input) => {
        const nextSession = await authClient.login(input);
        setSession(nextSession);
        return nextSession;
      },
      signUp: async (input) => {
        const nextSession = await authClient.register(input);
        setSession(nextSession);
        return nextSession;
      },
      signOut: async () => {
        const current = session;
        setSession(null);
        queryClient.clear();
        try {
          await authClient.logout(current);
        } catch (error) {
          console.error("Remote logout failed after local session teardown.", error);
        }
      }
    }),
    [queryClient, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
