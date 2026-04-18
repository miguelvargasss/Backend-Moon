import { ProductImage } from './product-image.entity.js';

// Entidad de dominio Product
export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly categoryId?: string,
    public readonly statusId?: string,
    public readonly color?: string,
    public readonly size?: string,
    public readonly specification?: string,
    public readonly images?: ProductImage[],
  ) {}

  isInStock(): boolean {
    return this.quantity > 0;
  }
}
