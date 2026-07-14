"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { DashboardNotifications } from "@/components/layout/dashboard-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardTopbar() {
  const { organizations, organization, setOrganizationId } = useOrganization();
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{organization.name}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">Organization-scoped dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={organization.id} onValueChange={setOrganizationId}>
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
          </Button>
          <DashboardNotifications />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Account menu">
                <UserRound className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session?.displayName ?? "Demo merchant"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <ExternalLink className="size-4" />
                  Open storefront
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSigningOut}
                onSelect={() => void handleSignOut()}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
