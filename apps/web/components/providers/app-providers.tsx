"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { QueryProvider } from "@/components/providers/query-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <OrganizationProvider>{children}</OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
