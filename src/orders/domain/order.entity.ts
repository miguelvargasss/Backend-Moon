// Entidad de dominio Order
export class Order {
  constructor(
    public readonly id: string,
    public readonly orderCode: string,
    public readonly userId: string,
    public readonly date: Date,
    public readonly time?: string,
    public readonly shippingAddressId?: string,
    public readonly statusId?: string,
    public readonly couponId?: string,
    public readonly statusName?: string,
    public readonly items?: OrderItem[],
    public readonly customer?: {
      firstName: string;
      lastName: string;
      dni?: string;
      phone: string;
      address: string;
      city: string;
      region: string;
    },
    public readonly pointsAwarded: boolean = false,
  ) {}
}

// Entidad de dominio OrderItem (línea de una orden)
export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly priceAtSale: number, // precio congelado al momento de la compra
    public readonly productName?: string,
  ) {}

  get subtotal(): number {
    return this.quantity * this.priceAtSale;
  }
}
