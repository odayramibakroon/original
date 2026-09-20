import { expect, it } from "vitest";
import { seedProducts } from "../data/seed-products";
import { productSchema } from "./product-schema";

it("accepts the existing products with 24 pieces and no price", () => {
  for (const product of seedProducts) {
    const parsed = productSchema.parse(product);
    expect(parsed.pieces).toBe(24);
    expect(parsed).not.toHaveProperty("price");
  }
});

it("validates the piece count, bilingual content, slug and gallery", () => {
  const product = seedProducts[0];
  for (const pieces of [0, -1, 1.5, 10001]) expect(productSchema.safeParse({ ...product, pieces }).success).toBe(false);
  expect(productSchema.safeParse({ ...product, name: { ar: "", en: "Cookies" } }).success).toBe(false);
  expect(productSchema.safeParse({ ...product, slug: "../admin" }).success).toBe(false);
  expect(productSchema.safeParse({ ...product, images: [] }).success).toBe(false);
  expect(productSchema.safeParse({ ...product, mainImage: "/not-in-gallery.jpg" }).success).toBe(false);
});
