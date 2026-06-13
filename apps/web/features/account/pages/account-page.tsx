"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function AccountPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell py-8">
        {!session ? (
          <EmptyState
            icon={UserRound}
            title="Login required"
            description="Customer account details are only available after authentication."
            actionLabel="Login"
            onAction={() => {
              window.location.href = "/login";
            }}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Info label="Name" value={session.displayName} />
              <Info label="Email" value={session.email} />
              <Info label="Role" value={session.role} />
              <Button asChild className="md:col-span-3 md:w-fit">
                <Link href="/account/orders">View orders</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-secondary/40 p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
