import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  originalPrice: z.preprocess(
    emptyToUndefined,
    z.coerce.number().positive().optional(),
  ),
  categoryId: z.string().uuid("Choose a category"),
  size: z.string().trim().min(1, "Size is required"),
  condition: z.enum([
    "new_with_tags",
    "like_new",
    "excellent",
    "good",
    "fair",
  ]),
  brand: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  color: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  material: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  sku: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  tags: z.array(z.string().trim().min(1)).default([]),
  measurements: z
    .object({
      shoulder: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      chest: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      waist: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      hip: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      length: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      sleeve: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
      inseam: z.preprocess(emptyToUndefined, z.coerce.number().positive().optional()),
    })
    .partial()
    .default({}),
});

export type ProductFormValues = z.input<typeof productSchema>;
