"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productFormSchema, type ProductFormValues } from "@/features/products/schemas/product.schema";

type ProductFormProps = {
  title: string;
  defaultValues?: Partial<ProductFormValues>;
  isPending?: boolean;
  onSubmit: (values: ProductFormValues) => void;
};

const fallbackDefaults: ProductFormValues = {
  name: "",
  intro: "",
  description: "",
  brandId: "brand-demo",
  brand: "",
  categoryId: "cat-workspace",
  category: "Workspace",
  price: 1,
  stock: 0,
  image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82",
  isPublished: false
};

type ProductFormInput = z.input<typeof productFormSchema>;

export function ProductForm({ title, defaultValues, isPending, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { ...fallbackDefaults, ...defaultValues }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Product name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Brand" error={form.formState.errors.brand?.message}>
              <Input {...form.register("brand")} />
            </Field>
          </div>
          <Field label="Intro" error={form.formState.errors.intro?.message}>
            <Input {...form.register("intro")} />
          </Field>
          <Field label="Description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} />
          </Field>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Brand ID" error={form.formState.errors.brandId?.message}>
              <Input {...form.register("brandId")} />
            </Field>
            <Field label="Category ID" error={form.formState.errors.categoryId?.message}>
              <Input {...form.register("categoryId")} />
            </Field>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Category" error={form.formState.errors.category?.message}>
              <Input {...form.register("category")} />
            </Field>
            <Field label="Price" error={form.formState.errors.price?.message}>
              <Input type="number" min={0} step="0.01" {...form.register("price")} />
            </Field>
            <Field label="Stock" error={form.formState.errors.stock?.message}>
              <Input type="number" min={0} step="1" {...form.register("stock")} />
            </Field>
          </div>
          <Field label="Image URL" error={form.formState.errors.image?.message}>
            <Input type="url" {...form.register("image")} />
          </Field>
          <Controller
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                Published
              </label>
            )}
          />
          <Button type="submit" disabled={isPending}>
            Save product
          </Button>
        </form>
      </CardContent>
    </Card>
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
