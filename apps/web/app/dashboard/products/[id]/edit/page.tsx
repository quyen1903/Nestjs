import { ProductEditorPage } from "@/features/dashboard/pages/product-editor-page";

export default function EditProduct({ params }: { params: { id: string } }) {
  return <ProductEditorPage mode="edit" productId={params.id} />;
}
