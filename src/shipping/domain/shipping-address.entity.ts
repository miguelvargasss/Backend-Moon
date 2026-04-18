// Entidad de dominio ShippingAddress
export class ShippingAddress {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly address: string,
    public readonly city: string,
    public readonly region: string,
    public readonly phone: string,
    public readonly reference?: string,
    public readonly codeZip?: string,
    public readonly dni?: string,
  ) {}
}
