import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsUUID,
  IsIn,
  Length,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'El código del cupón es obligatorio' })
  @Length(1, 25, { message: 'El código del cupón debe tener entre 1 y 25 caracteres' })
  code: string;

  @IsDateString(
    {},
    { message: 'La fecha de expiración debe tener formato válido' },
  )
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
  @IsIn(['fixed', 'percentage'], {
    message: 'El tipo de descuento debe ser fixed o percentage',
  })
  discountType?: 'fixed' | 'percentage';

  @IsOptional()
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId?: string;
}
