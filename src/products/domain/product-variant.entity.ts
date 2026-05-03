// Entidad de dominio ProductVariant
export class ProductVariant {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly size: string | null,
    public readonly color: string | null,
    public readonly stock: number,
    public readonly priceOverride: number | null,
  ) {}
}
