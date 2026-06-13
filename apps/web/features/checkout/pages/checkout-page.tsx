"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { CheckoutSummary } from "@/components/storefront/checkout-summary";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
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
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/features/cart/api/cart.queries";
import { useCheckoutReview, useSubmitCheckout } from "@/features/checkout/api/checkout.queries";
import { checkoutSchema, type CheckoutValues } from "@/features/checkout/schemas/checkout.schema";
import { useAuth } from "@/hooks/use-auth";

export function CheckoutPage() {
  const { session } = useAuth();
  const cart = useCart();
  const review = useCheckoutReview();
  const submitCheckout = useSubmitCheckout(session);
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "United States",
      shippingMethod: "standard",
      paymentMethod: "placeholder"
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <main className="page-shell space-y-6 py-8">
        <div>
          <p className="text-sm font-medium text-primary">Checkout</p>
          <h1 className="text-3xl font-semibold tracking-normal">Confirm delivery details</h1>
        </div>

        {cart.isLoading || review.isLoading ? <LoadingState label="Reviewing cart" /> : null}
        {cart.isError || review.isError ? <ErrorState onRetry={() => void Promise.all([cart.refetch(), review.refetch()])} /> : null}
        {cart.data && cart.data.items.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Checkout starts after products are added to the cart."
            actionLabel="Browse products"
            onAction={() => {
              window.location.href = "/products";
            }}
          />
        ) : null}
        {cart.data && review.data && cart.data.items.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader>
                <CardTitle>Shipping and Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4"
                  onSubmit={form.handleSubmit((values) => submitCheckout.mutate(values))}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={form.formState.errors.fullName?.message}>
                      <Input {...form.register("fullName")} />
                    </Field>
                    <Field label="Email" error={form.formState.errors.email?.message}>
                      <Input type="email" {...form.register("email")} />
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone" error={form.formState.errors.phone?.message}>
                      <Input {...form.register("phone")} />
                    </Field>
                    <Field label="Country" error={form.formState.errors.country?.message}>
                      <Input {...form.register("country")} />
                    </Field>
                  </div>
                  <Field label="Address" error={form.formState.errors.address?.message}>
                    <Textarea {...form.register("address")} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="City" error={form.formState.errors.city?.message}>
                      <Input {...form.register("city")} />
                    </Field>
                    <Field label="Shipping" error={form.formState.errors.shippingMethod?.message}>
                      <Select
                        value={form.watch("shippingMethod")}
                        onValueChange={(value) => form.setValue("shippingMethod", value as CheckoutValues["shippingMethod"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="express">Express</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="rounded-md border bg-secondary/50 p-4 text-sm text-muted-foreground">
                    Payment integration is a placeholder until a backend payment intent confirms the order.
                  </div>
                  <Button type="submit" disabled={submitCheckout.isPending}>
                    Submit checkout review
                  </Button>
                  {submitCheckout.data ? (
                    <div className="rounded-md border bg-card p-4 text-sm">
                      Order {submitCheckout.data.id} is pending backend payment confirmation.
                    </div>
                  ) : null}
                  {submitCheckout.isError ? (
                    <ErrorState title="Checkout failed" description="The backend did not confirm checkout." />
                  ) : null}
                </form>
              </CardContent>
            </Card>
            <aside className="space-y-4">
              <CheckoutSummary totals={review.data.totals} />
              <Button asChild variant="outline" className="w-full">
                <Link href="/cart">Back to cart</Link>
              </Button>
            </aside>
          </div>
        ) : null}
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
