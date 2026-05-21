import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

/** DTO para crear un sistema de tallas */
export class CreateSizeSystemDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del sistema de tallas es obligatorio' })
  name: string;
}

/** DTO para agregar una opción de talla a un sistema */
export class CreateSizeOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'El label de la opción es obligatorio' })
  label: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
