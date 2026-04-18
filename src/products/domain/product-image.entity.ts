// Entidad de dominio ProductImage
export class ProductImage {
  constructor(
    public readonly id: string,
    public readonly url: string,
    public readonly productId: string,
  ) {}
}
