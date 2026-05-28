import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class CreateShippingAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(2, 30, { message: 'El nombre debe tener entre 2 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Length(2, 30, { message: 'El apellido debe tener entre 2 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @Length(5, 100, {
    message: 'La dirección debe tener entre 5 y 100 caracteres',
  })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @Length(3, 30, { message: 'La ciudad debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, {
    message: 'La ciudad solo debe contener letras',
  })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  region: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^9\d{8}$/, {
    message: 'El teléfono debe empezar con 9 y tener 9 dígitos',
  })
  phone: string;

  @IsOptional()
  @IsString()
  @Length(0, 60, { message: 'La referencia no debe exceder los 60 caracteres' })
  reference?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'El código postal debe tener 5 dígitos' })
  codeZip?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni?: string;
}
