import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

/** DTO para una variante de producto */
export class CreateVariantDto {
  @IsOptional()
  @IsString()
  sizeLabel?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNumber({}, { message: 'El precio de la variante debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price: number;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;

  @IsOptional()
  @IsString()
  sku?: string;
}

/** DTO para un estilo dentro de un producto múltiple */
export class CreateStyleDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del estilo es obligatorio' })
  name: string;

  @IsOptional()
  @IsString()
  colorHex?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}

/** DTO principal para crear un producto */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  name: string;

  @IsIn(['single', 'multiple'], {
    message: 'El tipo de producto debe ser "single" o "multiple"',
  })
  productType: 'single' | 'multiple';

  // ── Campos para producto single ──
  @IsOptional()
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  price?: number;

  @IsOptional()
  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  /** Variantes directas (solo para single con tallas/colores) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  // ── Campos para producto multiple ──
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStyleDto)
  styles?: CreateStyleDto[];

  // ── Campos comunes ──
  @IsOptional()
  @IsString({ message: 'El ID del sistema de tallas debe ser un texto válido' })
  sizeSystemId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString({ message: 'El ID de categoría debe ser un texto válido' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'El ID de estado debe ser un texto válido' })
  statusId?: string;
}
