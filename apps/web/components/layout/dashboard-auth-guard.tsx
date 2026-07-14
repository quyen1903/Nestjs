"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const canAccessDashboard = session?.role === "SHOP" || session?.role === "ADMIN";

  useEffect(() => {
    if (!canAccessDashboard) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [canAccessDashboard, pathname, router]);

  if (!canAccessDashboard) {
    return null;
  }

  return <>{children}</>;
}
