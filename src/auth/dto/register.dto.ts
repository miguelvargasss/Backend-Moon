import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(50, {
    message: 'El correo electrónico no puede exceder los 50 caracteres',
  })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(18, {
    message: 'La contraseña no puede exceder los 18 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).*$/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un carácter especial',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  lastName: string;

  @IsOptional()
  @IsString()
  @IsIn(['comprador', 'admin'], {
    message: 'El rol debe ser "comprador" o "admin"',
  })
  role?: string;
}
