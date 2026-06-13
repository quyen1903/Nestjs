import { ProductDetailPage } from "@/features/storefront/pages/product-detail-page";

export default function ProductDetail({ params }: { params: { slug: string } }) {
  return <ProductDetailPage slug={params.slug} />;
}
