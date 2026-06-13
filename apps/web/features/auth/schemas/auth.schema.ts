import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password needs an uppercase letter.")
  .regex(/[a-z]/, "Password needs a lowercase letter.")
  .regex(/[0-9]/, "Password needs a number.");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email.").transform((value) => value.toLowerCase().trim()),
  password: passwordSchema,
  role: z.enum(["user", "shop"])
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name is required.").max(100),
  businessName: z.string().max(200).optional(),
  businessType: z.string().max(100).optional()
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
