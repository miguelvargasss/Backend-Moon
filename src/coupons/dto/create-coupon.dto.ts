import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'El código del cupón es obligatorio' })
  code: string;

  @IsDateString({}, { message: 'La fecha de expiración debe tener formato válido' })
  expirationDate: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  couponQuantity: number;

  @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
  @Min(0, { message: 'El monto mínimo no puede ser negativo' })
  minimumAmount: number;

  @IsNumber({}, { message: 'El monto de descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  discountAmount: number;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId?: string;
}
