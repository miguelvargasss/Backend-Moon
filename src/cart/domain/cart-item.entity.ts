// Entidad de dominio CartItem (ítem del carrito)
export class CartItem {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
