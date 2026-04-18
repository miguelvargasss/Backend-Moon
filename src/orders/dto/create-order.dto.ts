import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4', { message: 'El ID de dirección de envío debe ser un UUID válido' })
  shippingAddressId: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
