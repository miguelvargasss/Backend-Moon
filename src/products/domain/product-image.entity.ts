// Entidad de dominio ProductImage
export class ProductImage {
  constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly productId: string | null,
    public readonly styleId: string | null = null,
    public readonly sortOrder: number = 0,
  ) {}
}
