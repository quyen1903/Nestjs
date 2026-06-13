import { Suspense } from "react";

import { LoadingState } from "@/components/state/loading-state";
import { ProductsPage } from "@/features/storefront/pages/products-page";

export default function Products() {
  return (
    <Suspense fallback={<LoadingState label="Loading products" />}>
      <ProductsPage />
    </Suspense>
  );
}
