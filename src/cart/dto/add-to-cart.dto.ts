import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsString({ message: 'El ID del producto debe ser un texto válido' })
  productId: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'El ID de la variante debe ser un texto válido' })
  variantId?: string;
}
