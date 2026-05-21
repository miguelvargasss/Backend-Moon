import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  IsUUID,
  IsIn,
} from 'class-validator';

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de expiración debe tener formato válido' },
  )
  expirationDate?: string;

  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(0, { message: 'La cantidad no puede ser negativa' })
  couponQuantity?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El monto mínimo debe ser un número' })
  @Min(0, { message: 'El monto mínimo no puede ser negativo' })
  minimumAmount?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El monto de descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  discountAmount?: number;

  @IsOptional()
  @IsIn(['fixed', 'percentage'], {
    message: 'El tipo de descuento debe ser fixed o percentage',
  })
  discountType?: 'fixed' | 'percentage';

  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId?: string;
}
