import { expect, it } from "vitest";
import { seedProducts } from "../data/seed-products";
import { toProductViewModel } from "./get-products";
import { filterProducts } from "./filter-products";

it("combines search and category without mutating the original ordering", () => {
  const products = seedProducts.map((product) => toProductViewModel(product, "en"));
  expect(filterProducts(products, " CHOCOLATE ", "Cake", "", "en").map((item) => item.id)).toEqual(["cake"]);
  expect(filterProducts(products, "missing product", "", "", "en")).toEqual([]);
  const sorted = filterProducts(products, "", "", "name-desc", "en");
  expect(sorted[0].name).toBe("Classic Biscuits");
  expect(products[0].id).toBe("cookies");
});
