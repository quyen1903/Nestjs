import { CategoryPage } from "@/features/storefront/pages/category-page";

export default function Category({ params }: { params: { slug: string } }) {
  return <CategoryPage slug={params.slug} />;
}
