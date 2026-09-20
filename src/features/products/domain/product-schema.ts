import { z } from "zod";
import { localizedTextSchema, optionalLocalizedTextSchema, imageUrlSchema } from "@/core/validation/cms";

export const productSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: localizedTextSchema,
  category: localizedTextSchema,
  shortDescription: localizedTextSchema,
  description: localizedTextSchema,
  pieces: z.number().int().min(1).max(10000),
  weight: optionalLocalizedTextSchema,
  pack: optionalLocalizedTextSchema,
  type: optionalLocalizedTextSchema,
  features: z.array(localizedTextSchema).max(20),
  ingredients: optionalLocalizedTextSchema,
  images: z.array(imageUrlSchema).min(1).max(12),
  mainImage: imageUrlSchema,
  isPublished: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
}).refine((product) => product.images.includes(product.mainImage), { path: ["mainImage"] });

export type ProductInput = z.infer<typeof productSchema>;

export const emptyProduct: ProductInput = {
  slug: "", name: { ar: "", en: "" }, category: { ar: "", en: "" },
  shortDescription: { ar: "", en: "" }, description: { ar: "", en: "" },
  pieces: 24, weight: { ar: "", en: "" }, pack: { ar: "", en: "" }, type: { ar: "", en: "" },
  ingredients: { ar: "", en: "" }, features: [], images: [], mainImage: "", isPublished: false, sortOrder: 0,
};
