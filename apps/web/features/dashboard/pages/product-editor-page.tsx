"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/dashboard/product-form";
import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";
import {
  useCreateMerchantProduct,
  useMerchantProducts,
  useUpdateMerchantProduct
} from "@/features/dashboard/api/dashboard.queries";
import type { ProductFormValues } from "@/features/products/schemas/product.schema";
import { useOrganization } from "@/hooks/use-organization";

type ProductEditorPageProps = {
  mode: "create" | "edit";
  productId?: string;
};

export function ProductEditorPage({ mode, productId }: ProductEditorPageProps) {
  const router = useRouter();
  const { tenant } = useOrganization();
  const products = useMerchantProducts(tenant);
  const createProduct = useCreateMerchantProduct(tenant);
  const updateProduct = useUpdateMerchantProduct(tenant, productId ?? "");
  const product = products.data?.find((item) => item.id === productId);

  if (mode === "edit" && products.isLoading) {
    return <LoadingState label="Loading product" />;
  }

  if (mode === "edit" && products.isError) {
    return <ErrorState onRetry={() => void products.refetch()} />;
  }

  if (mode === "edit" && !product) {
    return <EmptyState title="Product not found" description="This product is not visible in the current organization." />;
  }

  const defaultValues = product
    ? {
        name: product.name,
        intro: product.intro,
        description: product.description,
        brandId: "brand-demo",
        brand: product.brand,
        categoryId: "cat-demo",
        category: product.category,
        price: product.price,
        stock: product.stockEstimate,
        image: product.images[0],
        isPublished: product.isPublished
      }
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Catalog</p>
        <h1 className="text-3xl font-semibold tracking-normal">
          {mode === "create" ? "New Product" : "Edit Product"}
        </h1>
      </div>
      <ProductForm
        title={mode === "create" ? "Create Product" : "Product Details"}
        defaultValues={defaultValues}
        isPending={createProduct.isPending || updateProduct.isPending}
        onSubmit={(values: ProductFormValues) => {
          const mutation = mode === "create" ? createProduct : updateProduct;
          mutation.mutate(values, {
            onSuccess: () => router.push("/dashboard/products")
          });
        }}
      />
      {createProduct.isError || updateProduct.isError ? (
        <ErrorState title="Save failed" description="The product was not accepted by the API layer." />
      ) : null}
    </div>
  );
}
