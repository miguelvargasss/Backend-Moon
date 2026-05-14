import { ProductImage } from './product-image.entity.js';
import { ProductVariant } from './product-variant.entity.js';

// Entidad de dominio ProductStyle — representa un estilo/color de un producto múltiple
export class ProductStyle {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly name: string,
    public readonly colorHex: string | null,
    public readonly sortOrder: number,
    public readonly images: ProductImage[] = [],
    public readonly variants: ProductVariant[] = [],
  ) {}

  /** Stock total del estilo = suma de stocks de todas sus variantes */
  get totalStock(): number {
    return this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
}
