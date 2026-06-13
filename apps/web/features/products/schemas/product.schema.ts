import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(3, "Product name is required.").max(100),
  intro: z.string().min(10, "Intro should describe the product.").max(200),
  description: z.string().min(20, "Description is required.").max(1500),
  brandId: z.string().min(2, "Brand ID is required."),
  brand: z.string().min(2, "Brand name is required."),
  categoryId: z.string().min(2, "Category ID is required."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().positive("Price must be positive."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  image: z.string().url("Enter a valid image URL."),
  isPublished: z.boolean().default(false)
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
