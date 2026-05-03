import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';

// Entidad de dominio Product
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public readonly description?: string,
    public readonly specification?: string,
    public readonly sizeType?: string,
    public readonly categoryId?: string,
    public readonly statusId?: string,
    public readonly images?: ProductImage[],
    public readonly variants?: ProductVariant[],
  ) {}

  /** Stock total = suma de los stocks de todas las variantes */
  get totalStock(): number {
    if (!this.variants || this.variants.length === 0) return 0;
    return this.variants.reduce((sum, v) => sum + v.stock, 0);
  }

  isInStock(): boolean {
    return this.totalStock > 0;
  }
}
