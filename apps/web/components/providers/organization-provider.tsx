"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { mockOrganizations } from "@/api/mock-data";
import type { Organization, TenantContext } from "@/types/domain";

type OrganizationContextValue = {
  organizations: Organization[];
  organization: Organization;
  tenant: TenantContext;
  setOrganizationId: (organizationId: string) => void;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizationId, setOrganizationId] = useState(mockOrganizations[0].id);
  const organization =
    mockOrganizations.find((item) => item.id === organizationId) ?? mockOrganizations[0];

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations: mockOrganizations,
      organization,
      tenant: {
        organizationId: organization.id,
        actorType: "shop"
      },
      setOrganizationId
    }),
    [organization]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) {
    throw new Error("useOrganization must be used inside OrganizationProvider");
  }
  return value;
}
