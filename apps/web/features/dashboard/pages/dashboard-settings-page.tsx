"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useMerchantSettings, useUpdateMerchantSettings } from "@/features/dashboard/api/dashboard.queries";
import { settingsSchema, type SettingsValues } from "@/features/settings/schemas/settings.schema";
import { useOrganization } from "@/hooks/use-organization";

export function DashboardSettingsPage() {
  const { tenant } = useOrganization();
  const settings = useMerchantSettings(tenant);
  const updateSettings = useUpdateMerchantSettings(tenant);

  if (settings.isLoading) {
    return <LoadingState label="Loading settings" />;
  }

  if (settings.isError || !settings.data) {
    return <ErrorState onRetry={() => void settings.refetch()} />;
  }

  return (
    <SettingsForm
      values={settings.data}
      isPending={updateSettings.isPending}
      onSubmit={(values) =>
        updateSettings.mutate({
          ...settings.data,
          ...values
        })
      }
    />
  );
}

function SettingsForm({
  values,
  isPending,
  onSubmit
}: {
  values: SettingsValues;
  isPending?: boolean;
  onSubmit: (values: SettingsValues) => void;
}) {
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: values
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Configuration</p>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Store Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store name" error={form.formState.errors.storeName?.message}>
                <Input {...form.register("storeName")} />
              </Field>
              <Field label="Support email" error={form.formState.errors.supportEmail?.message}>
                <Input type="email" {...form.register("supportEmail")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Order prefix" error={form.formState.errors.orderPrefix?.message}>
                <Input {...form.register("orderPrefix")} />
              </Field>
              <Field label="Currency" error={form.formState.errors.defaultCurrency?.message}>
                <Select
                  value={form.watch("defaultCurrency")}
                  onValueChange={(value) => form.setValue("defaultCurrency", value as SettingsValues["defaultCurrency"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                    Email notifications
                  </label>
                )}
              />
              <Controller
                control={form.control}
                name="lowStockAlerts"
                render={({ field }) => (
                  <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                    Low stock alerts
                  </label>
                )}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>
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
