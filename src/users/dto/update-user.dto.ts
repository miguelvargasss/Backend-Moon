import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  lastName?: string;
}
