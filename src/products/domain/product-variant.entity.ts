// Entidad de dominio ProductVariant
// Pertenece a un Product (single) o a un ProductStyle (multiple)
export class ProductVariant {
  constructor(
    public readonly id: string,
    public readonly productId: string | null,
    public readonly styleId: string | null,
    public readonly sizeLabel: string | null,
    public readonly color: string | null,
    public readonly price: number,
    public readonly stock: number,
    public readonly sku: string | null = null,
  ) {}
}
