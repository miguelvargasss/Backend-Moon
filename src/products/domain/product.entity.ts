import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';
import { ProductStyle } from './product-style.entity.js';

export type ProductType = 'single' | 'multiple';

// Entidad de dominio Product
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly productType: ProductType,
    public readonly price: number | null,
    public readonly stock: number | null,
    public readonly sku: string | null,
    public readonly description: string | undefined,
    public readonly specification: string | undefined,
    public readonly sizeSystemId: string | undefined,
    public readonly categoryId: string | undefined,
    public readonly statusId: string | undefined,
    public readonly images: ProductImage[] = [],
    public readonly variants: ProductVariant[] = [],
    public readonly styles: ProductStyle[] = [],
  ) {}

  /**
   * Stock total según tipo de producto:
   * - single sin variantes → this.stock
   * - single con variantes → suma de variantes
   * - multiple → suma de estilos → variantes
   */
  get totalStock(): number {
    if (this.productType === 'single') {
      if (this.variants.length > 0) {
        return this.variants.reduce((sum, v) => sum + v.stock, 0);
      }
      return this.stock ?? 0;
    }
    // multiple
    return this.styles.reduce(
      (sum, s) => sum + s.variants.reduce((vs, v) => vs + v.stock, 0),
      0,
    );
  }

  isInStock(): boolean {
    return this.totalStock > 0;
  }
}
