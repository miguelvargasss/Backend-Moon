import { Product } from './product.entity.js';
import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

/** Datos para crear un producto (sin id, sin imágenes, sin variantes) */
export type CreateProductData = {
  name: string;
  price: number;
  description?: string;
  specification?: string;
  sizeType?: string;
  categoryId?: string;
  statusId?: string;
};

/** Datos para crear una variante */
export type CreateVariantData = {
  size?: string;
  color?: string;
  stock: number;
  priceOverride?: number;
};

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters?: { categoryId?: string; statusId?: string }): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: Partial<CreateProductData>): Promise<Product>;
  delete(id: string): Promise<void>;

  // Imágenes
  findImagesByProductId(productId: string): Promise<ProductImage[]>;
  addImage(productId: string, url: string): Promise<ProductImage>;
  removeImage(imageId: string): Promise<void>;

  // Variantes
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
  createVariant(productId: string, data: CreateVariantData): Promise<ProductVariant>;
  updateVariant(variantId: string, data: Partial<CreateVariantData>): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;
  deleteAllVariants(productId: string): Promise<void>;

  // Verificación de historial (CU04 — soft-delete)
  hasOrderHistory(productId: string): Promise<boolean>;
}
