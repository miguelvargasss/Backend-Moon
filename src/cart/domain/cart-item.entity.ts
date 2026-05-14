// Entidad de dominio CartItem (ítem del carrito)
// Incluye datos enriquecidos del producto para evitar N+1 queries en el frontend
export class CartItem {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly variantId?: string | null,
    // ── Datos enriquecidos del producto ──
    public readonly productName?: string,
    public readonly productPrice?: number,
    public readonly productImage?: string | null,
    public readonly variantLabel?: string | null,
    public readonly variantColor?: string | null,
  ) {}
}
