import type { ProductType } from './product.entity.js';
import type { Product } from './product.entity.js';
import type { ProductImage } from './product-image.entity.js';
import type { ProductVariant } from './product-variant.entity.js';
import type { ProductStyle } from './product-style.entity.js';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

// ── Tipos para creación ────────────────────────────────────

/** Datos para crear un producto base */
export type CreateProductData = {
  name: string;
  productType: ProductType;
  price?: number;
  stock?: number;
  sku?: string;
  description?: string;
  specification?: string;
  sizeSystemId?: string;
  categoryId?: string;
  statusId?: string;
};

/** Datos para crear un estilo */
export type CreateStyleData = {
  name: string;
  colorHex?: string;
  sortOrder?: number;
};

/** Datos para crear una variante */
export type CreateVariantData = {
  sizeLabel?: string;
  color?: string;
  price: number;
  stock: number;
  sku?: string;
};

// ── Tipos para catálogo de tallas ──────────────────────────

export type SizeSystem = {
  id: string;
  name: string;
  options: SizeOption[];
};

export type SizeOption = {
  id: string;
  label: string;
  sortOrder: number;
};

// ── Interfaz del repositorio ───────────────────────────────

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters?: {
    categoryId?: string;
    statusId?: string;
  }): Promise<Product[]>;
  create(data: CreateProductData): Promise<Product>;
  update(id: string, data: Partial<CreateProductData>): Promise<Product>;
  delete(id: string): Promise<void>;

  // Obtiene los estados de los productos
  getStatuses(): Promise<{ id: string; name: string }[]>;

  // Imágenes (productId o styleId, uno de los dos)
  addImage(
    productId: string | null,
    styleId: string | null,
    url: string,
  ): Promise<ProductImage>;
  removeImage(imageId: string): Promise<void>;

  // Estilos (solo para productos tipo multiple)
  createStyle(
    productId: string,
    data: CreateStyleData,
  ): Promise<ProductStyle>;
  deleteStyle(styleId: string): Promise<void>;
  deleteAllStyles(productId: string): Promise<void>;

  // Variantes (parentId puede ser productId para single o styleId para multiple)
  createVariantForProduct(
    productId: string,
    data: CreateVariantData,
  ): Promise<ProductVariant>;
  createVariantForStyle(
    styleId: string,
    data: CreateVariantData,
  ): Promise<ProductVariant>;
  deleteVariant(variantId: string): Promise<void>;
  deleteAllVariantsByProduct(productId: string): Promise<void>;
  deleteAllVariantsByStyle(styleId: string): Promise<void>;

  // Catálogo de tallas
  getSizeSystems(): Promise<SizeSystem[]>;
  createSizeSystem(name: string): Promise<SizeSystem>;
  updateSizeSystem(id: string, name: string): Promise<SizeSystem>;
  deleteSizeSystem(id: string): Promise<void>;
  addSizeOption(
    systemId: string,
    label: string,
    sortOrder?: number,
  ): Promise<SizeOption>;
  deleteSizeOption(optionId: string): Promise<void>;

  // Verificación de historial (CU04 — soft-delete)
  hasOrderHistory(productId: string): Promise<boolean>;

  // Decremento atómico de stock al confirmar pedido
  decrementProductStock(productId: string, quantity: number): Promise<void>;
  decrementVariantStock(variantId: string, quantity: number): Promise<void>;
}
