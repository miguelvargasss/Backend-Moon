// Entidad de dominio Coupon
export class Coupon {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly expirationDate: Date,
    public readonly couponQuantity: number,
    public readonly minimumAmount: number,
    public readonly discountAmount: number,
    public readonly categoryId?: string,
  ) {}

  isValid(orderAmount: number): boolean {
    const notExpired = new Date() <= this.expirationDate;
    const hasStock = this.couponQuantity > 0;
    const meetsMinimum = orderAmount >= this.minimumAmount;
    return notExpired && hasStock && meetsMinimum;
  }

  isExpired(): boolean {
    return new Date() > this.expirationDate;
  }

  hasStock(): boolean {
    return this.couponQuantity > 0;
  }
}
