"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { useAuth } from "@/hooks/use-auth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SessionScopedProviders>{children}</SessionScopedProviders>
      </AuthProvider>
    </QueryProvider>
  );
}

function SessionScopedProviders({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  return (
    <OrganizationProvider key={session?.actorId || "signed-out"}>
      {children}
    </OrganizationProvider>
  );
}
