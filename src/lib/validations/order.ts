import { z } from "zod";

export const orderSchema = z.object({
  productId: z.string().uuid(),
  customerName: z.string().trim().min(2, "Please enter your name"),
  contactMethod: z.enum(["phone", "line", "instagram", "email", "other"]),
  contactValue: z.string().trim().min(2, "Please enter a way to reach you"),
  message: z.string().trim().max(1000).optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
