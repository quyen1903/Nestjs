import { z } from "zod";

export const settingsSchema = z.object({
  storeName: z.string().min(2, "Store name is required.").max(100),
  supportEmail: z.string().email("Enter a valid support email."),
  defaultCurrency: z.enum(["USD", "VND", "EUR"]),
  orderPrefix: z.string().min(2).max(8),
  emailNotifications: z.boolean(),
  lowStockAlerts: z.boolean()
});

export type SettingsValues = z.infer<typeof settingsSchema>;
