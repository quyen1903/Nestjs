"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { ErrorState } from "@/components/state/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/features/auth/schemas/auth.schema";
import { useAuth } from "@/hooks/use-auth";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const { signIn, signUp } = useAuth();
  const isRegister = mode === "register";
  const schema = isRegister ? registerSchema : loginSchema;
  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      role: "shop",
      name: "",
      businessName: "",
      businessType: "Retail"
    } as RegisterValues
  });
  const role = form.watch("role");

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell grid min-h-[calc(100vh-4rem)] place-items-center py-10">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>{isRegister ? "Create account" : "Login"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  if (isRegister) {
                    await signUp(values as RegisterValues);
                  } else {
                    await signIn(values as LoginValues);
                  }
                  router.push(role === "shop" ? next : "/account");
                } catch {
                  form.setError("root", { message: "Authentication failed." });
                }
              })}
            >
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => form.setValue("role", value as LoginValues["role"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">Merchant</SelectItem>
                    <SelectItem value="user">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isRegister ? (
                <Field label={role === "shop" ? "Shop name" : "Name"} error={(form.formState.errors as any).name?.message}>
                  <Input {...form.register("name" as never)} />
                </Field>
              ) : null}
              {isRegister && role === "shop" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name" error={(form.formState.errors as any).businessName?.message}>
                    <Input {...form.register("businessName" as never)} />
                  </Field>
                  <Field label="Business type" error={(form.formState.errors as any).businessType?.message}>
                    <Input {...form.register("businessType" as never)} />
                  </Field>
                </div>
              ) : null}
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" {...form.register("email")} />
              </Field>
              <Field label="Password" error={form.formState.errors.password?.message}>
                <Input type="password" autoComplete={isRegister ? "new-password" : "current-password"} {...form.register("password")} />
              </Field>
              {form.formState.errors.root?.message ? (
                <ErrorState description={form.formState.errors.root.message} />
              ) : null}
              <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
                {isRegister ? "Create account" : "Login"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isRegister ? "Already have an account?" : "Need an account?"}{" "}
                <Link className="font-medium text-primary" href={isRegister ? "/login" : "/register"}>
                  {isRegister ? "Login" : "Register"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
