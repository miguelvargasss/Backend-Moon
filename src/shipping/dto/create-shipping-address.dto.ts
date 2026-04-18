import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateShippingAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'La región/estado es obligatorio' })
  region: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  phone: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  codeZip?: string;

  @IsOptional()
  @IsString()
  dni?: string;
}
