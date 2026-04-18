// Entidad de dominio User — representa al usuario dentro del negocio
// No depende de ningún framework ni de Supabase (principio de pureza del dominio)
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly roleId?: string,
  ) {}

  get fullName(): string {
    return `${this.name} ${this.lastName}`;
  }
}
