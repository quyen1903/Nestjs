"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const requireGuard = process.env.NEXT_PUBLIC_REQUIRE_DASHBOARD_AUTH === "true";

  useEffect(() => {
    if (requireGuard && session?.role !== "SHOP" && session?.role !== "ADMIN") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, requireGuard, router, session?.role]);

  if (requireGuard && session?.role !== "SHOP" && session?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}
