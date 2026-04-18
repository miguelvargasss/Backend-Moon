import { Product } from './product.entity.js';
import { ProductImage } from './product-image.entity.js';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters?: { categoryId?: string; statusId?: string }): Promise<Product[]>;
  create(data: Omit<Product, 'id' | 'isInStock' | 'images'>): Promise<Product>;
  update(id: string, data: Partial<Omit<Product, 'id' | 'isInStock' | 'images'>>): Promise<Product>;
  delete(id: string): Promise<void>;

  // Imágenes (CU04)
  findImagesByProductId(productId: string): Promise<ProductImage[]>;
  addImage(productId: string, url: string): Promise<ProductImage>;
  removeImage(imageId: string): Promise<void>;

  // Verificación de historial (CU04 — soft-delete)
  hasOrderHistory(productId: string): Promise<boolean>;
}
