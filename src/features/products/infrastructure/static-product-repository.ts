import { seedProducts } from "@/features/products/data/seed-products";
import type {
  Product,
  ProductRepository,
} from "@/features/products/domain/Product";

export class StaticProductRepository implements ProductRepository {
  async listPublished(): Promise<Product[]> {
    return seedProducts
      .filter((product) => product.isPublished)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
