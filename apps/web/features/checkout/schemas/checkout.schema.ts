import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").max(100),
  email: z.string().email("Enter a valid email.").transform((value) => value.toLowerCase().trim()),
  phone: z.string().min(7, "Phone is required.").max(30),
  address: z.string().min(5, "Address is required.").max(300),
  city: z.string().min(2, "City is required.").max(100),
  country: z.string().min(2, "Country is required.").max(100),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.literal("placeholder")
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
